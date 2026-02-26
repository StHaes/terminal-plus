Feature: Git panel

  Background:
    Given the app is open

  Scenario: Toggle git panel via button
    When I click the git panel button
    Then the git panel should be visible
    And the branch name should be "main"

  Scenario: Git panel shows commits
    When I click the git panel button
    Then I should see at least 1 commit row

  Scenario: Search filters commits
    When I click the git panel button
    And I type "dark mode" in the git search input
    Then I should see 1 commit row

  Scenario: Clear search restores all commits
    When I click the git panel button
    And I type "dark mode" in the git search input
    And I click the git search clear button
    Then I should see at least 2 commit rows

  @git-not-repo
  Scenario: Shows error when not a git repo
    When I click the git panel button
    Then the git panel should show an error
