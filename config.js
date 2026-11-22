/**
 * 埋点配置。和 char-db-cn / ai-ref-library-cn 共用同一个 Clarity 项目，
 * 报表里按 URL 过滤（包含 outfit-db-cn）就能只看本站，热图本来就按 URL 分开。
 *
 * 留空 providers 即完全关闭，只在本地 window.__trackLog 留最近 200 条。
 *
 * 调试：控制台执行 window.__trackDebug = true 后刷新可看实时事件；
 *      window.__trackLog 始终保留最近 200 条。
 */
window.ANALYTICS = {
  providers: [
    { provider: "clarity", id: "r1wmvdsf4a" }
  ]
};
