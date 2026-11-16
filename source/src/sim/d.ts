import { unitFloat } from "./rng";
import { RULE_CONFIG, clamp, type SkillLevel } from "./rules";

export type Axis = "density" | "emotion" | "commerce";
export type Axes = Record<Axis, number>;
export type DeskRound = (typeof RULE_CONFIG.D.rounds)[number];
export type Grade = "S" | "A" | "B" | "C";

export type DSkills = { writing: SkillLevel; analysis: SkillLevel };

export function skillsFromLevel(level: SkillLevel): DSkills {
  return { writing: level, analysis: level };
}

const D = RULE_CONFIG.D;

export function axisScore(value: number, lo: number, hi: number): number {
  if (value >= lo && value <= hi) return 100;
  const distance = value < lo ? lo - value : value - hi;
  return clamp(100 - D.distancePenalty * distance, 0, 100);
}

export function intervalOf(round: DeskRound, axis: Axis): readonly [number, number] {
  return round[axis];
}

export function matchOf(round: DeskRound, axes: Axes): { scores: Axes; match: number; grade: Grade } {
  const scores: Axes = {
    density: axisScore(axes.density, round.density[0], round.density[1]),
    emotion: axisScore(axes.emotion, round.emotion[0], round.emotion[1]),
    commerce: axisScore(axes.commerce, round.commerce[0], round.commerce[1]),
  };
  const match = (scores.density + scores.emotion + scores.commerce) / 3;
  const grade: Grade = match >= D.grades.S ? "S" : match >= D.grades.A ? "A" : match >= D.grades.B ? "B" : "C";
  return { scores, match, grade };
}

export function riskProbability(emotion: number): number {
  return clamp(D.risk.perEmotion * (emotion / 100), 0, 1);
}

export function riskUnit(seed: string, roundId: string): number {
  return unitFloat([seed, "D-risk", roundId]);
}

export type Payoff = {
  exposure: number;
  conversion: number;
  income: number;
  hit: boolean;
  p: number;
  u: number;
  match: number;
  grade: Grade;
  scores: Axes;
  lines: string[];
};

export function settleDesk(round: DeskRound, confirmed: Axes, seed: string): Payoff {
  const { scores, match, grade } = matchOf(round, confirmed);
  const p = riskProbability(confirmed.emotion);
  const u = riskUnit(seed, round.id);
  const hit = u < p;
  let conversion = D.conversion.base * (1 - D.conversion.commerceTax * (confirmed.commerce / 100));
  if (hit) conversion *= D.risk.hitConversion;
  const exposure = Math.floor(match * (1 + confirmed.emotion / 100));
  const income = Math.floor(D.income.base + D.income.perCommerce * (confirmed.commerce / 100));
  const lines = [
    `确认值：密度 ${confirmed.density}，情绪 ${confirmed.emotion}，商业 ${confirmed.commerce}。`,
    `单轴：落在区间内记 100，否则 100 − 2×到最近边界的距离，再夹到 0..100。`,
    `密度 ${scores.density}，情绪 ${scores.emotion}，商业 ${scores.commerce}。匹配均值 ${match.toFixed(2)}，档位 ${grade}（S≥90，A≥75，B≥60，否则 C）。`,
    `曝光 ${exposure} = floor(匹配均值 × (1 + 情绪/100))。`,
    `转化 ${conversion.toFixed(4)} = ${D.conversion.base}×(1 − ${D.conversion.commerceTax}×商业/100)${hit ? ` × ${D.risk.hitConversion}` : ""}。`,
    `收入 ${income} = floor(${D.income.base} + ${D.income.perCommerce}×商业/100)。`,
    `风险概率 ${p.toFixed(4)} = 0.3×情绪/100。u=${u.toFixed(4)}。${hit ? "命中，本篇转化 ×0.6。" : "未命中。"} 只掷一次，跟滑杆来回无关。`,
  ];
  return { exposure, conversion, income, hit, p, u, match, grade, scores, lines };
}

export function revealedInterval(lo: number, hi: number, analysis: SkillLevel): [number, number] {
  const expand = analysis === 1 ? D.toolExpansion.analysisSkill : D.toolExpansion.base;
  return [clamp(lo - expand, 0, 100), clamp(hi + expand, 0, 100)];
}

export type Probe = { axes: Axes; payoffPreview: null };

export type Desk = {
  seed: string;
  skills: DSkills;
  pending: DSkills | null;
  round: number;
  calibrationsLeft: number;
  draft: Axes;
  confirmed: Axes;
  analyzed: boolean;
  feedback: string[];
  history: { roundId: string; title: string; payoff: Payoff; axes: Axes }[];
  message: string;
};

const START: Axes = { density: D.initial, emotion: D.initial, commerce: D.initial };

export function createDesk(seed: string, level: SkillLevel): Desk {
  const skills = skillsFromLevel(level);
  return {
    seed,
    skills,
    pending: null,
    round: 0,
    calibrationsLeft: skills.writing ? D.calibrations.skill1 : D.calibrations.skill0,
    draft: { ...START },
    confirmed: { ...START },
    analyzed: false,
    feedback: [],
    history: [],
    message: "",
  };
}

export function currentRound(desk: Desk): DeskRound | null {
  return D.rounds[desk.round] ?? null;
}

export function setDraft(desk: Desk, axis: Axis, value: number): Desk {
  const next = clamp(value, 0, 100);
  return {
    ...desk,
    draft: { ...desk.draft, [axis]: next },
    message: "滑杆只改草稿。校准次数没变，也没有新的反馈。",
  };
}

export function analyzeDesk(desk: Desk): Desk {
  const round = currentRound(desk);
  if (!round) return { ...desk, message: "十轮都结束了。" };
  if (desk.calibrationsLeft <= 0) return { ...desk, message: "校准用完了。不能白拿反馈。" };
  const { scores, match, grade } = matchOf(round, desk.draft);
  const feedback = [
    `这一次分析把草稿抄进确认值，消耗 1 次校准。`,
    `密度 ${scores.density}，情绪 ${scores.emotion}，商业 ${scores.commerce}。`,
    `匹配均值 ${match.toFixed(2)}，档位 ${grade}。`,
    `若按这个确认值出版，风险概率约 ${(riskProbability(desk.draft.emotion) * 100).toFixed(1)}%。命中则转化 ×0.6。`,
  ];
  return {
    ...desk,
    calibrationsLeft: desk.calibrationsLeft - 1,
    confirmed: { ...desk.draft },
    analyzed: true,
    feedback,
    message: "分析完成。出版将用这组确认值，不是你之后拨到的草稿。",
  };
}

export function publishDesk(desk: Desk): Desk {
  const round = currentRound(desk);
  if (!round) return { ...desk, message: "十轮都结束了。" };
  if (!desk.analyzed) return { ...desk, message: "还没分析。不能把未分析的草稿出版，初始的 50 也不算分析过。" };
  const payoff = settleDesk(round, desk.confirmed, desk.seed);
  const next = desk.round + 1;
  const skills = desk.pending ?? desk.skills;
  return {
    ...desk,
    round: next,
    skills,
    pending: null,
    calibrationsLeft: next < D.rounds.length ? (skills.writing ? D.calibrations.skill1 : D.calibrations.skill0) : 0,
    draft: { ...START },
    confirmed: { ...START },
    analyzed: false,
    feedback: [],
    history: [...desk.history, { roundId: round.id, title: round.title, payoff, axes: { ...desk.confirmed } }],
    message: `出版了「${round.title}」。档位 ${payoff.grade}。`,
  };
}
