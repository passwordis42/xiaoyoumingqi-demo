import { useState } from "react";
import { C_ROUNDS, createCurve, label, publishCurve, setBlocks, simulate, type Block, type BlockType, type CurveState } from "../sim/c";
import { RULE_CONFIG, type SkillLevel } from "../sim/rules";
import { Controls } from "./controls";

const TYPES: BlockType[] = ["opening", "fact", "reversal", "joke"];

export function ExpC() {
  const [seed, setSeed] = useState("20261116");
  const [skill, setSkill] = useState<SkillLevel>(0);
  const [tool, setTool] = useState(false);
  const [state, setState] = useState<CurveState>(() => createCurve("20261116", 0));
  const [picked, setPicked] = useState<BlockType | null>(null);
  const [cursor, setCursor] = useState(0);

  function apply(level: SkillLevel, nextSeed: string) {
    const clean = nextSeed.trim() || "20261116";
    setSkill(level);
    setSeed(clean);
    setState(createCurve(clean, level));
    setPicked(null);
  }

  const round = C_ROUNDS[state.round];
  const preview = tool ? safe(state.blocks, state.skills) : null;
  const shown = state.committed ?? (state.history.at(-1)?.curve ?? null);

  function placeAt(type: BlockType, t: number) {
    const withoutType = state.blocks.filter((b) => b.type !== type && b.t !== t);
    const next = [...withoutType, { type, t }].slice(-RULE_CONFIG.C.maxBlocks);
    setState(setBlocks(state, next));
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
        instruction="横轴是阅读进度 0 到 99，一共 100 个点。块只能放在 0、10、20……90。挑衅开头只有进度 0 生效。工具打开时，虚线用和落版相同的公式；关掉时，落版之后才看见实线。技能 0、不放块时，超阈值比例是 0.59，最高点在进度 0。"
      />
      <div className="stage">
        <div className="stage-head">
          <h2>曲线</h2>
          <p data-testid="round-title">{round ? `第 ${state.round + 1} / 10 · ${round.title}` : "十篇结束"}</p>
        </div>
        {round ? <p className="brief">{round.brief}</p> : null}
        <Chart
          actual={shown && state.history.length ? state.history.at(-1)!.curve.A : state.committed?.A ?? null}
          preview={preview?.A ?? null}
          live={preview?.A ?? state.committed?.A ?? null}
        />
        {preview ? (
          <p data-testid="metric-r">模型估计 R {preview.R.toFixed(2)} · H {preview.H.toFixed(1)} @ 进度 {preview.hAt}</p>
        ) : shown ? (
          <p data-testid="metric-r">模型估计 R {shown.R.toFixed(2)} · H {shown.H.toFixed(1)} @ 进度 {shown.hAt}</p>
        ) : (
          <p>工具关闭时，落版前不画曲线。</p>
        )}
        <div className="tray">
          {TYPES.map((type) => (
            <button key={type} type="button" className={picked === type ? "selected" : ""} data-testid={`beat-${type}`} onClick={() => setPicked(type)}>
              {label(type)}
            </button>
          ))}
        </div>
        <div className="slots">
          {RULE_CONFIG.C.positions.map((t) => (
            <button
              key={t}
              type="button"
              data-testid={`pos-${t}`}
              className={state.blocks.some((b) => b.t === t) ? "filled" : ""}
              onClick={() => picked && placeAt(picked, t)}
            >
              {t}
              {state.blocks.find((b) => b.t === t) ? ` ${label(state.blocks.find((b) => b.t === t)!.type)}` : ""}
            </button>
          ))}
        </div>
        <label className="field inline">
          进度格
          <input data-testid="cursor" type="number" min={0} max={90} step={10} value={cursor} onChange={(e) => setCursor(Number(e.target.value))} />
        </label>
        <div className="actions">
          <button type="button" data-testid="place-beat" onClick={() => picked && placeAt(picked, cursor - (cursor % 10))}>放到进度格</button>
          <button type="button" onClick={() => setState(setBlocks(state, []))}>清空</button>
          <button type="button" data-testid="settle" onClick={() => round && setState(publishCurve(state))}>落版</button>
        </div>
        <p className="message" data-testid="message">{state.message}</p>
        {(state.committed ?? state.history.at(-1)?.curve) ? (
          <article className="explain" data-testid="result">
            {(state.committed ?? state.history.at(-1)!.curve).lines.map((line) => <p key={line}>{line}</p>)}
          </article>
        ) : null}
      </div>
      <aside className="side">
        <h3>已落版</h3>
        <ol data-testid="history">
          {state.history.map((h) => <li key={h.round}>{h.title} · R {h.curve.R.toFixed(2)}</li>)}
        </ol>
      </aside>
    </section>
  );
}

function safe(blocks: Block[], skills: CurveState["skills"]) {
  try {
    return simulate(blocks, skills);
  } catch {
    return null;
  }
}

function Chart({ actual, preview, live }: { actual: number[] | null; preview: number[] | null; live: number[] | null }) {
  const w = 640;
  const h = 220;
  const line = (values: number[]) =>
    values.map((v, i) => `${((i / 99) * w).toFixed(1)},${(h - 16 - (v / 100) * (h - 28)).toFixed(1)}`).join(" ");
  const probe = live ?? actual;
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="阅读进度上的注意力">
      {preview ? <polyline data-testid="chart-preview" className="preview" points={line(preview)} /> : null}
      {actual ? <polyline data-testid="chart-actual" className="actual" points={line(actual)} /> : null}
      <polyline
        data-testid="chart-probe"
        data-a0={probe?.[0] ?? ""}
        data-a69={probe?.[69] ?? ""}
        data-a70={probe?.[70] ?? ""}
        data-r={probe ? probe.filter((v) => v >= 25).length / 100 : ""}
        data-h={probe ? Math.max(...probe) : ""}
        points=""
        className="baseline"
      />
      <text x="8" y="16">实线是已落版 · 虚线是同一公式的预飞</text>
    </svg>
  );
}
