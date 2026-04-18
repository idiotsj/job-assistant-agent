# Work Agent - 详细前端设计方案 (Developer Handoff Spec)

本文档是为前端开发者准备的**像素级**工作辅助智能体（Work Agent）设计实施规范。设计基调为**明亮、专业、通透的蓝白系风格**，旨在传达科技感、可信度与现代 SaaS 产品的高级感。

---

## 1. 核心设计理念 (Design Philosophy)

*   **Crisp & Trustworthy (清爽且值得信赖)**：以海蓝色和纯白色为主调，抛弃沉闷拥挤的页面，营造“智能高效助理”的感知。
*   **Subtle Elevation (细腻的层级跃升)**：不在平面上使用死板的边框，而是利用微弱的弥散阴影 (Soft Drop Shadow) 和纯白卡片在极浅灰色底板上的反差，来区分空间层级。
*   **Clarity over Decoration (清晰胜于装饰)**：数据和文本是主角。AI 分析结果（如匹配度）使用直观的色彩和进度条，无需过多的无关插画。
*   **Smooth Micro-interactions (平滑微动画)**：使用 `framer-motion` 在路由切换、卡片 hover、分数加载、抽屉滑出时增加 `<0.3s` 的缓动动画。

---

## 2. 核心设计令牌 (Design Tokens - CSS Variables)

开发时请在 `global.css` 中严格定义并使用以下 CSS 变量。这里使用基于 HSL 的规范以方便设置透明度。

### 🎨 蓝白明亮调色板 (Blue & White Palette)

| CSS 变量名 | HSL 参考值 | 视觉效用 | 具体使用场景 |
| :--- | :--- | :--- | :--- |
| `--bg-body` | `210 20% 98%` | 浅冷灰/极浅蓝灰 | 网页的最底层 `<body>` 背景色，确保纯白卡片能悬浮出来。 |
| `--bg-surface` | `0 0% 100%` | 纯净白 | 所有模块卡片、侧边栏、下拉菜单的背景色。 |
| `--text-primary` | `214 30% 16%` | 深邃海港蓝 | 极其接近黑色的深蓝，用于所有正文内容和主要大标题。（比纯黑更有呼吸感） |
| `--text-muted` | `214 15% 45%` | 中灰蓝调 | 次要文本、时间戳、表单提示占位符。 |
| `--primary` | `212 100% 48%` | 晴空蓝 (Sky Azure) | **应用主色**：主按钮背景色、选中的菜单项图标色、活跃的链接。 |
| `--primary-hover` | `212 100% 40%` | 加深晴空蓝 | 主按钮 Hover 状态。 |
| `--primary-soft` | `212 100% 95%` | 极浅蔚蓝 | 主按钮选中时的背景底色（如侧边栏活跃项）。 |
| `--accent-success` | `150 70% 40%` | 森林绿 | AI 简历诊断“优势”、匹配度 > 80% 的高亮色。 |
| `--accent-success-bg` |`150 70% 95%`| 浅薄荷绿 | “优势”徽章的背景色。 |
| `--accent-warning` | `35 90% 50%` | 亮琥珀 | AI 诊断“待改进”、匹配度普通的提示色。 |
| `--accent-warning-bg` |`35 90% 95%`| 浅橙底色 | “待改进”徽章的背景色。 |
| `--border-light` | `214 15% 90%` | 极淡的灰线 | 卡片之间的分割线、浅色边框。 |
| `--shadow-card` | *见下文代码* | 弥散阴影 | 悬浮卡片的标准阴影。 |

**阴影规范 (Box Shadows)**:
```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05); /* 面板内部小块 */
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.04); /* 基础卡片默认状态 */
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.08); /* 抽屉、弹窗、Hover拉起状态 */
}
```

### ✒️ 排版规范 (Typography)

