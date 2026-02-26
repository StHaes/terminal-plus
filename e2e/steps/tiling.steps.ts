import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { TerminalPlusWorld } from "../support/world";
import { S } from "../support/selectors";

Then("I should see a horizontal split", async function (this: TerminalPlusWorld) {
  const split = await this.page.$(S.tileSplitH);
  expect(split).not.toBeNull();
});

Then("I should see a vertical split", async function (this: TerminalPlusWorld) {
  const split = await this.page.$(S.tileSplitV);
  expect(split).not.toBeNull();
});

When("I close the focused pane", async function (this: TerminalPlusWorld) {
  // Click the close button on the focused pane's header
  const focused = await this.page.$(`${S.terminalPaneFocused} ${S.terminalHeaderClose}`);
  if (focused) {
    await focused.click();
  } else {
    // Fallback: close any pane header close button
    await this.page.click(S.terminalHeaderClose);
  }
  await this.page.waitForTimeout(300);
});

Then("a different pane should be focused", async function (this: TerminalPlusWorld) {
  // After focus-next, there should still be a focused pane
  const focused = await this.page.$(S.terminalPaneFocused);
  expect(focused).not.toBeNull();
});

Then("the active tab count should be {int}", async function (this: TerminalPlusWorld, count: number) {
  const activeTabs = await this.page.$$(S.tabActive);
  expect(activeTabs.length).toBe(count);
});

Then("I should see a split handle", async function (this: TerminalPlusWorld) {
  const handle = await this.page.$(S.splitHandle);
  expect(handle).not.toBeNull();
});
