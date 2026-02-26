import { BeforeAll, AfterAll, Before, After, type ITestCaseHookParameter } from "@cucumber/cucumber";
import { chromium, Browser } from "playwright";
import { TerminalPlusWorld } from "./world.js";
import { buildTauriMockScript } from "./tauri-mock.js";

const APP_URL = "http://localhost:1420";

let browser: Browser;

BeforeAll(async function () {
  const headless = !process.env.HEADED;
  browser = await chromium.launch({
    headless,
    args: ["--disable-web-security"],
  });
});

AfterAll(async function () {
  await browser?.close();
});

Before(async function (this: TerminalPlusWorld, scenario: ITestCaseHookParameter) {
  this.browser = browser;
  this.context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  this.page = await this.context.newPage();

  // Determine mock options from scenario tags
  const tags = scenario.pickle.tags.map((t) => t.name);
  const isNotRepo = tags.includes("@git-not-repo");

  // Inject Tauri IPC mock before any page scripts run
  await this.page.addInitScript(buildTauriMockScript({
    gitIsRepo: !isNotRepo,
  }));

  await this.page.goto(APP_URL, { waitUntil: "networkidle" });

  // Wait for the app to mount
  await this.page.waitForSelector(".app", { timeout: 10000 });

  // Wait for the welcome screen to fade out (1.5s animation + buffer)
  await this.page.waitForTimeout(2000);
});

After(async function (this: TerminalPlusWorld) {
  await this.context?.close();
});
