import { EVENT_POOL, type EventDef, type Stance } from "../content/e-events";
import { unitFloat } from "./rng";
import { RULE_CONFIG, clamp, type SkillLevel } from "./rules";

export type { EventDef, Stance };
export type ESkills = { communication: SkillLevel; internet: SkillLevel };

export function skillsFromLevel(level: SkillLevel): ESkills {
  return { communication: level, internet: level };
}

const E = RULE_CONFIG.E;
const STANCES: Stance[] = ["news", "roast", "technical", "contrary"];

export type LifeStage = 0 | 1 | 2;

export type LiveEvent = EventDef & { birth: number; stage: LifeStage };

export function stageName(stage: LifeStage): string {
  return E.stageNames[stage];
}

export function heatOf(stage: LifeStage): number {
  return E.stageHeat[stage];
}

export function factorOf(stance: Stance, stage: LifeStage): number {
  return E.stanceFactor[stance][stage];
}

export function eventByBirth(birth: number): EventDef {
  const n = EVENT_POOL.length;
  const index = ((birth % n) + n) % n;
  return EVENT_POOL[index];
}

/** 当天同时在场三则：出生日为当天、前一天、前两天，分别处于发酵、高潮、退潮。 */
export function eventsOnDay(day: number): LiveEvent[] {
  return ([0, 1, 2] as LifeStage[]).map((stage) => {
    const birth = day - stage;
    return { ...eventByBirth(birth), birth, stage };
  });
}

export function tomorrowPreview(day: number): LiveEvent {
  return eventsOnDay(day + 1).find((event) => event.stage === 0)!;
}

export type Crowd = Record<string, number>;

function key(birth: number, stance: Stance) {
  return `${birth}:${stance}`;
}

export function crowdOf(crowd: Crowd, event: { birth: number }, stance: Stance): number {
  return crowd[key(event.birth, stance)] ?? 0;
}

export type ActionResult = {
  day: number;
  stage: LifeStage;
  eventId: string;
  birth: number;
  title: string;
  stance: Stance;
  exposureRaw: number;
  exposure: number;
  conversion: number;
  fans: number;
  hit: boolean;
  p: number;
  u: number;
  crowd: number;
  lines: string[];
};

export function conversionOf(event: EventDef, stance: Stance): number {
  if (stance === "technical") return event.technicalSupported ? E.conversion.technicalMatched : E.conversion.technicalUnmatched;
  if (stance === "contrary") return event.contrarySupported ? E.conversion.contraryMatched : E.conversion.contraryUnmatched;
  return E.conversion.other;
}

export function riskProbability(stage: LifeStage, stance: Stance): number {
  const peak = stage === E.peakStage;
  const confront = (E.confrontational as readonly string[]).includes(stance);
  return peak && confront ? E.risk.peakConfront : E.risk.otherwise;
}

/** 展示用的曝光单独下取整。涨粉用未截断的中间曝光。 */
export function settlePayoff(rawExposure: number, conversion: number, riskMult: number): { exposure: number; fans: number } {
  return {
    exposure: Math.floor(rawExposure),
    fans: Math.floor(rawExposure * conversion * riskMult),
  };
}

