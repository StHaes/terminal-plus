Feature: Tiling pane layout

  Background:
    Given the app is open

  Scenario: Single pane on launch
    Then I should see 1 terminal pane

  Scenario: Split horizontal via button
    When I click the split horizontal button
    Then I should see 2 terminal panes
    And I should see a horizontal split

  Scenario: Split vertical via button
    When I click the split vertical button
    Then I should see 2 terminal panes
    And I should see a vertical split

  Scenario: Close a pane
    When I click the split horizontal button
    And I close the focused pane
    Then I should see 1 terminal pane

  Scenario: Focus navigation cycles panes
    When I click the split horizontal button
    And I press "Meta+Shift+]"
    Then a different pane should be focused

  Scenario: Tab matches focused pane
    Then the active tab count should be 1

  Scenario: Drag to resize split handle exists
    When I click the split horizontal button
    Then I should see a split handle
