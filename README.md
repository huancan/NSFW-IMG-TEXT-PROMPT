# NSFW Prompt Studio 💜

面向 **男同 (Yaoi) / 女同 (Yuri) · 二次元** 的 NSFW 提示词构建工坊。

纯前端静态站点，**无任何依赖、无需服务器**，双击 `index.html` 即可使用，也可直接丢到任意静态托管（GitHub Pages / Netlify / Vercel / 对象存储）上。

**淡蓝色主题 + 小鲸鱼背景** 🐳（页面底部漂浮着小鲸鱼与气泡）。

> 🔞 仅面向 **18 岁以上成年人**。所有标签均以成年角色为前提，请勿用于生成任何涉及未成年人的内容，并遵守你所在地区的法律法规。

## 功能

| 功能 | 说明 |
| --- | --- |
| 🧑‍❤️‍💋‍🧑 / 👩‍❤️‍💋‍👩 双模式 | 男同 / 女同各自独立的标签库与选中状态，一键切换 |
| 🎨 模型预设 | **通用 (SD/NovelAI) / Illustrious XL / JANIMA / Nova Anime AM** 四套预设：切换后自动替换质量词池、模型专属标签、默认负面词与推荐参数 |
| 🏷️ 900+ 标签库 | 角色基础 / 体型身体 / 服装脱衣 / 动作体位 / 表情状态 / 场景环境 / 道具细节 / **审查与码（步兵/骑兵）** / **发型 / 发色 / 视角镜头** / 质量词 分类 |
| 🎌 动漫角色库 | **日本动漫（163 部 / 553 角色）与国产动漫（62 部 / 143 角色）分开存放**，经典+热门+冷门全覆盖；**男角色进男同区、女角色进女同区**，一键搜作品/角色、随机角色 |
| 🇨🇳 中文注释 | **每个标签都有中文注释**（悬浮可看详情），搜索支持中英文关键词 |
| ⚖️ 推荐权重 | 标签自带**推荐权重**（如 `blowjob ×1.2`），点击即带上，输出 `(tag:1.2)` 强调语法；可再 `+ / −` 微调 |
| 🎲 随机生成 | 三档强度（轻 / 中 / 重）按露骨程度过滤，自动加入发型/发色/视角与模型评分词；中/重强度默认带 `uncensored`（步兵），想要骑兵手动加 `censored` 类标签 |
| 📋 一键复制 | 正向提示词、负面提示词、生成参数行（Steps / Sampler / CFG / Size / Clip skip） |
| 📦 场景模板 | 温泉、办公室、更衣室、Bara 写真风等一键套用 |
| ⭐ 收藏 / 🕘 历史 | localStorage 本地持久化，关闭浏览器不丢 |
| 🔞 负面词预设 | 每个模型各自的默认负面词，可编辑、可恢复默认 |

## 动漫角色库（🎌 左栏第二个面板）

- **日本动漫 / 中国动漫分开**：面板顶部切换 🇯🇵 / 🇨🇳
- **性别分流**：男同模式下只显示**男角色**，女同模式下只显示**女角色**（点击即加入提示词，danbooru 风格标签 + 中文名）
- **覆盖范围**：从 1970 年代经典（高达、龙珠、美少女战士）到 2024-2026 新番（胆大党、怪兽8号、芙莉莲 S2 等），含 BL（世界第一初恋、GIVEN）与百合（柑橘味香气、终将成为你）题材，国漫含魔道祖师、天官赐福、斗罗大陆、时光代理人等
- **搜索**：支持中文名/英文名/角色名，命中自动展开
- **随机角色**：🎲 随机挑一部作品的当前性别角色加入提示词

> 说明：静态站点无法收录「所有」动漫（全量达数十万部）。本库为精选集合并可无限扩充——直接往 `anime.js` 追加一行即可，想要的全量列表可以整理成 CSV 发给我批量导入。

## 审查与码（步兵 / 骑兵）

「🚫 审查与码」分类在所有模型下都可用（27 个标签，全部为单个可加权词汇）：

- **步兵（无码）**：`uncensored`（推荐权重 ×1.2）、`partially uncensored`（局部无码）、`uncensored version`
- **骑兵（有码）**：`censored`、`mosaic censoring`（马赛克）、`bar censor`（黑条）、`blur censor`（模糊）、`text censoring`（贴字）
- **局部打码**：`partial censoring`、`censor bar over genitals`、`pixelated nipples`、`mosaic over genitals` 等按部位打码
- **程度**：`light censoring`（小码）/ `heavy censoring`（大码）

