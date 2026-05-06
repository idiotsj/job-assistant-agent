# YU HANG / 职链 Agent - 详细前端设计方案 (Developer Handoff Spec)

本文档面向继续在 `apps/web` 内推进产品设计与前端实现的研发同学。它以 [`C:\Users\ECO\Downloads\产品简要说明 (1).docx`](C:/Users/ECO/Downloads/%E4%BA%A7%E5%93%81%E7%AE%80%E8%A6%81%E8%AF%B4%E6%98%8E%20%281%29.docx) 中的整套页面图为母版，不再只吸收单张首页，而是将首页、个人中心、面试模拟、就业广场、AI 对话工作区等页面统一成一套正式的产品设计规范。

从这一版开始，文档的主命名、视觉基线和页面语义整体向图稿靠拢，采用 **YU HANG / 职链 Agent** 的产品表达。当前仓库中的 `Work Agent` 相关命名仍可暂时保留在代码层，但设计文档、产品评审和后续页面实现应优先遵守本规范。

---

## 0. 项目概况与协作定位

这一节的目标不是替代接口文档，而是让任何新接手的同学先搞清楚三件事：

1. 这个项目当前到底是什么形态，不是只看图稿想象。
2. 这份设计文档、前后端交接文档、进度 Todo 三者分别管什么。
3. 后续多人协作时，什么信息应该在前端文档沉淀，什么信息应该交给接口文档和进度文档维护。

### 0.1 项目一句话说明

`YU HANG / 职链 Agent` 是一个围绕学生成长、就业、升学与考公路径提供陪伴式任务推进的前端产品。它不是单纯的信息查询站，也不是传统后台工作台，而是把首页任务、岗位推荐、简历优化、个人中心、频道内容和 AI 对话工作区统一成一套持续陪伴式体验。

### 0.2 当前仓库与系统结构

当前项目是一个 monorepo，前后端并不是散落在不同仓库里，而是共享一套 contract 与数据库结构：

```text
apps/
├─ web/          # Next.js 用户端前端
├─ api/          # Fastify + TypeScript 公共业务后端
├─ ai-service/   # FastAPI + Python 内部 AI 能力层
└─ admin/        # 预留目录

packages/
├─ contracts/    # 前后端共享 HTTP 契约与 zod schema
├─ database/     # PostgreSQL schema / seed / migrations
└─ config/       # 预留共享配置
```

当前系统边界必须始终保持清晰：

*   浏览器页面只访问 `apps/web`。
*   前端页面只通过 `apps/web/src/lib/api/*` 调 `apps/api` 暴露的公共接口。
*   `apps/ai-service` 是 `apps/api` 的内部依赖，不给前端直连。
*   接口字段真相以 `@job-assistant/contracts` 为准，不以前端页面当前写法为准。

### 0.3 当前项目状态与阶段判断

截至 `2026-05-04`，这个项目已经不是“空白搭建期”，但也还没有进入“视觉、逻辑、路由全部收敛稳定”的成熟期。更准确地说，它现在处于：

*   **业务能力已有一批真实接口**
    *   登录 / 注册 / 当前用户
    *   用户画像
    *   首页推荐 / 今日内容
    *   岗位 / 企业 / 案例 / 活动
    *   日程聚合
    *   考研 / 考公频道
    *   简历解析 / 诊断 / 岗位定向分析 / 改写建议
*   **前端已有一版 V1 骨架**
    *   已有真实路由和 feature 目录
    *   已有 demo/live 联调实践
    *   已有 `page + hook + sections + types/utils` 组织方式
*   **但产品母版仍在升级期**
    *   当前大部分页面还是旧版单壳层工作台风格
    *   新图稿定义的双壳层体系、黄色主任务卡、右侧知识树、对话工作区等还没有完整落地

这意味着后续工作的核心，不是从零搭一个新项目，而是：

*   在已有真实能力上重做产品壳层与信息架构。
*   一边保留现有稳定能力页，一边渐进引入新的聚合页与新模块。
*   控制多人协作时的重构成本，而不是一轮把目录、路由、视觉、接口都同时推倒。

### 0.4 当前前端落点概览

目前 `apps/web` 已存在的前端 feature 与路由，决定了后续改造必须走“渐进演进”而不是“完全重建”：

| 类型 | 当前现状 | 对后续工作的含义 |
| --- | --- | --- |
| 现有路由 | `/`、`/resume`、`/jobs`、`/companies`、`/events`、`/profile`、`/schedule`、`/cases`、`/postgraduate`、`/civil-service`、`/login`、`/register` | 这些都已是可工作的入口，第一轮不应贸然删除。 |
| 现有 feature | `home`、`resume`、`jobs`、`profile`、`cases`、`channels`、`companies`、`events`、`schedule` 等 | 说明多数业务能力已有目录承载，后续重点是换壳、重组、聚合，不是重新发明数据层。 |
| 当前布局层 | 仍以 `AppSidebar` 为代表的旧单壳层结构为主 | 新母版改版首先要动共享壳层，而不是先动最深业务逻辑。 |
| 当前状态治理 | 已有 demo/live/mixed 与错误态治理经验 | 这是项目的成熟资产，不能在改版中丢掉。 |

### 0.5 三份核心文档的分工

为了避免协作时“所有信息都堆到同一份文档里”，下面这三个文档的职责边界应固定：

| 文档 | 作用 | 谁优先维护 |
| --- | --- | --- |
| `apps/web/docs/frontend-design-spec.md` | 规定产品母版、页面结构、前端逻辑组织方式、实施规划、协作规则 | 前端主导维护 |
| `apps/web/docs/frontend-backend-handoff.md` | 规定系统边界、接口说明、contract 真相、启动方式、联调与排障方法 | 前后端共同参考，接口变化时后端优先维护 |
| `apps/web/docs/frontend-progress-todo.md` | 记录当前 `todo / doing / blocked / done` 的执行状态与阻塞项 | 协作者按进度实时维护 |

在当前协作方式下，推荐执行约定如下：

*   前端每次开工前都重新读一遍这三份文档。
*   前端在页面设计、结构规划或实施基线变化后，更新本设计文档。
*   后端在接口、contract、联调方式或模块完成状态变化后，更新交接文档和 Todo 文档。
*   如果一次改动同时影响产品结构和接口边界，三份文档应在同一轮内一起对齐，而不是只改代码不改文档。

### 0.6 这份文档应该怎样被使用

这份文档的用途不是单纯“给设计师看”，而是面向后续会真正写代码、联调接口、拆任务、做评审的研发同学。因此它应该同时回答下面几类问题：

*   页面应该长什么样。
*   页面为什么要这样组织。
*   当前代码里从哪里接着改最合理。
*   哪些旧东西先保留，哪些新东西必须新增。
*   前后端联调时，哪些边界不能被页面实现破坏。
*   多人协作时，如何避免每个人按自己的理解再做一遍产品决策。

---

## 1. 核心设计理念 (Design Philosophy)

*   **Companion Dashboard (陪伴式仪表盘)**：页面不是传统后台控制台，也不是纯内容信息流，而是围绕“现在最该做什么”组织的信息工作台。用户打开页面后，应优先看到任务、建议、倒计时和下一步动作，而不是功能菜单。
*   **Soft Career Guidance (柔和的职业陪伴感)**：整体基调采用浅雾白、浅灰蓝、浅灰紫和柔和蓝紫强调，避免企业后台的强压迫感。视觉上更像一位“陪你推进成长与求职任务的助手”，而不是冷冰冰的管理系统。
*   **Action-first over Navigation-first (任务优先而非导航优先)**：一级认知重点是任务卡、推荐卡、建议卡、时间卡与对话区，不是大面积侧边导航。导航是辅助，行动区才是主角。
*   **Dual Shell System (双壳层体系)**：产品存在两类完全不同的交互任务，因此不应强迫所有页面共用一个布局：
    *   仪表盘壳层：用于首页、个人中心、就业广场、面试模拟、频道页。
    *   对话工作区壳层：用于 AI 岗位咨询、深度问答、历史会话、智能分析等长交互页面。
*   **AI as Guidance, not Final Truth (AI 是辅助，不是最终结论)**：所有 AI 诊断、推荐、复盘、改写建议、政策解读都必须以“辅助建议”表达，不可包装成绝对判断、官方评定或已经自动执行完毕的最终结果。

---

## 2. 核心设计令牌 (Design Tokens - CSS Variables)

开发时请在 `globals.css` 中严格定义并使用以下变量。延续基于 HSL 的书写方式，方便设置透明度与渐变。

### 🎨 基础调色板 (Fog White + Blue Violet Palette)

| CSS 变量名 | HSL 参考值 | 视觉效用 | 具体使用场景 |
| :--- | :--- | :--- | :--- |
| `--bg-page` | `224 40% 97%` | 浅雾白底 | 页面最外层背景。 |
| `--bg-shell` | `0 0% 100%` | 纯白壳层底 | 顶栏、主容器、对话壳层大面板。 |
| `--bg-surface` | `0 0% 100%` | 白色卡片 | 常规模块卡片、表单区、信息面板。 |
| `--bg-surface-soft` | `228 60% 98%` | 浅灰紫底 | 预览卡、弱强调区域、内容容器底板。 |
| `--bg-rail-soft` | `223 55% 96%` | 浅蓝灰侧区 | 左侧辅助栏、右侧知识树、次级面板。 |
| `--bg-task` | `44 100% 56%` | 亮黄色 | 当前阶段主任务卡、重点行动块。 |
| `--bg-task-soft` | `45 100% 91%` | 柔黄底 | 任务说明、轻提醒。 |
| `--bg-dialog` | `224 34% 16%` | 深色对话舞台 | AI 数字人面试舞台、AI 对话工作区。 |
| `--primary` | `241 84% 64%` | 柔和蓝紫主色 | 主按钮、重要标签、主图标。 |
| `--primary-hover` | `241 82% 58%` | 深一档蓝紫 | Hover / active 态。 |
| `--primary-soft` | `241 100% 96%` | 浅蓝紫底 | 次级按钮底、标签底。 |
| `--accent-blue` | `208 80% 77%` | 浅蓝补色 | 用户身份胶囊、顶栏头像底。 |
| `--accent-green` | `152 67% 44%` | 成功/积极 | 匹配度、已完成、良好状态。 |
| `--accent-orange` | `32 100% 54%` | 重点提醒 | 截止期提醒、风险提示。 |
| `--accent-red` | `356 84% 68%` | 警示色 | 严重风险、异常提醒。 |
| `--text-primary` | `223 31% 20%` | 深蓝灰正文 | 主标题、正文、重点标签。 |
| `--text-secondary` | `222 20% 43%` | 次级文本 | 描述文字、辅助说明。 |
| `--text-muted` | `221 18% 62%` | 弱信息 | 时间、占位符、元信息。 |
| `--border-soft` | `226 33% 91%` | 柔边框 | 卡片边界、分割线。 |
| `--border-strong` | `227 42% 84%` | 强边框 | 激活态卡片、输入区、胶囊按钮。 |

