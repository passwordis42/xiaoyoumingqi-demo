import { expect, test } from "@playwright/test";
import { mkdirSync } from "fs";

mkdirSync("reports/screenshots", { recursive: true });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("disclaimer")).toContainText("游戏试验规则");
});

test("首页", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "小有名气" })).toBeVisible();
  await page.screenshot({ path: "reports/screenshots/home-desktop.png", fullPage: true });
});

test("A 十篇、技能、工具与不同摆法", async ({ page }) => {
  await page.goto("/#/a");
  await page.getByTestId("draw").click();
  await expect(page.getByTestId("hand-count")).toHaveText("6");
  await page.getByTestId("skill-high").click();
  await page.getByTestId("draw").click();
  await expect(page.getByTestId("hand-count")).toHaveText("7");
  await page.getByTestId("skill-low").click();
  await page.getByTestId("draw").click();

  async function publishVisible() {
    const opening = page.locator("[data-slots~='opening']").first();
    const openingId = await opening.getAttribute("data-testid");
    await opening.click();
    await page.getByTestId("slot-opening").click();
    const core = page.locator("[data-slots~='core']:not(.used)").first();
    await core.click();
    await page.getByTestId("slot-core").click();
    const ending = page.locator("[data-slots~='ending']:not(.used)").first();
    await ending.click();
    await page.getByTestId("slot-ending").click();
    await page.getByTestId("publish").click();
    return openingId;
  }

  await publishVisible();
  const first = await page.getByTestId("history-0").innerText();
  await page.getByTestId("restart").click();
  await page.getByTestId("draw").click();
  const emotion = page.locator("[data-slots~='emotion']").first();
  await page.locator("[data-slots~='opening']").first().click();
  await page.getByTestId("slot-opening").click();
  await page.locator("[data-slots~='core']:not(.used)").first().click();
  await page.getByTestId("slot-core").click();
  await emotion.click();
  await page.getByTestId("slot-emotion").click();
  await page.locator("[data-slots~='ending']:not(.used)").first().click();
  await page.getByTestId("slot-ending").click();
  await page.getByTestId("publish").click();
  expect(await page.getByTestId("history-0").innerText()).not.toBe(first);

  await page.getByTestId("tool").check();
  await page.getByTestId("restart").click();
  await page.getByTestId("draw").click();
  await expect(page.getByTestId("risk-readout")).toContainText("P=");
  await page.locator("[data-slots~='opening']").first().click();
  await page.getByTestId("slot-opening").focus();
  await page.keyboard.press("Enter");
  await page.locator("[data-slots~='core']:not(.used)").first().click();
  await page.getByTestId("slot-core").click();
  await page.locator("[data-slots~='ending']:not(.used)").first().click();
  await page.getByTestId("slot-ending").click();
  await page.getByTestId("publish").click();
  const withTool = await page.getByTestId("history-0").innerText();
  await page.getByTestId("tool").uncheck();
  await page.getByTestId("restart").click();
  await page.getByTestId("draw").click();
  await page.locator("[data-slots~='opening']").first().click();
  await page.getByTestId("slot-opening").click();
  await page.locator("[data-slots~='core']:not(.used)").first().click();
  await page.getByTestId("slot-core").click();
  await page.locator("[data-slots~='ending']:not(.used)").first().click();
  await page.getByTestId("slot-ending").click();
  await page.getByTestId("publish").click();
  expect(await page.getByTestId("history-0").innerText()).toBe(withTool);

  await page.getByTestId("restart").click();
  for (let i = 0; i < 10; i++) {
    if ((await page.getByTestId("energy").innerText()) === "0") await page.getByTestId("next-day").click();
    await page.getByTestId("draw").click();
    if ((await page.getByTestId("hand-count").innerText()) === "0") {
      await page.getByTestId("next-day").click();
      await page.getByTestId("draw").click();
    }
    await page.locator("[data-slots~='opening']").first().click();
    await page.getByTestId("slot-opening").click();
    await page.locator("[data-slots~='core']:not(.used)").first().click();
    await page.getByTestId("slot-core").click();
    await page.locator("[data-slots~='ending']:not(.used)").first().click();
    await page.getByTestId("slot-ending").click();
    await page.getByTestId("publish").click();
    if ((await page.getByTestId("history").locator("li").count()) === i) {
      await page.getByTestId("next-day").click();
      await page.getByTestId("publish").click();
    }
    await expect(page.getByTestId(`history-${i}`)).toBeVisible();
  }
  await expect(page.getByTestId("summary")).toBeVisible();
  await page.screenshot({ path: "reports/screenshots/a-ten.png", fullPage: true });
});

