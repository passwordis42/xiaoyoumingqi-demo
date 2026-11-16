import { useState } from "react";
import {
  STANCES,
  advanceDay,
  createTiming,
  crowdOf,
  eventsOnDay,
  factorOf,
  heatOf,
  moodRatio,
  publishAction,
  riskProbability,
  stageName,
  stanceName,
  tomorrowPreview,
  type Stance,
  type Timing,
} from "../sim/e";
import { RULE_CONFIG, type SkillLevel } from "../sim/rules";
import { Controls } from "./controls";

export function ExpE() {
  const [seed, setSeed] = useState("20261116");
  const [skill, setSkill] = useState<SkillLevel>(0);
  const [tool, setTool] = useState(false);
  const [state, setState] = useState<Timing>(() => createTiming("20261116", 0));
  const [stance, setStance] = useState<Stance>("news");

  function apply(level: SkillLevel, nextSeed: string) {
    const clean = nextSeed.trim() || "20261116";
    setSkill(level);
    setSeed(clean);
    setState(createTiming(clean, level));
  }

  const events = eventsOnDay(state.day);

  return (
    <section className="bench">
      <Controls
        seed={seed}
        setSeed={setSeed}
        skill={skill}
        tool={tool}
        onApply={apply}
        onTool={setTool}
        instruction="每天同时有三则事件，分别处于发酵、高潮、退潮。下一天只让退潮的那则退出，补进一则新的发酵；另外两则保留编号、证据和拥挤，并各自进入下一阶段。每则连续在场三天。发稿不自动进入下一天。高潮里的吐槽和唱反调风险 0.30，其余 0.10。"
      />
      <div className="stage">
        <div className="stage-head">
          <h2>时机</h2>
          <p data-testid="round-title">已发布 {state.history.length} 篇 · 目标先记满 10 篇</p>
        </div>
        <p className="dayline">
          第 <strong data-testid="day">{state.day}</strong> 天 · 场上同时是发酵、高潮、退潮
          <span className="dot">行动点</span>
          <strong data-testid="budget">{state.budget}</strong>
        </p>
        <div data-testid="event-list">
          {events.map((event) => (
            <article key={event.id} className="event" data-testid={`event-${event.id}`}>
              <h3>
                {event.title}
                <span data-testid={`stage-${event.id}`}> · {stageName(event.stage)} · 热度 {heatOf(event.stage)}</span>
              </h3>
              <p>{event.synopsis}</p>
              <p>技术证据{event.technicalSupported ? "成立" : "不足"} · 反调证据{event.contrarySupported ? "成立" : "不足"}</p>
              <p>系数 {STANCES.map((s) => `${stanceName(s)} ×${factorOf(s, event.stage)}`).join("，")}</p>
              <p>
                拥挤 {STANCES.map((s) => `${stanceName(s)} ${crowdOf(state.crowd, event, s)}`).join(" / ")}
              </p>
              <button type="button" data-testid={`publish-${event.id}`} onClick={() => setState(publishAction(state, event.id, stance))}>
                用「{stanceName(stance)}」发这篇 · 风险 {riskProbability(event.stage, stance)}
              </button>
            </article>
          ))}
        </div>
        {state.skills.internet ? <p data-testid="tomorrow">明天会新看到：{tomorrowPreview(state.day).title}。现在不能发。</p> : null}
        {tool ? (
          <p data-testid="mood">
            情绪比例只供对照，不改热度和事实。
            {events.map((event) => `${stageName(event.stage)} ${moodRatio(event.stage).map((m) => `${stanceName(m.stance)} ${(m.share * 100).toFixed(0)}%`).join("、")}`).join("；")}
          </p>
        ) : null}
        <div className="stances">
          {STANCES.map((item) => (
            <button key={item} type="button" data-testid={`stance-${item}`} className={stance === item ? "selected" : ""} aria-pressed={stance === item} onClick={() => setStance(item)}>
              {stanceName(item)} · {RULE_CONFIG.E.costs[item]} 点
            </button>
          ))}
        </div>
        <div className="actions">
          <button type="button" data-testid="advance-day" onClick={() => setState(advanceDay(state))}>下一天</button>
        </div>
        <p className="message" data-testid="message">{state.message}</p>
        {state.history.at(-1) ? (
          <article className="explain" data-testid="result">
            <p data-testid="fans">涨粉 {state.history.at(-1)!.fans}</p>
            <p data-testid="exposure">曝光 {state.history.at(-1)!.exposure}</p>
            {state.history.at(-1)!.lines.map((line) => <p key={line}>{line}</p>)}
          </article>
        ) : null}
      </div>
      <aside className="side">
        <h3>已发布</h3>
        <ol data-testid="history">
          {state.history.map((h, i) => <li key={`${h.eventId}-${i}`}>第 {h.day} 天 {h.title} · 粉 {h.fans}</li>)}
        </ol>
      </aside>
    </section>
  );
}