*   **字库设定**: 优先加载 `Inter` 或苹果系统的 `-apple-system, BlinkMacSystemFont, "SF Pro Text"`。
*   **层级**:
    *   **H1 (主页标题)**: 1.75rem (28px), `font-weight: 700`, `letter-spacing: -0.02em`
    *   **H2 (卡片标题)**: 1.25rem (20px), `font-weight: 600`
    *   **Body (正文)**: 0.9375rem (15px), `font-weight: 400`, `line-height: 1.6`
    *   **Small (辅助信息)**: 0.8125rem (13px), `color: var(--text-muted)`

---

## 3. 全局布局骨架 (Layout Architecture)

应用采用 **定宽左侧栏 + 响应式主内容区** 布局。

### 📌 左侧导航栏 (Sidebar - 固定 240px 宽)
*   **背景**: `--bg-surface` (纯白)，右侧带一条细腻的 `--border-light` 竖线。
*   **顶部 Logo 区**: "Work Agent" 文本加一个蔚蓝色的 AI 星星图标。
*   **导航菜单 (Menu Items)**:
    *   普通状态：文本和图标为 `--text-muted`，Hover 时背景变为极浅灰色，文本变深。
    *   **活跃状态 (Active)**：文本和图标变为 `--primary` 蓝色，背景层变为 `--primary-soft`，且左边框有一条 3px 宽的蓝色指示线（高度占满该 item 高度的 60%，圆角）。
*   **底部账户区**: 用户的小头像（默认显示姓名首字母的带背景色圆圈）、姓名、身份标识（如：大三学生）。

### 📌 主工作区 (Main Content Area)
*   **背景**: `--bg-body` (极浅灰蓝版底色，用于托起白色卡片)。
*   **内边距 (Padding)**: 统一四周留白 `32px`。对于内部卡片的间距统一定义为 `var(--gap-4)` 即 16px 或 24px。

---

## 4. 重点业务模块详细开发文档 (Module Details)

交给不同前端开发者时，请他们严格按照以下规范还原：

### 模块 A：首页控制中心 (Dashboard / Home)
*   **欢迎横幅 (Welcome Banner)**:
    *   不需要粗糙的巨大背景图。
    *   纯白底色大卡片，圆角 16px，`--shadow-md`。
    *   **结构**: 左侧文字“早安，[姓名]。工作智能体已为您准备好今日洞察”；右侧是动态生长的每日格言或核心进度数据。
*   **三大推荐流 (Jobs, Cases, Events - 核心网格视图)**:
    *   布局：CSS Grid, `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`。
    *   **工作推荐卡片 (Job Card) 结构**:
        *   **顶栏**: 公司 Logo(或蓝底白字占位符) + 公司名称 + 右上角“AI 契合度：88%”（文本用 `--primary` 蓝色）。
        *   **主标题**: 岗位名称 (`font-weight: 600`)。
        *   **标签组 (Tags)**: 薪资、城市、不限专业等 tag (高度 24px，圆角 12px，背景色 `var(--bg-body)`，字号 12px)。
        *   **卡片底座**: 推荐理由（采用一行带省略号的小字）。
        *   **交互**: 鼠标 Hover 时，卡片 `transform: translateY(-2px)`，使用 `--shadow-lg` 阴影。

### 模块 B：简历 AI 体检舱 (Resume AI Diagnosis)
*   **页面两分栏布局 (Split Grid Layout)**
*   **左区 (原文区，占宽 45%)**:
    *   **UI 边界**: 这是一个巨大的纯白容器，带 1px `--border-light`。
    *   **输入态**: 一片带有淡蓝色虚线的“上传或粘贴区域”。中心有一个蓝色上传图标。
    *   **当前前端约束**: 支持粘贴文本，也支持导入 `txt / md` 文本文件；若是 Word / PDF，前端应先提示用户转成纯文本再导入，而不是假装已经支持二进制简历上传。
    *   **解析后状态**: 原文用等宽字体 (Monospace) 展示在此，左侧有细小的行号，类似代码阅读器，给人严谨感。
