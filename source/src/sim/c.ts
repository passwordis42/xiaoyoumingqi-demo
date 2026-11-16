import { C_ROUNDS } from "../content/c-rounds";
import { RULE_CONFIG, clamp, type SkillLevel } from "./rules";

export type BlockType = "opening" | "fact" | "reversal" | "joke";
export type Block = { type: BlockType; t: number };
export type CSkills = { checking: SkillLevel; production: SkillLevel };

export function skillsFromLevel(level: SkillLevel): CSkills {
  return { checking: level, production: level };
}

const C = RULE_CONFIG.C;

export function decayOf(checking: SkillLevel): number {
  return C.decay * (1 - C.checkingDecayRelief * checking);
}

export function liftOf(production: SkillLevel): number {
  return 1 + C.lift * production;
}

export type Curve = {
  A: number[];
  R: number;
  H: number;
  hAt: number;
  sharingScore: number;
  exposure: number;
  fans: number;
  lines: string[];
};

/** 预飞和落版都调用这一条。工具不换公式。 */
export function simulate(blocks: readonly Block[], skills: CSkills): Curve {
  const d = decayOf(skills.checking);
  const m = liftOf(skills.production);
  const seen = new Set<string>();
  for (const b of blocks) {
    if (seen.has(b.type)) throw new Error("每种最多一块");
    seen.add(b.type);
    if (!C.positions.includes(b.t as (typeof C.positions)[number])) throw new Error("进度必须是 0、10、…、90");
  }
  if (blocks.length > C.maxBlocks) throw new Error("最多三块");
  if (new Set(blocks.map((b) => b.t)).size !== blocks.length) throw new Error("同一进度只能放一块");
  const A: number[] = [];
  for (let x = 0; x < C.points; x++) {
    let value = C.base - d * x;
    for (const block of blocks) {
      if (x < block.t) continue;
      if (block.type === "opening") {
        if (block.t !== C.openingOnlyAt) continue;
        value += C.effects.opening.amp * m * Math.exp(-x / C.effects.opening.tau);
        value += C.effects.opening.extraDecay * x;
      } else if (block.type === "fact") {
        value += C.effects.fact.amp * m * Math.exp(-(x - block.t) / C.effects.fact.tau);
      } else if (block.type === "reversal") {
        value += C.effects.reversal.amp * m * Math.exp(-(x - block.t) / C.effects.reversal.tau);
      } else if (block.type === "joke") {
        value += C.effects.joke.amp * m * Math.exp(-(x - block.t) / C.effects.joke.tau);
      }
    }
    A.push(clamp(value, 0, 100));
  }
  const above = A.filter((v) => v >= C.threshold).length;
  const R = above / C.points;
  let H = -1;
  let hAt = 0;
  A.forEach((v, x) => {
    if (v > H) {
      H = v;
      hAt = x;
    }
  });
  const sharingScore = Math.round(H);
  const exposure = Math.floor((C.exposure.base + C.exposure.perH * H) * (C.exposure.floor + C.exposure.span * R));
  const fans = Math.floor(exposure * C.fanRate * R);
  const lines = [
    `基础 A = ${C.base} − d×进度，d=${d.toFixed(3)} = ${C.decay}×(1 − ${C.checkingDecayRelief}×校对${skills.checking})。`,
    `正向倍率 m=${m.toFixed(2)} = 1 + ${C.lift}×制作${skills.production}。挑衅开头的额外下沉 −0.12×进度 不乘 m。`,
    `进度 x 从 0 到 99，共 ${C.points} 个点，按阅读进度计，不按时钟。x < 放置进度时，这块的增量是 0。`,
    `R = 高于 ${C.threshold} 的点数 / ${C.points} = ${R.toFixed(2)}。这是模型估计的超阈值长度，不是第一次流失。`,
    `H = max(A) = ${H.toFixed(2)}，出现在进度 ${hAt}。分享分 ${sharingScore} = round(H)。`,
    `曝光 ${exposure} = floor((100 + 2×H)×(0.4 + 0.6×R))。涨粉 ${fans} = floor(曝光×0.05×R)。没有额外的随机命中倍率。`,
  ];
  for (const block of blocks) {
    lines.push(`${label(block.type)}放在进度 ${block.t}。${block.type === "opening" && block.t !== 0 ? "挑衅开头只有进度 0 生效，这一块目前没有增量。" : "它不改写更早的进度。"}`);
  }
  return { A, R, H, hAt, sharingScore, exposure, fans, lines };
}

export function label(type: BlockType): string {
  return { opening: "挑衅开头", fact: "事实", reversal: "反转", joke: "笑话" }[type];
}

export type CurveState = {
  seed: string;
  skills: CSkills;
  pending: CSkills | null;
  round: number;
  blocks: Block[];
  committed: Curve | null;
  history: { round: number; title: string; curve: Curve }[];
  message: string;
};

export function createCurve(seed: string, level: SkillLevel): CurveState {
  return { seed, skills: skillsFromLevel(level), pending: null, round: 0, blocks: [], committed: null, history: [], message: "" };
}

export function setBlocks(state: CurveState, blocks: Block[]): CurveState {
  return { ...state, blocks, committed: null, message: "进度改了，曲线按整条公式重算，不留残差。" };
}

export function publishCurve(state: CurveState): CurveState {
  if (state.round >= C_ROUNDS.length) return { ...state, message: "十篇都落过了。" };
  let curve: Curve;
  try {
    curve = simulate(state.blocks, state.skills);
  } catch (error) {
    return { ...state, message: error instanceof Error ? error.message : "放不下。" };
  }
  const next = state.round + 1;
  return {
    ...state,
    committed: curve,
    round: next,
    blocks: [],
    skills: state.pending ?? state.skills,
    pending: null,
    history: [...state.history, { round: state.round, title: C_ROUNDS[state.round].title, curve }],
    message: "已落版。预飞如果开着，用的是同一条公式。",
  };
}

export { C_ROUNDS };
