import { unitFloat } from "./rng";
import { RULE_CONFIG, clamp, type SkillLevel } from "./rules";

export type ModuleType = "analysis" | "list" | "meme" | "ad";
export type GridName = "low" | "high" | "optional";

export type Piece = { id: string; type: ModuleType; x: number; y: number; rot: 0 | 1 };

const B = RULE_CONFIG.B;

export function gridOf(name: GridName): { w: number; h: number } {
  return B.grids[name];
}

export function defaultGridForSkill(level: SkillLevel): GridName {
  return level === 1 ? "high" : "low";
}

export function footprint(p: Piece): [number, number][] {
  const def = B.modules[p.type];
  const w = p.rot === 1 ? def.h : def.w;
  const h = p.rot === 1 ? def.w : def.h;
  const cells: [number, number][] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) cells.push([p.x + x, p.y + y]);
  return cells;
}

export function area(type: ModuleType): number {
  const def = B.modules[type];
  return def.w * def.h;
}

export function sharedEdges(a: readonly [number, number][], b: readonly [number, number][]): number {
  const set = new Set(a.map(([x, y]) => `${x},${y}`));
  let n = 0;
  for (const [x, y] of b) {
    if (set.has(`${x - 1},${y}`)) n++;
    if (set.has(`${x + 1},${y}`)) n++;
    if (set.has(`${x},${y - 1}`)) n++;
    if (set.has(`${x},${y + 1}`)) n++;
  }
  return n;
}

export function diagonalTouches(a: readonly [number, number][], b: readonly [number, number][]): number {
  const set = new Set(a.map(([x, y]) => `${x},${y}`));
  let n = 0;
  for (const [x, y] of b) {
    for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
      if (set.has(`${x + dx},${y + dy}`)) n++;
    }
  }
  return n;
}

export function placementError(pieces: Piece[], grid: { w: number; h: number }, piece: Piece, ignore?: string): string | null {
  const occ = new Set<string>();
  for (const p of pieces) {
    if (p.id === ignore) continue;
    for (const [x, y] of footprint(p)) occ.add(`${x},${y}`);
  }
  for (const [x, y] of footprint(piece)) {
    if (x < 0 || y < 0 || x >= grid.w || y >= grid.h) return "出了版心。";
    if (occ.has(`${x},${y}`)) return "和已有模块重叠。";
  }
  return null;
}

export type Hotspot = { x: number; y: number; tag: ModuleType };

const TAGS: ModuleType[] = ["analysis", "list", "meme", "ad"];

export function hotspotOf(seed: string, roundId: string, grid: { w: number; h: number }): Hotspot {
  const u = unitFloat([seed, "B-hot", roundId]);
  const t = unitFloat([seed, "B-hot-tag", roundId]);
  const index = Math.floor(u * grid.w * grid.h) % (grid.w * grid.h);
  return { x: index % grid.w, y: Math.floor(index / grid.w), tag: TAGS[Math.floor(t * TAGS.length) % TAGS.length] };
}

export type Analysis = {
  occupancy: number;
  Q: number;
  R: number;
  unrelieved: number;
  positiveCount: number;
  adPairs: number;
  adPairCount: number;
  newFans: number;
  income: number;
  local: { id: string; score: number; doubled: boolean }[];
  localTotal: number;
  hotspot: Hotspot;
  lines: string[];
};

export function analyze(pieces: Piece[], grid: { w: number; h: number }, hotspot: Hotspot): Analysis {
  const total = grid.w * grid.h;
  const occ = new Set<string>();
  for (const p of pieces) for (const [x, y] of footprint(p)) occ.add(`${x},${y}`);
  const occupancy = occ.size / total;
  const Q = 100 * occupancy;
  const analyses = pieces.filter((p) => p.type === "analysis");
  const memes = pieces.filter((p) => p.type === "meme");
  const ads = pieces.filter((p) => p.type === "ad");
  let unrelieved = 0;
  let relieved = 0;
  for (const a of analyses) {
    const touch = memes.filter((m) => sharedEdges(footprint(a), footprint(m)) > 0).length;
    if (touch >= 1) relieved++;
    else unrelieved++;
  }
  const positiveCount = Math.min(B.positiveCap, relieved);
  let adPairs = 0;
  for (let i = 0; i < ads.length; i++) {
    for (let j = i + 1; j < ads.length; j++) {
      if (sharedEdges(footprint(ads[i]), footprint(ads[j])) > 0) adPairs++;
    }
  }
  const adPairCount = Math.min(B.adPairCap, adPairs);
  const R = clamp(
    B.retention.base + B.retention.occupancy * occupancy + B.boredom * unrelieved + B.memeRelief * positiveCount + B.adPairRetention * adPairCount,
    B.retention.min,
    B.retention.max,
  );
  const newFans = Math.floor(B.fans.scale * R * B.fans.rate) + B.adPairFans * adPairCount;
  const income = B.adIncome * ads.length;
  const local = pieces.map((p) => {
    const covers = footprint(p).some(([x, y]) => x === hotspot.x && y === hotspot.y);
    const doubled = covers && hotspot.tag === p.type;
    return { id: p.id, score: B.modules[p.type].local * (doubled ? 2 : 1), doubled };
  });
  const lines = [
    `占格 ${occ.size}/${total}，Q=${Q.toFixed(2)}，占用率 ${occupancy.toFixed(3)}。Q 和 R 分开看，铺满不等于内容更好。`,
    `未缓解的分析 ${unrelieved} 个，每个留存 ${B.boredom}。被玩梗贴到的分析 ${relieved} 个，正向记 ${positiveCount}（全篇上限 ${B.positiveCap}）。两块玩梗贴同一篇分析也只 +0.20 一次。`,
    `广告对 ${adPairs}，计入 ${adPairCount}（上限 ${B.adPairCap}）。共享三条边仍然是一对。`,
    `R=${R.toFixed(4)} = clamp(${B.retention.base} + ${B.retention.occupancy}×占用 −0.10×未缓解 +0.20×正向 −0.10×广告对, 0, 1)。`,
    `新粉 ${newFans} = floor(100×R×0.1) − 3×广告对。可以为负。广告收入 ${income} = 15×${ads.length}。`,
    `热点在 (${hotspot.x},${hotspot.y})，标签 ${hotspot.tag}。盖住且类型相符只把该模块的局部结构分翻倍，不乘进 R 和收入。局部结构分是展示。`,
  ];
  return {
    occupancy,
    Q,
    R,
    unrelieved,
    positiveCount,
    adPairs,
    adPairCount,
    newFans,
    income,
    local,
    localTotal: local.reduce((s, x) => s + x.score, 0),
    hotspot,
    lines,
  };
}