*   **右区 (AI 洞察面板，占宽 55%)**:
    *   **头部得分区**: 中心是一个大的**半环形表盘组件 (Gauge Chart)**。数字从 0 动画递增到如 85。高分时表盘颜色为 `--primary` 蓝色。数字下方有小字“超过同届 78% 的候选人”。
    *   **优劣势徽章组 (Strengths & Risks)**:
        *   分成两等宽列。左列标题“🔥 AI 捕捉到的优势”，右列“⚠️ 风险与不足”。
        *   每一条都是一个小巧的圆角块。优势用 `--accent-success-bg` 底色 + 绿色勾图标；弱势用 `--accent-warning-bg` + 橙色感叹号图标。
    *   **优化清单 (Actionable Checklist)**:
        *   下方呈现具体的 Task 清单。圆圈打勾样式，复原真实的待办列表 UI。

### 模块 C：岗位与简历双向对齐面板 (Job vs Resume Analysis)
这是岗位详情页里的高频高价值模块。

*   **交互载体 - 流畅滑出抽屉 (Slide-out Sheet/Drawer)**:
    *   触发：点击“一键评估投递成功率”按钮。
    *   效果：屏幕剩余部分呈现黑色 `rgba(0,0,0,0.3)` 遮罩（backdrop-blur 毛玻璃仅对背景生效），抽屉从屏幕右侧滑出，占比约宽 450px。纯白底色。
*   **内容结构**:
    *   **置顶 Header**: 岗位名 + 简历匹配度总览，关闭 `X` 按钮位于右上方。
    *   **能力雷达墙 (Skill Alignment Area)**:
        *   建议使用横向柱状条 (Horizontal Progress bars) 逐一展现能力对比。
        *   例如：岗位要求“React”。条形图填满，后跟文字“简历深度涉及”。
    *   **亮点功能区 - AI 原文改写 (Text Diff View)**:
        *   为了指导求职者改简历，采用类似 GitHub 代码变更 (Diff) 的界面设计。
        *   原句：删除线 + 极淡的红色背景。
        *   **AI 建议改写句**：高亮亮蓝色文本，旁边带有“✨一键采纳”的精美小按钮。

### 模块 D：通用表单与按钮 (Forms & Buttons)
为了保证极高的一致性，系统内所有原子组件规范如下：

*   **基础输入框 (Input / Textarea)**:
    *   背景色：`#ffffff` (纯白)。
    *   边框：`1px solid var(--border-light)`。
    *   圆角：`8px`。
    *   **Focus 态 (核心视觉重点)**: `border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0, 119, 255, 0.15);` (浅蓝色的发光外圈)，取消浏览器的默认轮廓 (outline: none)。
*   **主要行动按钮 (Primary CTA)**:
    *   颜色：`--primary` 海蓝底色，纯白文字。
    *   圆角：`8px`。高度 `40px` (常规) 或 `48px` (大号，如登录/提交解析)。
    *   悬浮 (Hover)：平滑过渡为 `--primary-hover`，不偏移，但略微增加阴影。
*   **次要按钮 (Secondary Button)**:
    *   样式：白底，`--border-light` 浅灰边框，文本颜色为 `--text-primary` 半深蓝。

---

## 5. 开发者移交清单 (Developer Checklist)

前端研发拿到此方案后，请依照以下顺序开工：

1.  **初始化基础设施**:
    *   清空默认的 Next.js 样式。
    *   将上述 "Design Tokens" 转化为 `globals.css` 中 `:root` 下的变量。
    *   配置字体（推荐 `next/font/google` 引入 `Inter`）。
2.  **原子封装**:
    *   必须将 `Button`, `Input`, `Card`, `Badge` 封装为可复用的组件 (React Components)，统一接收 `className` 来处理细微特例。
    *   例如：`<Card className="col-span-2">...</Card>`
3.  **骨架搭建**:
    *   在 `app/layout.tsx` 中编写左侧 `Sidebar` 和右侧 `main` 内容区的 Flex 布局。
4.  **接口联调先行**:
    *   调用 `apps/web/src/lib/api/client.ts` 已经封装好的 `apiGet`、`apiPost`。
    *   使用真实数据填充卡片，针对每种数据情况（无数据、数据加载中、数据过长）调试 UI 宽容度。

