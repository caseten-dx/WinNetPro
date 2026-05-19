Feature: Auto-apply safety in the GUI
  As a field engineer using the GUI
  I want auto-apply to be off by default and safe when enabled
  So that I cannot accidentally mutate the network while typing or by leaving a stale toggle on

  Background:
    Given the GUI is launched with the fake provider
    And the GUI has loaded an adapter "ad-02" currently DHCP at 192.168.1.42/24

  Scenario: Auto-apply is off on every launch
    When the GUI window finishes loading
    Then the auto-apply toggle is OFF
    And the toggle is visible in the title bar
    And the status bar reads "idle"

  Scenario: Field edits with auto-apply OFF stage but do not mutate
    Given auto-apply is OFF
    When the user types "192.168.132.10" into the IPv4 address field
    And the user types "24" into the IPv4 prefix field
    Then the "Pending change plan" panel updates to show ipv4 from dhcp to static 192.168.132.10/24
    And the status bar reads "pending"
    And the fake provider's recorded state for "ad-02" is unchanged

  Scenario: Field edits with auto-apply ON apply only after debounce and full validity
    Given auto-apply is ON (explicitly toggled by user this session)
    When the user begins typing the IPv4 address one character at a time:
      | keystroke  | elapsedMsSinceLastEdit | formValid |
      | 1          | 0                      | false     |
      | 9          | 100                    | false     |
      | 2          | 100                    | false     |
      | .          | 100                    | false     |
      | 1          | 100                    | false     |
      | 6          | 100                    | false     |
      | 8          | 100                    | false     |
      | .          | 100                    | false     |
      | 1          | 100                    | false     |
      | 3          | 100                    | false     |
      | 2          | 100                    | false     |
      | .          | 100                    | false     |
      | 1          | 100                    | false     |
      | 0          | 100                    | true      |
    Then no apply has fired yet
    When 1500 ms pass with no further edits
    Then exactly one apply fires
    And a snapshot is captured before the apply
    And the fake provider's recorded state for "ad-02" reflects ipv4.static 192.168.132.10/24
    And the status bar transitions: pending → applying → applied

  Scenario: A failed auto-apply does not auto-retry
    Given auto-apply is ON
    And the fake provider is configured to fail the next apply
    When the user enters a valid form and 1500 ms pass
    Then exactly one apply fires
    And the apply fails verification and rolls back
    And the status bar reads "rolled-back: verify failed"
    And no further apply fires until the user makes another edit

  Scenario: Auto-apply does not persist across app restarts
    Given auto-apply was ON when the user closed the app
    When the user relaunches the GUI
    Then auto-apply is OFF
    And the title bar toggle reflects OFF
