import { describe, expect, it } from "vitest";
import { createCurve, publishCurve, setBlocks, simulate } from "../src/sim/c";

describe("C 基线与因果", () => {
  it("技能 0 且没有块：R=0.59，H=60 在进度 0", () => {
    const curve = simulate([], { checking: 0, production: 0 });
    expect(curve.A).toHaveLength(100);
    expect(curve.A[0]).toBeCloseTo(60, 8);
    expect(curve.H).toBeCloseTo(60, 8);
    expect(curve.hAt).toBe(0);
    expect(curve.R).toBeCloseTo(0.59, 10);
    expect(curve.A.filter((v) => v >= 25)).toHaveLength(59);
    expect(curve.A[58]).toBeGreaterThanOrEqual(25);
    expect(curve.A[59]).toBeLessThan(25);
    expect(curve.sharingScore).toBe(60);
    expect(curve.lines.join("\n")).not.toContain("秒");
  });

  it("进度 70 的反转不改写 x<70，移动后没有残差", () => {
    const base = simulate([], { checking: 0, production: 0 });
    const moved = simulate([{ type: "reversal", t: 70 }], { checking: 0, production: 0 });
    expect(moved.A.slice(0, 70)).toEqual(base.A.slice(0, 70));
    expect(moved.A[70]).not.toBe(base.A[70]);
    const back = simulate([], { checking: 0, production: 0 });
    expect(back.A).toEqual(base.A);
  });

  it("预飞和落版是同一个函数", () => {
    const blocks = [{ type: "fact" as const, t: 20 }, { type: "joke" as const, t: 50 }];
    const skills = { checking: 0 as const, production: 1 as const };
    expect(simulate(blocks, skills)).toEqual(simulate(blocks, skills));
  });

  it("技能只改公式里的衰减和抬升", () => {
    const check = simulate([], { checking: 1, production: 0 });
    expect(check.A[0]).toBeCloseTo(60, 8);
    expect(check.A[10]).toBeCloseTo(60 - 0.6 * 0.8 * 10, 8);
    const fact0 = simulate([{ type: "fact", t: 0 }], { checking: 0, production: 0 });
    const fact1 = simulate([{ type: "fact", t: 0 }], { checking: 0, production: 1 });
    expect(fact1.A[0] - 60).toBeCloseTo((fact0.A[0] - 60) * 1.25, 6);
    const open = simulate([{ type: "opening", t: 0 }], { checking: 0, production: 0 });
    expect(open.A[0]).toBeCloseTo(90, 6);
    expect(open.A[10]).toBeCloseTo(Math.min(100, Math.max(0, 60 - 0.6 * 10 + 30 * Math.exp(-10 / 12) - 0.12 * 10)), 6);
    const ignored = simulate([{ type: "opening", t: 10 }], { checking: 0, production: 0 });
    expect(ignored.A).toEqual(simulate([], { checking: 0, production: 0 }).A);
  });

  it("曝光和涨粉按给定式子取整，十轮可落版", () => {
    const curve = simulate([{ type: "joke", t: 0 }], { checking: 0, production: 0 });
    expect(curve.exposure).toBe(Math.floor((100 + 2 * curve.H) * (0.4 + 0.6 * curve.R)));
    expect(curve.fans).toBe(Math.floor(curve.exposure * 0.05 * curve.R));
    let state = createCurve("s", 0);
    for (let i = 0; i < 10; i++) state = publishCurve(setBlocks(state, i % 2 ? [{ type: "fact", t: 40 }] : []));
    expect(state.history).toHaveLength(10);
    expect(state.history[0].curve.R).toBeCloseTo(0.59, 10);
  });
});