---

## 6. 页面设计与逻辑结构统一规范 (Page Logic Architecture)

从现在开始，这份文档不只规定页面长什么样，也规定前端页面应该怎么组织。后续功能继续增加时，必须优先遵守这套结构，避免页面文件无限膨胀、多人同时改同一块逻辑。

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

- `<domain>-page.tsx`：
  - 只负责页面编排、区块顺序、少量路由级判断。
  - 不要在这里堆大段接口同步、状态机和衍生文案。
- `hooks/use-<domain>-page-data.ts`：
  - 负责调用 `apps/web/src/lib/api/*`
  - 负责 demo/live 切换
  - 负责同步逻辑、副作用、状态聚合、view model 计算
- `sections/*.tsx`：
  - 只接收 props，负责页面分区 UI。
  - 不直接请求接口，不自己持有新的业务真相源。
- `types.ts`：
  - 放 feature 内部状态枚举、view model 类型、局部契约。
- `utils.ts`：
  - 放纯函数，例如日期格式化、状态汇总、展示文案转换。

### 6.2 页面分层职责

- 页面层只做“拼装”，不要把页面写成一个巨型业务容器。
- 数据层统一收口在 feature hook，不要在多个 section 里各自请求一次接口。
- 展示层优先做纯组件，让它可以被 demo 数据、live 数据、测试数据重复复用。
- 所有接口访问必须继续走 `apps/web/src/lib/api/*` wrapper，不能在页面或 section 中直接 `fetch`。
- 后端已经按分区建模的数据，前端应保留分区语义，不要为了“看起来统一”而重新打平成另一套核心结构。

### 6.3 统一状态模型

新页面默认按下面这组状态思路组织，命名可以因场景微调，但语义必须一致：

- `loading`：会话恢复中，或页面关键数据正在首次同步。
- `ready-demo`：当前可展示，但仍是演示数据。
- `ready-live`：页面核心模块都已切到真实数据。
- `partial-live`：部分模块已实时同步，剩余模块仍保留 demo 兜底。
- `unauthenticated`：需要登录才能拿到真实内容，但仍允许保留演示预览。
- `error`：实时同步失败，必须显式提示，并明确说明当前展示的是 demo 或兜底内容。

特别注意：

- `error` 不等于“静默回退 demo”。
- `partial-live` 是正式状态，不要把它当成异常。
- 对用户可见的状态文案和 badge 必须和真实数据来源一致。

### 6.4 Demo / Live 约束

- 页面级必须能明确告诉用户当前是 `demo`、`live` 还是 `mixed`。
- 模块级也要尽量保留来源标识，尤其是首页、简历、日程这类多来源页面。
- 可以保留 demo 兜底用于视觉演示和联调，但不能让开发者或用户分不清“到底有没有真的请求成功”。
- 发生失败时允许保留旧数据或 demo 数据，但必须给出显式错误提示。

### 6.5 首页作为首个标准模板

首页现在已经按这套结构落地，可作为后续页面的直接参照：

```text
apps/web/src/features/home/
├─ home-page.tsx
├─ hooks/use-home-dashboard-data.ts
├─ sections/
│  ├─ home-page-intro.tsx
│  ├─ home-auth-prompt.tsx
│  ├─ home-status-strip.tsx
│  ├─ home-hero-section.tsx
│  ├─ home-metrics-section.tsx
│  ├─ home-recommendations-section.tsx
│  └─ home-overview-section.tsx
├─ types.ts
└─ utils.ts
```

首页模板的核心约束：

- `home-page.tsx` 只负责 section 编排。
- `use-home-dashboard-data.ts` 统一处理首页四个模块的同步、会话状态、demo/live/mixed 计算和衍生动作建议。
- 首页各 section 不直接访问 API，只消费 hook 传入的 props。
- 后续像 `resume`、`jobs`、`profile`、`schedule` 这类页面，优先按同样的“page + hook + sections + types/utils”结构扩展。

