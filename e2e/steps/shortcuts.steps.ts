import { Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { TerminalPlusWorld } from "../support/world";
import { S } from "../support/selectors";

Then("the shortcuts overlay should be visible", async function (this: TerminalPlusWorld) {
  await this.page.waitForSelector(S.shortcutsOverlay, { timeout: 3000 });
  const overlay = await this.page.$(S.shortcutsOverlay);
  expect(overlay).not.toBeNull();
});

Then("the shortcuts overlay should not be visible", async function (this: TerminalPlusWorld) {
  await this.page.waitForSelector(S.shortcutsOverlay, { state: "detached", timeout: 3000 });
  const overlay = await this.page.$(S.shortcutsOverlay);
  expect(overlay).toBeNull();
});

Then("I should see {int} shortcut rows", async function (this: TerminalPlusWorld, count: number) {
  const rows = await this.page.$$(S.shortcutsRow);
  expect(rows.length).toBe(count);
});

Then("I should see the shortcut {string}", async function (this: TerminalPlusWorld, label: string) {
  const labels = await this.page.$$eval(S.shortcutsLabel, (els) =>
    els.map((el) => el.textContent?.trim())
  );
  expect(labels).toContain(label);
});
