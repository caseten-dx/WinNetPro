# WinNetPro demo-001 CLI smoke harness for Windows.
#
# Runs the audience-target smoke battery against a Windows .exe built by CI
# (or any equivalent build). Captures exit code + stdout + stderr per test
# and emits a single structured report to stdout, suitable for paste-back.
#
# Designed to run cleanly under SSH (non-TTY stdin) on Windows PowerShell 5.1.
# Uses Start-Process with file redirects, mirroring .github/workflows/build-cli.yml,
# because the pipeline form (`& $exe 2>&1`) interacts badly with pwsh defaults.
#
# Usage:
#   .\smoke-x64-cli.ps1 [-Exe <path>] [-Fixtures <path>] [-Work <path>]
#
# Defaults assume the VM dev surface from STATUS.md 2026-05-20.

param(
  [string] $Exe = "$env:USERPROFILE\smoke\WinNetPro-CLI-demo-001.exe",
  [string] $Fixtures = "$env:USERPROFILE\Developer\WinNetPro\demos\001-save-and-dry-run-cli\fixtures",
  [string] $Work = "$env:USERPROFILE\smoke"
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $Exe)) {
  Write-Host "ERROR: Exe not found at $Exe"
  exit 1
}
if (-not (Test-Path $Fixtures)) {
  Write-Host "ERROR: Fixtures not found at $Fixtures"
  exit 1
}

$cfg = Join-Path $Work "config"
if (Test-Path $cfg) { Remove-Item $cfg -Recurse -Force }
New-Item -ItemType Directory -Path $cfg -Force | Out-Null

function Invoke-Cli {
  param([string[]] $CliArgs)
  $stdoutFile = New-TemporaryFile
  $stderrFile = New-TemporaryFile
  try {
    if ($CliArgs.Length -eq 0) {
      $proc = Start-Process -FilePath $Exe `
        -NoNewWindow -Wait -PassThru `
        -RedirectStandardOutput $stdoutFile `
        -RedirectStandardError $stderrFile
    } else {
      $proc = Start-Process -FilePath $Exe -ArgumentList $CliArgs `
        -NoNewWindow -Wait -PassThru `
        -RedirectStandardOutput $stdoutFile `
        -RedirectStandardError $stderrFile
    }
    $stdout = Get-Content $stdoutFile -Raw
    $stderr = Get-Content $stderrFile -Raw
    if ($null -eq $stdout) { $stdout = "" }
    if ($null -eq $stderr) { $stderr = "" }
    [pscustomobject]@{
      ExitCode = $proc.ExitCode
      Stdout = $stdout
      Stderr = $stderr
    }
  } finally {
    Remove-Item $stdoutFile, $stderrFile -ErrorAction SilentlyContinue
  }
}

$script:failures = @()

function Invoke-SmokeTest {
  param(
    [string] $Name,
    [string[]] $CliArgs,
    [scriptblock] $Expect
  )
  Write-Host ""
  Write-Host ("=" * 72)
  Write-Host "TEST: $Name"
  if ($CliArgs.Length -eq 0) {
    Write-Host "args: (none)"
  } else {
    Write-Host ("args: " + ($CliArgs -join ' '))
  }
  Write-Host ("-" * 72)
  $r = Invoke-Cli -CliArgs $CliArgs
  Write-Host "exit: $($r.ExitCode)"
  Write-Host "stdout:"
  Write-Host $r.Stdout
  Write-Host "stderr:"
  Write-Host $r.Stderr
  Write-Host ("-" * 72)
  $verdict = & $Expect $r
  if ($verdict.Pass) {
    Write-Host "VERDICT: PASS  ($($verdict.Note))"
  } else {
    Write-Host "VERDICT: FAIL  ($($verdict.Note))"
    $script:failures += $Name
  }
}

