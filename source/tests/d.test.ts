import { describe, expect, it } from "vitest";
import { analyzeDesk, axisScore, createDesk, matchOf, publishDesk, revealedInterval, riskUnit, setDraft, settleDesk } from "../src/sim/d";
import { RULE_CONFIG } from "../src/sim/rules";

describe("D 校准与确认值", () => {
  it("滑杆不消耗，分析才减，出版不用未分析草稿", () => {
    let desk = createDesk("d", 0);
    expect(desk.calibrationsLeft).toBe(3);
    expect(desk.confirmed).toEqual({ density: 50, emotion: 50, commerce: 50 });
    for (let v = 0; v <= 100; v += 5) desk = setDraft(desk, "density", v);
    expect(desk.calibrationsLeft).toBe(3);
    expect(desk.feedback).toHaveLength(0);
    expect(publishDesk(desk).history).toHaveLength(0);
    desk = setDraft(desk, "density", 80);
    desk = setDraft(desk, "emotion", 20);
    desk = setDraft(desk, "commerce", 10);
    desk = analyzeDesk(desk);
    expect(desk.calibrationsLeft).toBe(2);
    expect(desk.confirmed.density).toBe(80);
    desk = setDraft(desk, "density", 10);
    const published = publishDesk(desk);
    expect(published.history[0].axes.density).toBe(80);
    expect(published.history[0].payoff.exposure).toBe(settleDesk(RULE_CONFIG.D.rounds[0], { density: 80, emotion: 20, commerce: 10 }, "d").exposure);
  });

  it("技能 1 有 4 次校准，用尽后再分析被拒绝", () => {
    let desk = createDesk("d", 1);
    expect(desk.calibrationsLeft).toBe(4);
    desk = createDesk("d", 0);
    desk = analyzeDesk(analyzeDesk(analyzeDesk(desk)));
    expect(desk.calibrationsLeft).toBe(0);
    expect(analyzeDesk(desk).calibrationsLeft).toBe(0);
  });

  it("区间内 100，区间外按距离，三轮区间互不相同且中心不全是 50", () => {
    expect(axisScore(30, 20, 40)).toBe(100);
    expect(axisScore(50, 20, 40)).toBe(80);
    expect(axisScore(0, 20, 40)).toBe(60);
    for (const round of RULE_CONFIG.D.rounds) {
      const intervals = [round.density.join(","), round.emotion.join(","), round.commerce.join(",")];
      expect(new Set(intervals).size).toBe(3);
      const centers = [round.density, round.emotion, round.commerce].map(([lo, hi]) => (lo + hi) / 2);
      expect(centers.every((c) => c === 50)).toBe(false);
    }
    expect(RULE_CONFIG.D.rounds.length).toBe(10);
  });

  it("曝光、转化、收入和风险按确认值计算，工具不改真区间", () => {
    const round = RULE_CONFIG.D.rounds[0];
    const axes = { density: 80, emotion: 20, commerce: 10 };
    const pay = settleDesk(round, axes, "fixed");
    const { match } = matchOf(round, axes);
    expect(pay.exposure).toBe(Math.floor(match * (1 + 20 / 100)));
    expect(pay.income).toBe(Math.floor(5 + 20 * (10 / 100)));
    const raw = 0.06 * (1 - 0.5 * (10 / 100));
    expect(pay.conversion).toBeCloseTo(pay.hit ? raw * 0.6 : raw, 10);
    expect(pay.u).toBe(riskUnit("fixed", round.id));
    expect(pay.u).toBe(settleDesk(round, { density: 0, emotion: 100, commerce: 0 }, "fixed").u);
    const shown = revealedInterval(round.density[0], round.density[1], 0);
    const tighter = revealedInterval(round.density[0], round.density[1], 1);
    expect(shown[0]).toBeLessThanOrEqual(round.density[0]);
    expect(tighter[1] - tighter[0]).toBeLessThan(shown[1] - shown[0]);
    expect(round.density).toEqual([70, 90]);
  });

  it("十轮可出版", () => {
    let desk = createDesk("ten", 0);
    for (let i = 0; i < 10; i++) {
      desk = analyzeDesk(desk);
      desk = publishDesk(desk);
    }
    expect(desk.history).toHaveLength(10);
    expect(new Set(desk.history.map((h) => h.roundId)).size).toBe(10);
  });
});