export type Layout = {
  seed: string;
  round: number;
  gridName: GridName;
  rotation: boolean;
  pieces: Piece[];
  tray: { id: string; type: ModuleType }[];
  message: string;
  history: { round: number; analysis: Analysis }[];
};

const TYPES: Record<string, ModuleType> = {
  "analysis-a": "analysis",
  "analysis-b": "analysis",
  "meme-a": "meme",
  "meme-b": "meme",
  "ad-a": "ad",
  "ad-b": "ad",
  "ad-c": "ad",
  "list-a": "list",
};

export function freshTray(): { id: string; type: ModuleType }[] {
  return B.instances.map((id) => ({ id, type: TYPES[id] }));
}

export function createLayout(seed: string, level: SkillLevel, gridName?: GridName): Layout {
  return {
    seed,
    round: 0,
    gridName: gridName ?? defaultGridForSkill(level),
    rotation: level === 1,
    pieces: [],
    tray: freshTray(),
    message: "",
    history: [],
  };
}

function grid(layout: Layout) {
  return gridOf(layout.gridName);
}

export function placePiece(layout: Layout, id: string, x: number, y: number, rot: 0 | 1 = 0): Layout {
  const idx = layout.tray.findIndex((t) => t.id === id);
  if (idx < 0) return { ...layout, message: "托盘里没有这块。" };
  if (rot === 1 && !layout.rotation) return { ...layout, message: "技能 0 不能旋转。重开或下轮升到技能 1。" };
  const piece: Piece = { id, type: layout.tray[idx].type, x, y, rot };
  const error = placementError(layout.pieces, grid(layout), piece);
  if (error) return { ...layout, message: error };
  const tray = layout.tray.slice();
  tray.splice(idx, 1);
  return { ...layout, tray, pieces: [...layout.pieces, piece], message: "放下。邻接按现在的位置重算，不累加旧分。" };
}

export function movePiece(layout: Layout, id: string, x: number, y: number): Layout {
  const piece = layout.pieces.find((p) => p.id === id);
  if (!piece) return { ...layout, message: "版上没有这块。" };
  const next = { ...piece, x, y };
  const error = placementError(layout.pieces, grid(layout), next, id);
  if (error) return { ...layout, message: error };
  return { ...layout, pieces: layout.pieces.map((p) => (p.id === id ? next : p)), message: "移动后重算。" };
}

export function rotatePiece(layout: Layout, id: string): Layout {
  if (!layout.rotation) return { ...layout, message: "技能 0 不能旋转。" };
  const piece = layout.pieces.find((p) => p.id === id);
  if (!piece) return { ...layout, message: "版上没有这块。" };
  const next: Piece = { ...piece, rot: piece.rot === 1 ? 0 : 1 };
  if (area(piece.type) !== footprint(next).length) return { ...layout, message: "旋转后面积变了，这不应该发生。" };
  const error = placementError(layout.pieces, grid(layout), next, id);
  if (error) return { ...layout, message: `转不过去：${error}` };
  return { ...layout, pieces: layout.pieces.map((p) => (p.id === id ? next : p)), message: "旋转后重新检查碰撞，面积不变。" };
}

export function removePiece(layout: Layout, id: string): Layout {
  const piece = layout.pieces.find((p) => p.id === id);
  if (!piece) return { ...layout, message: "版上没有这块。" };
  return {
    ...layout,
    pieces: layout.pieces.filter((p) => p.id !== id),
    tray: [...layout.tray, { id: piece.id, type: piece.type }],
    message: "收回。厌烦惩罚会按剩下的分析重算。",
  };
}

export function live(layout: Layout): Analysis {
  return analyze(layout.pieces, grid(layout), hotspotOf(layout.seed, String(layout.round), grid(layout)));
}

export function commitRound(layout: Layout): Layout {
  if (layout.round >= 10) return { ...layout, message: "十轮都记下了。" };
  const analysis = live(layout);
  const nextRound = layout.round + 1;
  return {
    ...layout,
    round: nextRound,
    pieces: [],
    tray: freshTray(),
    history: [...layout.history, { round: layout.round, analysis }],
    message: nextRound >= 10 ? "十轮拼版都记下了。" : "这一轮已记下。模块数值没有换，热点会随种子和轮次变。",
  };
}

export const B_BRIEFS = [
  "把留存做高。铺满不是目标。",
  "广告能来钱，也会成对扣留存和新粉。",
  "一块玩梗可以同时救两篇分析。",
  "两块玩梗贴同一篇分析，正向仍然一次。",
  "对角贴着没有用。",
  "收回分析，厌烦就回来。",
  "技能 1 才能把长条转个方向。",
  "热点只翻局部结构分。",
  "3×3 和 3×4 的占用率不是同一个 R。",
  "最后一轮。规则还是这一套。",
];
