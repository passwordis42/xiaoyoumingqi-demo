import { useState } from "react";
import {
  cardOf,
  correct,
  createCampaign,
  currentTopic,
  draw,
  nextDay,
  place,
  previewArticle,
  publish,
  riskProbability,
  scheduleUpgrade,
  SLOT_ORDER,
  unplace,
  type Campaign,
  type SlotId,
} from "../sim/a";
import type { SkillLevel } from "../sim/rules";
import { Controls } from "./controls";

const LABEL: Record<SlotId, string> = { opening: "开篇", core: "核心", emotion: "情绪", ending: "收束" };

export function ExpA() {
  const [seed, setSeed] = useState("20261116");
  const [skill, setSkill] = useState<SkillLevel>(0);
  const [tool, setTool] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign>(() => createCampaign("20261116", 0));

  function apply(level: SkillLevel, nextSeed: string) {
    const clean = nextSeed.trim() || "20261116";
    setSkill(level);
    setSeed(clean);
    setSelected(null);
    setCampaign(createCampaign(clean, level));
  }

  const topic = currentTopic(campaign);
  const preview = topic && campaign.drawn
    ? previewArticle({ topic, placed: campaign.placed, skills: campaign.skills, correctedId: campaign.correctedId })
    : null;

  function drop(slot: SlotId) {
    if (!selected) return;
    setCampaign(place(campaign, selected, slot));
    setSelected(null);
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
        instruction="四个槽：开篇、核心、情绪、收束。提交前必须放满开篇、核心、收束。每天 6 点能量：抓牌 1，提交 1，丑闻加硬分析再加 1。能量不够就按「下一天」，没有等待。风险在提交时才掷一次。"
      />
      <div className="stage">
        <div className="stage-head">
          <h2>卡槽</h2>
          <p data-testid="article-index">{topic ? `第 ${campaign.index + 1} / 10 · ${topic.title}` : "十篇结束"}</p>
          <p>
            第 <strong data-testid="day">{campaign.day}</strong> 天
            <span className="dot">能量</span>
            <strong data-testid="energy">{campaign.energy}</strong>
            <span className="dot">手牌</span>
            <strong data-testid="hand-count">{campaign.hand.length}</strong>
          </p>
        </div>
        {topic ? (
          <>
            <p className="brief">{topic.brief}</p>
            <p>风向 {topic.wind}，倍率在提交说明里展开。牌面配置固定，不随轮次偷偷改。</p>
            <div className="slots">
              {SLOT_ORDER.map((slot) => {
                const id = campaign.placed[slot];
                const card = id ? cardOf(topic, id) : null;
                return (
                  <button
                    key={slot}
                    type="button"
                    className={`slot ${card ? "filled" : ""}`}
                    data-testid={`slot-${slot}`}
                    onClick={() => drop(slot)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && selected) {
                        e.preventDefault();
                        drop(slot);
                      }
                      if (e.key === "Backspace" || e.key === "Delete") {
                        e.preventDefault();
                        setCampaign(unplace(campaign, slot));
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const cardId = e.dataTransfer.getData("text/card");
                      if (cardId) setCampaign(place(campaign, cardId, slot));
                    }}
                  >
                    <span>{LABEL[slot]}</span>
                    <strong>{card ? card.name : "空"}</strong>
                  </button>
                );
              })}
            </div>
            <div className="hand" data-testid="hand">
              {campaign.hand.map((id) => {
                const card = cardOf(topic, id);
                const used = Object.values(campaign.placed).includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    className={`card ${selected === id ? "selected" : ""} ${used ? "used" : ""}`}
                    data-testid={`card-${id}`}
                    data-slots={card.slots.join(" ")}
                    draggable={!used}
                    aria-pressed={selected === id}
                    onClick={() => setSelected(selected === id ? null : id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(id);
                      }
                    }}
                    onDragStart={(e) => e.dataTransfer.setData("text/card", id)}
                  >
                    <strong>{card.name}</strong>
                    <em>可进 {card.slots.map((s) => LABEL[s]).join("、")}</em>
                    <small>b {card.b} · 完成度 {card.q}{card.risk ? " · 风险" : ""}{card.error ? " · 技术错误" : ""}</small>
                    <small>{card.blurb}</small>
                  </button>
                );
              })}
            </div>
            {campaign.drawn ? (
              <p data-testid="risk-readout">
                已放风险牌 n=
                {topic.cards.filter((c) => Object.values(campaign.placed).includes(c.id) && c.risk).length}
                ，P=
                {riskProbability(topic.cards.filter((c) => Object.values(campaign.placed).includes(c.id) && c.risk).length).toFixed(2)}
                。节流则曝光 ×0.6；争议则转化 ×0.5 且收入 ×0.8。还没提交，所以还没有 u。
              </p>
            ) : null}
            {tool && preview && preview.ok ? <p data-testid="tool-hint">{preview.lines.join(" ")}</p> : null}
            <div className="actions">
              <button type="button" data-testid="draw" onClick={() => setCampaign(draw(campaign))}>抓牌</button>
              <button type="button" data-testid="publish" onClick={() => setCampaign(publish(campaign))}>提交</button>
              <button type="button" data-testid="next-day" onClick={() => setCampaign(nextDay(campaign))}>下一天</button>
              <button type="button" data-testid="upgrade-next" onClick={() => setCampaign(scheduleUpgrade(campaign))}>下篇升级</button>
              {campaign.skills.checking ? (
                <button type="button" onClick={() => selected && setCampaign(correct(campaign, selected))}>改正选中的技术错误</button>
              ) : null}
            </div>
          </>
        ) : (
          <div data-testid="summary">
            <h3>十篇的账</h3>
            <p>
              曝光 {campaign.history.reduce((s, h) => s + h.exposure, 0)}，涨粉 {campaign.history.reduce((s, h) => s + h.fans, 0)}，收入 {campaign.history.reduce((s, h) => s + h.income, 0)}。
            </p>
          </div>
        )}
        <p className="message" role="status" data-testid="message">{campaign.message}</p>
        {campaign.history.at(-1) ? (
          <article className="explain" data-testid="result">
            {campaign.history.at(-1)!.lines.map((line) => <p key={line}>{line}</p>)}
          </article>
        ) : null}
      </div>
      <aside className="side">
        <h3>成稿记录</h3>
        <ol data-testid="history">
          {campaign.history.map((h, i) => (
            <li key={h.topicId} data-testid={`history-${i}`}>
              {h.title} · 曝{h.exposure} 粉{h.fans} 入{h.income} · u {h.u.toFixed(3)} {h.outcome}
            </li>
          ))}
        </ol>
      </aside>
    </section>
  );
}
