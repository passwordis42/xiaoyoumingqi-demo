import { TOPICS, type CardDef, type SlotId, type TopicDef } from "../content/a-topics";
import { shuffleIds, unitFloat } from "./rng";
import { RULE_CONFIG, clamp, type SkillLevel } from "./rules";

export type { CardDef, SlotId, TopicDef };
export type RiskOutcome = "throttle" | "controversy" | "none";
export type Placed = Partial<Record<SlotId, string>>;

export type ASkills = { internet: SkillLevel; writing: SkillLevel; checking: SkillLevel };

export function skillsFromLevel(level: SkillLevel): ASkills {
  return { internet: level, writing: level, checking: level };
}

const A = RULE_CONFIG.A;
export const SLOT_ORDER: SlotId[] = ["opening", "core", "emotion", "ending"];

export function riskProbability(n: number): number {
  return clamp(A.risk.step * Math.max(0, n - 1), 0, A.risk.cap);
}

export function classifyRisk(u: number, p: number): RiskOutcome {
  if (u < p / 2) return "throttle";
  if (u < p) return "controversy";
  return "none";
}

/** 掷值只由种子和题目决定，不读牌的位置。 */
export function riskUnit(seed: string, topicId: string): number {
  return unitFloat([seed, "A-risk", topicId]);
}

export function cardOf(topic: TopicDef, id: string): CardDef {
  const card = topic.cards.find((c) => c.id === id);
  if (!card) throw new Error(`未知卡片 ${id}`);
  return card;
}

export function dealHand(seed: string, topic: TopicDef, skills: ASkills): string[] {
  const count = skills.internet ? A.draw.skill1 : A.draw.skill0;
  const shuffled = shuffleIds(topic.cards.map((c) => c.id), [seed, "A-hand", topic.id]).map((id) => cardOf(topic, id));
  const chosen: CardDef[] = [];
  for (const slot of A.requiredSlots) {
    const card = shuffled.find((c) => c.slots.includes(slot) && !chosen.some((x) => x.id === c.id));
    if (!card) throw new Error(`${topic.id} 缺少可单独放入${slot}的牌`);
    chosen.push(card);
  }
  for (const card of shuffled) {
    if (chosen.length >= count) break;
    if (!chosen.some((c) => c.id === card.id)) chosen.push(card);
  }
  return chosen.slice(0, count).map((c) => c.id);
}

export type ArticleInput = {
  topic: TopicDef;
  placed: Placed;
  skills: ASkills;
  correctedId: string | null;
  seed: string;
};

export type ArticleScore = {
  topicId: string;
  title: string;
  exposure: number;
  conversion: number;
  fans: number;
  income: number;
  n: number;
  p: number;
  u: number;
  outcome: RiskOutcome;
  energyCost: number;
  lines: string[];
};

function placedCards(topic: TopicDef, placed: Placed): { slot: SlotId; card: CardDef }[] {
  const list: { slot: SlotId; card: CardDef }[] = [];
  for (const slot of SLOT_ORDER) {
    const id = placed[slot];
    if (id) list.push({ slot, card: cardOf(topic, id) });
  }
  return list;
}

export function effectiveQ(card: CardDef, correctedId: string | null, checking: SkillLevel): number {
  const removed = checking === 1 && card.error && card.id === correctedId;
  const penalty = card.error && !removed ? A.errorQualityPenalty : 0;
  return clamp(card.q - penalty, A.qualityMin, 2);
}

export function previewArticle(input: Omit<ArticleInput, "seed"> & { seed?: string }): {
  ok: true;
  n: number;
  p: number;
  energyCost: number;
  lines: string[];
} | { ok: false; error: string } {
  const { topic, placed, skills, correctedId } = input;
  for (const slot of A.requiredSlots) {
    if (!placed[slot]) return { ok: false, error: "开篇、核心、收束都要放上才能提交。" };
  }
  const cards = placedCards(topic, placed);
  const ids = cards.map((c) => c.card.id);
  if (new Set(ids).size !== ids.length) return { ok: false, error: "同一张牌不能放两次。" };
  for (const { slot, card } of cards) {
    if (!card.slots.includes(slot)) return { ok: false, error: `「${card.name}」不能放进这个槽。` };
  }
  const n = cards.filter((c) => c.card.risk).length;
  const p = riskProbability(n);
  const deep = cards.some((c) => c.card.tags.includes("scandal")) && cards.some((c) => c.card.tags.includes("hard"));
  const energyCost = A.cost.publish + (deep ? A.cost.deepCombo : 0);
  const lines = [
    `风险牌 n=${n}，P=${p.toFixed(2)}。u < P/2 为节流（曝光 ×${A.throttleExposure}）；P/2 ≤ u < P 为争议（转化 ×${A.controversyConversion}，收入 ×${A.controversyIncome}）；否则无事。只掷一次。`,
  ];
  if (skills.checking && cards.some((c) => c.card.error)) {
    lines.push(correctedId ? `校对改掉了「${cards.find((c) => c.card.id === correctedId)?.card.name ?? correctedId}」的技术错误。风险和争议不在校对范围内。` : "校对可以指定一张有技术错误的牌。不指定就不改。");
  }
  return { ok: true, n, p, energyCost, lines };
}

