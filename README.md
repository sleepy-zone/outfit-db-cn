# 服装提示词库 · ChiHAL 精选（中文）

AI 服装设计师 **ChiHAL／AI服飾デザイナー**（[@chihal_ai0509](https://x.com/chihal_ai0509)）的原创服饰精选库，做成和 [char-db-cn](https://github.com/sleepy-zone/char-db-cn) 一样的检索界面。

**23 套 · 12 类风格 · 151 段提示词 · 23,444 字**

**在线访问**：<https://sleepyzone.online/outfit-db-cn/> · 仓库：<https://github.com/sleepy-zone/outfit-db-cn>

- 作者 2026-11-01 出道，19 天发了 38 套编号设计（No.001–038），每套 = 主帖 + 图 + 一条按部位分栏的服装提示词
- 这里按**风格不重叠**挑出 23 套（朋克 / 新中式 / 学院运动 / 户外工装 / Y2K / 未来科技 / 夜场华丽 / 芭蕾核 / 高定裁缝 / 复古流行 / 军装机能 / 法式日常）
- 每套保留：设计规格板、试穿图、风格公式、配色、单品拆解、完整提示词（分栏 + 可逐段复制）

## 打开方式

线上直接访问 <https://sleepyzone.online/outfit-db-cn/>（GitHub Pages，仓库 `main` 分支根目录自动发布）。

本地也可以直接双击 **index.html**（thumbs/ 和 preview/ 要在同目录），不需要起服务器。

想用 http 打开：

```bash
python3 -m http.server 8080
# 然后访问 http://localhost:8080/outfit-db-cn/
```

## 站点里能做什么

- **风格分栏**：全部 / 高定裁缝 1 / 暗黑朋克 3 / 学院运动 3 / 东方新中式 1 / 户外工装 2 / Y2K辣妹 2 / 未来科技 2 / 夜场华丽 3 / 芭蕾少女 1
- **中英混合搜索**：搜「芭蕾核」「马甲」「撞色」「lace」「Y2K」都能命中（连提示词正文一起搜）
- **随机一套**：看运气抽一套，点开就出提示词
- **弹窗左侧**：规格板 / 试穿图可切换，`←` `→` 翻图
- **弹窗右侧**：风格公式（中/英）、品类、配色（带色点）、单品组合、设计要点、复用建议
- **提示词分栏**：上装 / 下装 / 腿部 / 鞋履 / 配饰 / 材质与细节，每栏单独「复制」，也有「复制全部」「复制整套结构（带分栏标题）」
- **深链**：`index.html#038` 直接打开某一套

## 提示词怎么用

提示词只描述**衣服**，不含人物、模型、seed、LoRA。用法是把它拼到自己的人物提示词后面：

```
<你的人物设定 / 固定行>
<服装段落：从本站复制，整段或只取一栏>
<姿势 / 构图 / 背景 / 画质词>
```

- 想保持人物一致性：人物段落一个字不改，只换服装段落（服装是「可变行」）
- 想改颜色：只替换面料色名，其余结构别动，结构描述是这套提示词真正的价值
- 规格板适合当结构参考（正背面裁片、面料小样、细节），试穿图适合当风格参考

## 目录结构

```
outfit-db-cn/
├── index.html          # 页面骨架
├── data.js             # 23 套的全部数据（window.OUTFIT_DB）
├── config.js           # 埋点开关
├── assets/
│   ├── style.css       # 与 char-db-cn 同一套设计语言
│   ├── app.js          # 渲染 / 筛选 / 搜索 / 弹窗 / 复制
│   └── analytics.js    # 轻量埋点层（默认关闭）
├── thumbs/             # 420px 宽 webp 缩略图（卡片用）
└── preview/            # 900px 宽 webp（弹窗用）
```

## 数据怎么来的

工作目录：`ego/x-chihal-ai0509-20261119/`（同一份数据的上游）

1. `round-20-scrape.mjs` — 逐帖抓 38 套的主帖 + 回复里的提示词（ego-browser）
2. `parse.mjs` — 去掉推文外壳，按部位切栏
3. `curated.mjs` — 人工精选 23 套 + 风格/配色/品类/设计要点/复用建议
4. `overrides.mjs` — 两套纯日文提示词的人工中译（No.016、No.036）
5. `build.mjs` — 生成 `data.js`（图片走 `preview/` `thumbs/`，文件名 `<No.>-<序号>.webp`）

想追加新的一套：把 `curated.mjs` 里加一条、图片按 `No.-序号` 放进两个目录、重跑 `node build.mjs`。

## 来源与授权

- 素材（设计、图片、提示词原文）版权归 **ChiHAL／[@chihal_ai0509](https://x.com/chihal_ai0509)** 所有
- 本站仅为个人使用的中文检索界面，只保留压缩缩略图；原图与原帖请通过页面链接到 X 获取
- 提示词由作者日文原文整理、分栏并译成中文，未改动技术细节；如有出入以原帖为准
- 请不要把图片本体二次分发或商用

## 埋点

和 [char-db-cn](https://github.com/sleepy-zone/char-db-cn) / ai-ref-library-cn 共用同一个 Clarity 项目 `r1wmvdsf4a`，报表里按 URL 过滤（包含 `outfit-db-cn`）就能只看本站，热图本来就按 URL 分开。

配置在 `config.js`，清空 `providers` 即完全关闭（只留本地 `window.__trackLog`）。调试：控制台 `window.__trackDebug = true` 后刷新可看实时事件。

所有事件都带 `lib: "outfit"` 标签，方便和其他库区分：

| 事件 | 触发 | 主要参数 |
|---|---|---|
| `lib_view` | 首屏加载 | `label: outfit-db-cn` |
| `filter` | 切风格分类 | `type: family`、`value: 分类名` |
| `search` | 搜索（>1 字，去抖） | `q`（截 40 字） |
| `random` | 随机一套 | — |
| `item_open` | 打开弹窗 | `id: No.`、`label: 中文名`、`value: 分类` |
| `image_view` | 切换规格板 / 试穿图 | `id`、`type: board\|look` |
| `copy` | 复制 | `type: section\|structured\|plain\|formula`、`label: 栏名`、`id` |
| `download_open` | 打开图包面板 | `label: image-pack` |
| `download_click` | 点网盘按钮 | `label: xunlei\|uc` |

外链点击（GitHub、X、网盘）由 Clarity 的「出站点击」自动统计，不再手动埋点。
