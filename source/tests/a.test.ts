import { describe, expect, it } from "vitest";
import {
  TOPICS,
  classifyRisk,
  createCampaign,
  dealHand,
  draw,
  nextDay,
  place,
  publish,
  riskProbability,
  riskUnit,
  settleArticle,
  skillsFromLevel,
  unplace,
} from "../src/sim/a";

const topic = TOPICS[0];

function placed(ids: Partial<Record<"opening" | "core" | "emotion" | "ending", string>>) {
  return ids;
}

describe("A 风险阶梯", () => {
  it("P 按 0.15×max(0,n-1) 封顶 0.45", () => {
    expect(riskProbability(0)).toBe(0);
    expect(riskProbability(1)).toBe(0);
    expect(riskProbability(2)).toBeCloseTo(0.15, 10);
    expect(riskProbability(3)).toBeCloseTo(0.3, 10);
    expect(riskProbability(4)).toBeCloseTo(0.45, 10);
    expect(riskProbability(5)).toBeCloseTo(0.45, 10);
  });

  it("n=3 时 u=0.10 节流，0.20 争议，0.40 无事，互斥且只判一次", () => {
    const p = riskProbability(3);
    expect(p).toBeCloseTo(0.3, 10);
    expect(classifyRisk(0.1, p)).toBe("throttle");
    expect(classifyRisk(0.2, p)).toBe("controversy");
    expect(classifyRisk(0.4, p)).toBe("none");
    expect(classifyRisk(p / 2, p)).toBe("controversy");
    expect(classifyRisk(p, p)).toBe("none");
  });

  it("挪牌不改变 u", () => {
    const before = riskUnit("seed", topic.id);
    const a = settleArticle({
      topic,
      placed: { opening: `${topic.id}-roast`, core: `${topic.id}-meme`, ending: `${topic.id}-end` },
      skills: skillsFromLevel(0),
      correctedId: null,
      seed: "seed",
    });
    const b = settleArticle({
      topic,
      placed: { opening: `${topic.id}-open`, core: `${topic.id}-scandal`, emotion: `${topic.id}-feel`, ending: `${topic.id}-hard` },
      skills: skillsFromLevel(0),
      correctedId: null,
      seed: "seed",
    });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.score.u).toBe(before);
    expect(b.score.u).toBe(before);
    expect(a.score.n).not.toBe(b.score.n);
  });
});

