import { describe, expect, it } from "vitest";
import {
  analyze,
  area,
  commitRound,
  createLayout,
  diagonalTouches,
  footprint,
  hotspotOf,
  placePiece,
  removePiece,
  rotatePiece,
  sharedEdges,
  type Piece,
} from "../src/sim/b";
import { RULE_CONFIG } from "../src/sim/rules";

function piece(id: string, type: Piece["type"], x: number, y: number, rot: 0 | 1 = 0): Piece {
  return { id, type, x, y, rot };
}

const grid = { w: 3, h: 4 };
const hot = { x: 0, y: 0, tag: "list" as const };

describe("B 邻接与上限", () => {
  it("对角为 0，一条边和三条边都只记一对", () => {
    const analysis = piece("analysis-a", "analysis", 0, 0);
    const memeCorner = piece("meme-a", "meme", 3, 1);
    expect(sharedEdges(footprint(analysis), footprint(memeCorner))).toBe(0);
    expect(diagonalTouches(footprint(analysis), [[3, 1]])).toBeGreaterThan(0);
    const far = analyze([analysis], grid, hot);
    const corner = analyze([analysis, piece("meme-a", "meme", 0, 1)], grid, hot);
    expect(sharedEdges(footprint(analysis), footprint(corner.local ? piece("meme-a", "meme", 0, 1) : analysis))).toBe(1);
    const long = piece("ad-a", "ad", 0, 0);
    const long2 = piece("ad-b", "ad", 0, 1);
    expect(sharedEdges(footprint(long), footprint(long2))).toBe(3);
    const one = analyze([piece("ad-a", "ad", 0, 0), piece("ad-b", "ad", 0, 1)], grid, hot);
    const single = analyze([piece("meme-a", "meme", 0, 0), piece("meme-b", "meme", 1, 0)], grid, hot);
    expect(one.adPairs).toBe(1);
    expect(single.adPairs).toBe(0);
    expect(one.adPairCount).toBe(1);
    expect(far.unrelieved).toBe(1);
  });

  it("两块玩梗贴同一篇分析只 +0.20 一次，一块玩梗可以救两篇，全篇正向最多 2", () => {
    const one = analyze(
      [piece("analysis-a", "analysis", 0, 0), piece("meme-a", "meme", 0, 1), piece("meme-b", "meme", 2, 1)],
      grid,
      hot,
    );
    expect(one.positiveCount).toBe(1);
    expect(one.unrelieved).toBe(0);
    const two = analyze(
      [
        piece("analysis-a", "analysis", 0, 0),
        piece("analysis-b", "analysis", 0, 2),
        piece("meme-a", "meme", 0, 1),
      ],
      grid,
      hot,
    );
    expect(sharedEdges(footprint(piece("analysis-a", "analysis", 0, 0)), footprint(piece("meme-a", "meme", 0, 1)))).toBeGreaterThan(0);
    expect(sharedEdges(footprint(piece("analysis-b", "analysis", 0, 2)), footprint(piece("meme-a", "meme", 0, 1)))).toBeGreaterThan(0);
    expect(two.positiveCount).toBe(2);
    const three = analyze(
      [
        piece("analysis-a", "analysis", 0, 0),
        piece("analysis-b", "analysis", 0, 2),
        piece("meme-a", "meme", 0, 1),
        piece("meme-b", "meme", 1, 1),
      ],
      { w: 4, h: 4 },
      hot,
    );
    expect(three.positiveCount).toBe(2);
  });

  it("收回玩梗后厌烦回来，R 用占用率而不是百分比", () => {
    const withMeme = analyze([piece("analysis-a", "analysis", 0, 0), piece("meme-a", "meme", 0, 1)], grid, hot);
    const bare = analyze([piece("analysis-a", "analysis", 0, 0)], grid, hot);
    expect(bare.unrelieved).toBe(1);
    expect(withMeme.unrelieved).toBe(0);
    expect(bare.R).toBeCloseTo(0.35 + 0.35 * (3 / 12) - 0.1, 10);
    expect(withMeme.R).toBeCloseTo(0.35 + 0.35 * (4 / 12) + 0.2, 10);
    expect(withMeme.Q).toBeCloseTo(100 * (4 / 12), 8);
    expect(withMeme.Q).not.toBeCloseTo(withMeme.R, 1);
  });

  it("广告对最多记 2，收入只跟广告块数，热点只翻局部结构分", () => {
    const ads = analyze(
      [piece("ad-a", "ad", 0, 0), piece("ad-b", "ad", 0, 1), piece("ad-c", "ad", 0, 2)],
      { w: 4, h: 4 },
      { x: 0, y: 0, tag: "ad" },
    );
    expect(ads.adPairs).toBe(2);
    expect(ads.adPairCount).toBe(2);
    expect(ads.income).toBe(45);
    expect(ads.newFans).toBe(Math.floor(100 * ads.R * 0.1) - 6);
    const local = ads.local.find((l) => l.id === "ad-a")!;
    expect(local.doubled).toBe(true);
    expect(local.score).toBe(0);
    const covered = analyze([piece("analysis-a", "analysis", 0, 0)], grid, { x: 0, y: 0, tag: "analysis" });
    expect(covered.local[0].score).toBe(20);
    expect(covered.R).toBeCloseTo(analyze([piece("analysis-a", "analysis", 0, 0)], grid, { x: 2, y: 3, tag: "meme" }).R, 10);
  });

  it("旋转不改变面积，撞上就转不回去；热点不看工具", () => {
    expect(area("analysis")).toBe(footprint(piece("analysis-a", "analysis", 0, 0, 1)).length);
    let layout = createLayout("hot", 1, "high");
    layout = placePiece(layout, "analysis-a", 0, 3, 0);
    const turned = rotatePiece(layout, "analysis-a");
    expect(turned.pieces[0].rot).toBe(0);
    expect(turned.message).toContain("转不过去");
    const a = hotspotOf("hot", "0", { w: 3, h: 4 });
    const b = hotspotOf("hot", "0", { w: 3, h: 4 });
    expect(a).toEqual(b);
  });

  it("十轮可记完，收回后托盘回来", () => {
    let layout = createLayout("ten", 0, "low");
    expect(layout.gridName).toBe("low");
    layout = placePiece(layout, "meme-a", 0, 0);
    layout = removePiece(layout, "meme-a");
    expect(layout.tray.some((t) => t.id === "meme-a")).toBe(true);
    for (let i = 0; i < 10; i++) layout = commitRound(layout);
    expect(layout.history).toHaveLength(10);
    expect(RULE_CONFIG.B.defaultGrid).toEqual({ w: 3, h: 4 });
  });
});