Write-Host ("=" * 72)
Write-Host "WinNetPro demo-001 x64 .exe smoke harness"
Write-Host ("=" * 72)
Write-Host "Machine:    $env:COMPUTERNAME"
Write-Host "Arch:       $env:PROCESSOR_ARCHITECTURE"
Write-Host "User:       $env:USERNAME"
Write-Host "PSVersion:  $($PSVersionTable.PSVersion)"
Write-Host "Exe:        $Exe"
Write-Host "Fixtures:   $Fixtures"
Write-Host "Config:     $cfg"
Get-Item $Exe | Format-List Name,Length,LastWriteTime | Out-String | Write-Host

# 1. No-args -> exit 2 + Usage in stderr
Invoke-SmokeTest -Name "01 no-args -> exit 2 + usage" -CliArgs @() -Expect {
  param($r)
  $pass = ($r.ExitCode -eq 2) -and ($r.Stderr -match 'Usage:')
  [pscustomobject]@{ Pass = $pass; Note = "expected exit 2 + 'Usage:' in stderr" }
}

# 2. --real rejected (safety baseline)
Invoke-SmokeTest -Name "02 --real rejected" `
  -CliArgs @('profiles','save','--name','foo','--real') -Expect {
  param($r)
  $pass = ($r.ExitCode -eq 1) -and ($r.Stderr -match '--real is not supported')
  [pscustomobject]@{ Pass = $pass; Note = "expected exit 1 + '--real is not supported'" }
}

# 3. Save DHCP profile from adapter (human-readable)
Invoke-SmokeTest -Name "03 save dhcp from ad-02" `
  -CliArgs @(
    'profiles','save','--name','dock-dhcp','--from-adapter','ad-02','--ipv4-mode','dhcp',
    '--config-dir',$cfg,'--fixture-dir',$Fixtures
  ) -Expect {
  param($r)
  $pass = ($r.ExitCode -eq 0) -and ($r.Stdout -match 'Saved profile "dock-dhcp"')
  [pscustomobject]@{ Pass = $pass; Note = "expected exit 0 + 'Saved profile dock-dhcp'" }
}

# 4. Save static profile with explicit IPv4 fields, --json
Invoke-SmokeTest -Name "04 save static lab-static --json" `
  -CliArgs @(
    'profiles','save','--name','lab-static','--from-adapter','ad-01',
    '--ipv4-mode','static','--ipv4-address','10.0.0.50','--ipv4-prefix','24',
    '--ipv4-gateway','10.0.0.1','--description','lab bench',
    '--config-dir',$cfg,'--fixture-dir',$Fixtures,'--json'
  ) -Expect {
  param($r)
  $okExit = $r.ExitCode -eq 0
  $parsed = $null
  try { $parsed = $r.Stdout | ConvertFrom-Json } catch {}
  $okShape = $null -ne $parsed -and $parsed.name -eq 'lab-static' -and `
             $parsed.ipv4.mode -eq 'static' -and $parsed.ipv4.address -eq '10.0.0.50'
  [pscustomobject]@{ Pass = ($okExit -and $okShape); Note = "expected exit 0 + JSON with name=lab-static ipv4.mode=static address=10.0.0.50" }
}

# 5. Save --global profile
Invoke-SmokeTest -Name "05 save --global anywhere" `
  -CliArgs @(
    'profiles','save','--name','anywhere','--ipv4-mode','dhcp','--global',
    '--config-dir',$cfg,'--fixture-dir',$Fixtures,'--json'
  ) -Expect {
  param($r)
  $okExit = $r.ExitCode -eq 0
  $parsed = $null
  try { $parsed = $r.Stdout | ConvertFrom-Json } catch {}
  $okShape = $null -ne $parsed -and $parsed.name -eq 'anywhere'
  [pscustomobject]@{ Pass = ($okExit -and $okShape); Note = "expected exit 0 + JSON profile (full shape captured above)" }
}

# 6. Apply dry-run human-readable
Invoke-SmokeTest -Name "06 apply --dry-run dock-dhcp" `
  -CliArgs @(
    'profiles','apply','--profile','dock-dhcp','--dry-run',
    '--config-dir',$cfg,'--fixture-dir',$Fixtures
  ) -Expect {
  param($r)
  $pass = ($r.ExitCode -eq 0) -and ($r.Stdout -match 'Change plan for profile') -and ($r.Stdout -match 'ad-02')
  [pscustomobject]@{ Pass = $pass; Note = "expected exit 0 + 'Change plan' and 'ad-02' in stdout" }
}

