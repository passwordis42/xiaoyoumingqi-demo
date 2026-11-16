import { useState } from "react";
import {
  B_BRIEFS,
  commitRound,
  createLayout,
  footprint,
  gridOf,
  live,
  movePiece,
  placePiece,
  removePiece,
  rotatePiece,
  type GridName,
  type Layout,
} from "../sim/b";
import { RULE_CONFIG, type SkillLevel } from "../sim/rules";
import { Controls } from "./controls";

export function ExpB() {
  const [seed, setSeed] = useState("20261116");
  const [skill, setSkill] = useState<SkillLevel>(0);
  const [tool, setTool] = useState(false);
  const [gridName, setGridName] = useState<GridName>("high");
  const [layout, setLayout] = useState<Layout>(() => createLayout("20261116", 0, "high"));
  const [selected, setSelected] = useState<string | null>(null);

  function apply(level: SkillLevel, nextSeed: string) {
    const clean = nextSeed.trim() || "20261116";
    setSkill(level);
    setSeed(clean);
    setSelected(null);
    const name = level === 1 ? "high" : gridName === "optional" ? "optional" : gridName === "low" ? "low" : "high";
    setGridName(name);
    const next = createLayout(clean, level, name);
    next.rotation = level === 1;
    setLayout(next);
  }

  const grid = gridOf(layout.gridName);
  const analysis = live(layout);
  const names: Record<string, string> = { analysis: "分析", list: "清单", meme: "玩梗", ad: "广告" };

  function chooseGrid(name: GridName) {
    setGridName(name);
    setLayout({ ...createLayout(seed, skill, name), rotation: skill === 1, history: layout.history, round: layout.round });
  }

  return (
    <section className="bench">
      <Controls
        seed={seed}
        setSeed={setSeed}
        skill={skill}
        tool={tool}
        onApply={apply}
        onTool={setTool}
        instruction="默认 3×4。可以改成 3×3 对照，或选 4×4。每种模块只有一块实例。技能 1 才能转 90 度，面积不变。对角不算。玩梗能解除分析的厌烦，两块玩梗贴同一篇也只加一次。没有栏线挡格。"
      />
      <div className="stage">
        <div className="stage-head">
          <h2>拼版</h2>
          <p data-testid="round-title">第 {Math.min(layout.round + 1, 10)} / 10 · {B_BRIEFS[Math.min(layout.round, 9)]}</p>
        </div>
        <div className="actions">
          {(["low", "high", "optional"] as GridName[]).map((name) => (
            <button key={name} type="button" data-testid={`grid-${name}`} onClick={() => chooseGrid(name)}>
              {gridOf(name).w}×{gridOf(name).h}
            </button>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${grid.w}, 1fr)` }} data-testid="grid">
          {Array.from({ length: grid.h }, (_, y) =>
            Array.from({ length: grid.w }, (_, x) => {
              const owner = layout.pieces.find((p) => footprint(p).some(([cx, cy]) => cx === x && cy === y));
              const hot = tool && analysis.hotspot.x === x && analysis.hotspot.y === y;
              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  className={`cell ${owner ? `kind-${owner.type}` : ""} ${hot ? "selected" : ""}`}
                  data-testid={`cell-${x}-${y}`}
                  onClick={() => {
                    if (selected && layout.tray.some((t) => t.id === selected)) {
                      const next = placePiece(layout, selected, x, y, 0);
                      setLayout(next);
                      if (next.pieces.length > layout.pieces.length) setSelected(null);
                      return;
                    }
                    if (selected && layout.pieces.some((p) => p.id === selected)) {
                      setLayout(movePiece(layout, selected, x, y));
                      return;
                    }
                    if (owner) setSelected(owner.id);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("text/piece");
                    if (!id) return;
                    if (layout.tray.some((t) => t.id === id)) setLayout(placePiece(layout, id, x, y, 0));
                    else setLayout(movePiece(layout, id, x, y));
                  }}
                >
                  {hot ? "热" : owner ? names[owner.type].slice(0, 1) : ""}
                </button>
              );
            }),
          )}
        </div>
        <div className="tray">
          {layout.tray.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`piece kind-${item.type} ${selected === item.id ? "selected" : ""}`}
              data-testid={`tray-${item.id}`}
              draggable
              onClick={() => setSelected(item.id)}
              onDragStart={(e) => e.dataTransfer.setData("text/piece", item.id)}
            >
              {names[item.type]}
            </button>
          ))}
        </div>
        <div className="actions">
          <button type="button" data-testid="rotate" onClick={() => selected && setLayout(rotatePiece(layout, selected))}>旋转</button>
          <button type="button" data-testid="remove" onClick={() => selected && setLayout(removePiece(layout, selected))}>收回</button>
          <button type="button" data-testid="next-round" onClick={() => setLayout(commitRound(layout))}>记下并下一轮</button>
        </div>
        <p className="message" data-testid="message">{layout.message}</p>
        <article className="explain" data-testid="result">
          <p data-testid="score-q">Q {analysis.Q.toFixed(1)}</p>
          <p data-testid="score-r">R {analysis.R.toFixed(3)}</p>
          <p>新粉 {analysis.newFans} · 广告收入 {analysis.income} · 局部结构分 {analysis.localTotal}</p>
          {tool ? <p data-testid="hotspot">热点 ({analysis.hotspot.x},{analysis.hotspot.y}) {analysis.hotspot.tag}</p> : <p>热点已经按种子生成。打开工具才看得到格子。</p>}
          {analysis.lines.map((line) => <p key={line}>{line}</p>)}
        </article>
      </div>
      <aside className="side">
        <h3>已记的轮次</h3>
        <ol data-testid="history">
          {layout.history.map((h) => <li key={h.round}>第 {h.round + 1} 轮 · Q {h.analysis.Q.toFixed(0)} R {h.analysis.R.toFixed(2)} 新粉 {h.analysis.newFans}</li>)}
        </ol>
        <p>合计新粉 {Math.max(0, layout.history.reduce((s, h) => s + h.analysis.newFans, 0))}。单轮可以为负，合计不再往下显示。</p>
        <p className="hint">模块底分：分析 {RULE_CONFIG.B.modules.analysis.local}，清单 {RULE_CONFIG.B.modules.list.local}，玩梗 {RULE_CONFIG.B.modules.meme.local}，广告 {RULE_CONFIG.B.modules.ad.local}。</p>
      </aside>
    </section>
  );
}
