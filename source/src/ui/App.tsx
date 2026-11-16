import { useEffect, useState } from "react";
import { DISCLAIMER, RULE_CONFIG } from "../sim/rules";
import { ExpA } from "./ExpA";
import { ExpB } from "./ExpB";
import { ExpC } from "./ExpC";
import { ExpD } from "./ExpD";
import { ExpE } from "./ExpE";

const PAGES = [
  { id: "a", name: "卡槽", line: "两张风险牌，概率是 0.15 还是 0？" },
  { id: "b", name: "拼版", line: "贴三条边，会不会算成三对？" },
  { id: "c", name: "曲线", line: "进度 70 之前的读者，看得到后面的反转吗？" },
  { id: "d", name: "调音台", line: "拨杆的时候，校准次数动不动？" },
  { id: "e", name: "时机", line: "发完一篇，日子会不会自己往前走？" },
] as const;

type PageId = (typeof PAGES)[number]["id"] | "home";

function readRoute(): PageId {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (PAGES.some((p) => p.id === hash)) return hash as PageId;
  return "home";
}

export function App() {
  const [page, setPage] = useState<PageId>(readRoute);

  useEffect(() => {
    const onHash = () => setPage(readRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const found = PAGES.find((p) => p.id === page);
    document.title = found ? `小有名气 · ${found.name}` : "小有名气 · 创作试验台";
  }, [page]);

  function downloadRules() {
    const blob = new Blob([JSON.stringify(RULE_CONFIG, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rule-config.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="desk">
      <header className="mast">
        <a className="seal" href="#/">
          <span>小有</span>
          <span>名气</span>
        </a>
        <div>
          <p className="eyebrow">创作试验台 · 五组独立原型</p>
          <h1>小有名气</h1>
        </div>
        <nav className="nav" aria-label="试验">
          {PAGES.map((item) => (
            <a key={item.id} href={`#/${item.id}`} aria-current={page === item.id ? "page" : undefined} data-testid={`nav-${item.id}`}>
              {item.name}
            </a>
          ))}
        </nav>
      </header>
      <p className="disclaimer" data-testid="disclaimer" role="note">
        {DISCLAIMER}
      </p>
      <main>
        {page === "home" ? (
          <section className="home">
            <p className="lede">
              这不是一整部游戏，是五张可以反复重开的工作台。每张只试一种做法：卡怎么叠、版怎么拼、阅读进度上放什么、滑杆哪一次才算数、以及什么时候开口。
            </p>
            <div className="doors">
              {PAGES.map((item) => (
                <a key={item.id} className="door" href={`#/${item.id}`}>
                  <span className="door-index">{item.id.toUpperCase()}</span>
                  <strong>{item.name}</strong>
                  <span>{item.line}</span>
                </a>
              ))}
            </div>
            <div className="home-notes">
              <p>鼠标可以拖。也可以先点选，再点目标。键盘用 Tab 和 Enter，方向键在标了的地方移动。</p>
              <p>技能在重开时生效。对照工具只多给你看的东西，不改结算。</p>
              <p>规则版本 {RULE_CONFIG.version}。数字都能改，改的是这台试验，不是平台。</p>
              <button type="button" onClick={downloadRules} data-testid="export-rules">
                导出规则 JSON
              </button>
            </div>
          </section>
        ) : null}
        {page === "a" ? <ExpA /> : null}
        {page === "b" ? <ExpB /> : null}
        {page === "c" ? <ExpC /> : null}
        {page === "d" ? <ExpD /> : null}
        {page === "e" ? <ExpE /> : null}
      </main>
    </div>
  );
}