### 🎨 阴影与圆角 (Shadows & Radius)

```css
:root {
  --shadow-sm: 0 4px 12px rgba(34, 48, 88, 0.05);
  --shadow-md: 0 10px 28px rgba(34, 48, 88, 0.08);
  --shadow-lg: 0 18px 48px rgba(34, 48, 88, 0.12);

  --radius-xs: 10px;
  --radius-sm: 14px;
  --radius-md: 18px;
  --radius-lg: 24px;
  --radius-xl: 32px;
}
```

### ✒️ 排版规范 (Typography)

*   **字库设定**：优先使用 `Inter`，中文回退采用 `PingFang SC`、`Microsoft YaHei`、`-apple-system`。
*   **层级**：
    *   **Display / Hero**：2.75rem (44px), `font-weight: 700`, `letter-spacing: -0.04em`
    *   **H1**：2.25rem (36px), `font-weight: 700`, `letter-spacing: -0.03em`
    *   **H2**：1.625rem (26px), `font-weight: 700`
    *   **H3 / 模块标题**：1.125rem (18px), `font-weight: 600`
    *   **Body**：1rem (16px), `font-weight: 400`, `line-height: 1.7`
    *   **Small / Meta**：0.8125rem (13px), `color: var(--text-muted)`
*   **标题气质**：
    *   首页与任务卡允许使用更大的字重和更宽的留白。
    *   频道页和工具页标题避免“后台表格式标题”，要更像产品叙事。
*   **辅助标签**：
    *   倒计时、状态、身份、匹配度、来源等信息优先使用胶囊形态。
    *   标签高度建议 24px 到 32px。

### 📏 间距与栅格 (Spacing & Grid)

*   页面外边距默认 `24px` 到 `32px`。
*   模块间距默认 `20px` 到 `24px`。
*   卡片内边距默认 `20px` 到 `28px`。
*   仪表盘桌面端优先采用 `280px / 1fr / 280px` 或 `300px / 1fr / 300px` 三栏基线。
*   对话工作区桌面端优先采用 `320px / 1fr` 两栏基线。

---

## 3. 全局布局骨架 (Layout Architecture)

### 3.1 双壳层体系总览

产品必须正式区分以下两类页面壳层：

1.  **仪表盘壳层 (Dashboard Shell)**
    *   用于：首页、个人中心、就业广场、面试模拟、学生案例、升学考研、考公之路等以“浏览 + 推进任务 + 多模块聚合”为主的页面。
2.  **对话工作区壳层 (Conversation Workspace Shell)**
    *   用于：AI 岗位咨询、深度问答、政策解读、历史对话、长交互工作区等以“连续输入输出”为主的页面。

禁止把所有页面都强行做成一种布局。页面结构应服务于交互任务，而不是反过来被统一模板绑死。

### 3.2 仪表盘壳层 (Dashboard Shell)

#### 📌 顶部品牌与身份条

*   顶部是全宽品牌条，而不是传统左侧固定系统导航。
*   左侧展示：
    *   品牌 Logo
    *   产品名 `YU HANG` 或 `职链 Agent`
    *   日期与产品副标题，例如“2026年02月06日 · 智能生涯助手”
*   右侧展示：
    *   用户头像
    *   用户昵称 / 年级身份
    *   可扩展的通知或状态入口
*   顶栏高度建议 `72px` 到 `84px`，需要留足呼吸感。

#### 📌 主体分区规则

仪表盘页采用“内容分区驱动”而不是“导航驱动”：

*   **左侧辅助区**：
    *   关键日程倒计时
    *   心理健康/状态观察
    *   简历管理
    *   小型日程或通知
*   **中部主舞台**：
    *   推荐卡
    *   当前阶段主任务
    *   学业/画像/时间线/内容流
    *   深色 AI 模块或大面积操作区
*   **右侧知识树与建议区**：
    *   综合就业知识树
    *   快捷入口
    *   每日建议
    *   行业热点 / 政策解读
    *   往期面经、学习提醒等辅助块

#### 📌 导航策略

*   一级导航不靠固定左侧系统菜单承载。
*   桌面端优先由 **右侧知识树 / 快捷入口卡** 提供高频跳转。
*   页面中部可通过任务卡、推荐卡、内容区继续承载上下文跳转。
*   若某个频道页存在更深层的二级结构，应在页面内部处理，不要把全站再次退回成传统“侧边菜单后台”。

### 3.3 对话工作区壳层 (Conversation Workspace Shell)

#### 📌 左侧历史与模式栏

*   左侧固定列承担：
    *   产品 Logo 与模式切换
    *   历史对话列表
    *   当前方向标签，例如“就业 / 考公”
    *   可选的用量、积分或对话次数信息
*   默认宽度建议 `280px` 到 `340px`。

#### 📌 中央对话主区

*   顶部为会话标题区，展示当前工作区名称和上下文。
*   中央为大面积消息流或分析流区域，背景可采用浅雾蓝白底。
*   底部为固定输入器，包含：
    *   附件按钮
    *   语音按钮
    *   发送按钮
    *   能力模式切换，例如“深度思考”
    *   快捷问题胶囊

#### 📌 视觉重点

*   AI 对话主区允许使用更深的背景块或深色舞台模块。
*   但输入器、上下文条和快捷问题区域必须保持明亮、柔和、可读。

### 3.4 响应式规则

*   `<= 1280px`：
    *   仪表盘页优先压缩侧栏宽度，不立刻砍掉右侧知识树。
*   `<= 1080px`：
    *   仪表盘页可退化为双栏，右侧知识树转为顶部折叠卡或二级入口组。
*   `<= 768px`：
    *   仪表盘页改成单列堆叠。
    *   对话工作区历史栏改成抽屉。
    *   顶部品牌条只保留品牌、头像、当前关键入口。
*   移动端仍应保留产品陪伴感与任务感，不得退回默认浏览器表单页风格。

---

## 4. 重点业务模块详细开发文档 (Module Details)

### 模块 A：首页仪表盘 (Home Dashboard)

首页以 [`image1.png`](C:/Users/ECO/AppData/Local/Temp/work-agent-doc-images/images/image1.png) 及其拆解图为主母版，是整套产品最核心的视觉模板。

#### 1. 顶栏身份条

*   左侧：品牌、日期、副标题。
*   右侧：用户头像、昵称、年级。
*   全页的第一认知点是“这是我的个人智能生涯助手”，不是“这是一个企业管理后台”。

#### 2. 左侧辅助模块

*   **关键日程倒计时**
    *   展示两个优先级最高的倒计时事项。
    *   每项包含：
        *   状态胶囊
        *   标题
        *   剩余天数大字
    *   卡片气质应轻、亮、清晰。
*   **身心平衡指数**
    *   展示简单雷达图或评分图。
    *   附加两项轻信息，例如“心理压力”“今天天气”。
    *   此区是人文关怀模块，语气要温和。
*   **今日日程**
    *   首页仅展示最近两个时间节点。
    *   明确来源是用户自定义、宣讲会、面试安排或关键考试提醒。

#### 3. 中部顶部精准推送

*   两到三张横向岗位推荐卡。
*   每张卡包含：
    *   公司标识
    *   岗位名
    *   基础信息
    *   匹配度标签
    *   城市 / 薪资
*   对于大一大二用户，可切换成职业方向推荐；对于大三大四用户，优先展示具体岗位推荐。

#### 4. 中部主任务卡

*   首页最大卡片必须是“引导式主任务卡”。
*   这是页面第一视觉重心，负责回答“你现在该做什么”。
*   默认结构：
    *   小标签：当前阶段说明
    *   大标题：如“简历优化”“提高面试能力”“补齐目标画像”
    *   一段解释：说明为何现在推进这件事
    *   右侧收益提示：如简历竞争力、目标方向、已更新条目
    *   底部双按钮：
        *   主按钮：亮黄色或强强调色，用于立即行动
        *   次按钮：白底或浅紫底，用于辅助动作
*   同一张卡的任务内容必须能随用户年级、目标方向和当前状态变化。

#### 5. 右侧知识树与建议区

*   **综合就业知识树**
    *   是桌面端的高频入口区。
    *   默认展示：个人中心、学生案例、面试模拟、就业广场、升学考研、考公之路。
*   **每日建议**
    *   使用高饱和蓝紫渐变卡。
    *   展示 AI 根据当前阶段生成的建议。
    *   必须配一个清晰的行动按钮，例如“前往练习”。
*   **行业热点 / 政策解读**
    *   采用短列表流展示。
    *   优先提供 AI 总结后的入口，不要直接把原始长新闻堆上来。

#### 6. 底部内容流

*   **近期宣讲会**
    *   首页默认只展示最近两个。
    *   点击进入更完整的活动 / 宣讲会页。
*   **每日企业推荐**
    *   采用彩色企业卡片流。
    *   重点展示企业、核心岗位、宣讲时间、往年招聘人数等。

### 模块 B：面试模拟 (Interview Simulation)

该模块以 [`image11.png`](C:/Users/ECO/AppData/Local/Temp/work-agent-doc-images/images/image11.png) 为主母版。

#### 1. 面试礼仪须知

*   以浅底说明卡呈现，不做纯文档列表。
*   卡内展示最重要的 2 到 3 条礼仪提醒，例如着装、光线、背景。
*   提供“查看手册”入口进入完整礼仪页。

#### 2. AI 智能建议卡

*   使用蓝紫渐变卡。
*   展示对当前场景的即时开场建议或练习建议。
*   按钮文案应偏行动式，例如“立即前往”。

#### 3. 数字人面试主舞台

*   页面主舞台必须采用深色背景。
*   居中展示数字人、当前场景、身份标签。
*   核心目标是营造“正在进行一场模拟面试”的沉浸感，而不是聊天框。
*   顶部可展示场景标签，例如“算法工程师专场”“AI 导师已就绪”。

#### 4. 往期面经总结

*   右侧列表展示过往面试轮次、企业、题型、摘要。
*   允许“录入新面经”。
*   语义上是“可追溯的经验积累”，不是普通通知列表。

#### 5. AI 复盘总结

*   页面底部展示雷达图、综合面试胜率、文字建议。
*   该区必须显式表达这是“AI 辅助复盘”。
*   不应写成“官方评分”或“最终录取判断”。

### 模块 C：就业广场 (Career Hub)

该模块以 [`image18.png`](C:/Users/ECO/AppData/Local/Temp/work-agent-doc-images/images/image18.png) 为主母版，是当前 `resume`、`jobs`、`companies`、`events` 等能力的统一产品承载页。