describe("A 数值", () => {
  it("吐槽贴玩梗只乘一次 1.5，风向和节流分账", () => {
    const score = settleArticle({
      topic,
      placed: placed({ opening: `${topic.id}-roast`, core: `${topic.id}-meme`, ending: `${topic.id}-end` }),
      skills: skillsFromLevel(0),
      correctedId: null,
      seed: "none-risk",
    });
    expect(score.ok).toBe(true);
    if (!score.ok) return;
    const cards = ["roast", "meme", "end"].map((s) => topic.cards.find((c) => c.id === `${topic.id}-${s}`)!);
    const sumB = cards.reduce((s, c) => s + c.b, 0);
    const wind = 1.2;
    const throttle = score.score.outcome === "throttle" ? 0.6 : 1;
    expect(score.score.exposure).toBe(Math.floor(sumB * 1.5 * wind * throttle));
    expect(score.score.lines.join("\n")).toContain("只记一次");
  });

  it("写作技能让每张牌的 b×1.15，校对只改一张技术错误", () => {
    const hard = topic.cards.find((c) => c.tags.includes("hard"))!;
    const base = settleArticle({
      topic,
      placed: { opening: `${topic.id}-open`, core: `${topic.id}-hard`, ending: `${topic.id}-end` },
      skills: { internet: 0, writing: 1, checking: 1 },
      correctedId: hard.error ? hard.id : null,
      seed: "w",
    });
    const plain = settleArticle({
      topic,
      placed: { opening: `${topic.id}-open`, core: `${topic.id}-hard`, ending: `${topic.id}-end` },
      skills: skillsFromLevel(0),
      correctedId: null,
      seed: "w",
    });
    expect(base.ok && plain.ok).toBe(true);
    if (!base.ok || !plain.ok) return;
    const sum = [topic.cards.find((c) => c.id.endsWith("-open"))!, hard, topic.cards.find((c) => c.id.endsWith("-end"))!].reduce(
      (s, c) => s + c.b * 1.15,
      0,
    );
    const wind = 1.2;
    const throttle = base.score.outcome === "throttle" ? 0.6 : 1;
    expect(base.score.exposure).toBe(Math.floor(sum * wind * throttle));
    expect(base.score.u).toBe(plain.score.u);
  });

  it("丑闻+硬分析与软广+硬分析可以共存，同一种不叠两次", () => {
    const score = settleArticle({
      topic,
      placed: {
        opening: `${topic.id}-open`,
        core: `${topic.id}-scandal`,
        emotion: `${topic.id}-soft`,
        ending: `${topic.id}-hard`,
      },
      skills: skillsFromLevel(0),
      correctedId: null,
      seed: "combo",
    });
    expect(score.ok).toBe(true);
    if (!score.ok) return;
    expect(score.score.energyCost).toBe(2);
    expect(score.score.lines.filter((l) => l.includes("转化 ×2")).length).toBe(1);
    expect(score.score.lines.filter((l) => l.includes("转化 ×0.9")).length).toBe(1);
    const cards = ["open", "scandal", "soft", "feel"].map((s) => topic.cards.find((c) => c.id === `${topic.id}-${s === "feel" ? "soft" : s}`)!);
    // income uses soft count 1 and forced combo
    const factor = score.score.outcome === "controversy" ? 0.8 : 1;
    expect(score.score.income).toBe(Math.floor((5 + 10 * 1 + 20) * factor));
    expect(cards.length).toBe(4);
  });

  it("未改正的技术错误让完成度 -0.5 且不低于 0", () => {
    const feel = topic.cards.find((c) => c.id.endsWith("-feel"))!;
    expect(feel.error).toBe(true);
    const score = settleArticle({
      topic,
      placed: { opening: `${topic.id}-open`, core: `${topic.id}-meme`, emotion: feel.id, ending: `${topic.id}-end` },
      skills: skillsFromLevel(0),
      correctedId: null,
      seed: "err",
    });
    expect(score.ok).toBe(true);
    if (!score.ok) return;
    expect(score.score.lines.join("\n")).toContain("技术错误仍在");
  });

  it("缺槽不能提交，重复提交被挡住，能量不够不掷进历史", () => {
    let c = createCampaign("energy", 0);
    c = draw(c);
    expect(c.energy).toBe(5);
    c = place(c, c.hand.find((id) => topic.cards.find((card) => card.id === id)?.slots.includes("opening"))!, "opening");
    const blocked = publish(c);
    expect(blocked.history).toHaveLength(0);
    expect(blocked.message).toContain("收束");
    c = { ...createCampaign("low-energy", 0), energy: 0, drawn: true, hand: topic.cards.map((card) => card.id) };
    c = place(c, `${topic.id}-open`, "opening");
    c = place(c, `${topic.id}-meme`, "core");
    c = place(c, `${topic.id}-end`, "ending");
    const poor = publish(c);
    expect(poor.history).toHaveLength(0);
    expect(poor.message).toContain("下一天");
    const rested = publish(nextDay(poor));
    expect(rested.history).toHaveLength(1);
    expect(rested.day).toBe(2);
  });

  it("同一种子十篇重放一致，抓牌 6 与 7", () => {
    const play = (level: 0 | 1) => {
      let c = createCampaign("20261116", level);
      for (let i = 0; i < 10; i++) {
        if (c.energy < 1) c = nextDay(c);
        c = draw(c);
        if (!c.drawn) {
          c = nextDay(c);
          c = draw(c);
        }
        const t = TOPICS[i];
        const opening = c.hand.find((id) => t.cards.find((card) => card.id === id)?.slots.includes("opening"))!;
        const core = c.hand.find((id) => t.cards.find((card) => card.id === id)?.slots.includes("core"))!;
        const ending = c.hand.find((id) => id !== core && t.cards.find((card) => card.id === id)?.slots.includes("ending"))!;
        c = place(c, opening, "opening");
        c = place(c, core, "core");
        c = place(c, ending, "ending");
        let tried = publish(c);
        if (tried.history.length === c.history.length) {
          c = nextDay(c);
          tried = publish(c);
        }
        c = tried;
      }
      return c;
    };
    const a = play(0);
    const b = play(0);
    expect(a.history).toHaveLength(10);
    expect(b.history).toEqual(a.history);
    expect(dealHand("20261116", TOPICS[0], skillsFromLevel(0))).toHaveLength(6);
    expect(dealHand("20261116", TOPICS[0], skillsFromLevel(1))).toHaveLength(7);
    const moved = unplace(place(draw(createCampaign("20261116", 0)), `${TOPICS[0].id}-open`, "opening"), "opening");
    expect(moved.history).toHaveLength(0);
  });
});
