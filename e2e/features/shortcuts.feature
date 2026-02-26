Feature: Keyboard shortcuts overlay

  Background:
    Given the app is open

  Scenario: Open shortcuts overlay via button
    When I click the shortcuts button
    Then the shortcuts overlay should be visible

  Scenario: Close shortcuts overlay with Escape
    When I click the shortcuts button
    And I press "Escape"
    Then the shortcuts overlay should not be visible

  Scenario: Close shortcuts overlay with close button
    When I click the shortcuts button
    And I click the shortcuts close button
    Then the shortcuts overlay should not be visible

  Scenario: Lists all 7 keybindings
    When I click the shortcuts button
    Then I should see 7 shortcut rows

  Scenario: Lists expected shortcut labels
    When I click the shortcuts button
    Then I should see the shortcut "Split Horizontal"
    And I should see the shortcut "Split Vertical"
    And I should see the shortcut "Close Pane"
    And I should see the shortcut "Toggle Git Panel"
    And I should see the shortcut "Search Terminal"

  Scenario: Cmd+D triggers horizontal split
    When I press "Meta+d"
    Then I should see 2 terminal panes
