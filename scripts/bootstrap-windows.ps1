# Bootstraps a fresh Windows 11 VM for WinNetPro smoke-testing.
#
# What this does, in order:
#   1. Installs the OpenSSH Server feature and opens the firewall rule so the
#      Mac (or any other tailnet peer) can ssh in.
#   2. Installs the dev toolchain via winget: Git, PowerShell 7, Node.js
#      (current channel = 24), and Tailscale.
#   3. Reloads PATH in this session so the just-installed binaries resolve.
#   4. Installs pnpm 9 globally via npm (matches the repo's packageManager).
#   5. Points OpenSSH at PowerShell 7 as the default shell.
#   6. Ensures C:\ProgramData\ssh\administrators_authorized_keys exists and
#      is locked down — this is the right place for SSH keys on an account
#      that's in the Administrators group.
#   7. Brings Tailscale up (opens a browser for SSO sign-in) and prints the
#      VM's tailnet IP for use in the Mac's ~/.ssh/config.
#
# Designed to be paste-resistant: run it via
#   irm https://raw.githubusercontent.com/caseten-dx/WinNetPro/main/scripts/bootstrap-windows.ps1 | iex
# from a Win11 admin Terminal. Idempotent: safe to re-run if a step fails.
#
# This script is environment setup for *testing* WinNetPro demo binaries on
# Windows. It is not part of the product. See conversation context in the
# session that produced commit history for details on why this lives here.

$ErrorActionPreference = 'Stop'

# Windows PowerShell 5.1's default execution policy is Restricted, which
# blocks loading any .ps1 file from disk. Two scopes matter:
#   - Process: needed inside this bootstrap so it can call npm.ps1
#     (`npm` on Windows is a PowerShell wrapper script).
#   - LocalMachine: needed so future SSH sessions (and any other shell)
#     can also call pnpm.ps1, npm.ps1, etc. RemoteSigned is the standard
#     dev-host default: allows locally-created .ps1 files to run while
#     still requiring signatures on internet-downloaded scripts.
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
Set-ExecutionPolicy -Scope LocalMachine -ExecutionPolicy RemoteSigned -Force

Write-Host ""
Write-Host "=== WinNetPro Windows VM bootstrap ==="
Write-Host ""

# --- 1. OpenSSH Server ---
Write-Host "[1/7] Installing OpenSSH Server..."
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0 | Out-Null
Start-Service sshd
Set-Service -Name sshd -StartupType Automatic