### 6.6 简历页作为第二个标准模板

简历页现在也应按这套结构推进，而不是继续维持单文件大页：

```text
apps/web/src/features/resume/
├─ resume-diagnosis-page.tsx
├─ hooks/use-resume-workbench.ts
├─ sections/
│  ├─ resume-page-intro.tsx
│  ├─ resume-status-strip.tsx
│  ├─ resume-input-section.tsx
│  ├─ resume-parse-section.tsx
│  ├─ resume-diagnosis-section.tsx
│  └─ resume-action-plan-section.tsx
├─ types.ts
└─ utils.ts
```

简历页模板的核心约束：

- 原文输入、文本文件导入、解析、体检都由 `use-resume-workbench.ts` 统一调度。
- 页面必须显式处理“当前结果是否对应当前原文”，原文变化后要提示结果已过期。
- `resume/parse` 的自动补全结果要继续和画像页联动，不能只停留在本页展示。
- 文本文件导入只是“帮助用户把原文放进输入区”，不是绕过后端 contract 的另一条上传接口。

### 6.7 岗位分析抽屉作为第三个标准模板

岗位详情页里的分析抽屉也必须遵守同一套结构，而不是继续在一个文件里同时堆动画、接口、状态机和 diff 交互：

```text
apps/web/src/features/jobs/
├─ job-analysis-drawer.tsx
├─ drawer/
│  ├─ hooks/
│  │  └─ use-job-analysis-drawer.ts
│  ├─ sections/
│  │  ├─ job-analysis-drawer-header.tsx
│  │  ├─ job-analysis-drawer-status.tsx
│  │  ├─ job-analysis-input-section.tsx
│  │  ├─ job-analysis-overview-section.tsx
│  │  ├─ job-analysis-rewrite-section.tsx
│  │  └─ job-analysis-action-section.tsx
│  ├─ types.ts
│  └─ utils.ts
```

岗位分析抽屉模板的核心约束：

- `job-analysis-drawer.tsx` 只负责抽屉容器、动画、遮罩和各 section 编排。
- `use-job-analysis-drawer.ts` 统一管理：
  - 原文输入
  - `analysis` / `rewrite` 两个模块各自的 `demo` / `live`
  - `partial-live` / `mixed`
  - 原文变更后的结果过期提示
  - “一键采纳”后的预览、复制、清空、移除
- 岗位分析和改写建议允许分模块成功或失败，前端必须显式告诉用户当前是：
  - `demo`
  - `live`
  - `mixed`
  - `stale-live`
- `rewrite-suggestions` 返回的 `headlineSuggestion`、`summarySuggestion`、`keywordSuggestions`、`sectionSuggestions`、`actionChecklist` 都要被结构化承接，不能只展示 diff 列表的一部分。
- “一键采纳”只代表：
  - 把某条建议加入当前抽屉内的采纳预览
  - 允许用户复制带走
  - 方便手动粘贴回自己的简历编辑器
- “一键采纳”不代表：
  - 已自动保存回画像
  - 已自动替换远端简历正文
  - 已生成最终可投递简历
- 这类 AI 文案交互必须持续强调“辅助改写建议”，而不是“系统已经替你改完”。

---

## 7. 当前实现对齐状态 (2026-04-18)

以下内容用于帮助前端继续在统一视觉语言下推进，而不是重复从零判断“现在做到哪了”。

### ✅ 已经基本对齐的部分

- 已落地蓝白系整体视觉骨架：
  - 左侧固定导航
  - 右侧主工作区
  - 统一 design tokens
  - `Card` / `Button` / `Badge` / `Input` / `Textarea` / `ProgressBar` 原子组件
- 已落地三个核心体验页骨架：
  - 首页控制中心 `/`
  - 简历 AI 体检舱 `/resume`
  - 岗位主链路 `/jobs`
- 已补齐登录态与个性化基础页面：
  - 登录页 `/login`
  - 注册页 `/register`
  - 用户画像页 `/profile`
  - 基于 `GET /api/auth/me` 的全局会话恢复
  - 侧边栏退出登录入口
