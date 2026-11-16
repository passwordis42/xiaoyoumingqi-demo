import { useState } from "react";
import { analyzeDesk, createDesk, currentRound, publishDesk, revealedInterval, riskProbability, setDraft, type Axis, type Desk } from "../sim/d";
import { RULE_CONFIG, type SkillLevel } from "../sim/rules";
import { Controls } from "./controls";

const AXES: { id: Axis; name: string; low: string; high: string }[] = [
  { id: "density", name: "密度", low: "浅", high: "硬" },
  { id: "emotion", name: "情绪", low: "稳", high: "煽" },
  { id: "commerce", name: "商业", low: "无", high: "卖" },
];

export function ExpD() {
  const [seed, setSeed] = useState("20261116");
  const [skill, setSkill] = useState<SkillLevel>(0);
  const [tool, setTool] = useState(false);
  const [desk, setDesk] = useState<Desk>(() => createDesk("20261116", 0));

  function apply(level: SkillLevel, nextSeed: string) {
    const clean = nextSeed.trim() || "20261116";
    setSkill(level);
    setSeed(clean);
    setDesk(createDesk(clean, level));
  }

  const round = currentRound(desk);

  return (
    <section className="bench">
      <Controls
        seed={seed}
        setSeed={setSeed}
        skill={skill}
        tool={tool}
        onApply={apply}
        onTool={setTool}
        instruction="三根滑杆从 50 开始，确认值也是 50。拨杆不消耗校准，也不给反馈。按下分析才减一次，并把草稿抄进确认值。技能 0 每轮 3 次，技能 1 是 4 次。出版只用最后一次确认。工具把真实区间往两边放宽，不改区间本身。"
      />
      <div className="stage">
        {round ? (
          <>
            <div className="stage-head">
              <h2>调音台</h2>
              <p data-testid="round-title">第 {desk.round + 1} / 10 · {round.title}</p>
            </div>
            <p className="brief">{round.audience}</p>
            <p>
              剩余校准 <strong data-testid="cal-left">{desk.calibrationsLeft}</strong>
            </p>
            <div className="faders">
              {AXES.map((axis) => (
                <label key={axis.id} className="fader">
                  <span>{axis.name}<small>{axis.low} — {axis.high}</small></span>
                  <strong data-testid={`draft-${axis.id}`}>{desk.draft[axis.id]}</strong>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={desk.draft[axis.id]}
                    data-testid={`fader-${axis.id}`}
                    onChange={(e) => setDesk(setDraft(desk, axis.id, Number(e.target.value)))}
                  />
                </label>
              ))}
            </div>
            <p data-testid="confirmed-density">
              确认值 密度 {desk.confirmed.density}，情绪 {desk.confirmed.emotion}，商业 {desk.confirmed.commerce}。
              {desk.analyzed ? "已分析。" : "还没分析，不能出版。"}
              {desk.draft.density !== desk.confirmed.density || desk.draft.emotion !== desk.confirmed.emotion || desk.draft.commerce !== desk.confirmed.commerce
                ? " 草稿已经离开确认值。"
                : ""}
            </p>
            <p>
              按确认情绪，风险概率 {(riskProbability(desk.confirmed.emotion) * 100).toFixed(1)}%。命中则转化 ×0.6。
            </p>
            {desk.feedback.map((line) => <p key={line}>{line}</p>)}
            {tool ? (
              <ul data-testid="revealed">
                {AXES.map((axis) => {
                  const [lo, hi] = round[axis.id];
                  const shown = revealedInterval(lo, hi, desk.skills.analysis);
                  return <li key={axis.id}>{axis.name} 工具看到的区间 {shown[0]}–{shown[1]}（比真实区间更宽）</li>;
                })}
              </ul>
            ) : null}
            <div className="actions">
              <button type="button" data-testid="analyze" onClick={() => setDesk(analyzeDesk(desk))}>分析</button>
              <button type="button" data-testid="publish" onClick={() => setDesk(publishDesk(desk))}>按上次校准出版</button>
            </div>
          </>
        ) : (
          <h2>十轮都出版了</h2>
        )}
        <p className="message" data-testid="message">{desk.message}</p>
      </div>
      <aside className="side">
        <h3>已出版</h3>
        <ol data-testid="history">
          {desk.history.map((h, i) => (
            <li key={h.roundId} data-testid={`history-${i}`} data-density={h.axes.density}>
              {h.title} · {h.payoff.grade} 曝{h.payoff.exposure} 入{h.payoff.income}
            </li>
          ))}
        </ol>
        {desk.history.at(-1) ? (
          <article className="explain" data-testid="result">
            {desk.history.at(-1)!.payoff.lines.map((line) => <p key={line}>{line}</p>)}
          </article>
        ) : null}
        <p className="hint">共 {RULE_CONFIG.D.rounds.length} 个委托，区间中心并不都在 50。</p>
      </aside>
    </section>
  );
}