#### 1. 智能简历优化

*   首屏主模块是简历智能优化区。
*   左侧为价值说明和按钮区：
    *   上传简历
    *   一键生成
*   中部为简历预览卡。
*   右侧仍保留知识树入口。
*   当前前端约束继续保持：
    *   支持粘贴文本
    *   支持导入 `txt / md`
    *   Word / PDF 需先转纯文本，除非后续明确补齐二进制上传链路

#### 2. 针对简历的岗位与宣讲会推荐

*   推荐区必须明确是“基于当前简历/目标方向生成”。
*   岗位卡展示匹配度。
*   宣讲会/活动卡展示时间与是否可加入日程。

#### 3. 企业推荐

*   企业卡片使用更丰富的色块和标签。
*   每张卡至少展示：
    *   企业名称
    *   热招岗位
    *   宣讲日期或招聘周期
    *   往届招聘人数等说明

#### 4. AI 岗位咨询

*   采用深色对话模块。
*   是就业广场中的一个功能块，而不是默认全页对话模式。
*   重点用途：
    *   职业方向问答
    *   岗位信息咨询
    *   目标职业路线提问
*   历史对话、附件、上下文标签可作为扩展能力。

#### 5. 职业规划全周期

*   使用思维导图或路线图表现。
*   作为长期成长视图，与短期任务卡形成互补。
*   此区的语气应偏“长期路径指导”，而不是短期操作提醒。

### 模块 D：个人中心 (Personal Center)

该模块以 [`image24.png`](C:/Users/ECO/AppData/Local/Temp/work-agent-doc-images/images/image24.png) 为主母版，是当前 `profile`、`schedule`、简历缓存与登录态信息的统一产品承载页。

#### 1. 页面总结构

*   采用“左右相对固定，中部滚动”的仪表盘布局。
*   左侧：关键日程、简历管理、知识提醒。
*   中部：欢迎信息、成长指标、人格/职业画像、当前主任务、周视图日程。
*   右侧：知识树与每日建议延续全站统一规则。

#### 2. 左侧信息栏

*   **关键日程**
    *   展示最重要的两个倒计时。
*   **简历管理**
    *   存放不同方向的简历版本。
*   **智能求职洞察**
    *   用于提醒新的宣讲会、简历更新建议、网申成功率相关信息。

#### 3. 中部成长信息区

*   **欢迎区**
    *   展示姓名、当前阶段、连续打卡或持续推进状态。
*   **绩点趋势与学习路线**
    *   采用折线趋势图或卡片式指标。
*   **人格特质与目标职业**
    *   展示 MBTI / 霍兰德结果或其他职业画像摘要。
    *   若用户未完成测试，应有清晰的待补全入口。

#### 4. 当前阶段主任务

*   使用亮黄色大任务卡。
*   是个人中心页面的第一视觉重点。
*   可展示：
    *   当前阶段最优先动作
    *   竞争力百分比或阶段完成度
    *   主动作按钮
    *   次动作按钮

#### 5. 周视图日程

*   使用更正式的周视图时间板，而不是简单列表。
*   区分：
    *   宣讲会
    *   面试模拟
    *   用户自定义事项
    *   自动提醒事项
*   当前后端仍保留 `user / job / event / exam` 的聚合来源语义，前端展示时不得丢失来源边界。

### 模块 E：AI 对话工作区 (AI Conversation Workspace)

该模块以 [`image22.png`](C:/Users/ECO/AppData/Local/Temp/work-agent-doc-images/images/image22.png) 为主母版，是第二类正式页面壳层。

#### 1. 左侧历史与模式栏

*   顶部显示产品品牌与当前模式。
*   中部展示方向标签与历史对话。
*   底部可展示积分、次数、状态等辅助信息。

#### 2. 中央工作区

*   顶部展示当前对话主题，例如“对话 / AI 智能助手”。
*   中间是长对话流或分析流。
*   若为空态，应呈现柔和留白，不要用开发态占位框。

#### 3. 底部输入器

*   底部输入框是页面第二视觉重点。
*   必须具备：
    *   输入区
    *   附件入口
    *   语音入口
    *   发送按钮
    *   模式标签，例如“深度思考”
*   快捷问题胶囊在输入器上方排列，帮助用户迅速发起任务。

#### 4. 适用场景

*   岗位咨询
*   政策解读
*   职业方向问答
*   长链路追问
*   对已有分析结果继续追问

#### 5. 文案边界

*   回答、总结、建议都属于 AI 辅助输出。
*   不能暗示系统已经自动修改简历、自动保存职业路线或替用户完成外部投递。

### 模块 F：频道页继承规则 (Students Cases / 升学考研 / 考公之路)

*   学生案例、升学考研、考公之路属于仪表盘壳层的内容频道。
*   它们不需要再长成传统后台列表页。
*   视觉上应继承：
    *   顶栏身份条
    *   右侧知识树
    *   白色卡片 + 柔和边框 + 大圆角
    *   建议卡、任务卡、内容卡的统一语言
*   内容上：
    *   学生案例偏故事与路径拆解
    *   升学考研偏备考路线、资源与提醒
    *   考公之路偏城市、岗位、节奏与政策建议

### 模块 G：通用表单与按钮 (Forms & Components)

#### 基础输入框

*   白底、柔和边框、大圆角。
*   输入高度建议 `44px` 到 `52px`。
*   Focus 态采用蓝紫色描边与柔和发光，不要使用浏览器默认 outline。

#### 主按钮

*   默认采用 `--primary` 蓝紫底。
*   在“当前阶段主任务”“最关键转化按钮”场景下允许使用 `--bg-task` 亮黄色大按钮。
*   文案必须动作明确，例如“上传简历”“立即前往”“查看学习路线”“前往练习”。

#### 胶囊标签

*   用于状态、角色、方向、匹配度、来源、建议类型。
*   不同语义使用浅底色，而非高饱和大面积色块。

#### 深色舞台组件

*   面试模拟数字人舞台
*   AI 岗位咨询对话面板
*   需要沉浸感或聚焦感的对话模块

---

## 5. 开发者移交清单 (Developer Checklist)

1.  **先落设计基础设施**
    *   将本规范的 Design Tokens 写入 `globals.css`。
    *   把旧的“单一左侧栏壳层”升级为“双壳层体系”。
    *   顶栏身份条、知识树卡、黄色任务卡、深色对话舞台应优先成为复用组件。
2.  **建立新的通用组件层**
    *   原子组件继续保留 `Button`、`Input`、`Card`、`Badge`、`Textarea`、`ProgressBar`。
    *   需要补充中层组件：
        *   品牌顶栏
        *   右侧知识树卡
        *   倒计时卡
        *   黄色任务卡
        *   深色对话舞台
        *   周视图时间板
        *   企业推荐彩色卡
3.  **先壳层，后页面**
    *   先统一仪表盘壳层和对话工作区壳层。
    *   再改首页与个人中心。
    *   然后整合就业广场。
    *   最后再推进面试模拟与 AI 对话工作区。
4.  **接口联调规则不变**
    *   继续统一调用 `apps/web/src/lib/api/*`。
    *   继续以 `@job-assistant/contracts` 为真相源。
    *   不因新视觉改版而绕过既有前后端边界。
5.  **设计图与实现映射**
    *   首页：以 `image1.png` 为主。
    *   面试模拟：以 `image11.png` 为主。
    *   就业广场：以 `image18.png` 为主。
    *   个人中心：以 `image24.png` 为主。
    *   AI 对话工作区：以 `image22.png` 为主。

### 5.1 实施优先级与阶段产出 (Execution Phases)

为了确保任何接手同学都能直接开始实现，后续前端改版必须按下面的阶段推进，不允许跳着做。

#### Phase 1：壳层与基础组件

目标：

*   落地双壳层体系。
*   抽出新的视觉基础组件。
*   不改业务逻辑，不先重构复杂页面。

本阶段必须交付：

*   仪表盘壳层：
    *   顶部品牌与身份条
    *   左侧辅助栏容器
    *   中部主舞台容器
    *   右侧知识树栏容器
*   对话工作区壳层：
    *   左侧历史栏
    *   中央对话区
    *   底部输入器
*   新中层组件：
    *   `BrandTopBar`
    *   `KnowledgeTreeCard`
    *   `CountdownCard`
    *   `GuidedTaskCard`
    *   `GradientAdviceCard`
    *   `DarkStagePanel`
    *   `WeeklyScheduleBoard`
    *   `CompanySpotlightCard`

本阶段结束判定：

*   接下来任何页面都可以基于新壳层拼装，而不是继续复用旧的单壳层工作台。

#### Phase 2：首页与个人中心

目标：

*   先落两张最能定义产品气质的页面。

本阶段必须交付：

*   新首页仪表盘
*   新个人中心仪表盘
*   保持现有接口与状态治理不退化

本阶段结束判定：

*   用户打开产品后，第一眼已进入新产品视觉语言，而不是旧版工作台。

#### Phase 3：就业广场整合

目标：

*   将当前分散在 `resume / jobs / companies / events` 的能力，先以产品层组合到一个统一页面规范中。

本阶段必须交付：

*   就业广场首页壳
*   简历优化首屏
*   岗位/宣讲会推荐区
*   企业推荐区
*   AI 岗位咨询入口区
*   职业规划全周期区

本阶段结束判定：

*   就业广场已成为可展示给产品和设计评审的统一模块，而不是多个独立页面的集合。

#### Phase 4：新增模块落地

目标：

*   补齐当前仓库中还没有正式页面的新模块。

本阶段必须交付：

*   面试模拟页
*   AI 对话工作区
*   频道页视觉升级：
    *   学生案例
    *   升学考研
    *   考公之路

本阶段结束判定：

*   整套产品图稿中的核心页面都已有前端承载。

### 5.2 路由与页面落地决策 (Route & Page Decisions)

以下决策在实现阶段视为固定，不需要接手同学再次判断。

| 新产品模块 | 当前实现载体 | 路由策略 | 本阶段动作 |
| --- | --- | --- | --- |
| 首页 | `/` | 保留原路由 `/` | 重写为新首页仪表盘，不新建第二个首页路由。 |
| 个人中心 | `/profile` + `/schedule` | 暂保留 `/profile` 作为个人中心主路由，`/schedule` 暂时保留独立页 | 先把 `/profile` 升级成个人中心主页面，`/schedule` 继续作为子能力页保留。 |
| 学生案例 | `/cases` | 保留 `/cases` | 视觉升级，不改路由。 |
| 面试模拟 | 当前无 | 新建 `/interview` | 这是新增路由，不复用现有页面。 |
| 就业广场 | 当前分散在 `/resume`、`/jobs`、`/companies`、`/events` | 新建 `/career` 作为统一产品入口，同时保留旧路由 | 先新增产品聚合页，不立刻删旧页。 |
| 升学考研 | `/postgraduate` | 保留 `/postgraduate` | 视觉升级，不改路由。 |
| 考公之路 | `/civil-service` | 保留 `/civil-service` | 视觉升级，不改路由。 |
| AI 对话工作区 | 当前无 | 新建 `/advisor-chat` | 这是新增路由，作为第二壳层示范页。 |