export function resolveAction(input: {
  day: number;
  event: LiveEvent;
  stance: Stance;
  crowd: number;
  skills: ESkills;
  seed: string;
  nonce: number;
}): ActionResult {
  const heat = heatOf(input.event.stage);
  const factor = factorOf(input.stance, input.event.stage);
  const exposureRaw = (heat * factor) / (1 + E.crowdDivisor * input.crowd);
  const conversion = conversionOf(input.event, input.stance);
  const p = riskProbability(input.event.stage, input.stance);
  const u = unitFloat([input.seed, "E-risk", input.day, input.event.birth, input.stance, input.nonce]);
  const hit = u < p;
  const mult = hit ? (input.skills.communication ? E.risk.mitigatedFans : E.risk.hitFans) : 1;
  const { exposure, fans } = settlePayoff(exposureRaw, conversion, mult);
  const lines = [
    `第 ${input.day} 天。这一则处于${stageName(input.event.stage)}，热度 ${heat}。场上另外两则分别处于另外两个阶段。`,
    `立场系数 ${factor}。这一则、这一立场的拥挤 ${input.crowd}，换日不会清零。`,
    `展示曝光 ${exposure} = floor(${exposureRaw.toFixed(4)})。涨粉用未截断的 ${exposureRaw.toFixed(4)}。`,
    `证据：技术拆解${input.event.technicalSupported ? "成立" : "不足"}，唱反调${input.event.contrarySupported ? "成立" : "不足"}。转化 ${conversion}。`,
    `风险概率 ${p}。${input.event.stage === E.peakStage ? "这是高潮。" : "这不是高潮。"} u=${u.toFixed(4)}。${hit ? `命中，涨粉 ×${mult}。沟通技能只把 0.5 缓和到 0.75，不是免疫。` : "未命中。"}`,
    `涨粉 ${fans} = floor(未截断曝光 × 转化 × 风险系数)。全是虚构事件。`,
  ];
  return {
    day: input.day,
    stage: input.event.stage,
    eventId: input.event.id,
    birth: input.event.birth,
    title: input.event.title,
    stance: input.stance,
    exposureRaw,
    exposure,
    conversion,
    fans,
    hit,
    p,
    u,
    crowd: input.crowd,
    lines,
  };
}

export type Timing = {
  seed: string;
  skills: ESkills;
  pending: ESkills | null;
  day: number;
  budget: number;
  crowd: Crowd;
  nonce: number;
  history: ActionResult[];
  message: string;
};

export function createTiming(seed: string, level: SkillLevel): Timing {
  return {
    seed,
    skills: skillsFromLevel(level),
    pending: null,
    day: 1,
    budget: E.actionBudget,
    crowd: {},
    nonce: 0,
    history: [],
    message: "",
  };
}

export function advanceDay(state: Timing): Timing {
  const day = state.day + 1;
  const crowd = { ...state.crowd };
  for (const event of eventsOnDay(day)) {
    for (const stance of STANCES) {
      const add = unitFloat([state.seed, "E-crowd", day, event.birth, stance]) < 0.5 ? 0 : 1;
      const k = key(event.birth, stance);
      crowd[k] = Math.min(E.crowdCap, (crowd[k] ?? 0) + add);
    }
  }
  const skills = state.pending ?? state.skills;
  const leaving = eventsOnDay(state.day).find((event) => event.stage === 2);
  const entering = eventsOnDay(day).find((event) => event.stage === 0);
  return {
    ...state,
    day,
    budget: E.actionBudget,
    crowd,
    skills,
    pending: null,
    message: `进入第 ${day} 天。退潮的「${leaving?.title ?? ""}」退出，新的「${entering?.title ?? ""}」以发酵进入。其余两则保留编号、证据和拥挤，并各自推进一个阶段。`,
  };
}

export function publishAction(state: Timing, eventId: string, stance: Stance): Timing {
  const visible = eventsOnDay(state.day);
  const event = visible.find((e) => e.id === eventId);
  if (!event) return { ...state, message: "这篇还不在今天，不能提前发。" };
  const cost = E.costs[stance];
  if (state.budget < cost) return { ...state, message: `今天的行动点不够。${stanceName(stance)}要 ${cost} 点。` };
  const c = crowdOf(state.crowd, event, stance);
  const result = resolveAction({
    day: state.day,
    event,
    stance,
    crowd: c,
    skills: state.skills,
    seed: state.seed,
    nonce: state.nonce,
  });
  const k = key(event.birth, stance);
  return {
    ...state,
    budget: state.budget - cost,
    nonce: state.nonce + 1,
    crowd: { ...state.crowd, [k]: Math.min(E.crowdCap, c + 1) },
    history: [...state.history, result],
    message: `发出了。天数仍是 ${state.day}。同一事件同一立场的拥挤 +1。`,
  };
}

export function stanceName(stance: Stance): string {
  return { news: "新闻", roast: "吐槽", technical: "技术拆解", contrary: "唱反调" }[stance];
}

export function moodRatio(stage: LifeStage): { stance: Stance; share: number }[] {
  const factors = STANCES.map((stance) => factorOf(stance, stage));
  const sum = factors.reduce((s, n) => s + n, 0);
  return STANCES.map((stance, i) => ({ stance, share: clamp(factors[i] / sum, 0, 1) }));
}

export { STANCES, EVENT_POOL };