export function settleArticle(input: ArticleInput): { ok: true; score: ArticleScore } | { ok: false; error: string } {
  const preview = previewArticle(input);
  if (!preview.ok) return preview;
  const { topic, placed, skills, correctedId, seed } = input;
  const cards = placedCards(topic, placed);
  const lines: string[] = [];
  let sumB = 0;
  let sumQ = 0;
  for (const { card } of cards) {
    const b = card.b * (skills.writing ? A.writingExposureFactor : 1);
    const q = effectiveQ(card, correctedId, skills.checking);
    sumB += b;
    sumQ += q;
    const bits = [`b=${b}`, `有效完成度 ${q}`];
    if (card.risk) bits.push("风险标签");
    if (card.error) bits.push(card.id === correctedId && skills.checking ? "技术错误已改" : "技术错误仍在");
    lines.push(`《${card.name}》${bits.join("，")}。`);
  }
  const avgQ = sumQ / cards.length;
  let meme = false;
  for (let i = 0; i < SLOT_ORDER.length - 1; i++) {
    const left = cards.find((c) => c.slot === SLOT_ORDER[i]);
    const right = cards.find((c) => c.slot === SLOT_ORDER[i + 1]);
    if (!left || !right) continue;
    const roastMeme =
      (left.card.tags.includes("roast") && right.card.tags.includes("meme")) ||
      (left.card.tags.includes("meme") && right.card.tags.includes("roast"));
    if (roastMeme) meme = true;
  }
  const memeMul = meme ? A.memeExposureMultiplier : 1;
  if (meme) lines.push("新品吐槽与玩梗相邻，曝光 ×1.5，只记一次。");
  const has = (tag: string) => cards.some((c) => c.card.tags.includes(tag));
  const deep = has("scandal") && has("hard");
  const softCombo = has("softAd") && has("hard");
  if (deep) lines.push("丑闻与硬分析同时在场：转化 ×2，本篇能量 +1。只记一次。");
  if (softCombo) lines.push("软广与硬分析同时在场：收入 +20，转化 ×0.9。只记一次，不加长期口碑。");
  const n = cards.filter((c) => c.card.risk).length;
  const p = riskProbability(n);
  const u = riskUnit(seed, topic.id);
  const outcome = classifyRisk(u, p);
  lines.push(`种子掷值 u=${u.toFixed(4)}，P=${p.toFixed(2)}，结果：${outcome === "throttle" ? "节流" : outcome === "controversy" ? "争议" : "无事"}。`);
  const wind = RULE_CONFIG.A.wind[topic.wind];
  lines.push(`题目风向 ${topic.wind} ×${wind}。`);
  const throttle = outcome === "throttle" ? A.throttleExposure : 1;
  const exposure = Math.floor(sumB * memeMul * wind * throttle);
  let conversion = A.conversion.base + A.conversion.perQuality * avgQ;
  lines.push(`基础转化 ${A.conversion.base} + ${A.conversion.perQuality} × 平均完成度 ${avgQ.toFixed(3)}。`);
  if (deep) conversion *= A.deepConversionMultiplier;
  if (softCombo) conversion *= A.softAdConversionMultiplier;
  if (outcome === "controversy") conversion *= A.controversyConversion;
  conversion = clamp(conversion, 0, A.conversion.cap);
  const fans = Math.floor(exposure * conversion);
  const softCount = cards.filter((c) => c.card.tags.includes("softAd")).length;
  const incomeFactor = outcome === "controversy" ? A.controversyIncome : 1;
  const income = Math.floor((A.income.base + A.income.perSoftAd * softCount + (softCombo ? A.income.forcedCombo : 0)) * incomeFactor);
  lines.push(`曝光 ${exposure} = floor(牌面曝光和 ${sumB.toFixed(2)} × 玩梗 ${memeMul} × 风向 ${wind} × 节流 ${throttle})。`);
  lines.push(`转化 ${conversion.toFixed(4)}（上限 ${A.conversion.cap}）。涨粉 ${fans} = floor(曝光 × 转化)。`);
  lines.push(`收入 ${income} = floor((${A.income.base} + 10×软广${softCount}张 + ${softCombo ? 20 : 0}) × ${incomeFactor})。`);
  return {
    ok: true,
    score: {
      topicId: topic.id,
      title: topic.title,
      exposure,
      conversion,
      fans,
      income,
      n,
      p,
      u,
      outcome,
      energyCost: preview.energyCost,
      lines: [...preview.lines, ...lines],
    },
  };
}