特别注意：

*   当前阶段 **不** 重命名已有路由。
*   新增产品模块页仅新增：
    *   `/career`
    *   `/interview`
    *   `/advisor-chat`
*   旧路由继续服务已有业务能力与渐进迁移：
    *   `/resume`
    *   `/jobs`
    *   `/companies`
    *   `/events`
    *   `/schedule`
*   当新聚合页完成并稳定后，才允许后续再讨论是否下沉或收缩旧路由入口。

### 5.3 新旧命名并存规则 (Naming Coexistence Rules)

为了避免接手同学在代码层和文档层产生混乱，当前统一遵守以下规则：

*   设计文档、页面标题、产品评审稿使用新产品命名：
    *   `首页`
    *   `个人中心`
    *   `学生案例`
    *   `面试模拟`
    *   `就业广场`
    *   `升学考研`
    *   `考公之路`
    *   `AI 对话工作区`
*   代码目录层暂时允许保留旧业务域命名：
    *   `home`
    *   `resume`
    *   `jobs`
    *   `profile`
    *   `schedule`
*   若新建 feature，优先使用新的产品模块命名：
    *   `career-hub`
    *   `interview-lab`
    *   `advisor-chat`
*   在同一轮实现中，不要一边大规模重命名旧目录，一边改视觉和逻辑；避免多人协作时 merge 成本失控。

### 5.4 组件责任清单 (Component Responsibility Matrix)

以下组件从这一版开始视为正式组件目标，接手同学不需要再自行判断“要不要抽”。

| 组件名 | 层级 | 适用页面 | 是否允许业务逻辑 | 说明 |
| --- | --- | --- | --- | --- |
| `BrandTopBar` | layout | 全部仪表盘页 | 否 | 顶栏品牌、日期、用户身份条。 |
| `DashboardShell` | layout | 首页、个人中心、就业广场、频道页、面试模拟 | 否 | 统一三栏或双栏仪表盘容器。 |
| `ConversationShell` | layout | AI 对话工作区 | 否 | 左历史 + 中央对话 + 底部输入器。 |
| `KnowledgeTreeCard` | section-level | 首页、个人中心、面试模拟、频道页 | 否 | 右侧综合就业知识树与入口区。 |
| `CountdownCard` | block | 首页、个人中心 | 否 | 倒计时事项卡。 |
| `WellbeingCard` | block | 首页 | 否 | 身心平衡指数卡。 |
| `GuidedTaskCard` | block | 首页、个人中心 | 否 | 当前阶段主任务大卡。 |
| `GradientAdviceCard` | block | 首页、个人中心、面试模拟 | 否 | 每日建议或 AI 建议渐变卡。 |
| `JobMatchCard` | block | 首页、就业广场 | 否 | 岗位推荐卡。 |
| `CompanySpotlightCard` | block | 首页、就业广场 | 否 | 企业推荐卡。 |
| `WeeklyScheduleBoard` | block | 个人中心 | 否 | 周视图日程板。 |
| `DarkStagePanel` | block | 面试模拟、就业广场、AI 对话页 | 否 | 深色舞台/深色对话模块容器。 |
| `HistoryThreadList` | section-level | AI 对话工作区 | 否 | 左侧历史会话列表。 |
| `ChatComposer` | section-level | AI 对话工作区 | 只允许局部输入状态 | 输入器只管理局部交互，不持有业务真相源。 |

规则：

*   除 `ChatComposer` 这类局部输入组件外，中层与展示组件默认不持有业务真相源。
*   页面数据、同步状态、demo/live/mixed 必须统一由 hook 管理。

### 5.5 页面实现验收方式 (Implementation Acceptance Method)

每个页面实现完成后，必须按以下四层验收，而不是只看“像不像图”：

1.  **结构验收**
    *   页面区块是否齐全
    *   区块顺序是否与本规范一致
2.  **视觉验收**
    *   是否已进入新产品母版语言
    *   是否仍残留旧单壳层工作台痕迹
3.  **状态验收**
    *   loading / empty / error / demo / live / mixed 是否明确
4.  **工程验收**
    *   是否遵守 `page + hook + sections + types/utils`
    *   是否继续通过 `apps/web/src/lib/api/*`
    *   是否继续使用 `@job-assistant/contracts`

### 5.6 基于当前仓库的下一阶段详细改动规划 (Repo-aware Execution Plan)

下面这部分不是抽象建议，而是按当前 `apps/web` 的真实目录、真实入口文件和真实页面骨架写的落地规划。后续接手同学开工时，优先看这一节，而不是重新猜“从哪里下手”。

#### 5.6.1 当前代码基线判断

| 位置 | 当前现实 | 对接下来改版的含义 |
| --- | --- | --- |
| `apps/web/src/app/layout.tsx` | 仍然用 `AppSidebar + main-panel` 的旧单壳层结构包住全站。 | 这里是新母版切换的第一入口，必须先改。 |
| `apps/web/src/app/globals.css` | 仍然主要定义旧版蓝白工作台 token、`sidebar` 结构和旧网格类名。 | 新视觉令牌、双壳层容器和响应式规则都要先在这里重建。 |
| `apps/web/src/components/layout/app-sidebar.tsx` | 当前 `layout` 目录里只有这一个共享布局组件，而且语义仍是旧版左侧系统导航。 | 不能继续让它承担全站默认壳层；需要拆成新壳层组件，并把它降级成旧能力页导航或移动端补充导航。 |
| `apps/web/src/features/home/*` | 已按 `page + hook + sections + types/utils` 拆好，`home-page.tsx` 和 `use-home-dashboard-data.ts` 是真实可演进入口。 | 首页不需要推倒目录重来，应在原 feature 内重组 section 和视觉结构。 |
| `apps/web/src/features/profile/*` | 已有 `profile-page.tsx`、`use-profile-page.ts` 和多个 section。 | 个人中心应继续在这里演进，而不是新建平行的 `personal-center-v2`。 |
| `apps/web/src/features/resume/*` | 简历诊断、解析、行动清单已有较完整逻辑分层。 | `/career` 第一轮要复用这里的能力，不要先重写接口逻辑。 |
| `apps/web/src/features/jobs/*` | 岗位列表、详情、分析抽屉已按 list/detail/drawer 分层。 | `/career` 和后续 AI 咨询入口需要借用这些真实能力，不要拆散后重写。 |
| `apps/web/src/features/cases/cases-page.tsx` | 目前还是单页文件主导，尚未完全进入新母版的 section 化表达。 | 学生案例页会在后一阶段补结构化拆分。 |
| `apps/web/src/features/channels/*` | 考研/考公当前主要共用 `AdviceChannelPage`。 | 频道页可以继续共享逻辑，但视觉壳层和区块需要升级。 |
| `apps/web/src/features/app-shell` | 目录已存在但当前为空。 | 后续若壳层相关的无业务 section 超过少量共享组件，可在此目录承接。 |
| `apps/web/src/features/schedule/*` | 当前正在进行独立重构，工作区里已有未完成改动。 | 这一轮新母版改版不主动触碰 `schedule` feature 内部实现，只把 `/schedule` 当成保留中的独立能力页。 |

#### 5.6.2 按阶段落到真实文件的实施顺序

| 阶段 | 主要目标 | 必改文件 / 新增目录 | 实施动作 | 本阶段完成标志 |
| --- | --- | --- | --- | --- |
| Phase 1 | 先切换共享壳层和视觉基线 | `apps/web/src/app/layout.tsx`、`apps/web/src/app/globals.css`、`apps/web/src/components/layout/app-sidebar.tsx`、新建 `apps/web/src/components/layout/dashboard-shell.tsx`、`apps/web/src/components/layout/conversation-shell.tsx`、`apps/web/src/components/layout/brand-top-bar.tsx` | 保留 `AuthProvider` 和登录态恢复链路不动；把全站默认骨架从旧侧栏壳层改成“顶部身份条 + 仪表盘壳层/对话壳层”；把旧 `AppSidebar` 从“全站默认布局”降级成过渡导航组件或局部导航组件；在 `globals.css` 正式落新 token、三栏/两栏壳层类和移动端规则。 | 首页和个人中心哪怕还没完全重写，也已经可以挂到新壳层里，不再受旧侧栏结构限制。 |
| Phase 2 | 首页与个人中心先完成产品换壳 | `apps/web/src/app/page.tsx`、`apps/web/src/features/home/*`、`apps/web/src/app/profile/page.tsx`、`apps/web/src/features/profile/*` | 首页继续用 `HomePage` 入口，但把当前 `home-hero / metrics / overview` 这套旧区块重排成“左辅助栏 + 中部主任务 + 右知识树”结构；个人中心继续用 `ProfilePage` 入口，把当前“表单页”升级成“中心仪表盘 + 周视图摘要 + 简历管理摘要 + 任务卡”。 | `/` 与 `/profile` 都已正式切到 `DashboardShell`，并且用户第一眼看到的是新产品母版，而不是旧工作台页面。 |
| Phase 3 | 新建就业广场聚合页 | 新建 `apps/web/src/app/career/page.tsx`、新建 `apps/web/src/features/career-hub/*` | 新建产品聚合 feature，用一个 hook 统一编排简历优化、岗位推荐、宣讲会推荐、企业推荐、AI 岗位咨询、职业规划； 复用 `resume`、`jobs`、`companies`、`events` 现有 API wrapper 和成熟区块，不在这一阶段删除旧路由。 | `/career` 已可单独演示完整“就业广场”叙事，同时 `/resume`、`/jobs`、`/companies`、`/events` 仍然保留。 |
| Phase 4 | 补齐新模块并升级频道页 | 新建 `apps/web/src/app/interview/page.tsx`、新建 `apps/web/src/features/interview-lab/*`、新建 `apps/web/src/app/advisor-chat/page.tsx`、新建 `apps/web/src/features/advisor-chat/*`、升级 `apps/web/src/features/cases/*`、升级 `apps/web/src/features/channels/*` | 落地面试模拟舞台页和 AI 对话工作区；把学生案例、考研、考公页换到新仪表盘壳层下，补齐右侧知识树、建议卡和 Hero 结构。 | 设计稿中的核心页面都在当前仓库里有正式前端承载。 |

#### 5.6.3 每个阶段应优先改哪些现有页面入口