- 已补齐时间线与独立频道页面：
  - 日程时间线 `/schedule`
  - 考研频道 `/postgraduate`
  - 考公频道 `/civil-service`
- 已补齐扩展内容页：
  - 企业列表 `/companies`
  - 企业详情 `/companies/[id]`
  - 学生案例 `/cases`
  - 活动 / 宣讲会 `/events`
- 已补齐更正式的岗位链路：
  - 岗位列表页 `/jobs`
  - 岗位详情页 `/jobs/[id]`
  - 城市 / 行业 / 关键词 / `featuredOnly` 筛选
  - 正式分页、筛选空态和详情 `404` 空态
  - 详情页分析抽屉登录门禁与明确错误提示
  - 岗位分析抽屉已按 `hook + sections + types/utils` 重构
  - 岗位分析 / 改写建议已支持模块级 `demo / live / mixed` 显式状态
  - 原文变更后的 live 结果过期提示
  - “一键采纳”已落成抽屉内的采纳预览 / 复制交互，并明确不自动保存
  - 已补展示标题建议、摘要建议、关键词建议、diff 建议和合并行动清单
- 已补齐更完整的简历工作台：
  - `resume/parse` 与 `resume/diagnose` 在同页串联
  - “先解析，再体检”的正式操作顺序
  - 自动补全画像字段说明区
  - `401` / `503` 的可区分状态提示
  - 原文更新后的结果过期提示
  - `txt / md` 文本文件导入到原文区
  - 解析后前往画像页核对补全结果的正式 CTA
- 已补齐更完整的首页状态治理：
  - `GET /api/daily-content/today` 已接入首页“今日内容块”
  - 首页的游客态、登录失效态、加载同步态和部分同步成功态都已显式提示
  - 首页已嵌入小型时间线预览
  - 首页内已补岗位、案例、活动、企业、画像、日程的跨页跳转入口
- 首页已开始按统一逻辑结构重构：
  - `home-page.tsx` 只保留页面编排
  - `use-home-dashboard-data.ts` 统一处理首页同步和状态
  - 首页各分区拆到 `sections/*`
- 已把 demo 数据和真实接口调用做了显式分层：
  - 默认展示 demo 内容用于视觉演示
  - 需要时手动切换到实时接口联调
- 已实现的视觉重点基本符合本文档：
  - 首页欢迎横幅
  - 推荐卡片网格
  - 简历诊断半环形表盘
  - 岗位分析抽屉
  - diff 风格改写建议区
  - 画像标签编辑区
  - 聚合日程时间线
  - 独立频道建议卡片
  - 企业浏览与详情页
  - 案例路径卡片流
  - 活动时间卡片流

### ⚠️ 后端已具备、但前端仍未实现的功能

以下能力以后端和 contract 为准，当前 `apps/web` 里尚未形成正式页面或完整流程：

- 活动能力：
  - 日历式或时间轴式活动展示

### ⚠️ 已有页面，但仍未和后端完全对齐的部分

#### 首页 `/`

- 已完成：
  - `GET /api/daily-content/today` 接入
  - 首页游客态、登录失效态、加载同步态、部分同步成功态的明确提示
  - “今日精选岗位”内容块
  - 首页内的跨页跳转入口设计
  - 小型时间线组件嵌回首页
- 当前仍保留 demo 兜底，以便在接口未成功时继续做视觉演示和局部联调。
- 若后续需要更进一步，还可以继续细化“首次登录后的首页引导策略”和更细颗粒度的 skeleton loading。

#### 简历页 `/resume`

- 已完成：
  - `resume/parse` 与 `resume/diagnose` 的同页正式串联
  - 自动补全画像字段说明区
  - `401` / `503` 的可区分提示
  - demo / live 显式状态
  - `txt / md` 文本文件导入，并明确说明当前仍是“导入文本后再调用接口”的流程
  - 原文修改后的结果过期提示
  - 解析结果和画像页之间的正式跳转联动
