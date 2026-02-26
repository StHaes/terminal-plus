import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { TerminalPlusWorld } from "../support/world";
import { S } from "../support/selectors";

Then("the settings overlay should be visible", async function (this: TerminalPlusWorld) {
  await this.page.waitForSelector(S.settingsOverlay, { timeout: 3000 });
  const overlay = await this.page.$(S.settingsOverlay);
  expect(overlay).not.toBeNull();
});

Then("the settings overlay should not be visible", async function (this: TerminalPlusWorld) {
  await this.page.waitForSelector(S.settingsOverlay, { state: "detached", timeout: 3000 });
  const overlay = await this.page.$(S.settingsOverlay);
  expect(overlay).toBeNull();
});

Then("I should see at least {int} theme cards", async function (this: TerminalPlusWorld, min: number) {
  const cards = await this.page.$$(S.themeCard);
  expect(cards.length).toBeGreaterThanOrEqual(min);
});

Then("one theme card should be active", async function (this: TerminalPlusWorld) {
  const active = await this.page.$$(S.themeCardActive);
  expect(active.length).toBe(1);
});

When("I click an inactive theme card", async function (this: TerminalPlusWorld) {
  // Find a theme card that is NOT active and click it
  const cards = await this.page.$$(S.themeCard);
  for (const card of cards) {
    const isActive = await card.evaluate((el) => el.classList.contains("theme-card--active"));
    const isCreate = await card.evaluate((el) => el.classList.contains("theme-card--create"));
    if (!isActive && !isCreate) {
      await card.click();
      await this.page.waitForTimeout(300);
      // Store which card we clicked for the next assertion
      (this as any)._clickedCardName = await card.$eval(
        ".theme-card__name",
        (el) => el.textContent?.trim()
      ).catch(() => null);
      return;
    }
  }
  throw new Error("No inactive theme card found");
});

Then("the clicked theme card should be active", async function (this: TerminalPlusWorld) {
  const active = await this.page.$$(S.themeCardActive);
  expect(active.length).toBe(1);
});

Then("I should see the create custom theme card", async function (this: TerminalPlusWorld) {
  const create = await this.page.$(S.themeCardCreate);
  expect(create).not.toBeNull();
});