test("B 重叠、三条边与旋转", async ({ page }) => {
  await page.goto("/#/b");
  await expect(page.getByTestId("score-q")).toBeVisible();
  await page.getByTestId("tray-analysis-a").click();
  await page.getByTestId("cell-0-0").click();
  await page.getByTestId("tray-ad-a").click();
  await page.getByTestId("cell-0-0").click();
  await expect(page.getByTestId("message")).toContainText("重叠");
  await page.getByTestId("cell-0-1").click();
  const joined = await page.getByTestId("score-r").innerText();
  await page.getByTestId("cell-0-1").click();
  await page.getByTestId("remove").click();
  expect(await page.getByTestId("score-r").innerText()).not.toBe(joined);
  await page.getByTestId("skill-high").click();
  await page.getByTestId("grid-high").click();
  await page.getByTestId("tray-analysis-a").click();
  await page.getByTestId("cell-0-0").click();
  await page.getByTestId("cell-0-0").click();
  await page.getByTestId("rotate").click();
  await page.screenshot({ path: "reports/screenshots/b-grid.png", fullPage: true });
});

test("C 基线、进度 70 与同一公式预飞", async ({ page }) => {
  await page.goto("/#/c");
  await page.getByTestId("tool").check();
  await expect(page.getByTestId("chart-probe")).toHaveAttribute("data-r", "0.59");
  await expect(page.getByTestId("chart-probe")).toHaveAttribute("data-h", "60");
  const before69 = await page.getByTestId("chart-probe").getAttribute("data-a69");
  const before70 = await page.getByTestId("chart-probe").getAttribute("data-a70");
  await page.getByTestId("beat-reversal").click();
  await page.getByTestId("pos-70").click();
  await expect(page.getByTestId("chart-preview")).toBeVisible();
  expect(await page.getByTestId("chart-probe").getAttribute("data-a69")).toBe(before69);
  expect(await page.getByTestId("chart-probe").getAttribute("data-a70")).not.toBe(before70);
  await page.getByTestId("settle").click();
  await expect(page.getByTestId("history").locator("li")).toHaveCount(1);
  await page.screenshot({ path: "reports/screenshots/c-curve.png", fullPage: true });
});

test("D 校准次数与确认值", async ({ page }) => {
  await page.goto("/#/d");
  await expect(page.getByTestId("cal-left")).toHaveText("3");
  await page.getByTestId("fader-density").fill("80");
  await page.getByTestId("fader-emotion").fill("20");
  await page.getByTestId("fader-commerce").fill("10");
  await expect(page.getByTestId("cal-left")).toHaveText("3");
  await page.getByTestId("analyze").click();
  await expect(page.getByTestId("cal-left")).toHaveText("2");
  await expect(page.getByTestId("confirmed-density")).toContainText("密度 80");
  await page.getByTestId("fader-density").fill("10");
  await expect(page.getByTestId("cal-left")).toHaveText("2");
  await page.getByTestId("publish").click();
  await expect(page.getByTestId("history-0")).toHaveAttribute("data-density", "80");
  await page.getByTestId("tool").check();
  await expect(page.getByTestId("revealed")).toBeVisible();
  await expect(page.getByTestId("cal-left")).toHaveText("3");
  await page.getByTestId("skill-high").click();
  await expect(page.getByTestId("cal-left")).toHaveText("4");
  await page.screenshot({ path: "reports/screenshots/d-desk.png", fullPage: true });
});

test("E 天数不自动走，十篇可跨过第三天", async ({ page }) => {
  await page.goto("/#/e");
  await expect(page.getByTestId("day")).toHaveText("1");
  await page.waitForTimeout(1200);
  await expect(page.getByTestId("day")).toHaveText("1");
  const event = page.locator("[data-testid^='publish-']").first();
  await event.click();
  await expect(page.getByTestId("day")).toHaveText("1");
  await expect(page.getByTestId("fans")).toBeVisible();
  const fans = await page.getByTestId("fans").innerText();
  await page.getByTestId("tool").check();
  await page.getByTestId("restart").click();
  await expect(page.getByTestId("mood")).toBeVisible();
  await page.locator("[data-testid^='publish-']").first().click();
  expect(await page.getByTestId("fans").innerText()).toBe(fans);
  for (let i = 0; i < 9; i++) {
    const button = page.locator("[data-testid^='publish-']").first();
    const before = await page.getByTestId("history").locator("li").count();
    await button.click();
    if ((await page.getByTestId("history").locator("li").count()) === before) {
      await page.getByTestId("advance-day").click();
      await page.locator("[data-testid^='publish-']").first().click();
    }
  }
  await expect(page.getByTestId("history").locator("li")).toHaveCount(10);
  await page.getByTestId("advance-day").click();
  await page.getByTestId("advance-day").click();
  await page.getByTestId("advance-day").click();
  await expect(page.getByTestId("day")).not.toHaveText("1");
  await page.screenshot({ path: "reports/screenshots/e-day.png", fullPage: true });
});

test("窄屏", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({ path: "reports/screenshots/home-mobile.png", fullPage: true });
  await page.goto("/#/a");
  await expect(page.getByTestId("publish")).toBeVisible();
  await page.screenshot({ path: "reports/screenshots/a-mobile.png", fullPage: true });
});
