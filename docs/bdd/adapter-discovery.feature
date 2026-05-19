Feature: Adapter discovery
  As a field engineer
  I want WinNetPro to list every network adapter on the machine
  So that I can see what is connected before I edit anything

  Background:
    Given the fake provider is loaded from "./fixtures/adapters.json"

  Scenario: List adapters in a quiet environment
    Given the fixture defines three adapters:
      | id    | windowsAlias | macAddress         | ipv4Mode | ipv4Address     | linkState |
      | ad-01 | Ethernet     | 00-50-56-AA-BB-CC  | dhcp     | 192.168.1.42    | up        |
      | ad-02 | Ethernet 5   | 00-11-22-33-44-55  | static   | 192.168.132.10  | up        |
      | ad-03 | Wi-Fi        | A0-B1-C2-D3-E4-F5  | dhcp     | 10.0.0.7        | up        |
    When the user runs "adapters list --json"
    Then the exit code is 0
    And the JSON output contains exactly 3 adapters
    And each adapter has fields: id, windowsAlias, macAddress, ipv4.mode, ipv4.address, linkState

  Scenario: Show full detail for one adapter
    Given the fixture defines an adapter "ad-02" with windowsAlias "Ethernet 5" and macAddress "00-11-22-33-44-55"
    When the user runs "adapters show --id ad-02 --json"
    Then the exit code is 0
    And the JSON output is a single adapter object with id "ad-02"
    And the adapter has both an ipv4 and an ipv6 section
    And the ipv6 section is read-only and not editable in v1

  Scenario: Refusing to show an unknown adapter
    Given the fixture defines no adapter with id "ad-99"
    When the user runs "adapters show --id ad-99"
    Then the exit code is 3
    And stderr contains "no adapter with id ad-99"
