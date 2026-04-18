# `apps/web` 前后端交接文档

本文档面向继续在当前 monorepo 的 `apps/web` 内开发的前端接手同学。目标是让你在尽量少翻源码的前提下，完成本地启动、接口联调、页面实现和问题排查。

## 1. 项目现状快照

### 1.1 当前仓库结构

```text
apps/
├─ web/          # Next.js 用户端前端
├─ api/          # Fastify + TypeScript 独立业务后端
├─ ai-service/   # FastAPI + Python 内部 AI 能力层
└─ admin/        # 预留目录，暂未实现

packages/
├─ contracts/    # 前后端共享 HTTP 契约和 zod schema
├─ database/     # PostgreSQL schema / seed / migrations
└─ config/       # 预留共享配置目录
```

### 1.2 当前前端状态

- `apps/web` 当前已经落了一版可运行的 V1 页面骨架，至少包含：
  - 首页控制中心：`/`
  - 简历 AI 体检舱：`/resume`
  - 岗位与简历双向对齐：`/jobs`
- 当前前端代码已具备四类可复用资产：
  - `apps/web/src/features/*` 中按业务域组织的页面骨架
  - `apps/web/src/components/*` 中的布局和基础 UI 组件
  - `apps/web/next.config.ts` 中的 `/api/*` 代理
  - `apps/web/src/lib/api/*` 中已经封装好的 API 调用层
- `packages/contracts/src/*` 中的共享 schema / 类型仍然是前后端联调真相源。
- 当前页面仍然带有演示数据兜底和视觉演示性质，不应误解为全部业务流程都已最终定型。

### 1.3 当前后端状态

- 公共业务接口由 `apps/api` 暴露，前端只应访问它。
- `apps/api` 内部会按需转调 `apps/ai-service`，前端不得直连 Python AI Service。
- 首页推荐、画像、岗位、案例、宣讲会、日程、考研建议、考公建议、简历解析/诊断/岗位定向分析/岗位定向改写建议都已有后端实现。

### 1.4 当前验证状态

以下结果已于 `2026-04-17` 本地验证通过：

- `pnpm typecheck`
- `pnpm --filter api test` 通过，`51/51`
- `pnpm --filter web test` 通过，`2/2`
- `python -m pytest apps/ai-service/tests` 通过，`25/25`

## 2. 你接手前端时必须先记住的规则

### 2.1 系统边界

```mermaid
flowchart LR
  A["Browser / apps/web 页面"] --> B["Next.js apps/web"]
  B --> C["/api/* rewrites"]
  C --> D["apps/api (Fastify)"]
  D --> E["apps/ai-service (FastAPI, internal only)"]
  D --> F["PostgreSQL"]
  E --> F
```

- 前端页面和组件只访问 `apps/api` 暴露的公共业务 API。
- `apps/ai-service` 是内部服务，只供 `apps/api` 调用。
- 前端禁止直接写 `fetch("/api/...")`，统一通过 `apps/web/src/lib/api/*` 调用。
- 前后端共享契约统一来自 `@job-assistant/contracts`。

### 2.2 前端调用约定

`apps/web/src/lib/api/client.ts` 已经帮你处理了这些底层细节：

- 自动走 `/api/*` 路径
- 自动带上 `credentials: "include"`，用于 Cookie Session
- 自动补 `Accept: application/json`
- 有请求体时自动补 `Content-Type: application/json`
- 默认 `cache: "no-store"`
- 统一把错误转成 `ApiError`
- 自动构造 query string，并忽略 `undefined`、`null`、空字符串

接手时不要绕过这一层，否则 Cookie、错误处理、query 编码和 schema 校验会不一致。

### 2.3 共享类型约定

- 请求体、查询参数、响应结构以 `packages/contracts/src/*.ts` 为准。
- 如果文档描述和 contract 有冲突，以 contract 为最终真相。
- 推荐页面开发流程：
  1. 在 `packages/contracts` 找到对应 schema / type
  2. 在 `apps/web/src/lib/api/*` 找到对应 wrapper
  3. 在页面或 feature 中消费 wrapper 返回的 `data`

## 3. 本地启动与依赖关系

### 3.1 启动顺序

建议严格按下面顺序启动：

1. 安装 Node 依赖
2. 准备 PostgreSQL 数据库
3. 启动 `apps/ai-service`
4. 配置并启动 `apps/api`
5. 启动 `apps/web`

如果你只开发纯列表页，理论上可以不启动 AI Service；但只要涉及简历解析、简历诊断、岗位定向分析，或者想验证完整首页建议，就应把 AI Service 一起启动。

### 3.2 安装依赖

在仓库根目录执行：

```powershell
cd "D:\code\work agent"
pnpm install
```

### 3.3 准备 PostgreSQL

数据库脚本位于：

- `packages/database/schema.sql`
- `packages/database/seed.sql`

示例导入：

```powershell
psql -U postgres -d job_assistant -f "D:\code\work agent\packages\database\schema.sql"
psql -U postgres -d job_assistant -f "D:\code\work agent\packages\database\seed.sql"
```

