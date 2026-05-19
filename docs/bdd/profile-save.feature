Feature: Save a profile
  As a field engineer
  I want to save the current configuration of an adapter as a named profile
  So that I can reapply it later when the same device is reconnected

  Background:
    Given the fake provider is loaded from "./fixtures/adapters.json"
    And the working directory is "./demo-config" (no profiles.json yet)

  Scenario: Save the current state of an adapter as a new profile with preferred-adapter binding
    Given the fixture defines an adapter "ad-02" with:
      | windowsAlias        | Ethernet 5             |
      | macAddress          | 00-11-22-33-44-55      |
      | interfaceGuid       | {a1b2c3d4-...-345678}  |
      | description         | USB 10/100/1000 LAN    |
      | ipv4.mode           | static                 |
      | ipv4.address        | 192.168.132.10         |
      | ipv4.prefixLength   | 24                     |
      | ipv4.gateway        | null                   |
    When the user runs:
      """
      profiles save --name "DOCK 132" --from-adapter ad-02 --json
      """
    Then the exit code is 0
    And the file "./demo-config/profiles.json" exists
    And profiles.json contains a profile with name "DOCK 132"
    And the saved profile's ipv4.address is "192.168.132.10"
    And the saved profile's ipv4.prefixLength is 24
    And the saved profile's ipv4.gateway is null
    And the saved profile's preferredAdapter.macAddress is "00-11-22-33-44-55"
    And the saved profile's preferredAdapter.interfaceGuid is "{a1b2c3d4-...-345678}"
    And the saved profile's ipv6.mode is "inherit"

  Scenario: Save a global profile (no preferred adapter)
    When the user runs:
      """
      profiles save --name "Office DHCP" --ipv4-mode dhcp --global --json
      """
    Then the exit code is 0
    And profiles.json contains a profile with name "Office DHCP"
    And the saved profile's ipv4.mode is "dhcp"
    And the saved profile does not have a preferredAdapter field

  Scenario: Reject saving with invalid IPv4 address
    When the user runs:
      """
      profiles save --name "Bad" --ipv4-mode static --ipv4-address 999.0.0.1 --ipv4-prefix 24
      """
    Then the exit code is 3
    And stderr contains "invalid IPv4 address"
    And profiles.json is not created

  Scenario: Reject saving with conflicting flags (dhcp mode + static address)
    When the user runs:
      """
      profiles save --name "Bad" --ipv4-mode dhcp --ipv4-address 192.168.1.1 --ipv4-prefix 24
      """
    Then the exit code is 3
    And stderr contains "dhcp mode does not allow ipv4 address"