1. 共享壳层阶段先改：
   *   `apps/web/src/app/layout.tsx`
   *   `apps/web/src/app/globals.css`
   *   `apps/web/src/components/layout/app-sidebar.tsx`
2. 页面换壳阶段优先改：
   *   `apps/web/src/app/page.tsx`
   *   `apps/web/src/features/home/home-page.tsx`
   *   `apps/web/src/features/home/hooks/use-home-dashboard-data.ts`
   *   `apps/web/src/app/profile/page.tsx`
   *   `apps/web/src/features/profile/profile-page.tsx`
   *   `apps/web/src/features/profile/hooks/use-profile-page.ts`
3. 聚合新模块阶段新增：
   *   `apps/web/src/app/career/page.tsx`
   *   `apps/web/src/features/career-hub/*`
   *   `apps/web/src/app/interview/page.tsx`
   *   `apps/web/src/features/interview-lab/*`
   *   `apps/web/src/app/advisor-chat/page.tsx`
   *   `apps/web/src/features/advisor-chat/*`
4. 频道升级阶段再处理：
   *   `apps/web/src/app/cases/page.tsx`
   *   `apps/web/src/features/cases/cases-page.tsx`
   *   `apps/web/src/app/postgraduate/page.tsx`
   *   `apps/web/src/app/civil-service/page.tsx`
   *   `apps/web/src/features/channels/advice-channel-page.tsx`
   *   `apps/web/src/features/channels/postgraduate-page.tsx`
   *   `apps/web/src/features/channels/civil-service-page.tsx`

### 5.7 文件影响范围、复用边界与暂缓项

#### 5.7.1 这一轮必须优先复用的现有资产

| 资产 | 当前位置 | 后续处理规则 |
| --- | --- | --- |
| 认证与会话恢复 | `apps/web/src/components/providers/auth-provider.tsx` | 原样复用，不因换壳重写登录态机制。 |
| API wrapper | `apps/web/src/lib/api/*` | 所有新页面继续统一调用，不允许在新 feature 里绕过。 |
| 共享 contract | `@job-assistant/contracts` | 继续作为数据真相源，不在页面层重复声明结构。 |
| 首页数据 hook | `apps/web/src/features/home/hooks/use-home-dashboard-data.ts` | 继续作为首页真实数据入口，可重组返回结构，但不改成页面内零散请求。 |
| 画像页数据 hook | `apps/web/src/features/profile/hooks/use-profile-page.ts` | 继续作为个人中心主数据入口。 |
| 简历工作台逻辑 | `apps/web/src/features/resume/hooks/use-resume-workbench.ts` | 作为 `/career` 的简历优化区能力来源之一。 |
| 岗位页 list/detail/drawer 逻辑 | `apps/web/src/features/jobs/**/*` | 作为 `/career` 和后续 AI 咨询入口的能力来源之一，不先推翻。 |
| 列表分页与 catalog 小工具 | `apps/web/src/features/catalog/*` | 企业、案例、活动等目录型页面优先继续复用。 |

#### 5.7.2 第一轮不要做的重构

| 暂不做的事 | 原因 |
| --- | --- |
| 不大规模重命名现有 feature 目录 | 当前首页、画像、简历、岗位都已挂到真实路由，先换壳再谈目录命名收敛。 |
| 不删除 `/resume`、`/jobs`、`/companies`、`/events`、`/schedule` | 新聚合页完成前，这些路由仍是稳定能力入口。 |
| 不把 `resume` 和 `jobs` 的业务逻辑整体搬进 `/career` | 第一轮应做聚合编排，不做重型逻辑迁移。 |
| 不触碰 `apps/web/src/features/schedule/*` 正在进行的重构 | 当前工作区已有未完成改动，贸然插手会提高冲突成本。 |
| 不把 demo/live 状态隐藏到 UI 看不出来 | 现阶段仍需保留联调可观察性。 |
| 不为了对齐视觉而改后端 contract 或 API wrapper 真相 | 视觉升级不应倒逼边界失真。 |

#### 5.7.3 目录与文件新增规则

*   新壳层组件优先放在：
    *   `apps/web/src/components/layout`
*   若后续出现一组与壳层强绑定、但不携带业务真相源的中层展示模块，可以承接到：
    *   `apps/web/src/features/app-shell`
*   新产品聚合页统一新建独立 feature：
    *   `apps/web/src/features/career-hub`
    *   `apps/web/src/features/interview-lab`
    *   `apps/web/src/features/advisor-chat`
*   在原有 feature 中升级页面时，优先新增 `sections/*` 和必要的 `types/utils`，不要临时把新母版 UI 继续堆回单个 page 文件。

### 5.8 推荐的提单与协作拆分方式

为了让多人并行开发时不互相阻塞，推荐按下面的改动单元拆分，而不是把所有页面一起推：

1. 一张共享壳层改造单。
   *   只负责 `layout.tsx`、`globals.css`、新的 shell 组件和旧 `AppSidebar` 降级处理。
2. 一张首页改造单。
   *   只负责 `/` 和 `src/features/home/*`。
3. 一张个人中心改造单。
   *   只负责 `/profile` 和 `src/features/profile/*`。
4. 一张就业广场新建单。
   *   只负责 `/career` 与 `src/features/career-hub/*`，不顺手大改 `resume`、`jobs` 旧页。
5. 一张面试模拟新建单。
   *   只负责 `/interview` 与 `src/features/interview-lab/*`。
6. 一张 AI 对话工作区新建单。
   *   只负责 `/advisor-chat` 与 `src/features/advisor-chat/*`。
7. 一张频道页统一升级单。
   *   负责 `/cases`、`/postgraduate`、`/civil-service` 以及 `src/features/channels/*` 的壳层对齐。

额外协作规则：

*   共享壳层改造单必须先合，再并行推进页面单。
*   `/career`、`/interview`、`/advisor-chat` 三个新增路由可以并行开发，因为写入目录天然分离。
*   `schedule` 相关开发单不和本轮母版重构混在同一个改动中。
*   若某一轮只完成了视觉拼装，但还没补齐 `loading / empty / error / demo / live / mixed`，状态必须仍标记为 `doing`，不能标记为完成。

---

## 6. 页面设计与逻辑结构统一规范 (Page Logic Architecture)

从现在开始，这份文档不只规定页面长什么样，也规定前端页面应该怎么组织。即使产品命名和页面壳层发生升级，也必须继续遵守统一的工程结构，避免页面文件无限膨胀、多人同时改同一块逻辑。

### 6.1 推荐目录结构

```text
apps/web/src/features/<domain>/
├─ <domain>-page.tsx
├─ hooks/
│  └─ use-<domain>-page-data.ts
├─ sections/
│  ├─ <domain>-hero-section.tsx
│  ├─ <domain>-overview-section.tsx
│  └─ ...
├─ types.ts
└─ utils.ts
```

*   `<domain>-page.tsx`
    *   只负责页面编排、区块顺序、路由级判断。
*   `hooks/use-<domain>-page-data.ts`
    *   统一负责接口调用、demo/live 切换、副作用、状态聚合和 view model 计算。
*   `sections/*.tsx`
    *   只接收 props，负责页面分区 UI。
    *   不直接请求接口，不自己持有新的业务真相源。
*   `types.ts`
    *   放 feature 内部状态枚举、view model 类型、局部契约。
*   `utils.ts`
    *   放纯函数，例如日期格式化、状态汇总、展示文案转换。

### 6.2 页面分层职责

*   页面层只做“拼装”，不要把页面写成一个巨型业务容器。
*   数据层统一收口在 feature hook，不要在多个 section 里各自请求一次接口。
*   展示层优先做纯组件，让它可以被 demo 数据、live 数据、测试数据重复复用。
*   所有接口访问必须继续走 `apps/web/src/lib/api/*` wrapper，不能在页面或 section 中直接 `fetch`。
*   后端已经按分区建模的数据，前端应保留分区语义，不要为了“看起来统一”而重新打平成另一套核心结构。

### 6.3 统一状态模型

新页面默认按下面这组状态思路组织，命名可以因场景微调，但语义必须一致：

*   `loading`：会话恢复中，或页面关键数据正在首次同步。
*   `ready-demo`：当前可展示，但仍是演示数据。
*   `ready-live`：页面核心模块都已切到真实数据。
*   `partial-live`：部分模块已实时同步，剩余模块仍保留 demo 兜底。
*   `unauthenticated`：需要登录才能拿到真实内容，但仍允许保留演示预览。
*   `error`：实时同步失败，必须显式提示，并明确说明当前展示的是 demo 或兜底内容。

特别注意：

*   `error` 不等于“静默回退 demo”。
*   `partial-live` 是正式状态，不要把它当成异常。
*   对用户可见的状态文案和 badge 必须和真实数据来源一致。

### 6.4 Demo / Live 约束

*   页面级必须能明确告诉用户当前是 `demo`、`live` 还是 `mixed`。
*   模块级也要尽量保留来源标识，尤其是首页、就业广场、个人中心这类多来源页面。
*   可以保留 demo 兜底用于视觉演示和联调，但不能让开发者或用户分不清“到底有没有真的请求成功”。
*   发生失败时允许保留旧数据或 demo 数据，但必须给出显式错误提示。

### 6.5 新产品模块与当前仓库映射

本规范使用新的产品模块语义，但当前仓库仍保留按业务域拆分的实现。后续推进时，需要先理解下面这张映射表：

| 新产品模块 | 当前前端映射 | 说明 |
| --- | --- | --- |
| 首页 | `/` + `features/home` + 小型日程预览 | 已有首页数据与分区治理基础，但视觉与信息架构需重写。 |
| 就业广场 | `/resume` + `/jobs` + `/companies` + `/events` | 当前能力已分散实现，后续应整合成统一产品模块。 |
| 个人中心 | `/profile` + `/schedule` + `resumeData` 相关能力 | 画像、日程、简历缓存和阶段任务应在产品层统一承接。 |
| 学生案例 | `/cases` | 列表基础已有，后续可扩详情与故事化表达。 |
| 升学考研 | `/postgraduate` | 已有独立频道基础。 |
| 考公之路 | `/civil-service` | 已有独立频道基础。 |
| 面试模拟 | 暂无正式页面 | 仅有设计稿与产品定义，尚未在当前仓库落地。 |
| AI 对话工作区 | 暂无正式页面 | 仅有设计稿与概念定义，尚未以产品页落地。 |

特别注意：

*   本次设计文档升级不要求立刻重命名现有代码目录。
*   代码层可以继续沿用 `home / resume / jobs / profile / schedule` 等目录名。
*   但页面视觉、组件命名和产品语义应逐步向新模块体系收敛。

### 6.6 首页仪表盘作为第一标准模板

概念结构：