export type Campaign = {
  seed: string;
  skills: ASkills;
  pendingSkills: ASkills | null;
  day: number;
  energy: number;
  index: number;
  hand: string[];
  drawn: boolean;
  placed: Placed;
  correctedId: string | null;
  history: ArticleScore[];
  message: string;
  submitted: boolean;
};

export function createCampaign(seed: string, level: SkillLevel): Campaign {
  return {
    seed,
    skills: skillsFromLevel(level),
    pendingSkills: null,
    day: 1,
    energy: A.energyPerDay,
    index: 0,
    hand: [],
    drawn: false,
    placed: {},
    correctedId: null,
    history: [],
    message: "",
    submitted: false,
  };
}

export function currentTopic(c: Campaign): TopicDef | null {
  return TOPICS[c.index] ?? null;
}

export function draw(c: Campaign): Campaign {
  const topic = currentTopic(c);
  if (!topic) return { ...c, message: "十篇都结束了。" };
  if (c.drawn) return { ...c, message: "这一篇已经抓过牌。" };
  if (c.energy < A.cost.draw) return { ...c, message: "能量不够抓牌。可以进入下一天，没有等待。" };
  return {
    ...c,
    energy: c.energy - A.cost.draw,
    hand: dealHand(c.seed, topic, c.skills),
    drawn: true,
    message: "抓牌消耗 1 点能量。挪牌不会掷风险。",
  };
}

export function place(c: Campaign, cardId: string, slot: SlotId): Campaign {
  const topic = currentTopic(c);
  if (!topic || !c.drawn) return { ...c, message: "先抓牌。" };
  if (c.submitted) return { ...c, message: "这一篇已经提交。" };
  if (!c.hand.includes(cardId)) return { ...c, message: "这张牌不在手里。" };
  if (Object.values(c.placed).includes(cardId)) return { ...c, message: "这张牌已经在槽上。" };
  const card = cardOf(topic, cardId);
  if (!card.slots.includes(slot)) return { ...c, message: `「${card.name}」不进这个槽。` };
  if (c.placed[slot]) return { ...c, message: "这个槽已经有牌。" };
  return { ...c, placed: { ...c.placed, [slot]: cardId }, message: `放入「${card.name}」。还没掷。` };
}

export function unplace(c: Campaign, slot: SlotId): Campaign {
  if (!c.placed[slot]) return c;
  const placed = { ...c.placed };
  delete placed[slot];
  const correctedId = c.correctedId === c.placed[slot] ? null : c.correctedId;
  return { ...c, placed, correctedId, message: "拿回。风险仍未掷。" };
}

export function correct(c: Campaign, cardId: string | null): Campaign {
  if (!c.skills.checking) return { ...c, message: "技能 0 不能改技术错误。重开或下轮升级后再说。" };
  return { ...c, correctedId: cardId, message: cardId ? "指定改正这一张。提交前可以换。" : "取消改正。" };
}

export function nextDay(c: Campaign): Campaign {
  return { ...c, day: c.day + 1, energy: A.energyPerDay, message: "下一天。能量回到 6。没有倒计时，这篇还在。" };
}

export function scheduleUpgrade(c: Campaign): Campaign {
  return { ...c, pendingSkills: { internet: 1, writing: 1, checking: 1 }, message: "下一次进入新篇时升到技能 1。这一篇的手牌不变。" };
}

export function publish(c: Campaign): Campaign {
  const topic = currentTopic(c);
  if (!topic) return { ...c, message: "十篇都结束了。" };
  if (c.submitted) return { ...c, message: "不能重复提交这一篇。" };
  const settled = settleArticle({
    topic,
    placed: c.placed,
    skills: c.skills,
    correctedId: c.correctedId,
    seed: c.seed,
  });
  if (!settled.ok) return { ...c, message: settled.error };
  if (c.energy < settled.score.energyCost) {
    return { ...c, message: `能量不够。这篇要 ${settled.score.energyCost}，还剩 ${c.energy}。进入下一天即可，不用等。` };
  }
  const next = c.index + 1;
  const skills = next < TOPICS.length && c.pendingSkills ? c.pendingSkills : c.skills;
  return {
    ...c,
    energy: c.energy - settled.score.energyCost,
    index: next,
    hand: [],
    drawn: false,
    placed: {},
    correctedId: null,
    submitted: false,
    skills,
    pendingSkills: null,
    history: [...c.history, settled.score],
    message: `提交了「${topic.title}」。u=${settled.score.u.toFixed(4)}。`,
  };
}

export { TOPICS };
