Feature: Terminal I/O

  Background:
    Given the app is open

  Scenario: Terminal pane is visible on launch
    Then I should see 1 terminal pane
    And the terminal pane should have a body element

  Scenario: Toggle search bar
    When I press "Meta+f"
    Then the search bar should be visible
    When I press "Escape"
    Then the search bar should not be visible

  Scenario: Mock PTY output appears in terminal buffer
    When I wait for PTY output
    Then the terminal buffer should contain "user@mock"