```text
apps/web/src/features/home/
├─ home-dashboard-page.tsx
├─ hooks/
│  └─ use-home-dashboard.ts
├─ sections/
│  ├─ home-countdown-rail.tsx
│  ├─ home-recommend-strip.tsx
│  ├─ home-guided-task-section.tsx
│  ├─ home-agenda-section.tsx
│  ├─ home-company-section.tsx
│  └─ home-right-knowledge-section.tsx
├─ types.ts
└─ utils.ts
```

核心约束：

*   `page.tsx` 只负责编排。
*   `use-home-dashboard.ts` 统一处理首页推荐、今日内容、时间线预览、用户状态、任务建议。
*   “引导式主任务卡”必须由 hook 统一产出，不允许各 section 各自猜测当前阶段任务。
*   右侧知识树与每日建议应视为首页正式模块，而不是临时侧栏。

### 6.7 就业广场作为第二标准模板

概念结构：

```text
apps/web/src/features/career-hub/
├─ career-hub-page.tsx
├─ hooks/
│  └─ use-career-hub-page.ts
├─ sections/
│  ├─ career-hub-resume-section.tsx
│  ├─ career-hub-recommendation-section.tsx
│  ├─ career-hub-company-section.tsx
│  ├─ career-hub-ai-consult-section.tsx
│  └─ career-hub-roadmap-section.tsx
├─ types.ts
└─ utils.ts
```

核心约束：

*   就业广场是统一产品模块，不应在页面层同时堆简历、岗位、企业、活动、AI 咨询的业务真相源。
*   hook 统一处理：
    *   简历工作台状态
    *   推荐模块的 demo/live/mixed
    *   企业推荐
    *   活动/宣讲会推荐
    *   AI 咨询入口上下文
*   当前简历能力仍然遵守文本输入边界，不可在文档里假装已经有二进制上传链路。

### 6.8 面试模拟作为第三标准模板

概念结构：

```text
apps/web/src/features/interview-lab/
├─ interview-lab-page.tsx
├─ hooks/
│  └─ use-interview-lab-page.ts
├─ sections/
│  ├─ interview-etiquette-section.tsx
│  ├─ interview-ai-advice-section.tsx
│  ├─ interview-stage-section.tsx
│  ├─ interview-history-section.tsx
│  └─ interview-review-section.tsx
├─ types.ts
└─ utils.ts
```

核心约束：

*   数字人面试舞台、礼仪区、历史区、复盘区都要拆成 section。
*   hook 统一管理：
    *   当前场景
    *   会话状态
    *   复盘结果
    *   历史记录
    *   建议卡内容
*   AI 面试输出必须持续表述为“模拟 + 复盘 + 建议”，而不是正式面试判定。

### 6.9 个人中心作为第四标准模板

概念结构：

```text
apps/web/src/features/personal-center/
├─ personal-center-page.tsx
├─ hooks/
│  └─ use-personal-center-page.ts
├─ sections/
│  ├─ personal-center-left-rail.tsx
│  ├─ personal-center-growth-section.tsx
│  ├─ personal-center-profile-section.tsx
│  ├─ personal-center-task-section.tsx
│  ├─ personal-center-schedule-section.tsx
│  └─ personal-center-right-knowledge-section.tsx
├─ types.ts
└─ utils.ts
```

核心约束：

*   个人中心不是单纯的画像表单页。
*   hook 统一聚合：
    *   画像
    *   日程
    *   简历版本摘要
    *   当前阶段任务
    *   成长指标
*   表单输入、周视图日程、主任务卡不得在同一页面文件中混成一个巨型组件。

### 6.10 AI 对话工作区作为第五标准模板

概念结构：

```text
apps/web/src/features/advisor-chat/
├─ advisor-chat-page.tsx
├─ hooks/
│  └─ use-advisor-chat-page.ts
├─ sections/
│  ├─ advisor-chat-sidebar.tsx
│  ├─ advisor-chat-header.tsx
│  ├─ advisor-chat-thread.tsx
│  ├─ advisor-chat-suggestion-chips.tsx
│  └─ advisor-chat-composer.tsx
├─ types.ts
└─ utils.ts
```

核心约束：

*   左侧历史列表与中央消息流必须分离。
*   hook 统一管理：
    *   当前会话
    *   历史会话列表
    *   当前方向标签
    *   快捷问题
    *   输入器状态
*   若未来接入真正的会话接口，也必须继续通过 `apps/web/src/lib/api/*` 而不是直接在 section 中自行 `fetch`。

### 6.11 频道页通用模板

学生案例、升学考研、考公之路等频道页继续继承统一结构：

```text
apps/web/src/features/<channel>/
├─ <channel>-page.tsx
├─ hooks/
│  └─ use-<channel>-page.ts
├─ sections/
│  ├─ <channel>-hero-section.tsx
│  ├─ <channel>-content-section.tsx
│  ├─ <channel>-action-section.tsx
│  └─ <channel>-sidebar-section.tsx
├─ types.ts
└─ utils.ts
```

核心约束：

*   频道页不是孤立内容页，而是整套仪表盘语言的一部分。
*   右侧知识树、建议卡、任务卡应视场景按需复用。

### 6.12 逐页区块清单与验收标准 (Page-by-page Execution Specs)

以下清单用于回答“别人拿到文档是否能直接实现”。从这一节开始，所有页面的区块顺序、降级规则和验收条件都视为固定，不需要实现同学再做产品决策。

#### A. 首页 `/`

页面壳层：

*   使用 `DashboardShell`

桌面端区块顺序：

1. 顶部品牌与身份条
2. 左侧：
   *   关键日程倒计时
   *   身心平衡指数
   *   今日日程
3. 中部：
   *   精准推送岗位横卡
   *   引导式主任务卡
   *   近期宣讲会
   *   每日企业推荐
4. 右侧：
   *   综合就业知识树
   *   每日建议
   *   行业热点 / 政策解读

必须出现的状态：

*   会话恢复中
*   游客态
*   `demo`
*   `live`
*   `mixed`
*   接口失败但保留可展示内容

可降级规则：

*   若右侧热点区暂无数据，可以显示空态卡，但右侧知识树和每日建议不得同时消失。
*   若今日内容接口失败，可保留 demo 任务卡，但必须显式提示当前不是实时内容。

完成判定：

*   打开首页后，第一视觉重心必须是“引导式主任务卡”。
*   首页不允许再呈现旧版“欢迎横幅 + 通用卡片网格”的主结构。

#### B. 个人中心 `/profile`

页面壳层：

*   使用 `DashboardShell`

桌面端区块顺序：

1. 顶部品牌与身份条
2. 左侧：
   *   关键日程
   *   简历管理
   *   智能求职洞察
3. 中部：
   *   欢迎区
   *   GPA/趋势分析
   *   人格特质与目标职业
   *   当前阶段主任务
   *   周视图日程
4. 右侧：
   *   综合就业知识树
   *   每日建议

必须出现的状态：

*   登录恢复中
*   游客态
*   已登录但画像读取失败
*   已登录可编辑态
*   保存成功 / 保存失败提示

可降级规则：

*   若 GPA、人格特质等当前没有真实来源，可用占位型产品卡表达“待补全/待接入”，但页面结构不能缺失。
*   `/schedule` 当前仍保留独立页，因此个人中心中的周视图以摘要和跳转为主，不要求第一轮就承载全部编辑能力。

完成判定：

*   `/profile` 不再只是单纯表单编辑页，而是完整的个人中心首页。

#### C. 就业广场 `/career`

页面壳层：

*   使用 `DashboardShell`

桌面端区块顺序：

1. 顶部品牌与身份条
2. 首屏：
   *   智能简历优化说明区
   *   简历预览区
   *   右侧综合就业知识树
3. 第二屏：
   *   基于简历的岗位推荐
   *   基于简历的宣讲会推荐
4. 第三屏：
   *   企业推荐
5. 第四屏：
   *   AI 岗位咨询深色模块
   *   市场需求趋势或辅助指标
6. 第五屏：
   *   职业规划全周期

必须出现的状态：

*   简历尚未输入
*   简历已输入但未解析
*   `demo`
*   `live`
*   `mixed`
*   AI 相关接口 `401 / 404 / 503`

可降级规则：

*   第一轮实现中，企业推荐与职业规划区可以先使用已有静态/演示承载，但模块不能缺席。
*   `/resume`、`/jobs`、`/companies`、`/events` 仍保留，因此 `/career` 第一轮是“统一产品入口”，不是要求一轮就消灭旧页。

完成判定：

*   新增 `/career` 后，用户应能在一个页面中看到“简历优化 + 岗位推荐 + 企业推荐 + AI 咨询 + 职业规划”的完整叙事。

#### D. 面试模拟 `/interview`

页面壳层：

*   使用 `DashboardShell`

桌面端区块顺序：

1. 顶部品牌与身份条
2. 左上：
   *   面试礼仪须知
3. 中上：
   *   AI 智能建议卡
4. 中部主舞台：
   *   数字人面试舞台
5. 右侧：
   *   综合就业知识树
   *   往期面经总结
6. 下部：
   *   AI 复盘总结

必须出现的状态：

*   还未开始模拟
*   模拟进行中
*   模拟结束待复盘
*   历史记录为空
*   历史记录可用

可降级规则：

*   若数字人能力暂未接入，第一轮可先用静态舞台 + 状态占位承载，但整体页面结构不得改。

完成判定：

*   页面第一眼必须像“面试练习舞台”，而不是“表单页 + 说明文档页”。

#### E. AI 对话工作区 `/advisor-chat`

页面壳层：

*   使用 `ConversationShell`

桌面端区块顺序：

1. 左侧：
   *   品牌与模式切换
   *   一级方向标签
   *   历史对话列表
   *   底部状态信息
2. 中部：
   *   当前会话标题
   *   对话流 / 分析流
   *   快捷问题胶囊
   *   底部输入器

必须出现的状态：

*   空会话
*   有历史会话
*   输入中
*   发送中
*   失败提示

可降级规则：

*   若第一轮没有真实持久化会话接口，可用本地状态或演示数据承载布局与交互，但必须显式说明当前为演示会话。

完成判定：

*   页面不能再复用仪表盘壳层。
*   页面必须体现出“长对话工作区”的独立性。

#### F. 学生案例 `/cases`

页面壳层：

*   使用 `DashboardShell`

桌面端区块顺序：

1. 顶部品牌与身份条
2. 主内容：
   *   频道 Hero
   *   筛选区
   *   案例卡片流
3. 右侧：
   *   综合就业知识树
   *   辅助建议卡

必须出现的状态：

*   无筛选结果
*   `demo / live`
*   分页或继续浏览入口

完成判定：

*   页面应更像“故事与路径参考频道”，而不是普通卡片列表页。