if (-not (Get-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -DisplayName 'OpenSSH Server (sshd)' `
    -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22 | Out-Null
}

# --- 2. Dev toolchain + Tailscale via winget ---
Write-Host "[2/7] Updating winget sources..."
winget source update | Out-Null

Write-Host "[3/7] Installing Git, PowerShell 7, Node.js via winget (may take several minutes)..."
# Force --source winget on every install. The msstore source has a known
# certificate validation issue on fresh ARM Win11 installs (0x8a15005e),
# and even when it just fails to search, winget refuses to pick a source
# automatically when a package exists in both winget and msstore — it
# asks for --source explicitly. All three packages below live in the
# winget-community repo, so winget is the right (and only) source.
# winget install exit codes:
#   0           = success
#   -1978335189 = already installed (treat as success)
$pkgs = @(
  'Git.Git',
  'Microsoft.PowerShell',
  'OpenJS.NodeJS'
)
foreach ($pkg in $pkgs) {
  Write-Host "  - $pkg"
  winget install --id $pkg --source winget -e --silent `
    --accept-package-agreements --accept-source-agreements
  $code = $LASTEXITCODE
  if ($code -ne 0 -and $code -ne -1978335189) {
    throw "winget install of $pkg failed (exit $code). Re-run the bootstrap; winget is usually transient."
  }
}

# Tailscale: direct MSI download. The winget tailscale.tailscale manifest
# is amd64-only — installing it on an ARM64 Windows VM fails with exit
# code -1978335212 (APPINSTALLER_CLI_ERROR_NO_APPLICATIONS_FOUND).
# Tailscale's own pkgs.tailscale.com index serves arm64 MSIs, so we
# fetch the latest stable filename out of the HTML index and msiexec it.
$tsExe = 'C:\Program Files\Tailscale\tailscale.exe'
if (Test-Path $tsExe) {
  Write-Host "  - Tailscale (already installed; skipping MSI step)"
} else {
  Write-Host "  - Tailscale (direct MSI from pkgs.tailscale.com)"
  # $env:PROCESSOR_ARCHITECTURE is reliable since NT 3.1 and works
  # identically in Windows PowerShell 5.1 and PowerShell 7. The
  # [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture
  # static returns null under PS 5.1 (it's a .NET Core / .NET 5+ API),
  # so .ToString() on it throws InvokeMethodOnNull.
  $procArch = $env:PROCESSOR_ARCHITECTURE
  $tsArch = switch ($procArch) {
    'ARM64' { 'arm64' }
    'AMD64' { 'amd64' }
    default { throw "Unsupported PROCESSOR_ARCHITECTURE: '$procArch' (expected ARM64 or AMD64)" }
  }
  # Parse the public stable index for the latest versioned MSI filename.
  $indexHtml = (Invoke-WebRequest 'https://pkgs.tailscale.com/stable/' -UseBasicParsing).Content
  $msiMatch = [regex]::Match($indexHtml, "tailscale-setup-(\d+\.\d+\.\d+)-$tsArch\.msi")
  if (-not $msiMatch.Success) {
    throw "Could not find a Tailscale $tsArch MSI in pkgs.tailscale.com/stable"
  }
  $tsMsiFile = $msiMatch.Value
  $tsMsiUrl = "https://pkgs.tailscale.com/stable/$tsMsiFile"
  $tsMsiPath = Join-Path $env:TEMP $tsMsiFile
  Write-Host "    Downloading $tsMsiUrl"
  Invoke-WebRequest -Uri $tsMsiUrl -OutFile $tsMsiPath -UseBasicParsing
  Write-Host "    Running msiexec /quiet /norestart /i ..."
  $msiProc = Start-Process msiexec.exe -Wait -PassThru `
    -ArgumentList '/quiet','/norestart','/i',"`"$tsMsiPath`""
  if ($msiProc.ExitCode -ne 0) {
    throw "Tailscale MSI install failed (msiexec exit $($msiProc.ExitCode))"
  }
  Remove-Item $tsMsiPath -Force -ErrorAction SilentlyContinue
}

# --- 3. Reload PATH in this session ---
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' +
            [System.Environment]::GetEnvironmentVariable('Path','User')

# --- 4. pnpm via npm ---
Write-Host "[4/7] Installing pnpm 9..."
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm not found after Node install — winget likely failed silently. Re-run the bootstrap or check 'winget list OpenJS.NodeJS'."
}
npm install -g pnpm@9
if ($LASTEXITCODE -ne 0) {
  throw "pnpm install failed (npm exit $LASTEXITCODE)."
}

# --- 5. Default SSH shell = Windows PowerShell 5.1 ---
# We point OpenSSH at Windows PowerShell 5.1 because its path is fixed
# and guaranteed-present on every Win10/11 install. The winget-installed
# Microsoft.PowerShell (pwsh 7) on ARM64 Windows lands in a per-user
# WindowsApps App Execution Alias path that varies by username and isn't
# a real binary — pointing OpenSSH at it is fragile. PS 5.1 is older but
# fully sufficient for our use: `;`-separated commands, pnpm/npm/git,
# the WinNetPro test + build pipeline. If a future demo needs pwsh 7
# specifically, that's the moment to revisit.
Write-Host "[5/7] Setting OpenSSH DefaultShell to Windows PowerShell 5.1..."
$openSshKey = 'HKLM:\SOFTWARE\OpenSSH'
if (-not (Test-Path $openSshKey)) {
  New-Item -Path $openSshKey -Force | Out-Null
}
New-ItemProperty -Path $openSshKey -Name DefaultShell `
  -Value 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' `
  -PropertyType String -Force | Out-Null

# --- 6. Admin authorized_keys ---
Write-Host "[6/7] Preparing administrators_authorized_keys..."
$adminKeys = 'C:\ProgramData\ssh\administrators_authorized_keys'
$adminKeysDir = Split-Path $adminKeys -Parent
if (-not (Test-Path $adminKeysDir)) { New-Item -ItemType Directory -Path $adminKeysDir -Force | Out-Null }
if (-not (Test-Path $adminKeys))    { New-Item -ItemType File      -Path $adminKeys    -Force | Out-Null }
icacls $adminKeys /inheritance:r /grant 'Administrators:F' /grant 'SYSTEM:F' | Out-Null

# --- 7. Tailscale up ---
Write-Host "[7/7] Bringing Tailscale up..."
if (-not (Test-Path $tsExe)) {
  throw "Tailscale binary missing at $tsExe — MSI install step did not produce it."
}
Start-Service Tailscale -ErrorAction SilentlyContinue
& $tsExe up

Write-Host ""
Write-Host "=== Bootstrap complete ==="
Write-Host ""
Write-Host "Windows VM Tailscale IP (paste into the Mac's ~/.ssh/config):"
& $tsExe ip -4
Write-Host ""
Write-Host "Next: on the Mac, copy your pubkey into:"
Write-Host "  $adminKeys"
Write-Host ""
