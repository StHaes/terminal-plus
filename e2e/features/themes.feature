Feature: Theme management

  Background:
    Given the app is open

  Scenario: Open settings overlay via button
    When I click the settings button
    Then the settings overlay should be visible

  Scenario: Close settings overlay with Escape
    When I click the settings button
    And I press "Escape"
    Then the settings overlay should not be visible

  Scenario: Shows theme cards
    When I click the settings button
    Then I should see at least 2 theme cards

  Scenario: Active theme is highlighted
    When I click the settings button
    Then one theme card should be active

  Scenario: Switch theme by clicking a card
    When I click the settings button
    And I click an inactive theme card
    Then the clicked theme card should be active

  Scenario: Create custom theme card is visible
    When I click the settings button
    Then I should see the create custom theme card
