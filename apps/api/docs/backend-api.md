# 后端接口文档

本文档对应当前 `apps/api` 的独立 Fastify 后端实现，面向前端联调与后端维护。

## 1. 基础约定

### 健康检查

- `GET /health`
- 说明：后端存活检查，返回最小健康状态
- 鉴权：不需要

### Base URL

- 本地 API：`http://localhost:3001`
- 本地前端代理后访问：`http://localhost:3000/api/*`

### 鉴权

- 运行时采用后端自管的 `Cookie Session`
- 受保护接口依赖登录后的会话 Cookie
- 测试环境里为了方便集成和单测，仍允许 `x-user-id` 作为测试替身；运行时不要依赖它

### 环境变量

- `DATABASE_URL`
- `API_HOST`
- `API_PORT`
- `APP_ORIGIN`
- `SESSION_SECRET`
- `SESSION_COOKIE_NAME`
- `AI_SERVICE_URL`
- `AI_INTERNAL_SERVICE_TOKEN`
- `AI_SERVICE_TIMEOUT_MS`

说明：

- `SESSION_SECRET` 在生产运行环境必须显式配置
- 开发/测试环境允许使用开发兜底值，但会输出警告，不应带到部署环境
- `AI_SERVICE_URL` 不配置时，首页推荐会回退到 TypeScript 规则打分
- `AI_INTERNAL_SERVICE_TOKEN` 用于 `apps/api -> apps/ai-service` 的服务间鉴权
- `AI_SERVICE_TIMEOUT_MS` 用于控制内部 Python AI 服务调用超时

示例见：

- [.env.example](/D:/code/work%20agent/apps/api/.env.example)

### 本地演示账号

- 邮箱：`demo@example.com`
- 密码：`Password123!`

该账号来自：

- [seed.sql](/D:/code/work%20agent/packages/database/seed.sql)

### 统一响应格式

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

统一响应头：

- 业务 API 会返回 `x-request-id`
- 如果请求里已带 `x-request-id`，服务端会原样透传
- 如果请求里未带，服务端会自动生成，便于联调和查日志

## 2. 认证接口

### `POST /api/auth/register`

- 说明：创建新用户，并自动初始化空画像
- 鉴权：不需要

### `POST /api/auth/login`

- 说明：用户名密码登录，并建立 Cookie Session
- 鉴权：不需要
- 当前实现说明：已抽为独立登录处理文件，并由 Fastify 注册层桥接 session 写入

请求体：

```json
{
  "email": "demo@example.com",
  "password": "Password123!"
}
```

### `POST /api/auth/logout`

- 说明：清理当前登录态
- 鉴权：不需要
- 当前实现说明：已抽为独立登出处理文件，并由 Fastify 注册层桥接 session 清理

### `GET /api/auth/me`

- 说明：读取当前登录用户
- 鉴权：需要

## 3. 业务接口

保持不变的业务路径：

- `GET /api/profile`
- `PUT /api/profile`
- `POST /api/profile/resume/parse`
- `POST /api/profile/resume/diagnose`
- `GET /api/recommend/home`
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `POST /api/jobs/:id/resume/analyze`
- `POST /api/jobs/:id/resume/rewrite-suggestions`
- `POST /api/jobs/:id/resume/rewrite-suggestions/tasks`
- `GET /api/companies`
- `GET /api/companies/:id`
- `GET /api/cases`
- `GET /api/events`
- `GET /api/daily-content/today`
- `GET /api/ai/tasks`
- `GET /api/ai/tasks/:id`
- `GET /api/ai/tasks/ws`
- `GET /api/schedule`
- `POST /api/schedule`
- `PUT /api/schedule/:id`
- `DELETE /api/schedule/:id`
- `GET /api/postgraduate/advice`
- `GET /api/civil-service/advice`

说明：

- 接口路径和响应骨架与原后端保持兼容
- 首页推荐仍返回分区对象，而不是统一 feed
- 受保护接口统一通过 Cookie Session 识别用户
- 首页岗位推荐支持 Python AI 增强打分；若内部 AI 服务不可用，会自动降级到后端内置规则

### `POST /api/profile/resume/parse`

- 说明：调用内部 Python AI 服务解析简历文本，并把安全可自动补全的字段写回当前用户画像
- 鉴权：需要

请求体：

```json
{
  "rawText": "同济大学计算机科学专业，熟悉 Python、React，希望在上海从事前端开发。",
  "fileName": "resume.txt"
}
```

