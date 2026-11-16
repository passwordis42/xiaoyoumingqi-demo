/** 规划 minimum-rules-r01 的可调试验参数。不是已验证平衡，也不是真实平台算法。 */

export const DISCLAIMER =
  "这里的数字都是可调的游戏试验规则，不是已经验证的平衡，不是真实平台算法，也不能保证现实中一定火。";

export const RULE_VERSION = "r01-planner-2026-11-16";

export type SkillLevel = 0 | 1;

export const RULE_CONFIG = {
  version: RULE_VERSION,
  disclaimer: DISCLAIMER,
  general: {
    rounds: 10,
    skills: [0, 1],
    toolAffectsSettlement: false,
    floorFinalIntegers: true,
    noWallClock: true,
    noSharedEconomy: true,
  },
  A: {
    slots: ["opening", "core", "emotion", "ending"],
    requiredSlots: ["opening", "core", "ending"],
    draw: { skill0: 6, skill1: 7 },
    energyPerDay: 6,
    cost: { draw: 1, publish: 1, deepCombo: 1 },
    writingExposureFactor: 1.15,
    errorQualityPenalty: 0.5,
    qualityMin: 0,
    memeExposureMultiplier: 1.5,
    deepConversionMultiplier: 2,
    softAdIncomeBonus: 20,
    softAdConversionMultiplier: 0.9,
    risk: {
      step: 0.15,
      cap: 0.45,
      /** P = clamp(step * max(0, n-1), 0, cap) */
    },
    throttleExposure: 0.6,
    controversyConversion: 0.5,
    controversyIncome: 0.8,
    wind: { hot: 1.2, steady: 1, calm: 0.8 },
    conversion: { base: 0.02, perQuality: 0.005, cap: 0.12 },
    income: { base: 5, perSoftAd: 10, forcedCombo: 20 },
    checkingRemoves: "one-technical-error-only",
  },
  B: {
    defaultGrid: { w: 3, h: 4 },
    grids: {
      low: { w: 3, h: 3 },
      high: { w: 3, h: 4 },
      optional: { w: 4, h: 4 },
    },
    modules: {
      analysis: { w: 3, h: 1, local: 10 },
      list: { w: 2, h: 1, local: 8 },
      meme: { w: 1, h: 1, local: 3 },
      ad: { w: 3, h: 1, local: 0 },
    },
    boredom: -0.1,
    memeRelief: 0.2,
    positiveCap: 2,
    adPairRetention: -0.1,
    adPairFans: -3,
    adPairCap: 2,
    adIncome: 15,
    retention: { base: 0.35, occupancy: 0.35, min: 0, max: 1 },
    fans: { scale: 100, rate: 0.1, totalMin: 0 },
    hotspotDoublesLocalOnly: true,
    instances: ["analysis-a", "analysis-b", "meme-a", "meme-b", "ad-a", "ad-b", "ad-c", "list-a"],
  },
  C: {
    points: 100,
    progressMax: 99,
    base: 60,
    decay: 0.6,
    checkingDecayRelief: 0.2,
    threshold: 25,
    lift: 0.25,
    positions: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
    maxBlocks: 3,
    openingOnlyAt: 0,
    effects: {
      opening: { amp: 30, tau: 12, extraDecay: -0.12 },
      fact: { amp: 16, tau: 35 },
      reversal: { amp: 30, tau: 14 },
      joke: { amp: 18, tau: 22 },
    },
    exposure: { base: 100, perH: 2, floor: 0.4, span: 0.6 },
    fanRate: 0.05,
    metric: "above-threshold-length",
  },
  D: {
    axes: ["density", "emotion", "commerce"],
    initial: 50,
    calibrations: { skill0: 3, skill1: 4 },
    distancePenalty: 2,
    grades: { S: 90, A: 75, B: 60 },
    toolExpansion: { base: 10, analysisSkill: 5 },
    exposure: { emotion: 1 },
    conversion: { base: 0.06, commerceTax: 0.5 },
    income: { base: 5, perCommerce: 20 },
    risk: { perEmotion: 0.3, hitConversion: 0.6 },
    rounds: [
      { id: "forum", title: "高校论坛 · 论文标题", audience: "会翻参考文献的人", density: [70, 90], emotion: [10, 30], commerce: [0, 20] },
      { id: "commute", title: "通勤短视频 · 垃圾分类", audience: "地铁里单手滑动的人", density: [15, 40], emotion: [55, 85], commerce: [10, 35] },
      { id: "brand", title: "品牌合作 · 耳机", audience: "知道你收了钱的人", density: [40, 65], emotion: [25, 50], commerce: [60, 90] },
      { id: "night", title: "城市号 · 夜班食堂", audience: "下班后还想看人话的人", density: [35, 60], emotion: [40, 70], commerce: [15, 45] },
      { id: "campus", title: "校园墙 · 选修课", audience: "选课周的学生", density: [25, 55], emotion: [45, 75], commerce: [0, 25] },
      { id: "parents", title: "家长群 · 暑假安排", audience: "想要步骤不想要口号的人", density: [50, 80], emotion: [20, 45], commerce: [5, 30] },
      { id: "game", title: "游戏社区 · 公测", audience: "已经玩过两小时的人", density: [30, 55], emotion: [50, 80], commerce: [20, 50] },
      { id: "local", title: "街区报 · 菜市场", audience: "早起买菜的人", density: [20, 50], emotion: [15, 40], commerce: [0, 20] },
      { id: "lab", title: "实验室周报 · 失败记录", audience: "要看对照的同事", density: [75, 95], emotion: [5, 25], commerce: [0, 15] },
      { id: "festival", title: "节日特刊 · 返乡", audience: "在路上刷手机的人", density: [20, 45], emotion: [60, 90], commerce: [25, 55] },
    ],
  },
  E: {
    actionBudget: 2,
    costs: { news: 1, roast: 1, technical: 2, contrary: 1 },
    stageNames: ["发酵", "高潮", "退潮"],
    stageHeat: [80, 140, 60],
    stanceFactor: {
      news: [1.5, 0.8, 0.5],
      roast: [1.3, 1, 0.6],
      technical: [0.7, 1.4, 1],
      contrary: [0.8, 1.1, 0.8],
    },
    crowdCap: 4,
    crowdDivisor: 0.25,
    conversion: {
      technicalMatched: 0.1,
      technicalUnmatched: 0.02,
      contraryMatched: 0.06,
      contraryUnmatched: 0.02,
      other: 0.04,
    },
    risk: { peakConfront: 0.3, otherwise: 0.1, hitFans: 0.5, mitigatedFans: 0.75 },
    confrontational: ["roast", "contrary"],
    peakStage: 1,
    eventsPerDay: 3,
    cycleDays: 3,
  },
} as const;

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