- 当前仍不是完整的二进制文件上传链路，Word / PDF 仍需先转成纯文本。
- 后续如果补真正的上传能力，也必须继续保持“原文输入态”和“结果是否对应当前文本”的显式状态提示。

#### 岗位页 `/jobs`

- 已完成：
  - 岗位列表页 `/jobs`
  - 岗位详情页 `/jobs/[id]`
  - 城市 / 行业 / 关键词 / `featuredOnly` 筛选
  - 分页、筛选空态和岗位详情 `404` 空态
  - “未登录不可分析”的正式门禁与提示
  - 岗位分析抽屉已按统一结构拆分
  - 分析结果和改写建议已支持模块级 `demo / live / mixed`
  - 原文修改后的结果过期提示
  - “一键采纳”已变成当前抽屉内的采纳预览与复制行为
- 当前岗位不存在时采用的是详情页内联空态，而不是单独的全局 not-found 页面。
- 岗位详情页本体仍然相对偏大，后续可继续按同样的 `page + hook + sections + types/utils` 思路拆开。

#### 画像页 `/profile`

- 已完成基础编辑、保存、多标签交互和登录门禁。
- 还没有把“首次使用引导”做成完整 onboarding 流程。
- 还没有把 `resume/parse` 的自动补全结果和画像页做正式串联。

#### 日程页 `/schedule`

- 已完成：
  - 聚合时间线展示
  - `user / job / event / exam` 来源区分
  - 自定义日程的新增、编辑、删除
  - demo / live 显式切换
- 已把日程能力嵌回首页做“小型时间线组件”。
- 还没有补“未登录时自动引导先去画像页补关键偏好”的更强联动逻辑。

#### 企业页 `/companies` 与 `/companies/[id]`

- 已完成：
  - 企业列表分页浏览
  - 企业详情页
  - 城市 / 行业 / 关键词 / 精选态的前端筛选骨架
  - 企业详情 `404` 的正式空态承载
- 当前仍偏“企业档案浏览”，还没有把企业与岗位、活动建立更强的内容联动区。
- 详情页当前只消费 contract 里已有的简介字段，若后端后续扩字段，可继续在当前分区布局上渐进扩展。

#### 案例页 `/cases`

- 已完成分页浏览和基于 `careerPath / major` 的正式筛选入口。
- 已明确把首页推荐里的附加字段和纯案例列表数据模型分开处理。
- 目前还没有单独案例详情页，当前优先保证列表浏览与筛选对齐。

#### 活动页 `/events`

- 已完成活动列表页、城市筛选和 `upcomingOnly` 语义对齐。
- 当前以“时间卡片流”优先，还没有扩展成完整日历视图或时间轴视图。
- 还没有把活动页和首页、日程页做更深的联动跳转设计。

#### 考研频道 `/postgraduate` 与考公频道 `/civil-service`

- 已完成独立频道页和对应 advice 接口的基础承载。
- 当前仍以“建议卡片流”优先，没有继续扩展成更完整的频道导航结构。
- 还没有根据用户在画像页中是否开启对应意向，做更主动的入口收缩与推荐控制。

### 🎯 后续开发时必须继续遵守的实现原则

- 新功能必须继续复用当前设计令牌和原子组件，不要另起一套视觉体系。
- 新页面优先沿用：
  - `page-stack`
  - `page-header`
  - `wa-card`
  - `wa-button`
  - badge / tag / panel / drawer 这一套交互语言
- 新页面逻辑优先沿用：
  - `page + hook + sections + types/utils`
  - 页面只编排，hook 管状态，section 管展示
- 对于 demo 模式和 live 模式，必须继续保持显式可见，不要静默混合状态源。
- 所有新增业务页都要优先消费 `apps/web/src/lib/api/*`，不能绕过 wrapper 直接请求接口。
- 对于 AI 相关页面，必须持续强调“辅助建议”而不是“绝对结论”。
- 对于后端已经按分区建模的数据，前端不要自行打平或重排为另一套核心结构。