如果是已有环境，先应用 `packages/database/migrations/` 下的 SQL，再决定是否重新 seed。

### 3.4 启动 AI Service

```powershell
cd "D:\code\work agent\apps\ai-service"
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

AI Service 的主要职责：

- 简历结构化解析
- 通用简历诊断
- 岗位定向简历分析
- 岗位定向改写建议
- 首页岗位推荐增强
- 每日建议生成

### 3.5 配置 API 环境变量

参考文件：

- `apps/api/.env.example`
- `apps/web/.env.example`

### `apps/api` 关键变量

| 变量 | 是否关键 | 作用 |
| --- | --- | --- |
| `DATABASE_URL` | 必填 | 连接 PostgreSQL |
| `APP_ORIGIN` | 必填 | 允许跨域携带 Cookie 的前端域名，本地默认 `http://localhost:3000` |
| `SESSION_SECRET` | 必填 | 会话加密密钥，生产环境必须是长随机串 |
| `SESSION_COOKIE_NAME` | 建议保留默认 | 会话 Cookie 名 |
| `AI_SERVICE_URL` | 涉及 AI 能力时必填 | 指向 `apps/ai-service` |
| `AI_INTERNAL_SERVICE_TOKEN` | 涉及 AI 能力时必填 | `apps/api -> apps/ai-service` 的内部鉴权令牌 |
| `AI_SERVICE_TIMEOUT_MS` | 可选 | 内部 AI 调用超时控制 |
| `API_HOST` / `API_PORT` | 可选 | API 服务监听地址和端口 |

### `apps/web` 关键变量

| 变量 | 是否关键 | 作用 |
| --- | --- | --- |
| `API_PROXY_TARGET` | 必填 | Next.js rewrites 的目标地址，本地默认 `http://localhost:3001` |

### 推荐本地值

```powershell
$env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/job_assistant"
$env:SESSION_SECRET="replace-with-a-long-random-secret"
$env:APP_ORIGIN="http://localhost:3000"
$env:AI_SERVICE_URL="http://localhost:8000"
$env:AI_INTERNAL_SERVICE_TOKEN="replace-with-a-shared-internal-token"
$env:API_PROXY_TARGET="http://localhost:3001"
```

### 3.6 启动 API 和 Web

根目录启动 API：

```powershell
cd "D:\code\work agent"
pnpm dev:api
```

另开终端启动 Web：

```powershell
cd "D:\code\work agent"
pnpm dev:web
```

默认地址：

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

`apps/web/next.config.ts` 已配置：

- `/api/:path* -> ${API_PROXY_TARGET}/api/:path*`
- `/health -> ${API_PROXY_TARGET}/health`

### 3.7 演示账号

来自 `packages/database/seed.sql`：

- Email: `demo@example.com`
- Password: `Password123!`

## 4. 鉴权、联调与排障约定

### 4.1 当前鉴权方式

- 运行时使用 `Cookie Session`
- 前端依赖浏览器自动携带 Cookie
- `apps/web/src/lib/api/client.ts` 已固定 `credentials: "include"`
- API CORS 配置允许携带 Cookie，但 `APP_ORIGIN` 必须与前端实际域名一致

Fastify 会话配置当前是：

- `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` 仅在生产环境启用

### 4.2 `x-user-id` 仅限测试

- 测试环境允许用 `x-user-id` 或 `x-demo-user-id` 模拟登录用户。
- 运行时页面开发不要依赖这些 header。
- 实际联调请始终走 `login -> Cookie Session -> authenticated API` 这条链路。

### 4.3 `x-request-id`

所有业务接口都会返回 `x-request-id`：

- 如果前端请求时带了 `x-request-id`，后端会透传
- 如果没带，后端会自动生成

前端发生 4xx/5xx 时，建议把 `requestId` 打到控制台或错误上报里，便于后端查日志。

### 4.4 统一响应格式

成功响应：

```json
{
  "success": true,
  "data": {}
}
```

分页响应：

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

