export type Stance = "echo" | "side" | "counter";

export type Material = {
  id: string;
  name: string;
  availableDay: 1 | 2 | 3;
  supports: Stance | "none";
  grade: 0 | 1 | 2 | 3;
  misleading: boolean;
  text: string;
};

export type ScenarioEvent = {
  id: string;
  day: 1 | 2 | 3;
  title: string;
  body: string;
};

export type Scenario = {
  id: string;
  title: string;
  brief: string;
  truth: Record<Stance, boolean>;
  stanceCopy: Record<Stance, string>;
  events: ScenarioEvent[];
  materials: Material[];
  crowd: Record<1 | 2 | 3, Record<Stance, number>>;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "manhole",
    title: "小区井盖连夜被换",
    brief: "第一天群里都说换下来的井盖是偷工减料。后一天市政说明还在路上。你可以现在跟，也可以先核实。",
    truth: { echo: false, side: true, counter: false },
    stanceCopy: {
      echo: "顺着说：连夜更换就是偷工减料。",
      side: "补一侧：更换本身正常，但当晚没设提示，老人绕了远路。",
      counter: "唱反调：这是有人在掩盖更大的工程问题。",
    },
    events: [
      { id: "m1", day: 1, title: "业主群的照片", body: "夜里的照片里，新井盖边缝宽了一指。几十楼转发「又是最低价中标」。" },
      { id: "m2", day: 2, title: "市政短讯", body: "市政说这批井盖按例行年限更换，附了采购批号。群里一半人说是补锅。" },
      { id: "m3", day: 3, title: "居委会的补充", body: "批号对得上。真正没做到的是夜间提示牌，两位老人绕路。掩盖说没有后文。" },
    ],
    materials: [
      { id: "m-photo", name: "夜照片", availableDay: 1, supports: "echo", grade: 1, misleading: true, text: "缝宽能看见，但看不出材质。后来批号对上了，这张照片不能证明偷工。" },
      { id: "m-batch", name: "采购批号", availableDay: 2, supports: "side", grade: 3, misleading: false, text: "批号、年限、施工单位三者一致，偷工减料这句站不住。提示牌确实没有记录。" },
      { id: "m-rumor", name: "匿名爆料", availableDay: 1, supports: "counter", grade: 0, misleading: true, text: "说井盖下面埋了别的工程。没有任何可以核对的地点或文件。" },
      { id: "m-elder", name: "老人绕路记录", availableDay: 2, supports: "side", grade: 2, misleading: false, text: "社区登记了两位老人当晚绕行。支持「没设提示」，不支持「掩盖」。" },
    ],
    crowd: {
      1: { echo: 6, side: 1, counter: 2 },
      2: { echo: 8, side: 3, counter: 4 },
      3: { echo: 5, side: 2, counter: 2 },
    },
  },
  {
    id: "canteen",
    title: "新开的社区食堂",
    brief: "开业当天的主流说法是面子工程。也有人说其实坐满了。坐满不等于老人吃得起。",
    truth: { echo: false, side: true, counter: true },
    stanceCopy: {
      echo: "顺着说：又是做给检查看的面子工程。",
      side: "补一侧：中午有人吃，但老人套餐超出日常菜金。",
      counter: "唱反调：面子工程这个判断不成立，食堂的使用是真实的。",
    },
    events: [
      { id: "c1", day: 1, title: "开业剪彩", body: "领导剪彩的视频播放量很高。评论区默认「拍完就关」。" },
      { id: "c2", day: 2, title: "工作日中午", body: "没有剪彩的中午，窗口排了两轮。菜单边缘印着老人价，比早上菜场贵一截。" },
      { id: "c3", day: 3, title: "一周流水", body: "街道公布的一周份数不像摆拍。老人价是否调整，没有下文。" },
    ],
    materials: [
      { id: "c-video", name: "剪彩视频", availableDay: 1, supports: "echo", grade: 0, misleading: true, text: "只能证明有过剪彩。用它证明「拍完就关」，后来被工作日的队列推翻。" },
      { id: "c-queue", name: "工作日队列", availableDay: 2, supports: "counter", grade: 3, misleading: false, text: "无剪彩日的两轮队列。支持「使用是真实的」，不自动说明价格合理。" },
      { id: "c-price", name: "老人价菜单", availableDay: 2, supports: "side", grade: 3, misleading: false, text: "菜单上的老人价高于周边菜场同期。支持价格这一侧。" },
      { id: "c-cheer", name: "开业好评截图", availableDay: 1, supports: "counter", grade: 1, misleading: false, text: "有人说好吃。样本是开业当天的免费份，强度低。" },
    ],
    crowd: {
      1: { echo: 7, side: 1, counter: 1 },
      2: { echo: 6, side: 3, counter: 2 },
      3: { echo: 3, side: 2, counter: 2 },
    },
  },
  {
    id: "warning",
    title: "暴雨预警发晚了",
    brief: "主流批评大体是对的，所以第一天顺着说的人非常挤。反过来说「发得很及时」并不会因为你敢唱反调就成立。",
    truth: { echo: true, side: true, counter: false },
    stanceCopy: {
      echo: "顺着说：预警明显晚于已经开始的强降雨。",
      side: "补一侧：晚发是事实，但标准本身有一段空窗，不能只骂当班的人。",
      counter: "唱反调：预警发得很及时，是居民自己没看。",
    },
    events: [
      { id: "w1", day: 1, title: "雨已经很大", body: "傍晚群里全是积水。预警通知比第一批积水照片晚了四十分钟。批评的帖子很快占满。"},
      { id: "w2", day: 2, title: "空窗被翻出来", body: "有人把预警标准原文贴出来：降雨跨过阈值后允许一段确认时间。确认时间解释不了全部的四十分钟。" },
      { id: "w3", day: 3, title: "复盘会", body: "值班记录承认通知偏晚。同时也写了标准里的确认窗。两种说法里，只有「发得很及时」被记录否定。" },
    ],
    materials: [
      { id: "w-time", name: "照片和通知的时间戳", availableDay: 1, supports: "echo", grade: 3, misleading: false, text: "积水照片早于预警约四十分钟。直接支持「发晚了」。" },
      { id: "w-rule", name: "预警标准原文", availableDay: 2, supports: "side", grade: 3, misleading: false, text: "有确认窗。它解释一部分延迟，不支持「其实很及时」。" },
      { id: "w-blame", name: "「都怪居民」的帖", availableDay: 1, supports: "counter", grade: 0, misleading: true, text: "没有阅读数据。后来的值班记录否定了「发得很及时」。" },
      { id: "w-log", name: "值班记录摘要", availableDay: 3, supports: "echo", grade: 2, misleading: false, text: "承认偏晚。第三天才出现，等到这时话题已经凉了。" },
    ],
    crowd: {
      1: { echo: 9, side: 1, counter: 2 },
      2: { echo: 7, side: 3, counter: 2 },
      3: { echo: 4, side: 2, counter: 1 },
    },
  },
];
