Feature: Apply a profile in dry-run mode
  As a field engineer
  I want to see exactly what an apply would change before it changes anything
  So that I can confirm intent and catch mismatches before connectivity is affected

  Background:
    Given the fake provider is loaded from "./fixtures/adapters.json"
    And a profile "DOCK 132" exists in "./demo-config/profiles.json":
      """
      {
        "name": "DOCK 132",
        "preferredAdapter": {
          "macAddress": "00-11-22-33-44-55",
          "interfaceGuid": "{a1b2c3d4-...-345678}"
        },
        "ipv4": {
          "mode": "static",
          "address": "192.168.132.10",
          "prefixLength": 24,
          "gateway": null,
          "dns": { "mode": "inherit", "servers": [] }
        },
        "ipv6": { "mode": "inherit" },
        "rollback": { "enabled": true }
      }
      """

  Scenario: Dry-run apply emits a complete change plan and mutates nothing
    Given the fixture has adapter "ad-02" currently in DHCP with address 192.168.1.42/24 and gateway 192.168.1.1
    And the fixture adapter "ad-02" has macAddress "00-11-22-33-44-55"
    When the user runs:
      """
      profiles apply --profile "DOCK 132" --adapter ad-02 --dry-run --json
      """
    Then the exit code is 0
    And stdout is a JSON object with kind "ChangePlan"
    And the change plan's targetAdapterId is "ad-02"
    And the change plan's match.confidence is "mac"
    And the change plan's ipv4.from.mode is "dhcp"
    And the change plan's ipv4.to.mode is "static"
    And the change plan's ipv4.to.address is "192.168.132.10"
    And the change plan's ipv4.to.prefixLength is 24
    And the change plan's ipv4.willChange is true
    And the change plan's dns.willChange is false
    And the change plan's ipv6.willChange is false
    And the change plan's rollback.snapshotWillBeCreated is true
    And the fake provider mutation log is empty

  Scenario: Dry-run is the default when stdin is not a TTY
    When the user runs (with no TTY):
      """
      profiles apply --profile "DOCK 132" --adapter ad-02 --json
      """
    Then the exit code is 0
    And stdout is a ChangePlan with no mutation occurring
    And the fake provider mutation log is empty

  Scenario: Refuse to dry-run an ambiguous adapter match
    Given the fixture defines two adapters with the same MAC "00-11-22-33-44-55" (cloned virtual NIC pair)
    When the user runs:
      """
      profiles apply --profile "DOCK 132" --dry-run --json
      """
    Then the exit code is 3
    And stderr contains "ambiguous adapter match"
    And the fake provider mutation log is empty

  Scenario: Refuse to dry-run an unknown profile
    When the user runs:
      """
      profiles apply --profile "DOES NOT EXIST" --adapter ad-02 --dry-run
      """
    Then the exit code is 3
    And stderr contains "no profile named"