失败响应：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {}
  }
}
```

前端统一错误对象为 `ApiError`，关键字段有：

- `status`
- `code`
- `message`
- `details`
- `requestId`

常见状态语义：

- `400 / VALIDATION_ERROR`：请求体或 query 不符合 contract
- `401 / UNAUTHORIZED`：未登录或登录态失效
- `404 / NOT_FOUND`：岗位、企业或日程项不存在
- `409 / EMAIL_ALREADY_REGISTERED`：注册邮箱已存在
- `500`：服务内部错误或配置错误
- `503`：依赖 AI Service 的接口当前不可用

## 5. 页面 / 模块对接矩阵

本节按前端实际做页面的顺序来写，而不是按源码目录来写。

### 5.1 登录、注册、退出、当前用户

### 适用页面

- 注册页
- 登录页
- 全局登录态初始化
- 需要基于登录态做路由守卫的页面

### 接口矩阵

| 接口 | 是否需要登录 | 输入 | 关键输出 | 前端注意事项 |
| --- | --- | --- | --- | --- |
| `POST /api/auth/register` | 否 | `RegisterInput`：`email`、`password`、`name` | `AuthUser` | 只会创建用户和空画像，不会自动登录；注册成功后若要进入登录态，仍需主动调用登录接口 |
| `POST /api/auth/login` | 否 | `LoginInput`：`email`、`password` | `AuthUser` | 成功后由后端写入 Cookie Session；前端无需自己存 token |
| `POST /api/auth/logout` | 否 | 无 | `{ loggedOut: true }` | 可视为幂等登出；用于清理当前 Cookie Session |
| `GET /api/auth/me` | 是 | 无 | `AuthUser` | 页面初始化时可调用；401 代表当前无有效登录态 |

### `AuthUser` 关键字段

- `id`
- `email`
- `name`
- `role`
- `status`
- `emailVerifiedAt`

### 空态 / 错误态建议

- 登录页：`401` 时提示邮箱或密码错误
- 注册页：`409` 时提示邮箱已注册
- 全局登录态：`GET /api/auth/me` 返回 `401` 时清空本地用户态并回到游客状态

### 5.2 用户画像

### 适用页面

- 画像编辑页
- 首次使用引导页
- 首页推荐前的用户偏好补全

### 接口矩阵

| 接口 | 是否需要登录 | 输入 | 关键输出 | 前端注意事项 |
| --- | --- | --- | --- | --- |
| `GET /api/profile` | 是 | 无 | `UserProfile` | 进入画像页、首页推荐页前都可以先拉一次 |
| `PUT /api/profile` | 是 | `ProfileUpdateInput`，允许局部更新 | `UserProfile` | 至少传一个字段；不要提交空对象 |

### `UserProfile` 关键字段

- `university`
- `major`
- `grade`
- `targetIndustries`
- `targetCities`
- `skills`
- `preferredJobTypes`
- `considersPostgraduate`
- `considersCivilService`
- `resumeData`

### 前端注意事项

- `resumeData` 可能是 `null`。
- `PUT /api/profile` 是 partial update，不需要每次把整份画像全量提交。
- 页面上适合把 `targetIndustries`、`targetCities`、`skills`、`preferredJobTypes` 设计成多选或可编辑标签。

### 空态 / 错误态建议

- 空画像不是错误；后端会返回默认字段值，而不是 `404`
- 首页推荐前如果发现关键字段几乎为空，可以引导用户先补全画像

### 5.3 简历能力

### 适用页面

- 简历上传 / 粘贴文本页
- 简历解析结果页
- 简历诊断页
- 岗位详情里的“简历投递分析 / 改写建议”

### 接口矩阵

| 接口 | 是否需要登录 | 输入 | 关键输出 | 前端注意事项 |
| --- | --- | --- | --- | --- |
| `POST /api/profile/resume/parse` | 是 | `ProfileResumeParseInput`：`rawText`、`fileName?` | `ProfileResumeParseResult`：`parsed`、`appliedPatch`、`profile` | 适合做“先解析再回填画像”；后端只会保守写回画像 |
| `POST /api/profile/resume/diagnose` | 是 | 同上 | `ProfileResumeDiagnoseResult`：`diagnosis`、`parsed`、`appliedPatch`、`profile` | 适合做完整简历体检页；会刷新 `resumeData` 里的最新解析和诊断 |
| `POST /api/jobs/:id/resume/analyze` | 是 | `JobResumeAnalyzeInput`：`rawText`、`fileName?` | `JobResumeAnalyzeResult`：`analysis`、`parsed`、`appliedPatch`、`profile` | 每次都必须带原始简历文本；不支持只基于缓存结果直接分析 |
| `POST /api/jobs/:id/resume/rewrite-suggestions` | 是 | `JobResumeRewriteSuggestionsInput`：`rawText`、`fileName?` | `JobResumeRewriteSuggestionsResult`：`rewriteSuggestions`、`parsed`、`appliedPatch`、`profile` | 返回的是改写建议，不是整份自动重写后的简历 |

### `parsed` 关键字段

- `summary`
- `detectedSkills`
- `detectedJobTypes`
- `detectedCities`
- `education.university`
- `education.major`
- `confidence`

### `diagnosis` 关键字段

- `overallScore`
- `summary`
- `quality.strengths`
- `quality.risks`
- `quality.missingInfo`
- `alignment.targetSummary`
- `alignment.matchedSignals`
- `alignment.gapSignals`
- `actionPlan.topPriority`
- `actionPlan.nextSteps`

### `analysis` 关键字段

- `overallScore`
- `verdict`: `strong_match | partial_match | weak_match`
- `summary`
- `matchedRequirements`
- `gaps`
- `resumeRisks`
- `actionPlan.topPriority`
- `actionPlan.nextSteps`

### `rewriteSuggestions` 关键字段

- `summary`
- `headlineSuggestion`
- `summarySuggestion`
- `keywordSuggestions`
- `sectionSuggestions[]`
  - `section`
  - `currentIssue`
  - `rewriteGoal`
  - `suggestedText`
- `actionChecklist`

### 前端注意事项

- 这些接口都依赖登录态。
- `rawText` 必填，当前版本没有文件上传二进制接口；前端应先把简历转成文本或粘贴文本。
- `appliedPatch` 表示后端这次自动补写进画像的内容，适合在 UI 中做“已自动补全了哪些字段”的提示。
- `profile` 是写回后的最新画像，可以直接替换前端缓存。
- `jobs/:id/resume/rewrite-suggestions` 适合做“投递前改哪里”的侧边栏、弹窗或分步清单，不适合直接当成最终简历正文落库。
- `resume/diagnose`、`jobs/:id/resume/analyze` 与 `jobs/:id/resume/rewrite-suggestions` 在 `apps/api` 连不上 `apps/ai-service` 时会返回 `503`。
- 如果 `apps/ai-service` 可用但上游模型 provider 出错，内部 pipeline 会自动 fallback 到规则版，接口仍可能返回可用结果。

### 空态 / 错误态建议

- 输入为空时前端先做校验，不要把空 `rawText` 发到后端
- `503` 时提示“AI 诊断服务暂时不可用，请稍后重试”
- 岗位分析页若先于岗位详情页打开，应优先校验岗位存在性

### 5.4 首页

### 当前产品边界

- V1 首页主线是“就业优先”
- 首页推荐流是分区对象，不是统一 feed
- 考研建议和考公建议是独立频道，不混进首页主推荐流

### 接口矩阵

| 接口 | 是否需要登录 | 输入 | 关键输出 | 前端注意事项 |
| --- | --- | --- | --- | --- |
| `GET /api/recommend/home` | 是 | 无 | `HomeRecommendation`：`jobs`、`cases`、`events`、`dailyAdvice`、`featuredCompany` | 这是首页主推荐 API，适合驱动个性化首页主体 |
| `GET /api/daily-content/today` | 是 | 无 | `TodayContent`：`dailyAdvice`、`featuredCompany`、`featuredJobs` | 更偏“今日内容块”；补充了 `featuredJobs`，但不包含案例和活动推荐分数 |

### 两个首页接口的关系

- `/api/recommend/home` 是主推荐接口：
  - 已经按用户画像聚合并排序岗位、案例、活动
  - 已经带有 `dailyAdvice` 和 `featuredCompany`
  - 返回的是“分区结果”，不是“统一 feed”
- `/api/daily-content/today` 是今日内容接口：
  - 更适合做首页里的“今日建议 / 今日精选岗位”卡片
  - 会返回 `featuredJobs`
  - 同样依赖登录态，因为会参考用户画像生成每日建议

如果首页是完整的登录后首页，建议以 `/api/recommend/home` 为主，再按视觉设计决定是否额外拉 `/api/daily-content/today` 来补充“今日精选岗位”区域。

### `HomeRecommendation` 关键字段

- `jobs[]`
  - 继承 `Job` 字段
  - 增加 `score`、`reason`、`source`
- `cases[]`
  - 继承 `StudentCase` 字段
  - 增加 `score`、`reason`、`source`
- `events[]`
  - 继承 `CareerEvent` 字段
  - 增加 `score`、`reason`、`source`
- `dailyAdvice`
  - `title`
  - `body`
  - `source`
- `featuredCompany`

### 前端注意事项

- 每个分区都应该单独处理空态，不要假设 `jobs`、`cases`、`events` 一定都有数据。
- `featuredCompany` 可能为 `null`。
- 首页岗位推荐在 AI Service 不可用时会自动回退到 TypeScript 规则打分，所以首页不一定会报错，但推荐理由可能更偏规则版。
- 不要把 `jobs/cases/events` 强行拼成单一 feed；当前后端设计本身就是多分区。

### 5.5 岗位列表与岗位详情

### 适用页面

- 岗位列表页
- 岗位搜索页
- 岗位详情页
- 岗位详情中的简历适配分析弹层或侧边栏

### 接口矩阵

| 接口 | 是否需要登录 | 输入 | 关键输出 | 前端注意事项 |
| --- | --- | --- | --- | --- |
| `GET /api/jobs` | 否 | `JobListQuery` | 分页 `Job[]` | 列表接口，支持筛选和分页 |
| `GET /api/jobs/:id` | 否 | 路径参数 `id` | `Job` | 岗位详情接口 |
| `POST /api/jobs/:id/resume/analyze` | 是 | `JobResumeAnalyzeInput` | `JobResumeAnalyzeResult` | 依赖登录和 AI Service |
| `POST /api/jobs/:id/resume/rewrite-suggestions` | 是 | `JobResumeRewriteSuggestionsInput` | `JobResumeRewriteSuggestionsResult` | 依赖登录和 AI Service；返回改写建议而不是整份重写简历 |

### `JobListQuery`

- `page`
- `limit`
- `city`: `string | string[]`
- `industry`: `string | string[]`
- `keyword`
- `featuredOnly`

### `Job` 关键字段

- `id`
- `title`
- `companyId`
- `companyName`
- `companyIndustry`
- `workLocation`
- `tags`
- `requiredSkills`
- `description`
- `isFeatured`
- `deadline`
- `publishedAt`
- `popularity`

### 前端注意事项

- 列表接口是分页响应，要读 `pagination.page / limit / total / totalPages`。
- `city` 和 `industry` 支持单值或多值。
- `deadline` 可能是 `null`。
- 岗位列表和详情可匿名访问，但“简历适配分析”必须登录。
- 若岗位不存在，详情页或简历分析页会拿到 `404`。

### 空态 / 错误态建议

- 列表为空时展示筛选结果为空态，不要当成接口异常
- 详情 `404` 时跳转到“岗位不存在或已下线”页

### 5.6 企业列表与企业详情

### 接口矩阵

| 接口 | 是否需要登录 | 输入 | 关键输出 | 前端注意事项 |
| --- | --- | --- | --- | --- |
| `GET /api/companies` | 否 | `CompanyListQuery` | 分页 `Company[]` | 支持城市、行业、关键词、精选筛选 |
| `GET /api/companies/:id` | 否 | 路径参数 `id` | `Company` | 企业详情接口 |

### `CompanyListQuery`

- `page`
- `limit`
- `city`: `string | string[]`
- `industry`: `string | string[]`
- `keyword`
- `featuredOnly`

### `Company` 关键字段

- `id`
- `name`
- `industry`
- `city`
- `description`
- `isFeatured`

### 前端注意事项

- 企业列表也是分页接口。
- 首页 `featuredCompany` 与企业列表详情的数据结构一致。
- 企业不存在时详情会返回 `404`。

### 5.7 学生案例

### 接口矩阵

| 接口 | 是否需要登录 | 输入 | 关键输出 | 前端注意事项 |
| --- | --- | --- | --- | --- |
| `GET /api/cases` | 否 | `CaseListQuery` | 分页 `StudentCase[]` | 适合做案例列表页或首页案例分区 |

### `CaseListQuery`

- `page`
- `limit`
- `careerPath`
- `major`

### `StudentCase` 关键字段

- `id`
- `title`
- `careerPath`
- `backgroundMajor`
- `city`
- `tags`
- `summary`
- `isFeatured`
- `publishedAt`

### 前端注意事项

- 案例列表是分页接口。
- 首页推荐返回的 `cases[]` 比纯案例列表多了 `score / reason / source`。

### 5.8 宣讲会 / 活动

### 接口矩阵

| 接口 | 是否需要登录 | 输入 | 关键输出 | 前端注意事项 |
| --- | --- | --- | --- | --- |
| `GET /api/events` | 否 | `EventListQuery` | 分页 `CareerEvent[]` | 适合做活动列表、宣讲会页、日历页 |

### `EventListQuery`

- `page`
- `limit`
- `city`: `string | string[]`
- `upcomingOnly`，默认 `true`

### `CareerEvent` 关键字段

- `id`
- `title`
- `companyName`
- `companyIndustry`
- `city`
- `startAt`
- `endAt`
- `registrationDeadline`
- `description`
- `isFeatured`

### 前端注意事项

- 列表接口分页。
- `endAt` 和 `registrationDeadline` 都可能为 `null`。
- 首页推荐里的 `events[]` 同样会多 `score / reason / source`。

### 5.9 日程

### 适用页面

- 我的日程页
- 首页时间线组件
- 个人计划管理弹层

### 接口矩阵

| 接口 | 是否需要登录 | 输入 | 关键输出 | 前端注意事项 |
| --- | --- | --- | --- | --- |
| `GET /api/schedule` | 是 | 无 | `ScheduleItem[]` | 返回的是聚合后的时间线，不分页 |
| `POST /api/schedule` | 是 | `ScheduleCreateInput` | `ScheduleItem` | 仅创建用户自定义日程项 |
| `PUT /api/schedule/:id` | 是 | `ScheduleUpdateInput` | `ScheduleItem` | 仅允许更新用户自定义日程项 |
| `DELETE /api/schedule/:id` | 是 | 无 | `{ id, deleted: true }` | 仅删除用户自定义日程项 |

### `ScheduleItem` 关键字段

- `id`
- `title`
- `source`: `job | event | exam | user`
- `startAt`
- `endAt`
- `city`
- `description`

### `ScheduleCreateInput` / `ScheduleUpdateInput`

- `title`
- `startAt`
- `endAt`
- `city`
- `description`

约束：

- `startAt` / `endAt` 必须是 ISO datetime 字符串
- 若传 `endAt`，它必须晚于或等于 `startAt`
- `update` 为 partial update，但至少要传一个字段

### 前端注意事项

- `GET /api/schedule` 返回的是聚合时间线，不只是用户自己手动创建的事项。
- 聚合来源包括：
  - `source = "user"`：用户手动创建
  - `source = "job"`：岗位截止投递时间
  - `source = "event"`：宣讲会/活动时间
  - `source = "exam"`：根据画像偏好自动生成的考研/考公提醒
- 前端应在 UI 上区分哪些项目可编辑 / 可删除：
  - `source = "user"` 可编辑、可删除
  - 其他 source 只应展示，不应暴露编辑删除入口
- 时间线为空是可能的，尤其在新用户、空画像或无 seed 数据场景。

### 5.10 考研频道

### 接口矩阵

| 接口 | 是否需要登录 | 输入 | 关键输出 | 前端注意事项 |
| --- | --- | --- | --- | --- |
| `GET /api/postgraduate/advice` | 是 | 无 | `PostgraduateAdvice[]` | 结果会结合当前用户画像来挑选建议 |

### `PostgraduateAdvice` 关键字段

- `id`
- `title`
- `summary`
- `actionItems`
- `targetMajors`
- `updatedAt`

### 前端注意事项

- 该频道是独立频道，不混入首页主推荐流。
- 接口需要登录，因为后端会基于用户画像筛选建议。
- 返回数组，前端要能处理空数组。

### 5.11 考公频道

### 接口矩阵

| 接口 | 是否需要登录 | 输入 | 关键输出 | 前端注意事项 |
| --- | --- | --- | --- | --- |
| `GET /api/civil-service/advice` | 是 | 无 | `CivilServiceAdvice[]` | 结果会结合当前用户画像来挑选建议 |

### `CivilServiceAdvice` 关键字段

- `id`
- `title`
- `summary`
- `actionItems`
- `targetCities`
- `updatedAt`

### 前端注意事项

- 该频道是独立频道，不混入首页主推荐流。
- 接口需要登录。
- 返回数组，前端要能处理空数组。

## 6. 数据契约速查表

本节只列前端接手最常用的公开契约和用途。

### 6.1 认证与用户

| 类型 | 位置 | 用途 |
| --- | --- | --- |
| `AuthUser` | `packages/contracts/src/auth.ts` | 当前用户、登录返回、注册返回 |
| `RegisterInput` | `packages/contracts/src/auth.ts` | 注册表单提交 |
| `LoginInput` | `packages/contracts/src/auth.ts` | 登录表单提交 |

### 6.2 用户画像与简历

| 类型 | 位置 | 用途 |
| --- | --- | --- |
| `UserProfile` | `packages/contracts/src/profile.ts` | 画像详情与更新后返回 |
| `ProfileUpdateInput` | `packages/contracts/src/profile.ts` | 画像局部更新 |
| `ProfileResumeParseInput` | `packages/contracts/src/profile.ts` | 简历解析输入 |
| `ProfileResumeParseResult` | `packages/contracts/src/profile.ts` | 简历解析结果 |
| `ProfileResumeDiagnoseResult` | `packages/contracts/src/profile.ts` | 简历诊断结果 |

### 6.3 首页与内容

| 类型 | 位置 | 用途 |
| --- | --- | --- |
| `HomeRecommendation` | `packages/contracts/src/recommendation.ts` | 首页主推荐接口返回 |
| `TodayContent` | `packages/contracts/src/daily-content.ts` | 今日内容接口返回 |

### 6.4 岗位与企业

| 类型 | 位置 | 用途 |
| --- | --- | --- |
| `Job` | `packages/contracts/src/jobs.ts` | 岗位列表、详情、推荐 |
| `JobListQuery` | `packages/contracts/src/jobs.ts` | 岗位列表筛选与分页 |
| `JobResumeAnalyzeInput` | `packages/contracts/src/jobs.ts` | 岗位定向分析输入 |
| `JobResumeAnalyzeResult` | `packages/contracts/src/jobs.ts` | 岗位定向分析返回 |
| `JobResumeRewriteSuggestionsInput` | `packages/contracts/src/jobs.ts` | 岗位定向改写建议输入 |
| `JobResumeRewriteSuggestionsResult` | `packages/contracts/src/jobs.ts` | 岗位定向改写建议返回 |
| `Company` | `packages/contracts/src/companies.ts` | 企业列表、详情、首页精选企业 |
| `CompanyListQuery` | `packages/contracts/src/companies.ts` | 企业列表筛选与分页 |

### 6.5 案例与活动

| 类型 | 位置 | 用途 |
| --- | --- | --- |
| `StudentCase` | `packages/contracts/src/cases.ts` | 案例列表、首页案例推荐 |
| `CaseListQuery` | `packages/contracts/src/cases.ts` | 案例列表筛选与分页 |
| `CareerEvent` | `packages/contracts/src/events.ts` | 活动列表、首页活动推荐、日程聚合 |
| `EventListQuery` | `packages/contracts/src/events.ts` | 活动列表筛选与分页 |

### 6.6 日程与频道

| 类型 | 位置 | 用途 |
| --- | --- | --- |
| `ScheduleItem` | `packages/contracts/src/schedule.ts` | 日程时间线项 |
| `ScheduleCreateInput` | `packages/contracts/src/schedule.ts` | 新建用户自定义日程 |
| `ScheduleUpdateInput` | `packages/contracts/src/schedule.ts` | 修改用户自定义日程 |
| `PostgraduateAdvice` | `packages/contracts/src/postgraduate.ts` | 考研频道建议 |
| `CivilServiceAdvice` | `packages/contracts/src/civil-service.ts` | 考公频道建议 |

### 6.7 通用响应与错误

| 类型 / 结构 | 位置 | 用途 |
| --- | --- | --- |
| `ApiError` | `packages/contracts/src/http.ts` 和 `apps/web/src/lib/api/client.ts` | 前端统一错误对象 |
| 成功响应 | `createSuccessResponseSchema` | `{ success: true, data: ... }` |
| 分页响应 | `createPaginatedResponseSchema` | `{ success: true, data: [...], pagination: ... }` |

## 7. 业务数据来源与种子数据

前端页面大致对应的数据表如下：

| 页面 / 能力 | 主要数据来源 |
| --- | --- |
| 登录 / 注册 / 当前用户 | `app_users` |
| 用户画像 | `user_profiles` |
| 企业列表 / 详情 | `companies` |
| 岗位列表 / 详情 | `jobs` |
| 学生案例 | `student_cases` |
| 宣讲会 / 活动 | `career_events` |
| 今日内容 / 每日建议素材 | `daily_content` |
| 考研建议 | `postgraduate_advice` |
| 考公建议 | `civil_service_advice` |
| 用户自定义日程 | `schedule_items` |
| AI 运行日志 | `ai_run_logs` |

默认 seed 里已经有：

- 1 个演示用户
- 3 家企业
- 4 个岗位
- 2 个学生案例
- 2 个活动
- 1 条每日内容
- 1 条考研建议
- 1 条考公建议
- 1 条用户自定义日程

因此在本地 seed 完成后，列表页和首页分区应该能直接看到基础数据。

## 8. 已知限制与不要误解为已实现的能力

### 8.1 已实现、可以直接做页面的部分

- 登录 / 注册 / 当前用户
- 画像读取与更新
- 首页分区推荐
- 今日建议与精选企业/岗位
- 岗位列表 / 岗位详情
- 企业列表 / 企业详情
- 学生案例列表
- 宣讲会 / 活动列表
- 日程聚合与用户自定义日程 CRUD
- 考研频道
- 考公频道
- 简历解析、简历诊断、岗位定向简历分析、岗位定向改写建议

### 8.2 当前明确未实现或仅预留的部分

- `apps/admin` 仍是预留目录，不在本次交接范围内
- `password_reset_tokens`、`email_verification_tokens` 表已存在，但对应前端流程尚未上线
- 注册成功不会自动登录
- 简历诊断当前只保留最新结果，不保留历史列表
- 岗位定向分析结果不持久化
- 岗位定向改写建议结果也不持久化
- 岗位定向分析不支持仅基于缓存简历直接分析，每次都要重新提交 `rawText`
- 岗位定向改写建议也不支持仅基于缓存简历直接生成，每次都要重新提交 `rawText`
- 岗位定向改写建议当前只返回结构化建议，不返回整份自动改写后的简历正文
- 前端没有直连 AI Service 的合法路径
- 当前首页、岗位页、简历页已经有 V1 骨架，但更多业务页面、全局状态治理和最终交互规范仍需继续建设

### 8.3 与 AI 相关的边界

- `apps/ai-service` 是内部服务，不给前端直连
- 首页岗位推荐在 AI Service 不可用时会自动回退到 TypeScript 规则打分
- `POST /api/profile/resume/diagnose`、`POST /api/jobs/:id/resume/analyze`、`POST /api/jobs/:id/resume/rewrite-suggestions` 在 `apps/api` 连不上 `apps/ai-service` 时会返回 `503`
- 每日建议也可能在模型不可用时回退为规则版或策展版内容

## 9. 前端实现建议

### 9.1 推荐的落地顺序

1. 先把登录态链路打通：注册、登录、`/api/auth/me`、退出
2. 做画像页，确保 `targetCities`、`targetIndustries`、`skills`、`preferredJobTypes` 能编辑
3. 做首页基础版：
   - 用 `/api/recommend/home` 驱动主体
   - 如需“今日精选岗位”再补 `/api/daily-content/today`
4. 做公共列表页：
   - 岗位
   - 企业
   - 案例
   - 活动
5. 做日程页
6. 再接入简历相关 AI 能力
7. 最后做考研 / 考公独立频道

### 9.2 站在后端边界看，前端应该怎么实现

- 前端是 `apps/api` 的稳定消费层，不是第二套业务决策层。
- 不要在页面里自己重算推荐分、匹配度、诊断结论或推荐排序。
- 不要直连 `apps/ai-service`，所有 AI 能力都必须通过公共业务 API 暴露。
- 不要在前端重新拼一套“内部模型”；优先直接消费 `packages/contracts` 的公开 DTO。
- 诊断、分析、改写建议都属于“辅助决策结果”，UI 要强调行动建议和状态说明，不要包装成绝对真相。

### 9.3 推荐的前端代码分层

- 页面和 feature 只调用 `src/lib/api/*`
- 不要在页面里重复写接口 schema
- 页面状态里保存已经被 wrapper 和 contract 校验过的返回值
- 错误展示统一基于 `ApiError.status / code / requestId`
- 推荐继续按业务域组织：
  - `features/home`
  - `features/jobs`
  - `features/resume`
  - 后续补 `features/profile`
  - 后续补 `features/schedule`
  - 后续补 `features/postgraduate`
  - 后续补 `features/civil-service`

### 9.4 API 调用与 demo 数据的实现建议

- 所有请求统一走 `src/lib/api/*`，不要在页面或组件里直接写 `fetch("/api/...")`。
- `src/lib/api/*` 应被当作一个小型前端 SDK 来维护：
  - 入参先走 contract schema
  - 出参直接返回 contract type
  - 统一抛 `ApiError`
- demo 数据可以保留，但请和真实联调状态明确分层：
  - `demo fixtures` 用于视觉演示和本地无接口时的开发占位
  - `runtime fallback` 只负责在接口失败时给出清晰提示
- 不建议把“接口失败后静默回退 demo 数据”作为最终产品行为；至少在开发环境里要显式提示当前不是实时数据。

### 9.5 首页和日程的建模建议

- 首页请按后端分区直接建模：
  - 推荐岗位区
  - 学生案例区
  - 活动区
  - 每日建议区
  - 精选企业区
- 日程请区分聚合来源：
  - `user`：用户自己维护
  - `job`：投递截止提醒
  - `event`：活动时间
  - `exam`：考研/考公提醒

### 9.6 AI 能力页面的实现建议

- `POST /api/profile/resume/diagnose` 适合做成“分数 + 优势 + 风险 + 行动清单”的结构化页面，不建议简单输出大段原文。
- `POST /api/jobs/:id/resume/analyze` 适合做成“匹配点 / 缺口 / 风险 / 下一步动作”的对比式面板。
- `POST /api/jobs/:id/resume/rewrite-suggestions` 适合做成 diff view、分段建议卡片、关键词清单，不应被理解为“整份简历自动改写结果”。
- AI 页面必须有完整状态设计：
  - 未登录：`401`
  - 资源不存在：`404`
  - AI service 不可用：`503`
  - provider 失败但后端已 fallback：正常展示，但前端应避免过度强调“模型结果”
- 行为边界要在页面文案里说清楚：
  - 简历分析和改写建议每次都要提交 `rawText`
  - 当前不支持只基于缓存简历直接分析
  - 改写建议不持久化，不保留历史版本

### 9.7 从后端角度看，前端最容易踩的坑

- 在前端自己计算推荐分或重新打乱推荐顺序
- 页面绕过 `src/lib/api/*` 直接发请求
- 把 demo 数据和真实数据混成一个状态源，导致联调时无法判断是否真的请求成功
- 不区分 `401`、`404`、`503`，把不同问题都显示成同一种错误提示
- 把 AI 结果当成最终事实，而不是辅助建议
- 为了做“统一信息流”而把首页的分区结果重新打平，破坏当前后端分区模型

## 10. 常见联调问题

### 10.1 登录成功但后续接口仍然 401

优先检查：

- 前端是否通过 `src/lib/api/client.ts` 发请求
- 请求是否带 `credentials: "include"`
- `APP_ORIGIN` 是否与前端实际地址一致
- 是否通过 `/api/*` 代理访问而不是绕过代理直接访问

### 10.2 首页能开，但简历诊断或改写建议是 503

说明：

- 首页推荐有规则回退
- 简历诊断和岗位定向分析更强依赖 AI Service

优先检查：

- `apps/ai-service` 是否已启动
- `AI_SERVICE_URL` 是否正确
- `AI_INTERNAL_SERVICE_TOKEN` 是否前后端一致

### 10.3 列表页没数据

优先检查：

- PostgreSQL 是否已导入 `schema.sql` 和 `seed.sql`
- 是否误用了过窄的筛选条件
- 当前登录用户画像是否把首页推荐召回范围缩得过小

### 10.4 schedule 里有些项不能编辑

这是预期行为：

- 只有 `source = "user"` 的项才是用户自己创建的
- `job`、`event`、`exam` 是后端聚合或自动生成的时间线项，不应提供编辑删除入口

## 11. 追溯来源

本文件主要依据以下真相源整理：

- `README.md`
- `apps/api/docs/backend-api.md`
- `apps/web/docs/frontend-api-integration.md`
- `apps/api/src/routes/register-api-routes.ts`
- `apps/api/src/routes/**/*`
- `apps/api/src/workflows/recommendation/build-home-recommendations.ts`
- `apps/api/src/workflows/schedule/build-schedule-timeline.ts`
- `apps/web/src/lib/api/*`
- `packages/contracts/src/*`
- `packages/database/schema.sql`
- `packages/database/seed.sql`
- `apps/ai-service/README.md`

如果后续接口或 contract 有变化，请优先更新 contract 和 wrapper，再同步修改这份文档。

## 12. 协作进度文档

为了方便前后端持续对齐实现进度，请同步维护：

- [frontend-progress-todo.md](/D:/code/work%20agent/apps/web/docs/frontend-progress-todo.md)

建议更新时机：

- 新增一个公共接口或 AI 能力后
- 新增一个前端页面或完成一个关键模块后
- 出现阻塞项，需要让协作者快速知道卡点时
