export type Slot = "hook" | "body" | "close" | "ops";
export type RiskStyle = "backlash" | "flop";
export type RiskWhen =
  | { type: "always" }
  | { type: "flag"; flag: string }
  | { type: "missingTag"; tag: string }
  | { type: "hasTag"; tag: string };

export type CardDef = {
  id: string;
  name: string;
  slot: Slot;
  link: string;
  echo: string[];
  time: number;
  exposure: number;
  quality: number;
  income: number;
  reputation: number;
  blurb: string;
  risk?: { u: 0.1 | 0.2 | 0.4; style: RiskStyle; when: RiskWhen; text: string };
};

export type ArticleDef = {
  id: string;
  title: string;
  brief: string;
  flags: string[];
  cards: CardDef[];
};

function c(
  id: string,
  name: string,
  slot: Slot,
  link: string,
  echo: string[],
  time: number,
  exposure: number,
  quality: number,
  income: number,
  reputation: number,
  blurb: string,
  risk?: CardDef["risk"],
): CardDef {
  return { id, name, slot, link, echo, time, exposure, quality, income, reputation, blurb, risk };
}

export const ARTICLES: ArticleDef[] = [
  {
    id: "breakfast",
    title: "巷口早餐店为什么突然排队",
    brief: "一条生活短讯。可以写快，也可以把人和现场接上。没有现成的热点可蹭。",
    flags: [],
    cards: [
      c("bf-h1", "一句话标题", "hook", "", [], 1, 3, 1, 0, 1, "把事情说清楚，不夸张。"),
      c("bf-h2", "反差标题", "hook", "", ["contrast"], 1, 6, 0, 0, 0, "「最便宜的那家，队伍最长。」"),
      c("bf-b1", "路过一眼", "body", "scene", [], 1, 2, 1, 0, 0, "只写你看见的队伍。"),
      c("bf-b2", "老板的早上", "body", "person", [], 2, 1, 4, 0, 2, "问到四点起床和面粉涨价。"),
      c("bf-b3", "一碗的价格", "body", "data", [], 2, 1, 3, 0, 1, "把三年价格摆在一起。"),
      c("bf-b4", "常客的句子", "body", "line", [], 1, 2, 2, 0, 1, "让常客自己说为什么还来。"),
      c("bf-b5", "故事：排队的人", "body", "story", [], 2, 2, 3, 0, 1, "跟住其中一个人的十分钟。"),
      c("bf-c1", "收在味道上", "close", "", ["payoff"], 1, 1, 2, 0, 1, "把开头的反差落到这碗上。"),
      c("bf-c2", "收在涨价上", "close", "", [], 1, 0, 2, 0, 2, "不煽情，把原因说完。"),
      c("bf-o1", "顺手提外卖券", "ops", "soft", ["sponsor"], 1, 1, 0, 4, -2, "收入来了，口碑先扣。"),
    ],
  },
  {
    id: "checkup",
    title: "一份被传疯的体检指标",
    brief: "群里在转一张表。你可以跟着吓，也可以先找得出发表的那份说明。",
    flags: ["rumor"],
    cards: [
      c("ck-h1", "指标爆了", "hook", "", ["rumor"], 1, 8, -1, 0, -1, "很适合被转发，本身几乎没有完成度。", {
        u: 0.4,
        style: "backlash",
        when: { type: "missingTag", tag: "proof" },
        text: "若成稿里没有「实证」，这张标题会计入风险。单张时概率仍是 0。",
      }),
      c("ck-h2", "把表说清楚", "hook", "", [], 1, 2, 2, 0, 2, "标题就写指标名称和单位。"),
      c("ck-b1", "群聊截图", "body", "scene", ["rumor"], 1, 3, 0, 0, -1, "只有转发，没有出处。", {
        u: 0.2,
        style: "flop",
        when: { type: "hasTag", tag: "rumor" },
        text: "和另一张「传闻」同时在场时计入风险。",
      }),
      c("ck-b2", "说明书的一页", "body", "data", ["proof"], 2, 1, 4, 0, 3, "把参考范围和这句话的出处写上。"),
      c("ck-b3", "体检者的下午", "body", "story", [], 2, 2, 3, 0, 1, "一个人从恐慌到复查。"),
      c("ck-b4", "医生的原话", "body", "line", ["proof"], 2, 1, 3, 0, 3, "原话比转述难写，也更站得住。"),
      c("ck-b5", "空泛的警告", "body", "line", ["absolute"], 1, 4, -1, 0, -2, "「人人都会中招」这种句子。", {
        u: 0.2,
        style: "flop",
        when: { type: "missingTag", tag: "proof" },
        text: "没有实证时，这句绝对化计入风险。",
      }),
      c("ck-c1", "建议去复查", "close", "", ["useful"], 1, 1, 2, 0, 2, "告诉读者下一步，而不是再吓一次。"),
      c("ck-c2", "金句收束", "close", "", ["payoff"], 1, 3, 1, 0, 0, "好记，但不增加证据。"),
      c("ck-o1", "保健品链接", "ops", "soft", ["sponsor"], 1, 2, -1, 6, -3, "恐慌最值钱的时候，也最伤信任。"),
    ],
  },
  {
    id: "rooftop",
    title: "天台被改成了菜地",
    brief: "画面好写。写深要时间：产权、浇水、邻居。时间是这一篇的硬约束。",
    flags: [],
    cards: [
      c("rf-h1", "远看的绿", "hook", "", ["contrast"], 1, 4, 1, 0, 1, "先给一个画面。"),
      c("rf-h2", "谁的天台", "hook", "", [], 1, 2, 2, 0, 1, "标题把问题摆出来。"),
      c("rf-b1", "拍一张", "body", "scene", [], 1, 3, 1, 0, 0, "快，但是薄。"),
      c("rf-b2", "种菜的人", "body", "person", [], 3, 1, 5, 0, 2, "耗时 3。问到种子从哪来。"),
      c("rf-b3", "物业的条款", "body", "data", [], 2, 0, 4, 0, 2, "翻到不许私自改承重的那一条。"),
      c("rf-b4", "邻居的抱怨", "body", "line", [], 1, 2, 2, 0, 0, "一句就够，也可以只停在一句。"),
      c("rf-b5", "浇水的晚上", "body", "story", [], 3, 2, 4, 0, 1, "跟一次夜浇，时间贵。"),
      c("rf-c1", "落到条款", "close", "", [], 1, 0, 2, 0, 2, "画面回到「能不能种」。"),
      c("rf-c2", "落到饭桌", "close", "", ["payoff"], 1, 2, 1, 0, 1, "反差收在第一口菜。"),
      c("rf-o1", "种子广告", "ops", "soft", ["sponsor"], 1, 1, 0, 3, -1, "可以不放。"),
    ],
  },
  {
    id: "beta",
    title: "新游戏周末公测",
    brief: "热度还在。跟，会有曝光；只跟口号，完成度很低。",
    flags: ["hot"],
    cards: [
      c("bt-h1", "公测标题", "hook", "", ["hot"], 1, 5, 0, 0, 0, "正常跟热点。"),
      c("bt-h2", "全网都在玩", "hook", "", ["hot", "absolute"], 1, 7, -1, 0, -1, "把热度说满。", {
        u: 0.1,
        style: "backlash",
        when: { type: "flag", flag: "hot" },
        text: "这一题热点还在，硬喊「全网」会计入轻微风险。",
      }),
      c("bt-b1", "我玩的两小时", "body", "story", [], 2, 2, 3, 0, 1, "用自己的时间换完成度。"),
      c("bt-b2", "帧数和加载", "body", "data", [], 2, 1, 3, 0, 1, "写测到的数，不写感觉。"),
      c("bt-b3", "一句玩家黑话", "body", "line", [], 1, 3, 1, 0, 0, "好传，信息少。"),
      c("bt-b4", "和好友联机", "body", "person", ["useful"], 2, 2, 2, 0, 1, "告诉别人适不适合一起玩。"),
      c("bt-b5", "空镜截图说明", "body", "scene", [], 1, 2, 1, 0, 0, "最快的一段正文。"),
      c("bt-c1", "适不适合你", "close", "", ["useful"], 1, 1, 2, 0, 2, "给一个能用的判断。"),
      c("bt-c2", "口号收尾", "close", "", ["payoff"], 1, 3, 0, 0, -1, "热，但空。"),
      c("bt-o1", "加速器推广", "ops", "soft", ["sponsor"], 1, 2, 0, 5, -2, "公测期最容易塞进来。"),
    ],
  },
  {
    id: "rerun",
    title: "过气综艺突然又上了热搜",
    brief: "热搜是旧的。硬蹭会进入风险；找到现在还值得说的一点，才有用。",
    flags: ["stale"],
    cards: [
      c("rr-h1", "又上热搜了", "hook", "", ["hot"], 1, 6, 0, 0, -1, "标题只重复热搜。", {
        u: 0.1,
        style: "backlash",
        when: { type: "flag", flag: "stale" },
        text: "这一题的热点已经凉了。这张标题会计入风险，u=0.1。",
      }),
      c("rr-h2", "旧片新看的理由", "hook", "", [], 1, 2, 2, 0, 1, "不跟词条，跟问题。"),
      c("rr-b1", "当年的名场面", "body", "scene", ["hot"], 1, 3, 1, 0, 0, "人人都会写的那一段。"),
      c("rr-b2", "剪辑师后来怎样", "body", "person", ["useful"], 3, 1, 4, 0, 2, "热搜之外的人。"),
      c("rr-b3", "收视和现在的播放", "body", "data", [], 2, 1, 3, 0, 1, "两个时代的数字。"),
      c("rr-b4", "重看的笔记", "body", "story", [], 2, 1, 3, 0, 1, "你自己的第二次观看。"),
      c("rr-b5", "一句仿造金句", "body", "line", [], 1, 2, 0, 0, -1, "像当年，所以也像没写。"),
      c("rr-c1", "现在还能看什么", "close", "", ["useful"], 1, 1, 2, 0, 2, "给还没看过的人一个入口。"),
      c("rr-c2", "情怀收尾", "close", "", ["payoff"], 1, 2, 1, 0, 0, "安全，也不新。"),
      c("rr-o1", "会员开通", "ops", "soft", ["sponsor"], 1, 1, 0, 4, -2, "旧热搜上的广告更显眼。"),
    ],
  },
  {
    id: "nightshop",
    title: "社区便利店的夜间经济",
    brief: "可以写成观察，也可以写成软文。写不写明广告，收入和口碑会分开走。",
    flags: [],
    cards: [
      c("ns-h1", "凌晨一点还亮着", "hook", "", ["contrast"], 1, 4, 1, 0, 1, "时间本身就是题目。"),
      c("ns-h2", "夜班便利店观察", "hook", "", [], 1, 2, 2, 0, 1, "平稳的标题。"),
      c("ns-b1", "货架和灯", "body", "scene", [], 1, 2, 1, 0, 0, "快写。"),
      c("ns-b2", "夜班店员", "body", "person", [], 2, 1, 4, 0, 2, "问班次和最后一班公交。"),
      c("ns-b3", "夜间销售额", "body", "data", [], 2, 1, 3, 0, 1, "店长给的一周数字。"),
      c("ns-b4", "常来的人", "body", "story", [], 2, 2, 3, 0, 1, "跟着一位顾客走一圈。"),
      c("ns-b5", "店员的一句", "body", "line", [], 1, 2, 2, 0, 1, "留一句原话。"),
      c("ns-c1", "灯还要亮多久", "close", "", ["payoff"], 1, 1, 2, 0, 1, "把开头的灯收回来。"),
      c("ns-o1", "新品试吃软广", "ops", "soft", ["sponsor"], 1, 2, 0, 6, -3, "收入高，口碑先扣。", {
        u: 0.2,
        style: "flop",
        when: { type: "missingTag", tag: "disclose" },
        text: "如果通篇没有「标明广告」，这张计入风险。",
      }),
      c("ns-o2", "文末标明合作", "ops", "", ["disclose"], 1, 0, 1, 1, 2, "收入很少，但是把广告说穿。"),
    ],
  },
  {
    id: "earphone",
    title: "品牌想让你评测新耳机",
    brief: "钱是明确的。参数和听感要花时间。不标明合作，风险会进来。",
    flags: ["brand"],
    cards: [
      c("ep-h1", "新耳机一周", "hook", "", [], 1, 3, 1, 0, 1, "像一篇正常评测的标题。"),
      c("ep-h2", "闭眼入", "hook", "", ["absolute"], 1, 6, -1, 1, -2, "广告口吻。", {
        u: 0.4,
        style: "flop",
        when: { type: "missingTag", tag: "proof" },
        text: "没有参数或对照时，「闭眼入」计入风险，u=0.4。",
      }),
      c("ep-b1", "开箱", "body", "scene", [], 1, 3, 1, 0, 0, "快，完成度低。"),
      c("ep-b2", "频响和重量", "body", "data", ["proof"], 2, 1, 4, 0, 2, "写你测到的，不写新闻稿。"),
      c("ep-b3", "通勤两天", "body", "story", [], 2, 2, 3, 0, 1, "真实使用，而不是清单。"),
      c("ep-b4", "和旧耳机比", "body", "line", ["proof"], 2, 1, 3, 0, 2, "有对照，句子才站得住。"),
      c("ep-b5", "「音质绝了」", "body", "line", ["absolute"], 1, 3, -1, 0, -1, "空话。"),
      c("ep-c1", "适合谁", "close", "", ["useful"], 1, 1, 2, 0, 2, "把结论缩成可执行的一句。"),
      c("ep-o1", "购买链接", "ops", "soft", ["sponsor"], 1, 1, 0, 7, -2, "这是这篇的收入主体。"),
      c("ep-o2", "合作声明", "ops", "", ["disclose"], 1, 0, 1, 0, 4, "声明本身几乎不带来曝光。"),
    ],
  },
  {
    id: "lecture",
    title: "讲座里的一个反常识结论",
    brief: "反常识不是加分项。没有材料时它只是一句硬话；有材料时它才变成完成度。",
    flags: [],
    cards: [
      c("lc-h1", "老师说反了", "hook", "", ["absolute"], 1, 7, 0, 0, 0, "醒目。完成度要靠后面的牌补。", {
        u: 0.4,
        style: "flop",
        when: { type: "missingTag", tag: "proof" },
        text: "没有实证时计入风险。反常识不会自动算你对。",
      }),
      c("lc-h2", "讲座笔记", "hook", "", [], 1, 2, 2, 0, 1, "标题不预支结论。"),
      c("lc-b1", "现场反应", "body", "scene", [], 1, 2, 1, 0, 0, "掌声和皱眉，不是证据。"),
      c("lc-b2", "幻灯片上的表", "body", "data", ["proof"], 2, 1, 4, 0, 3, "把表上的比较写出来。"),
      c("lc-b3", "我去翻了论文", "body", "data", ["proof"], 3, 0, 5, 0, 4, "最贵的一张，耗时 3。"),
      c("lc-b4", "同学的疑问", "body", "person", [], 2, 1, 2, 0, 1, "保留没被说服的声音。"),
      c("lc-b5", "一句绝对化", "body", "line", ["absolute"], 1, 3, -1, 0, -2, "把讲座说成定论。", {
        u: 0.2,
        style: "flop",
        when: { type: "missingTag", tag: "proof" },
        text: "没有实证时，这句也计入风险。",
      }),
      c("lc-b6", "故事：提问的人", "body", "story", [], 2, 2, 2, 0, 1, "人物在，证据不在。"),
      c("lc-c1", "还不能下定论", "close", "", ["useful"], 1, 0, 2, 0, 3, "把边界说出来。"),
      c("lc-c2", "金句锤死", "close", "", ["payoff"], 1, 3, 0, 0, -1, "好记，也更容易说过头。"),
    ],
  },
  {
    id: "storm",
    title: "暴雨之后的地铁",
    brief: "时效很短。写深的牌都很贵。你可以抢一条快讯，或者花时间写清谁被留在站里。",
    flags: ["hot"],
    cards: [
      c("st-h1", "进站口封了", "hook", "", ["hot"], 1, 5, 1, 0, 0, "快讯标题。"),
      c("st-h2", "谁还在站台上", "hook", "", ["contrast"], 1, 3, 2, 0, 1, "把人放进标题。"),
      c("st-b1", "积水有多深", "body", "scene", [], 1, 2, 1, 0, 0, "一眼能写完。"),
      c("st-b2", "时刻表对比", "body", "data", [], 2, 1, 3, 0, 1, "延误到底有多久。"),
      c("st-b3", "被留下的人", "body", "person", ["useful"], 3, 1, 4, 0, 2, "耗时 3，完成度高。"),
      c("st-b4", "走回家的一段", "body", "story", [], 2, 2, 3, 0, 1, "你自己的返程。"),
      c("st-b5", "车站广播原文", "body", "line", ["proof"], 1, 1, 2, 0, 2, "引用广播，而不是转述恐慌。"),
      c("st-c1", "今晚怎么走", "close", "", ["useful"], 1, 1, 2, 0, 2, "对还在路上的人有用。"),
      c("st-c2", "情绪收尾", "close", "", ["payoff"], 1, 2, 1, 0, 0, "可以，但帮助不大。"),
      c("st-o1", "雨具店铺", "ops", "soft", ["sponsor"], 1, 1, 0, 3, -2, "这个时候放广告很显眼。"),
    ],
  },
  {
    id: "year",
    title: "年度小结：你想被记住成什么样",
    brief: "最后一篇。三张风险牌的 u 正好是 0.1、0.2、0.4。叠不叠，是这整组试验的题眼。",
    flags: [],
    cards: [
      c("yr-h1", "这一年的标题", "hook", "", ["contrast"], 1, 3, 2, 0, 1, "自己的句子。"),
      c("yr-h2", "全网都在复盘", "hook", "", ["hot", "absolute"], 1, 6, 0, 0, -1, "跟一个并不属于你的热度。", {
        u: 0.1,
        style: "backlash",
        when: { type: "always" },
        text: "只要放上就计入风险，u=0.1。单独一张时概率为 0。",
      }),
      c("yr-b1", "三个数字", "body", "data", ["proof"], 2, 1, 3, 0, 2, "用自己的工作量，不用想象的热度。"),
      c("yr-b2", "一件具体的事", "body", "story", [], 2, 2, 3, 0, 1, "只写一件，不写十二个月。"),
      c("yr-b3", "感谢名单", "body", "person", [], 1, 1, 1, 0, 2, "短，口碑温和。"),
      c("yr-b4", "绝对化的自我评价", "body", "line", ["absolute"], 1, 3, -1, 0, -1, "「已经小有名气」这种句子。", {
        u: 0.2,
        style: "flop",
        when: { type: "missingTag", tag: "proof" },
        text: "没有自己的数字时计入风险，u=0.2。",
      }),
      c("yr-b5", "现场的一张旧照", "body", "scene", [], 1, 2, 1, 0, 0, "快。"),
      c("yr-c1", "明年只做一件", "close", "", ["useful", "payoff"], 1, 1, 2, 0, 2, "收束，也给读者一个具体的东西。"),
      c("yr-o1", "课程推销", "ops", "soft", ["sponsor"], 1, 2, 0, 5, -2, "小结里塞课。", {
        u: 0.4,
        style: "flop",
        when: { type: "missingTag", tag: "disclose" },
        text: "不标明就是广告时计入风险，u=0.4。",
      }),
      c("yr-o2", "标明这是广告", "ops", "", ["disclose"], 1, 0, 1, 1, 3, "把推销说穿。"),
    ],
  },
];
