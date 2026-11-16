import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { EVENT_POOL } from "../src/content/e-events";
import {
  advanceDay,
  conversionOf,
  createTiming,
  crowdOf,
  eventsOnDay,
  publishAction,
  resolveAction,
  riskProbability,
  settlePayoff,
  tomorrowPreview,
  type LiveEvent,
} from "../src/sim/e";

function idForBirth(birth: number): string {
  const n = EVENT_POOL.length;
  return EVENT_POOL[((birth % n) + n) % n].id;
}

describe("E 错峰三阶段", () => {
  it("第 1 到第 5 天的编号和阶段", () => {
    const expected: Record<number, { birth: number; stage: 0 | 1 | 2 }[]> = {
      1: [
        { birth: 1, stage: 0 },
        { birth: 0, stage: 1 },
        { birth: -1, stage: 2 },
      ],
      2: [
        { birth: 2, stage: 0 },
        { birth: 1, stage: 1 },
        { birth: 0, stage: 2 },
      ],
      3: [
        { birth: 3, stage: 0 },
        { birth: 2, stage: 1 },
        { birth: 1, stage: 2 },
      ],
      4: [
        { birth: 4, stage: 0 },
        { birth: 3, stage: 1 },
        { birth: 2, stage: 2 },
      ],
      5: [
        { birth: 5, stage: 0 },
        { birth: 4, stage: 1 },
        { birth: 3, stage: 2 },
      ],
    };
    for (const day of [1, 2, 3, 4, 5]) {
      const events = eventsOnDay(day);
      expect(events.map((event) => event.stage)).toEqual([0, 1, 2]);
      expect(events.map((event) => ({ birth: event.birth, stage: event.stage }))).toEqual(expected[day]);
      expect(events.map((event) => event.id)).toEqual(expected[day].map((row) => idForBirth(row.birth)));
      expect(new Set(events.map((event) => event.id)).size).toBe(3);
    }
    const born = eventsOnDay(1).find((event) => event.stage === 0)!;
    expect(eventsOnDay(2).find((event) => event.id === born.id)?.stage).toBe(1);
    expect(eventsOnDay(3).find((event) => event.id === born.id)?.stage).toBe(2);
    expect(eventsOnDay(4).some((event) => event.id === born.id)).toBe(false);
    expect(eventsOnDay(2).some((event) => event.id === eventsOnDay(1).find((event) => event.stage === 2)!.id)).toBe(false);
    expect(tomorrowPreview(1)).toMatchObject(eventsOnDay(2).find((event) => event.stage === 0)!);
    expect(tomorrowPreview(4).id).toBe(eventsOnDay(5).find((event) => event.stage === 0)!.id);
    const continued = eventsOnDay(3).find((event) => event.id === born.id)!;
    expect(continued.technicalSupported).toBe(born.technicalSupported);
    expect(continued.contrarySupported).toBe(born.contrarySupported);
  });

  it("拥挤跟着事件走，换日不归零，同行增量封顶 4", () => {
    const ferment = eventsOnDay(1).find((event) => event.stage === 0)!;
    let state = publishAction(createTiming("crowd", 0), ferment.id, "news");
    expect(state.day).toBe(1);
    expect(crowdOf(state.crowd, ferment, "news")).toBe(1);
    expect(crowdOf(state.crowd, ferment, "roast")).toBe(0);
    state = advanceDay(state);
    const later = eventsOnDay(2).find((event) => event.birth === ferment.birth)!;
    expect(later.stage).toBe(1);
    expect(later.id).toBe(ferment.id);
    const kept = crowdOf(state.crowd, later, "news");
    expect(kept).toBeGreaterThanOrEqual(1);
    expect(kept).toBeLessThanOrEqual(4);
    let capped = createTiming("cap", 0);
    capped = { ...capped, crowd: { [`${ferment.birth}:news`]: 4 } };
    capped = advanceDay(capped);
    expect(crowdOf(capped.crowd, eventsOnDay(2).find((event) => event.birth === ferment.birth)!, "news")).toBe(4);
    const again = advanceDay(publishAction(createTiming("crowd", 0), ferment.id, "news"));
    expect(again.crowd).toEqual(state.crowd);
  });
});

describe("E 结算精度与其余规则", () => {
  it("展示曝光单独取整，涨粉用未截断中间值", () => {
    const split = settlePayoff(44.8, 0.06, 0.75);
    expect(split.exposure).toBe(44);
    expect(split.fans).toBe(2);
    expect(Math.floor(split.exposure * 0.06 * 0.75)).toBe(1);
    const event: LiveEvent = { ...EVENT_POOL.find((item) => item.technicalSupported)!, birth: 3, stage: 0 };
    const played = resolveAction({
      day: 3,
      event,
      stance: "technical",
      crowd: 1,
      skills: { communication: 0, internet: 0 },
      seed: "raw",
      nonce: 0,
    });
    const raw = (80 * 0.7) / 1.25;
    expect(played.exposureRaw).toBeCloseTo(raw, 10);
    expect(played.exposure).toBe(Math.floor(raw));
    const mult = played.hit ? 0.5 : 1;
    expect(played.fans).toBe(Math.floor(raw * played.conversion * mult));
  });

  it("高潮的唱反调风险是 0.30，沟通技能只缓和到 0.75", () => {
    expect(riskProbability(1, "contrary")).toBe(0.3);
    expect(riskProbability(1, "news")).toBe(0.1);
    expect(riskProbability(0, "roast")).toBe(0.1);
    const event: LiveEvent = { ...EVENT_POOL[0], birth: 0, stage: 1 };
    expect(conversionOf(event, "news")).toBe(0.04);
    let seed = "";
    for (let i = 0; i < 40; i++) {
      const trial = resolveAction({
        day: 2,
        event,
        stance: "contrary",
        crowd: 0,
        skills: { communication: 0, internet: 0 },
        seed: `hit-${i}`,
        nonce: 0,
      });
      if (trial.hit) {
        seed = `hit-${i}`;
        break;
      }
    }
    expect(seed).not.toBe("");
    const hard = resolveAction({ day: 2, event, stance: "contrary", crowd: 0, skills: { communication: 0, internet: 0 }, seed, nonce: 0 });
    const soft = resolveAction({ day: 2, event, stance: "contrary", crowd: 0, skills: { communication: 1, internet: 0 }, seed, nonce: 0 });
    expect(hard.fans).toBe(Math.floor(hard.exposureRaw * hard.conversion * 0.5));
    expect(soft.fans).toBe(Math.floor(soft.exposureRaw * soft.conversion * 0.75));
  });

  it("不能发明天的事件，十次发布可以跨天，源码没有倒计时", () => {
    const ui = readFileSync("src/ui/ExpE.tsx", "utf8") + readFileSync("src/sim/e.ts", "utf8");
    expect(ui).not.toMatch(/setInterval|setTimeout/);
    let state = createTiming("cycle", 1);
    const tomorrow = tomorrowPreview(1);
    expect(publishAction(state, tomorrow.id, "news").history).toHaveLength(0);
    let guard = 0;
    while (state.history.length < 10 && guard < 40) {
      const visible = eventsOnDay(state.day);
      const stance = state.budget >= 2 && state.history.length % 3 === 0 ? "technical" : "news";
      const next = publishAction(state, visible[state.history.length % visible.length].id, stance);
      state = next.history.length === state.history.length ? advanceDay(state) : next;
      guard++;
    }
    expect(state.history).toHaveLength(10);
    expect(Math.max(...state.history.map((item) => item.day))).toBeGreaterThan(1);
  });
});