#### G. 升学考研 `/postgraduate` 与考公之路 `/civil-service`

页面壳层：

*   使用 `DashboardShell`

桌面端区块顺序：

1. 顶部品牌与身份条
2. 主内容：
   *   频道 Hero
   *   建议卡流
   *   行动项区
3. 右侧：
   *   综合就业知识树
   *   辅助建议卡

必须出现的状态：

*   游客态提示
*   已登录但建议为空
*   已登录且建议可用

完成判定：

*   两个频道页应继承新母版，而不是继续作为孤立建议列表存在。

---

## 7. 当前实现对齐状态 (2026-05-04)

以下内容用于帮助前端继续在新产品语义下推进，而不是重复从零判断“现在做到哪了”。

### ✅ 已具备承接新母版的工程基础

*   已有统一的前端 API wrapper：
    *   `apps/web/src/lib/api/*`
*   已有共享 contract 真相源：
    *   `@job-assistant/contracts`
*   已有全局会话恢复基础：
    *   `GET /api/auth/me`
    *   登录 / 注册 / 退出链路
*   已有按业务域拆分的页面骨架：
    *   首页 `/`
    *   简历相关 `/resume`
    *   岗位相关 `/jobs`
    *   用户画像 `/profile`
    *   日程 `/schedule`
    *   企业 `/companies`
    *   学生案例 `/cases`
    *   活动 `/events`
    *   升学考研 `/postgraduate`
    *   考公之路 `/civil-service`
*   已有统一逻辑结构实践：
    *   `page + hook + sections + types/utils`
*   已有原子组件基础：
    *   `Card`
    *   `Button`
    *   `Badge`
    *   `Input`
    *   `Textarea`
    *   `ProgressBar`

### ⚠️ 新母版视觉与页面壳层已开始落地，但路由与页面内部尚未全面换壳

截至 `2026-05-04` 本轮 Phase 1 完成后，以下基础能力已具备：

*   ✅ 设计令牌已切换为新 Fog White + Blue Violet 调色板（`globals.css` 中 `:root` 已完成替换，旧 `wa-*` 工具类保留兼容）。
*   ✅ `BrandTopBar` 已创建并接入 `DashboardShell`，全站仪表盘页统一展示品牌与身份条。
*   ✅ `DashboardShell` 已创建并通过 `(dashboard)` route group 接入，桌面端三栏（280px / 1fr / 280px）+ 响应式断点已就位。
*   ✅ `ConversationShell` 已创建（组件就绪），但尚未接入任何路由（留给 Phase 4 的 `/advisor-chat`）。
*   ✅ Route group 体系已建立：`(dashboard)` 承载仪表盘页，`(auth)` 承载登录/注册页，根 layout 仅保留 `AuthProvider` + 全局样式。
*   ✅ `KnowledgeTreeCard` 已创建并在 `(dashboard)` 右侧栏使用（默认仅包含当前已有路由的入口）。
*   ✅ `CountdownCard`、`GradientAdviceCard` 已创建并在 `(dashboard)` 默认侧栏使用。
*   ✅ `GuidedTaskCard`、`DarkStagePanel`、`WeeklyScheduleBoard`、`CompanySpotlightCard` 已创建（组件就绪），等待页面级接入。
*   ✅ 旧 `AppSidebar` 已标记为 `@deprecated`，不再承担全站默认壳层角色。

以下新母版能力仍未完成：

*   深色对话舞台仍未接入正式产品页，`ConversationShell` 仍停留在组件基座层。
*   个人中心 `/profile` 已切到 V2 个人中心仪表盘结构，但仍未完全对齐图稿中的 GPA/趋势分析等深层模块。
*   AI 对话工作区尚未以正式产品页实现（组件就绪，路由 `/advisor-chat` 待 Phase 4）。
*   面试模拟页目前只实现了正式占位入口和建设中页面，真实训练能力待后续阶段。
*   就业广场聚合页 `/career` 尚未创建（待 Phase 3）。

### ⚠️ 按新产品模块看，当前实现的映射状态

#### 首页

*   当前 `/` 已接入：
    *   新 `DashboardShell` 三栏壳层（`BrandTopBar` + 左/右辅助栏）
    *   默认左栏 `CountdownCard`、右栏 `KnowledgeTreeCard` + `GradientAdviceCard`
    *   首页推荐、今日内容、游客态 / 登录态 / 错误态显式提示
    *   首页快捷入口、引导式主任务卡、精准推送岗位区
    *   今日日程、近期宣讲会、每日企业推荐、画像摘要、周视图预览
*   仍未完全对齐：
    *   行业热点 / 政策解读当前仍是弱承载或空态表达，尚无独立真实数据源
    *   深色 AI 主舞台尚未进入首页正式结构

#### 就业广场

*   当前能力已分散落在：
    *   `/resume`
    *   `/jobs`
    *   `/companies`
    *   `/events`
*   已完成：
    *   简历解析 / 诊断
    *   岗位列表 / 详情 / 定向分析 / 改写建议
    *   企业列表 / 详情
    *   活动列表页
*   仍未完成：
    *   统一的“就业广场”长页产品承载
    *   简历优化、岗位推荐、企业推荐、AI 岗位咨询、职业规划的整合页面

#### 个人中心

*   当前已具备：
    *   `/profile` 已重组为个人中心仪表盘
    *   阶段主任务、身份摘要、关键日程预览、周视图预览
    *   画像编辑区、建议补全区、简历状态说明
    *   聚合日程页 `/schedule`
*   仍未完成：
    *   图稿里的 GPA / 趋势分析、人格特质等更深层可视模块
    *   与首页、就业广场、面试模拟之间更强的跨页导流和任务闭环

#### 学生案例

*   `/cases` 已有列表浏览与筛选。
*   当前更偏列表页，还没有完全进入图稿所强调的“故事化路径参考”表达。

#### 升学考研 / 考公之路

*   已有独立频道页和后端 advice 接口。
*   当前仍偏基础建议卡承载，尚未继承新母版的完整频道化结构。

#### 面试模拟

*   `/interview` 已创建为正式占位页，并接入：
    *   右侧知识树
    *   首页快捷入口
*   当前仍未形成真实数字人面试、AI 复盘和礼仪训练能力。

#### AI 对话工作区

*   当前仓库中尚未形成图稿中的正式对话工作区。
*   未来应作为第二类壳层单独落地，而不是塞进首页或就业广场的大卡片里了事。

### ⚠️ 后端已具备、但新产品模块中仍未完整前端承接的能力

*   活动 / 宣讲会仍缺：
    *   日历式或时间轴式承载
*   AI 对话型咨询仍缺：
    *   正式的历史会话与长链路对话工作区
*   面试模拟仍缺：
    *   视觉舞台
    *   历史面经
    *   复盘页

### 🎯 后续开发时必须继续遵守的实现原则

*   新功能必须继续复用当前 API wrapper 与 contract，不得绕过：
    *   `apps/web/src/lib/api/*`
    *   `@job-assistant/contracts`
*   新页面逻辑继续优先沿用：
    *   `page + hook + sections + types/utils`
*   对于 demo 模式和 live 模式，必须继续保持显式可见，不要静默混合状态源。
*   对于 AI 页面，必须持续强调“辅助建议”而不是“最终结论”。
*   对于后端已经按分区建模的数据，前端不要自行打平或重排为另一套核心结构。
*   新视觉可以重写，但前后端边界、状态治理和数据真相源不能因为改版而后退。

### 7.1 新增 feature 与旧 feature 的处理规则

为了避免接手同学在实现时犹豫“是新建还是重写旧页”，这里把决策写死：

#### 直接在现有 feature 上继续演进

以下页面优先在原有目录上继续演进，不新建平行旧页：

*   首页：
    *   `apps/web/src/features/home`
*   个人中心主页面：
    *   以 `apps/web/src/features/profile` 为主承载
*   学生案例：
    *   `apps/web/src/features/cases`
*   升学考研：
    *   `apps/web/src/features/channels` 或当前对应频道目录
*   考公之路：
    *   `apps/web/src/features/channels` 或当前对应频道目录

原因：

*   这些页面已经有真实路由与部分真实逻辑。
*   第一轮重构重点是换壳和重组内容，而不是制造平行老新页面。

#### 新建产品聚合 feature

以下页面必须新建，不要硬塞回旧 feature：

*   就业广场：
    *   新建 `apps/web/src/features/career-hub`
*   面试模拟：
    *   新建 `apps/web/src/features/interview-lab`
*   AI 对话工作区：
    *   新建 `apps/web/src/features/advisor-chat`

原因：

*   这些模块在产品上已经不再等同于当前单一业务页。
*   若强行继续写在 `resume` 或 `jobs` 内，会让目录职责再次失真。

#### 保留为独立能力页，不在第一轮删除

以下旧路由第一轮必须保留：

*   `/resume`
*   `/jobs`
*   `/companies`
*   `/events`
*   `/schedule`

原因：

*   这些页面已经承载真实功能。
*   新的聚合页完成之前，不能提前删掉已有业务入口。

### 7.2 实现时禁止自行做的产品决策

接手同学在实现时，不允许再次自行决定以下事项：

*   不允许把双壳层重新压回成单壳层。
*   不允许把首页重新做回“欢迎横幅 + 通用网格卡片”。
*   不允许把 `/career` 省略掉，仅靠 `/resume`、`/jobs` 分散承载新产品表达。
*   不允许把 `/profile` 继续只做成纯表单页。
*   不允许把 AI 对话工作区塞进仪表盘页面的大卡片中替代独立页面。
*   不允许为了省事删除右侧知识树体系。
*   不允许绕开 `apps/web/src/lib/api/*` 直接请求接口。
*   不允许静默混用 demo 与 live 数据源。

### 7.3 页面改版完成的最低验收门槛

如果是多人协作或交接实现，页面只有同时满足下面条件才算“完成”，否则都视为“doing”：

*   已切到新壳层体系。
*   已按本规范的逐页区块清单完成桌面端主结构。
*   已明确处理 `loading / empty / error / demo / live / mixed`。
*   已继续复用 `apps/web/src/lib/api/*` 和 `@job-assistant/contracts`。
*   已遵守 `page + hook + sections + types/utils` 结构。
*   已保留 AI 边界文案，不把建议写成最终结论。
*   已在桌面端和移动端至少做一次基本可用性检查。

### 7.4 这份文档在交接中的使用方式

为了让这份文档真正具备“别人拿去就能实现”的作用，交接时统一按下面方式使用：

1. 先读第 3 节，确定当前页面属于哪种壳层。
2. 再读第 4 节，确定该模块的视觉与信息架构。
3. 再读第 5 节，按阶段、路由和组件清单执行。
4. 再读第 6 节，按统一工程结构组织代码。
5. 最后对照第 7 节，确认当前模块与现有仓库、现有能力的映射与限制。