# 7. Apply dry-run JSON for the static profile (should show willChange=true)
Invoke-SmokeTest -Name "07 apply --dry-run lab-static --json" `
  -CliArgs @(
    'profiles','apply','--profile','lab-static','--dry-run',
    '--config-dir',$cfg,'--fixture-dir',$Fixtures,'--json'
  ) -Expect {
  param($r)
  $okExit = $r.ExitCode -eq 0
  $parsed = $null
  try { $parsed = $r.Stdout | ConvertFrom-Json } catch {}
  $okShape = $null -ne $parsed -and $parsed.ipv4.willChange -eq $true
  [pscustomobject]@{ Pass = ($okExit -and $okShape); Note = "expected exit 0 + JSON ChangePlan with ipv4.willChange=true" }
}

# 8. Unknown profile -> exit 3
Invoke-SmokeTest -Name "08 unknown profile -> exit 3" `
  -CliArgs @(
    'profiles','apply','--profile','does-not-exist','--dry-run',
    '--config-dir',$cfg,'--fixture-dir',$Fixtures
  ) -Expect {
  param($r)
  $pass = ($r.ExitCode -eq 3) -and ($r.Stderr.Length -gt 0)
  [pscustomobject]@{ Pass = $pass; Note = "expected exit 3 + non-empty stderr" }
}

# 9. Bogus --ipv4-mode -> exit 2
Invoke-SmokeTest -Name "09 bogus --ipv4-mode -> exit 2" `
  -CliArgs @(
    'profiles','save','--name','bad','--ipv4-mode','magic',
    '--config-dir',$cfg,'--fixture-dir',$Fixtures
  ) -Expect {
  param($r)
  $pass = ($r.ExitCode -eq 2) -and ($r.Stderr -match 'must be "static" or "dhcp"')
  [pscustomobject]@{ Pass = $pass; Note = "expected exit 2 + ipv4-mode rejection" }
}

# 10. Apply without --dry-run, non-TTY stdin.
# Per ADR-0004 and run.ts: dry-run is the default when stdin is not a TTY.
# Start-Process detaches stdin from the child, so the .exe sees non-TTY and
# auto-applies --dry-run. This verifies the safe-by-default path for any
# non-interactive caller (script, CI, headless service, GUI shell-out).
# The interactive-rejection path requires a real console and is covered by
# the manual step printed at the end of this script.
Invoke-SmokeTest -Name "10 apply no --dry-run, non-TTY (safe default)" `
  -CliArgs @(
    'profiles','apply','--profile','dock-dhcp',
    '--config-dir',$cfg,'--fixture-dir',$Fixtures
  ) -Expect {
  param($r)
  $pass = ($r.ExitCode -eq 0) -and ($r.Stdout -match 'Change plan')
  [pscustomobject]@{ Pass = $pass; Note = "non-TTY: --dry-run auto-applied, expected exit 0 + 'Change plan'" }
}

Write-Host ""
Write-Host ("=" * 72)
Write-Host "Persisted profiles file at $cfg\profiles.json:"
$profilesJson = Join-Path $cfg "profiles.json"
if (Test-Path $profilesJson) {
  Get-Content $profilesJson -Raw | Write-Host
} else {
  Write-Host "(file missing -- should not happen if tests 3-5 passed)"
}

Write-Host ""
Write-Host ("=" * 72)
if ($script:failures.Count -eq 0) {
  Write-Host "SUMMARY: 10/10 PASS"
  Write-Host ""
  Write-Host "Manual follow-up to verify on the VM console (interactive TTY path):"
  Write-Host "  $Exe profiles apply --profile dock-dhcp --config-dir $cfg --fixture-dir $Fixtures"
  Write-Host "  Expected: exit 1, stderr 'demo-001 supports --dry-run only...'"
  exit 0
} else {
  Write-Host "SUMMARY: $($script:failures.Count) test(s) FAIL"
  $script:failures | ForEach-Object { Write-Host "  - $_" }
  exit 1
}
