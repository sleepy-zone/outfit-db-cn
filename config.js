/**
 * 埋点配置（可选，填了才会上报）。留空 / 不写 providers = 完全关闭。
 *
 * 与 sleepyzone.online 下其他库共用同一个 Clarity 项目，
 * 报表里按 URL 过滤（包含 outfit-db-cn）即可只看本站，热图本来就按 URL 分开。
 *
 * 调试：控制台执行 window.__trackDebug = true 后刷新，可看每条事件；
 *      window.__trackLog 始终保留最近 200 条。
 */
window.ANALYTICS = {
  providers: []
};