响应中的 `data` 包含：

- `parsed`：AI 解析结果
- `appliedPatch`：这次自动写回画像的字段
- `profile`：写回后的最新画像

自动写回策略当前比较保守：

- 会补空白的学校、专业
- 会把识别出的技能并入 `skills`
- 会在 `preferredJobTypes` 为空时补入识别出的岗位方向
- 不会自动覆盖已有的目标城市、目标行业等关键偏好

### `POST /api/profile/resume/diagnose`

- 说明：执行一次“先解析、再诊断”的同步简历诊断流程，并把最新结构化结果和诊断缓存回当前画像
- 鉴权：需要

请求体：

```json
{
  "rawText": "同济大学计算机科学专业，熟悉 Python、React，希望在上海从事前端开发。",
  "fileName": "resume.txt"
}
```

响应中的 `data` 包含：

- `diagnosis`：最新通用诊断结果
- `parsed`：这次诊断前置使用的最新结构化解析结果
- `appliedPatch`：本次根据简历安全写回的保守画像补丁
- `profile`：写回后的最新画像

诊断结果按三层组织：

- `quality`：简历本身的质量判断
- `alignment`：与当前画像目标的对齐情况
- `actionPlan`：下一步最该立即执行的动作

缓存写回规则：

- `profile.resumeData.parsedResume` 会刷新为本次最新解析结果
- `profile.resumeData.resumeDiagnosis.latest` 会覆盖为本次最新诊断
- 第一版不保留诊断历史列表

可用性约定：

- 如果 `apps/api` 无法连接 `apps/ai-service`，接口返回 `503`
- 如果 `apps/ai-service` 可达但上游 provider 失败，内部 pipeline 会回退到规则版诊断，公共接口仍返回可用结果

### `POST /api/jobs/:id/resume/analyze`

- 说明：执行一次“读取岗位详情 + 解析简历 + 岗位定向分析”的同步流程，回答“这份简历投这个岗位行不行、缺什么、先改哪里”
- 鉴权：需要

请求体：

```json
{
  "rawText": "同济大学计算机科学专业，熟悉 React，希望在上海从事前端开发。",
  "fileName": "resume.txt"
}
```

响应中的 `data` 包含：

- `analysis`：岗位定向分析结果
- `parsed`：本次分析前置使用的最新结构化解析结果
- `appliedPatch`：本次根据简历安全写回的保守画像补丁
- `profile`：写回后的最新画像

`analysis` 的固定结构：

- `version`
- `generatedAt`
- `overallScore`
- `verdict`
  - `strong_match`
  - `partial_match`
  - `weak_match`
- `summary`
- `matchedRequirements`
- `gaps`
- `resumeRisks`
- `actionPlan`
  - `topPriority`
  - `nextSteps`

行为边界：

- 每次请求都必须传 `rawText`，第一版不支持只基于缓存简历分析
- 接口会刷新 `profile.resumeData.parsedResume`，并应用保守画像补丁
- 岗位定向分析结果本身不持久化、不保留历史列表
- 如果岗位不存在，接口返回 `404`
- 如果 `apps/api` 无法连接 `apps/ai-service`，接口返回 `503`
- 如果 `apps/ai-service` 可达但 provider 失败，内部 pipeline 会回退到规则版岗位分析，公共接口仍返回可用结果

### `POST /api/jobs/:id/resume/rewrite-suggestions`

- 说明：执行一次“读取岗位详情 + 解析简历 + 岗位定向改写建议”的同步流程，回答“要投这个岗位，这份简历应该优先改哪里、怎么改”
- 鉴权：需要

请求体：

```json
{
  "rawText": "同济大学计算机科学专业，熟悉 React，希望在上海从事前端开发。",
  "fileName": "resume.txt"
}
```

响应中的 `data` 包含：

- `rewriteSuggestions`：岗位定向改写建议结果
- `parsed`：本次生成建议前置使用的最新结构化解析结果
- `appliedPatch`：本次根据简历安全写回的保守画像补丁
- `profile`：写回后的最新画像

`rewriteSuggestions` 的固定结构：

- `version`
- `generatedAt`
- `summary`
- `headlineSuggestion`
- `summarySuggestion`
- `keywordSuggestions`
- `sectionSuggestions`
  - `section`
  - `currentIssue`
  - `rewriteGoal`
  - `suggestedText`
- `actionChecklist`

行为边界：

