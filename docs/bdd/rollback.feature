Feature: Rollback on failed apply
  As a field engineer
  I want WinNetPro to undo a mutation if the apply does not produce the configuration I asked for
  So that I cannot strand my machine with a half-applied or wrong configuration

  Background:
    Given the fake provider is loaded from "./fixtures/adapters.json"
    And a profile "DOCK 132" exists with ipv4.static 192.168.132.10/24 and no gateway
    And the fixture adapter "ad-02" is currently DHCP at 192.168.1.42/24 with gateway 192.168.1.1

  Scenario: A successful apply captures a snapshot first and verifies after
    Given the fake provider is configured to succeed on apply
    When the user runs:
      """
      profiles apply --profile "DOCK 132" --adapter ad-02 --real --yes --json
      """
    Then the exit code is 0
    And a snapshot file exists under "./snapshots/" containing the pre-apply state of "ad-02"
    And the snapshot's ipv4.mode is "dhcp"
    And the snapshot's ipv4.address is "192.168.1.42"
    And the JSON result has outcome "applied"
    And the fake provider's recorded state for "ad-02" matches ipv4 192.168.132.10/24

  Scenario: An apply that mutates but fails verification auto-rollbacks
    Given the fake provider is configured to corrupt the apply (sets ipv4.address to "192.168.99.99" instead of "192.168.132.10")
    When the user runs:
      """
      profiles apply --profile "DOCK 132" --adapter ad-02 --real --yes --json
      """
    Then the exit code is 6
    And the JSON result has outcome "rolled-back"
    And the snapshot file still exists
    And the fake provider's recorded state for "ad-02" matches the snapshot (back to DHCP 192.168.1.42/24)
    And stderr contains "verify failed; rolled back from snapshot"

  Scenario: Rollback that also fails surfaces exit 7 with clear diagnostic
    Given the fake provider is configured to fail both the apply verification AND the rollback restore
    When the user runs:
      """
      profiles apply --profile "DOCK 132" --adapter ad-02 --real --yes --json
      """
    Then the exit code is 7
    And the JSON result has outcome "rollback-failed"
    And stderr contains "adapter may be in an inconsistent state"
    And stderr contains a concrete PowerShell command for manual inspection
    And the snapshot file still exists for manual restore

  Scenario: Manual rollback by snapshot id
    Given a snapshot "snap-ad-02-2026-05-19T12-00-00Z" exists with ipv4.dhcp at 192.168.1.42/24
    And the fake provider's current state for "ad-02" is ipv4.static at 192.168.132.10/24
    When the user runs:
      """
      rollback --snapshot snap-ad-02-2026-05-19T12-00-00Z --real --yes --json
      """
    Then the exit code is 0
    And the fake provider's recorded state for "ad-02" is ipv4.dhcp at 192.168.1.42/24