> 技巧：想稳定出步兵 → 正向加 `uncensored`，且负面词保留默认的 `censored, mosaic, bar censor, blur censor`；想出骑兵 → 正向加 `censored` 或具体打码标签。

## 模型预设说明

| 模型 | 质量词体系 | 负面词 | 推荐参数 |
| --- | --- | --- | --- |
| 🌀 通用 (SD / NovelAI) | `masterpiece, best quality…` | 经典负面词 | Euler a · 28 步 · CFG 7 · 832x1216 |
| 🎨 Illustrious XL | `score_9 / score_8_up…` + `source:anime` + `rating:explicit` + `year:2024` | `score_4, score_5, score_6` + 经典负面词 | DPM++ 2M Karras · 28 步 · CFG 7 · 832x1216 |
| ✨ JANIMA | 经典质量词 + `BREAK` 分段符 | 经典负面词 | Euler a · 28 步 · CFG 7 · 832x1216 |
| 🚀 Nova Anime AM | `score_9 / score_8_up…` + `source:anime` + `rating:explicit` | `score_4, score_5, score_6` + 经典负面词 | DPM++ 2M Karras · 30 步 · CFG 6.5 · 832x1216 |

> 切换模型时：若你没改过负面词，会自动跟随新模型默认；改过则保留你的版本。建议数值以各模型模型卡为准。

## 使用

1. 双击打开 `index.html`（或托管后访问对应 URL）
2. 通过 18+ 年龄确认
3. 顶部选**模型**（决定专属标签与参数建议）→ 左侧点选标签 / 点「🎲 随机生成」/ 点场景模板
4. 中栏标签默认带推荐权重，可用 `+ / −` 微调；复制正向 / 负面提示词与参数行
5. 粘贴到 Stable Diffusion WebUI / ComfyUI / NovelAI 等工具生成

## 目录结构

```
├── index.html        # 页面结构（含 18+ 确认、小鲸鱼背景层）
├── style.css         # 淡蓝色主题样式（小鲸鱼动画、角色库样式）
├── tags.js           # 标签数据（中文注释/推荐权重/模型预设）
├── anime.js          # 动漫角色库（日漫/国漫分库，角色按性别拆分）
├── app.js            # 交互逻辑
└── tests/            # 校验脚本（Node 直接运行）
    ├── smoke.test.js          # 逻辑冒烟测试：node tests/smoke.test.js
    ├── validate-data.test.js  # 标签数据一致性：node tests/validate-data.test.js
    ├── anime-data.test.js     # 动漫库数据校验：node tests/anime-data.test.js
    └── idcheck.test.js        # HTML/JS ID 交叉核对：node tests/idcheck.test.js
```

## 二次开发

- **加标签**：在 `tags.js` 对应分类里追加 `T('标签文本', 露骨等级, '中文注释', 推荐权重?)`，等级 0-3（3 为最露骨）。发型/发色/视角/审查为共享列表，改动会同时作用于两个模式。
- **加动漫/角色**：在 `anime.js` 对应地区数组里追加一行
  `A('作品中文名', 'English Name', 年份, ['角色tag:中文名', ...男], ['角色tag:中文名', ...女])`
  角色 tag 用 danbooru 风格（小写+下划线，如 `asuna:亚丝娜`、`wei_wuxian:魏无羡`），男角色进男同区、女角色进女同区。
- **加模型**：在 `tags.js` 的 `MODEL_PRESETS` 添加 `{ label, desc, extraQuality, specialTags, negative, params }` 即可，界面自动出现选项。
- **加模板**：在 `TEMPLATES` 对应模式下添加 `{ name: '名称', tags: [...] }`。
- **改负面词**：编辑 `NEGATIVE_DEFAULT` 或各模型的 `negative`。
- **换背景主题/鲸鱼**：`style.css` 的 `:root` 变量改色，`#whaleLayer` 里增删 `.whale` 元素。

## 说明

- 数据全部保存在浏览器 localStorage，无任何网络请求，不上传任何内容。
- 提示词仅供 AI 绘图工具使用，生成内容的合规责任由使用者自行承担。