- 这是“定向改写建议”接口，不返回整份自动改写后的简历
- 每次请求都必须传 `rawText`，第一版不支持只基于缓存简历生成建议
- 接口会刷新 `profile.resumeData.parsedResume`，并应用保守画像补丁
- 本次改写建议结果不持久化、不保留历史列表
- 如果岗位不存在，接口返回 `404`
- 如果 `apps/api` 无法连接 `apps/ai-service`，接口返回 `503`
- 如果 `apps/ai-service` 可达但 provider 失败，内部 pipeline 会回退到规则版建议，公共接口仍返回可用结果

### `POST /api/jobs/:id/resume/rewrite-suggestions/tasks`

- 说明：创建一个岗位定向简历改写建议异步任务，不等待 AI 结果完成
- 鉴权：需要

请求体：

```json
{
  "rawText": "同济大学计算机科学专业，熟悉 React，希望在上海从事前端开发。",
  "fileName": "resume.txt"
}
```

响应中的 `data` 包含：

- `taskId`
- `capability`
- `status`

说明：

- 旧同步接口 `POST /api/jobs/:id/resume/rewrite-suggestions` 保持不变
- 第一批异步任务能力固定为 `job_resume_rewrite`

### `GET /api/ai/tasks`

- 说明：按当前登录用户查询自己的 AI 任务列表
- 鉴权：需要

支持 query：

- `capability`
- `status`
- `limit`

### `GET /api/ai/tasks/:id`

- 说明：读取当前登录用户的单个 AI 任务详情
- 鉴权：需要

说明：

- 只允许读取自己的任务
- 任务成功时 `result` 为完整业务结果
- 任务失败时 `error` 为稳定错误对象

### `GET /api/ai/tasks/ws`

- 说明：AI 任务状态通知 WebSocket 通道
- 鉴权：需要，沿用 Cookie Session
- 角色：仅通知，不作为主调用入口

当前消息协议：

- 客户端订阅：

```json
{
  "type": "subscribe",
  "taskIds": ["task-1"]
}
```

- 服务端推送：

```json
{
  "type": "task.updated",
  "taskId": "task-1",
  "status": "running",
  "progress": {
    "step": "prepare",
    "message": "Preparing resume rewrite analysis",
    "percent": 10
  }
}
```

使用约定：

- 收到完成或失败推送后，前端仍应再请求 `GET /api/ai/tasks/:id` 获取权威结果
- 第一版 WebSocket 只做任务状态通知，不承载完整会话协议

## 3.1 内部 AI 服务协作

当前仓库新增了内部 Python 服务：

- [apps/ai-service/README.md](/D:/code/work%20agent/apps/ai-service/README.md)

当前 `apps/api` 已接入的内部能力：

- 岗位候选打分：`POST /internal/recommend/score-jobs`
- 简历结构化解析：`POST /internal/resume/parse`
- 通用简历诊断：`POST /internal/resume/diagnose`
- 岗位定向简历分析：`POST /internal/resume/analyze-for-job`
- 岗位定向改写建议：`POST /internal/resume/suggest-rewrite-for-job`

说明：

- 这些接口只供 `apps/api` 调用，不对前端直接开放
- 这样做的好处是，推荐增强和简历 NLP 可以逐步迁到 Python，而公共业务 API 路径保持不变

## 3.2 异步任务说明

当前异步任务底座已在 `apps/api` 落地：

- PostgreSQL 作为第一版任务队列
- `apps/api` 负责任务创建、归属校验、状态查询和业务写回
- 独立 worker 进程负责 claim 与执行

当前 worker 入口：

- [worker.ts](/D:/code/work%20agent/apps/api/src/worker.ts)

当前脚本：

- `pnpm --filter api dev:worker`
- `pnpm --filter api start:worker`

说明：

- 第一版不做自动重试
- stale `running` 任务会在 worker 启动时恢复为失败态
- 当前第一条异步试点是岗位定向简历改写建议

## 4. 数据模型概要

核心表：

- `app_users`
- `password_reset_tokens`
- `email_verification_tokens`
- `user_profiles`
- `companies`
- `jobs`
- `student_cases`
- `career_events`
- `daily_content`
- `postgraduate_advice`
- `civil_service_advice`
- `schedule_items`

数据库脚本：

- [schema.sql](/D:/code/work%20agent/packages/database/schema.sql)
- [seed.sql](/D:/code/work%20agent/packages/database/seed.sql)
