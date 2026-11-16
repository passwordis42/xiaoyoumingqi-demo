export type SlotId = "opening" | "core" | "emotion" | "ending";
export type WindTag = "hot" | "steady" | "calm";

export type CardDef = {
  id: string;
  name: string;
  slots: SlotId[];
  tags: string[];
  b: number;
  q: 0 | 1 | 2;
  risk: boolean;
  error: boolean;
  blurb: string;
};

export type TopicDef = {
  id: string;
  title: string;
  brief: string;
  wind: WindTag;
  cards: CardDef[];
};

const TITLES = [
  ["earphone", "新耳机开箱", "hot", "品牌送来的机器。可以吐槽，也可以拆。"],
  ["canteen", "社区食堂", "steady", "开业的说法很多。软广和硬分析会撞在一起。"],
  ["rerun", "旧综艺回潮", "calm", "热度不高。玩梗要贴着吐槽才算数。"],
  ["storm", "暴雨后的地铁", "hot", "时效很赶。错误不改，完成度会掉。"],
  ["checkup", "体检指标", "steady", "吓人的句子带风险。硬分析在不在，转化差一截。"],
  ["rooftop", "天台菜地", "calm", "画面好写。丑闻如果和硬分析同时在场，能量会多耗。"],
  ["beta", "游戏公测", "hot", "风向偏热。软广张数直接进收入。"],
  ["night", "夜班便利店", "steady", "观察和广告都在牌堆里，规则不换。"],
  ["lecture", "讲座笔记", "calm", "反常识本身不加分。风险牌叠多了，P 会上台阶。"],
  ["year", "年度小结", "hot", "最后一篇。四张风险牌可以叠到 P 的上限。"],
] as const;

function deck(topic: string, bump: number): CardDef[] {
  const q = (n: number) => (n > 2 ? 2 : n < 0 ? 0 : n) as 0 | 1 | 2;
  return [
    { id: `${topic}-roast`, name: "新品吐槽", slots: ["opening"], tags: ["roast"], b: 10 + bump, q: q(1), risk: false, error: false, blurb: "开篇吐槽。和玩梗贴邻，曝光乘一次 1.5。" },
    { id: `${topic}-open`, name: "把事说清", slots: ["opening"], tags: [], b: 6 + bump, q: q(2), risk: false, error: false, blurb: "平稳的开篇，没有组合标签。" },
    { id: `${topic}-meme`, name: "一个玩梗", slots: ["core"], tags: ["meme"], b: 8, q: q(1), risk: bump % 2 === 0, error: false, blurb: "要和吐槽相邻才触发玩梗倍率。" },
    { id: `${topic}-scandal`, name: "被传开的丑闻", slots: ["core", "emotion"], tags: ["scandal"], b: 9, q: q(1), risk: true, error: false, blurb: "和硬分析同时在场：转化 ×2，能量再耗 1。带风险标签。" },
    { id: `${topic}-hard`, name: "硬核核对", slots: ["core", "ending"], tags: ["hard"], b: 5, q: q(2), risk: false, error: bump % 3 === 0, blurb: "完成度高。校对技能最多改掉一篇里的一个技术错误。" },
    { id: `${topic}-feel`, name: "情绪旁白", slots: ["emotion"], tags: [], b: 4, q: q(1), risk: true, error: true, blurb: "可放可不放。有技术错误，不改则完成度 -0.5。" },
    { id: `${topic}-end`, name: "收在事实上", slots: ["ending"], tags: [], b: 5, q: q(2), risk: false, error: false, blurb: "收束。没有广告。" },
    { id: `${topic}-soft`, name: "软广一句", slots: ["ending", "emotion"], tags: ["softAd"], b: 3, q: q(0), risk: true, error: false, blurb: "每张软广收入 +10。若同时有硬分析，再 +20，转化 ×0.9，只记一次。" },
  ];
}

export const TOPICS: TopicDef[] = TITLES.map(([id, title, wind, brief], index) => ({
  id,
  title,
  brief,
  wind,
  cards: deck(id, index % 3),
}));
