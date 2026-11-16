export type Stance = "news" | "roast" | "technical" | "contrary";

export type EventDef = {
  id: string;
  title: string;
  synopsis: string;
  technicalSupported: boolean;
  contrarySupported: boolean;
};

/** 虚构事件。技术拆解与唱反调的证据有的成立、有的不足，两种都有。 */
export const EVENT_POOL: EventDef[] = [
  { id: "manhole", title: "井盖连夜被换", synopsis: "夜里的照片缝很宽，采购批号要到后一天才对得上。", technicalSupported: true, contrarySupported: false },
  { id: "canteen", title: "社区食堂开业", synopsis: "剪彩视频很满。工作日的队列和老人价是两件不同的事。", technicalSupported: true, contrarySupported: true },
  { id: "warning", title: "暴雨预警发晚", synopsis: "积水照片早于通知。标准里的确认窗解释不了全部延迟。", technicalSupported: true, contrarySupported: false },
  { id: "earphone", title: "新耳机频响争议", synopsis: "参数表公开。『闭眼入』没有对照。", technicalSupported: true, contrarySupported: false },
  { id: "rerun", title: "过气综艺又上榜", synopsis: "热搜是旧的。收视和现在的播放可以核对，掩盖说没有材料。", technicalSupported: false, contrarySupported: false },
  { id: "rooftop", title: "天台被改成菜地", synopsis: "产权条款找得到。有人说承重已经超了，没有检测。", technicalSupported: true, contrarySupported: false },
  { id: "beta", title: "游戏公测掉线", synopsis: "服务器状态页后来承认波动。『官方故意卡服』没有日志。", technicalSupported: true, contrarySupported: false },
  { id: "clinic", title: "体检指标截图", synopsis: "参考范围在说明书第 4 页。群里的『人人中招』对不上。", technicalSupported: true, contrarySupported: false },
  { id: "bus", title: "末班车被取消", synopsis: "时刻表改过。有人说是为了赶商场客流，合同里没有这一条。", technicalSupported: false, contrarySupported: false },
  { id: "lab", title: "讲座里的反常识", synopsis: "幻灯片有对照表。把结论说成定论的那句，表上没有。", technicalSupported: true, contrarySupported: true },
  { id: "market", title: "菜价一夜翻倍", synopsis: "批发报价可以核对。『有人囤货』目前只有匿名。", technicalSupported: true, contrarySupported: false },
  { id: "dorm", title: "宿舍断电传闻", synopsis: "后勤说是检修。电表记录支持检修，不支持『针对性停电』。", technicalSupported: true, contrarySupported: false },
];
