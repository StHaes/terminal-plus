import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { TerminalPlusWorld } from "../support/world";
import { S } from "../support/selectors";

// --- Given ---

Given("the app is open", async function (this: TerminalPlusWorld) {
  // App is already loaded in the Before hook — just verify it's mounted
  await this.page.waitForSelector(S.app, { timeout: 5000 });
});

// --- When: button clicks ---

When("I click the shortcuts button", async function (this: TerminalPlusWorld) {
  await this.page.click(S.btnShortcuts);
});

When("I click the settings button", async function (this: TerminalPlusWorld) {
  await this.page.click(S.btnSettings);
});

When("I click the git panel button", async function (this: TerminalPlusWorld) {
  await this.page.click(S.btnGit);
  // Allow git log fetch to resolve
  await this.page.waitForTimeout(500);
});

When("I click the split horizontal button", async function (this: TerminalPlusWorld) {
  await this.page.click(S.btnSplitH);
  await this.page.waitForTimeout(300);
});

When("I click the split vertical button", async function (this: TerminalPlusWorld) {
  await this.page.click(S.btnSplitV);
  await this.page.waitForTimeout(300);
});

When("I click the shortcuts close button", async function (this: TerminalPlusWorld) {
  await this.page.click(S.shortcutsClose);
});

// --- When: key presses ---

When("I press {string}", async function (this: TerminalPlusWorld, keyCombo: string) {
  await this.page.keyboard.press(keyCombo);
  await this.page.waitForTimeout(200);
});

// --- Then: terminal pane count ---

Then("I should see {int} terminal pane(s)", async function (this: TerminalPlusWorld, count: number) {
  const panes = await this.page.$$(S.terminalPane);
  expect(panes.length).toBe(count);
});
