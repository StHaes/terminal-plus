import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { TerminalPlusWorld } from "../support/world";
import { S } from "../support/selectors";

Then("the git panel should be visible", async function (this: TerminalPlusWorld) {
  await this.page.waitForSelector(S.gitPanel, { timeout: 5000 });
  const panel = await this.page.$(S.gitPanel);
  expect(panel).not.toBeNull();
});

Then("the branch name should be {string}", async function (this: TerminalPlusWorld, branch: string) {
  const branchEl = await this.page.waitForSelector(S.gitPanelBranch, { timeout: 3000 });
  const text = await branchEl?.textContent();
  expect(text).toContain(branch);
});

Then("I should see at least {int} commit row(s)", async function (this: TerminalPlusWorld, min: number) {
  // Wait for commits to load
  await this.page.waitForSelector(S.gitCommitRow, { timeout: 5000 });
  const rows = await this.page.$$(S.gitCommitRow);
  expect(rows.length).toBeGreaterThanOrEqual(min);
});

Then("I should see {int} commit row(s)", async function (this: TerminalPlusWorld, count: number) {
  await this.page.waitForTimeout(500);
  const rows = await this.page.$$(S.gitCommitRow);
  expect(rows.length).toBe(count);
});

When("I type {string} in the git search input", async function (this: TerminalPlusWorld, text: string) {
  await this.page.waitForSelector(S.gitSearchInput, { timeout: 3000 });
  await this.page.fill(S.gitSearchInput, text);
  await this.page.waitForTimeout(300);
});

When("I click the git search clear button", async function (this: TerminalPlusWorld) {
  await this.page.click(S.gitSearchClear);
  await this.page.waitForTimeout(300);
});

Then("the git panel should show an error", async function (this: TerminalPlusWorld) {
  await this.page.waitForSelector(S.gitPanelError, { timeout: 10000 });
  const error = await this.page.$(S.gitPanelError);
  expect(error).not.toBeNull();
});
