import { expect, test } from "@playwright/test";

test.use({
  hasTouch: true,
  isMobile: true,
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});

async function assertNoHorizontalClip(page: import("@playwright/test").Page, labels: string[]) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    offenders: [...document.querySelectorAll("button, a, input")].flatMap((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return [];
      const text = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 24);
      if (r.left < -1 || r.right > window.innerWidth + 1) return [{ text, left: r.left, right: r.right }];
      return [];
    }),
  }));
  expect(metrics.scrollWidth, "page wider than the phone").toBeLessThanOrEqual(metrics.innerWidth + 1);
  expect(metrics.offenders, "controls wider than the phone").toEqual([]);
  for (const label of labels) {
    const target = page.getByRole("button", { name: label }).first();
    await expect(target).toBeVisible();
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(-1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(metrics.innerWidth + 1);
    expect(box!.height).toBeGreaterThanOrEqual(32);
  }
}

test("触屏点选可完成五种试验", async ({ page }) => {
  await page.goto("/#/a");
  await assertNoHorizontalClip(page, ["抓牌", "提交", "下一天", "按此重开"]);
  await page.getByTestId("draw").tap();
  await expect(page.getByTestId("hand-count")).toHaveText("6");
  const opening = page.locator("[data-slots~='opening']").first();
  await opening.tap();
  await expect(opening).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("slot-opening").tap();
  await expect(page.getByTestId("slot-opening")).not.toContainText("空");
  await page.locator("[data-slots~='core']:not(.used)").first().tap();
  await page.getByTestId("slot-core").tap();
  await expect(page.getByTestId("slot-core")).not.toContainText("空");
  await page.locator("[data-slots~='ending']:not(.used)").first().tap();
  await page.getByTestId("slot-ending").tap();
  await page.getByTestId("publish").tap();
  await expect(page.getByTestId("history-0")).toBeVisible();
  await page.getByTestId("restart").tap();
  await expect(page.getByTestId("history").locator("li")).toHaveCount(0);

  await page.goto("/#/b");
  await assertNoHorizontalClip(page, ["旋转", "收回", "记下并下一轮"]);
  await page.getByTestId("tray-analysis-a").tap();
  await page.getByTestId("cell-0-0").tap();
  await expect(page.getByTestId("cell-0-0")).toContainText("分");
  await page.getByTestId("cell-0-0").tap();
  await page.getByTestId("rotate").tap();
  await page.getByTestId("remove").tap();
  await expect(page.getByTestId("tray-analysis-a")).toBeVisible();
  await expect(page.getByTestId("cell-0-0")).not.toContainText("分");

  await page.goto("/#/c");
  await assertNoHorizontalClip(page, ["事实", "落版"]);
  await page.getByTestId("beat-fact").tap();
  await page.getByTestId("pos-20").tap();
  await expect(page.getByTestId("pos-20")).toContainText("事实");
  await page.getByTestId("settle").tap();
  await expect(page.getByTestId("history").locator("li")).toHaveCount(1);

  await page.goto("/#/d");
  await assertNoHorizontalClip(page, ["分析", "按上次校准出版"]);
  const fader = page.getByTestId("fader-density");
  const box = await fader.boundingBox();
  expect(box).not.toBeNull();
  await page.touchscreen.tap(box!.x + box!.width * 0.8, box!.y + box!.height / 2);
  await expect(page.getByTestId("draft-density")).not.toHaveText("50");
  await expect(page.getByTestId("cal-left")).toHaveText("3");
  await page.getByTestId("analyze").tap();
  await expect(page.getByTestId("cal-left")).toHaveText("2");
  await page.getByTestId("publish").tap();
  await expect(page.getByTestId("history-0")).toBeVisible();

  await page.goto("/#/e");
  await assertNoHorizontalClip(page, ["下一天", "吐槽"]);
  await page.getByTestId("stance-roast").tap();
  await expect(page.getByTestId("stance-roast")).toHaveAttribute("aria-pressed", "true");
  await page.locator("[data-testid^='publish-']").first().tap();
  await expect(page.getByTestId("day")).toHaveText("1");
  await expect(page.getByTestId("fans")).toBeVisible();
  await page.getByTestId("advance-day").tap();
  await expect(page.getByTestId("day")).toHaveText("2");
  await page.screenshot({ path: "reports/screenshots/touch-e.png", fullPage: true });
});