如果实现过程中某个问题不能从这五步中直接得到答案，才说明文档仍需继续补，而不是允许实现同学自行随意发挥。

---

## 8. 项目经验与协作工作法

这一节不是“理论最佳实践”，而是基于当前项目已经发生过的推进过程，总结出的更适合本仓库、当前团队状态和后续多人维护的工作方法。后续同学接手时，建议把这一节当成默认协作规则。

### 8.1 当前项目最重要的经验判断

#### 经验 1：这个项目最怕的不是功能慢，而是口径散

当前项目已经有：

*   一批真实接口
*   一批已落地页面
*   一套正在切换的新产品母版

在这种状态下，真正容易失控的不是“某个页面晚两天上线”，而是：

*   设计口径一套，代码实现一套
*   前端理解一套，后端接口一套
*   页面命名一套，feature 目录一套
*   demo 行为一套，live 联调时又是一套

所以这个项目后续最重要的管理原则是：

*   先统一认知，再扩功能。
*   先固定页面结构和边界，再补细节。
*   先控制口径，再追求一次性做全。

#### 经验 2：渐进式重构比推倒重来更适合当前仓库

当前仓库并不是空白仓库，已经有 `home / profile / resume / jobs / schedule / channels` 等真实承载目录，也有现成的 wrapper、contract、登录态和错误态治理方式。

因此实践上已经证明：

*   直接在现有 feature 上演进首页、画像页，比新建平行 V2 页面更稳。
*   对于就业广场、面试模拟、AI 对话工作区这类新的产品聚合模块，再新建独立 feature 更清晰。
*   先换壳、再聚合、最后再收口旧路由，比第一轮就统一重命名目录和删旧页更适合多人协作。

#### 经验 3：demo/live 显式可见，是当前阶段的必要工程能力

这不是一个“所有接口都已完全稳定”的收尾项目，而是一个还在持续补齐模块、持续调视觉、持续对齐接口的项目。

所以已经验证可行的做法是：

*   演示数据可以保留。
*   实时数据可以逐步接入。
*   但来源必须让开发者和评审者一眼看出来。

如果把 demo/live 混成一个状态源，短期看起来省事，后期会带来几个问题：

*   很难知道页面到底有没有真的请求成功。
*   很难判断是接口问题、状态问题还是演示兜底掩盖了问题。
*   很容易让产品误以为某个模块“已经全完成”。

#### 经验 4：页面逻辑先定型，后续加功能会省很多维护成本

这也是本轮持续推进后最明确的一条经验：

*   页面一开始如果只是“把卡片堆出来”，短期很快，后期会越来越难接功能。
*   只要先把 `page + hook + sections + types/utils` 的边界定住，后面加模块、换视觉、补状态、多人并行都会顺很多。

对这个项目来说，逻辑结构定型的收益非常直接：

*   首页可以不断加区块，但不至于把 `home-page.tsx` 写成巨型文件。
*   画像页可以从表单页进化成个人中心，而不是重开一个平行页面。
*   就业广场可以复用简历、岗位、企业、活动逻辑，而不是复制一份新逻辑。

### 8.2 当前项目推荐的前后端配合方式

#### 8.2.1 前后端分工边界

在这个项目里，最稳定、最省沟通成本的分工边界已经比较明确：

*   后端负责：
    *   接口定义
    *   contract 真相
    *   分区数据模型
    *   AI 能力是否可用、何时 fallback、错误码语义
*   前端负责：
    *   页面结构
    *   状态表达
    *   多来源内容如何在产品层组织
    *   demo/live/mixed 的用户可见反馈
    *   AI 边界文案

前端不要自己接管后端职责，尤其不要：

*   自己重算推荐分
*   自己改推荐排序
*   自己推断接口真实语义
*   绕开 wrapper 直接发请求
*   在页面里“脑补”尚未存在的接口能力

#### 8.2.2 最低成本的联调顺序

实践上，下面这个顺序最稳：

1. 后端先确认 contract 与接口存在。
2. 前端先接 `apps/web/src/lib/api/*` wrapper，而不是先做复杂 UI。
3. 前端先跑通最小 live 数据展示。
4. 再补完整状态：
   *   `loading`
   *   `empty`
   *   `error`
   *   `demo`
   *   `live`
   *   `mixed`
5. 最后再做视觉收口、动画和细节 polish。

这个顺序的好处是：

*   先确认边界是真的通的。
*   不会出现页面已经画很满，结果接口语义理解错了的返工。
*   设计与联调问题能更早分离出来。

#### 8.2.3 前后端交流时推荐直接说清楚的内容

每次同步一个模块时，建议直接把下面四件事说清楚，而不是笼统地说“这个接口能不能用”：

1. 当前页面消费的是哪个接口或哪几个接口。
2. 当前字段真相以哪个 contract 文件为准。
3. 当前前端还缺的是：
   *   字段
   *   错误语义
   *   空态语义
   *   是否登录才能看
4. 当前页面会把结果表达成什么模块。

推荐直接用这种句式沟通：

*   “`/career` 首屏要消费 `resume + recommendation + events` 三类数据，当前缺的是企业推荐字段，不缺接口路径。”
*   “前端现在不是要新接口，而是要确认 `401 / 503` 在这个模块里的产品语义。”
*   “这个区块允许先用 demo 占位，但需要后端确认未来字段结构不会推翻当前 section 拆分。”

这种表达方式能明显减少“互相以为对方懂了”的情况。

### 8.3 文档协作经验

#### 8.3.1 三份文档不要互相替代

当前已经形成一个比较稳定的协作方式：

*   设计文档负责“页面怎么做、结构怎么定、实施怎么排”。
*   交接文档负责“接口怎么接、环境怎么起、边界怎么守”。
*   Todo 文档负责“现在做到哪、卡在哪、下一步是什么”。

后续不要把三份文档重新混成一份巨型说明书，否则维护成本会迅速升高。

#### 8.3.2 每次更新时各自应该改什么

推荐统一按下面方式维护：

| 触发情况 | 设计文档 | 交接文档 | Todo 文档 |
| --- | --- | --- | --- |
| 页面母版、布局、模块语义发生变化 | 更新 | 按需更新 | 可选更新 |
| 接口字段、错误码、联调方式变化 | 只在影响页面结构时更新 | 更新 | 更新 |
| 某个模块从 `todo` 进入 `doing` 或 `done` | 可不改 | 可不改 | 必改 |
| 新增一个产品聚合页或新路由 | 更新 | 若牵涉新接口则更新 | 更新 |
| 只是视觉细节优化 | 必要时更新 | 不改 | 可不改 |

#### 8.3.3 文档写法上最有用的经验

对这个项目来说，最有效的文档不是“概念上很对”的文档，而是别人拿到能直接行动的文档。所以后续写文档时，优先写这些内容：

*   具体改哪些路由。
*   具体动哪些目录。
*   哪些旧页保留。
*   哪些模块先用 demo。
*   哪些状态必须显式展示。
*   哪些产品决策已经写死，不需要实现同学再判断。

少写这类无执行力表述：

*   “整体优化体验”
*   “适当增强视觉”
*   “后续可考虑”
*   “视情况调整”

如果必须保留弹性，也要明确是谁来决策，而不是把决策压力重新甩给接手同学。

### 8.4 需求变更时的工作方法

当前项目后续还会持续加功能，所以需要默认接受“方案会继续演进”这件事。但演进不代表每次都重来，建议按下面方式处理：

#### 8.4.1 先判断是四类变化中的哪一种

1. 视觉变化
   *   例如：首页版式、卡片风格、壳层布局变化
2. 产品模块变化
   *   例如：新增就业广场、面试模拟、AI 对话工作区
3. 接口边界变化
   *   例如：新增字段、错误码调整、某接口登录要求变化
4. 实现进度变化
   *   例如：模块从 `todo` 进入 `doing`，或者被依赖阻塞

先判断类型，再决定改哪份文档，沟通成本会低很多。

#### 8.4.2 变更优先处理原则

这个项目后续若继续迭代，优先级建议始终保持：

1. 先守住边界正确。
2. 再守住页面结构稳定。
3. 然后再追求视觉一致。
4. 最后才是锦上添花的交互动效和小装饰。

换句话说：

*   接口没定，先别把页面写死。
*   页面结构没定，先别到处复制 section。
*   共享壳层没定，先别在每个页面里各写一套布局。

### 8.5 多人维护时的代码协作经验

#### 8.5.1 最适合当前仓库的拆分方式

当前仓库最适合按“壳层 / 页面 / 新模块”拆分，而不是按“我来改一点首页再顺手改一点岗位页”拆分。

推荐拆分：

*   一个人负责共享壳层与全局 token。
*   一个人负责首页。
*   一个人负责个人中心。
*   一个人负责就业广场聚合页。
*   一个人负责面试模拟或 AI 对话工作区。
*   频道页统一由一人或一小组收口。

这样拆的原因不是形式好看，而是：

*   写入目录更清楚。
*   merge 冲突更少。
*   每个人的责任边界更明确。

#### 8.5.2 当前项目最容易出现冲突的地方

多人并行时，下面几类文件最容易冲突，应尽量少人同时改：

*   `apps/web/src/app/layout.tsx`
*   `apps/web/src/app/globals.css`
*   `apps/web/src/components/layout/*`
*   共享 UI 原子组件
*   任一页面的顶层 `*-page.tsx`

而这些地方更适合并行：

*   `features/<domain>/sections/*`
*   新建的独立 feature
*   目录型列表页的独立 section
*   与当前模块强相关的 `types.ts / utils.ts`

#### 8.5.3 当前项目对维护最友好的代码风格

基于这段时间的推进经验，后续更推荐的写法是：

*   页面文件只做编排。
*   hook 文件集中做同步、转换、view model 输出。
*   section 只吃 props，不单独创造业务真相源。
*   文案边界在 section 层显式写清楚，尤其是 AI 辅助建议相关模块。
*   目录名先求职责稳定，再求名字绝对新潮统一。

### 8.6 最后给后续接手同学的建议

如果后续是新同学继续推进，不要把这个项目看成“要么全重写，要么只能小修小补”的二选一。

更合适的理解是：

*   这已经是一套有真实能力、但产品母版还在升级中的系统。
*   你的任务不是发明第二套系统，而是把当前真实能力稳定迁移进新的产品表达。
*   只要持续守住：
   *   `apps/web/src/lib/api/*`
   *   `@job-assistant/contracts`
   *   `page + hook + sections + types/utils`
   *   `demo / live / mixed` 显式可见
   *   AI 是辅助建议而不是最终事实

那么后续无论继续加功能、补细节、换视觉还是多人协作，维护成本都会明显低很多。
