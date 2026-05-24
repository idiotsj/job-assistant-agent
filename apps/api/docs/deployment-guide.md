# 部署与运行手册

本文档面向当前项目的实际部署、联调演示和环境迁移，目标是提供一份可以直接照着执行的运行手册，而不是只做抽象核对。

适用范围：

- `apps/web`
- `apps/api`
- `apps/ai-service`
- `packages/database`

最后更新：`2026-05-24`

## 1. 当前部署模型

当前仓库采用单仓多应用结构，但运行时是多进程模型：

1. `web`
2. `api`
3. `api worker`
4. `PostgreSQL`
5. 可选 `ai-service`

职责划分：

- `web`
  - 提供用户界面
  - 通过 Next.js rewrite 把 `/api/*` 和 `/health` 代理到 `api`
- `api`
  - 提供公共业务接口
  - 管理登录态、业务写回、异步任务创建与查询
- `api worker`
  - 消费 `ai_tasks`
  - 执行异步 AI 任务
- `ai-service`
  - 提供内部 AI 推理能力
  - 不直接暴露给前端
- `PostgreSQL`
  - 唯一主数据库

## 2. 什么时候必须部署 `ai-service`

如果你的目标只是让系统结构跑起来，可以暂时不启 `ai-service`，但要明确后果：

- 简历解析、简历诊断、岗位分析、岗位改写建议等同步 AI 接口会按当前设计返回 `503`
- 已创建的异步改写任务会进入 `failed`
- 首页推荐仍可退回规则版

如果你要演示真实 AI 效果，必须同时部署：

- `api`
- `api worker`
- `ai-service`

## 3. 环境要求

### 3.1 Node / pnpm

建议：

- Node.js `20.x`
- pnpm `10.30.3`

### 3.2 Python

建议：

- Python `3.13`

### 3.3 PostgreSQL

建议：

- PostgreSQL `15+`

## 4. 目录中的关键文件

- [README.md](/D:/code/work%20agent/README.md)
- [apps/api/.env.example](/D:/code/work%20agent/apps/api/.env.example)
- [apps/ai-service/.env.example](/D:/code/work%20agent/apps/ai-service/.env.example)
- [packages/database/schema.sql](/D:/code/work%20agent/packages/database/schema.sql)
- [packages/database/seed.sql](/D:/code/work%20agent/packages/database/seed.sql)
- [packages/database/migrations/20260413_add_schedule_items_user_fk.sql](/D:/code/work%20agent/packages/database/migrations/20260413_add_schedule_items_user_fk.sql)
- [packages/database/migrations/20260505_add_ai_tasks.sql](/D:/code/work%20agent/packages/database/migrations/20260505_add_ai_tasks.sql)

## 5. 环境变量

### 5.1 `apps/api`

最小必需：

- `DATABASE_URL`
- `APP_ORIGIN`
- `SESSION_SECRET`

AI 相关：

- `AI_SERVICE_URL`
- `AI_INTERNAL_SERVICE_TOKEN`
- `AI_SERVICE_TIMEOUT_MS`

运行补充：

- `API_HOST`
- `API_PORT`
- `SESSION_COOKIE_NAME`

参考模板：

- [apps/api/.env.example](/D:/code/work%20agent/apps/api/.env.example)

示例：

```env
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/job_assistant
API_HOST=0.0.0.0
API_PORT=3001
APP_ORIGIN=http://localhost:3000
SESSION_SECRET=replace-with-a-long-random-secret
SESSION_COOKIE_NAME=job_assistant_session
AI_SERVICE_URL=http://127.0.0.1:8000
AI_INTERNAL_SERVICE_TOKEN=replace-with-a-shared-internal-token
AI_SERVICE_TIMEOUT_MS=1800
```

### 5.2 `apps/web`

最小必需：

- `API_PROXY_TARGET`

参考模板：

- [apps/web/.env.example](/D:/code/work%20agent/apps/web/.env.example)

示例：

```env
API_PROXY_TARGET=http://127.0.0.1:3001
```

### 5.3 `apps/ai-service`

最小必需：

- `DATABASE_URL`
- `AI_INTERNAL_SERVICE_TOKEN`

如果需要真实模型：

- `OPENAI_API_KEY`

常用补充：

- `AI_SERVICE_NAME`
- `AI_SERVICE_ENV`
- `AI_LOG_MODE`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL_RESUME_PARSE`
- `OPENAI_MODEL_RESUME_DIAGNOSIS`
- `OPENAI_MODEL_JOB_RESUME_ANALYSIS`
- `OPENAI_MODEL_JOB_RESUME_REWRITE`
- `OPENAI_MODEL_JOB_SCORING`
- `OPENAI_MODEL_DAILY_ADVICE`

参考模板：

- [apps/ai-service/.env.example](/D:/code/work%20agent/apps/ai-service/.env.example)

## 6. 数据库初始化

### 6.1 新环境

新环境推荐先执行基线 schema，再补 seed：

```powershell
psql -U postgres -d job_assistant -f "D:\code\work agent\packages\database\schema.sql"
psql -U postgres -d job_assistant -f "D:\code\work agent\packages\database\seed.sql"
```

### 6.2 已有环境升级

已有环境优先执行 migration：

```powershell
psql -U postgres -d job_assistant -f "D:\code\work agent\packages\database\migrations\20260413_add_schedule_items_user_fk.sql"
psql -U postgres -d job_assistant -f "D:\code\work agent\packages\database\migrations\20260505_add_ai_tasks.sql"
```

然后再根据需要决定是否执行 `seed.sql`。

### 6.3 必须确认存在的表

- `app_users`
- `user_profiles`
- `jobs`
- `companies`
- `career_events`
- `schedule_items`
- `ai_run_logs`
- `ai_tasks`

## 7. 本地运行步骤

### 7.1 安装依赖

```powershell
cd "D:\code\work agent"
pnpm install
```

### 7.2 启动 `ai-service`

```powershell
cd "D:\code\work agent\apps\ai-service"
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 7.3 启动 `api`

```powershell
cd "D:\code\work agent"
pnpm dev:api
```

说明：

- `pnpm dev:api` 实际执行 `tsx watch --env-file=.env src/server.ts`
- 默认读取 `apps/api/.env`

### 7.4 启动 `api worker`

```powershell
cd "D:\code\work agent"
pnpm dev:worker
```

等价命令：

```powershell
cd "D:\code\work agent"
pnpm --filter api dev:worker
```

### 7.5 启动 `web`

```powershell
cd "D:\code\work agent"
pnpm dev:web
```

默认地址：

- `web`: `http://localhost:3000`
- `api`: `http://localhost:3001`
- `ai-service`: `http://localhost:8000`

## 8. 生产运行命令

### 8.1 构建

在仓库根目录执行：

```powershell
cd "D:\code\work agent"
pnpm build
```

### 8.2 运行 `api`

```powershell
cd "D:\code\work agent\apps\api"
node dist/server.js
```

### 8.3 运行 `api worker`

```powershell
cd "D:\code\work agent\apps\api"
node dist/worker.js
```

### 8.4 运行 `web`

推荐：

```powershell
cd "D:\code\work agent\apps\web"
npx next start
```

说明：

- `apps/web/package.json` 当前未单独声明 `start` 脚本
- 若后续要正式部署，建议补一个 `start: "next start"`，这样会更标准

### 8.5 运行 `ai-service`

```powershell
cd "D:\code\work agent\apps\ai-service"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 9. 代理与网络配置

### 9.1 本地代理模式

`apps/web` 当前通过 Next.js rewrite 代理：

- `/api/:path* -> ${API_PROXY_TARGET}/api/:path*`
- `/health -> ${API_PROXY_TARGET}/health`

配置文件：

- [apps/web/next.config.ts](/D:/code/work%20agent/apps/web/next.config.ts)

### 9.2 生产推荐模式

推荐仍采用同域路径代理：

- 前端站点：`/`
- 后端接口：`/api/*`
- 健康检查：`/health`

### 9.3 WebSocket

必须放通：

- `/api/ai/tasks/ws`

说明：

- 这是任务状态通知通道
- 如果代理层没有正确支持 upgrade，前端必须退化到轮询
- 轮询能工作，但不代表部署完整

## 10. Cookie Session 要点

当前认证采用后端自管 `Cookie Session`：

- 前端请求默认 `credentials: "include"`
- 推荐同域代理部署，避免跨域 Cookie 问题
- `APP_ORIGIN` 必须与实际前端访问域名一致

建议：

- 开发环境：`http://localhost:3000`
- 正式环境：配置真实域名

## 11. 推荐验收流程

### 11.1 基础验收

1. 打开首页
2. 登录演示账号
3. 读取 `/api/auth/me`
4. 查看首页推荐
5. 打开岗位详情

### 11.2 AI 同步链路验收

1. 调用简历解析
2. 调用简历诊断
3. 调用岗位定向分析

### 11.3 异步任务链路验收

1. 创建 `POST /api/jobs/:id/resume/rewrite-suggestions/tasks`
2. 确认任务进入 `pending` / `running`
3. 确认 worker 消费成功
4. `GET /api/ai/tasks/:id` 能返回最终结果
5. `GET /api/ai/tasks/ws` 能正确通知，或前端正确降级到轮询

### 11.4 Interview 占位接口验收

1. 登录后访问 `GET /api/interview/practice`
2. 返回 `200`
3. 响应包含 `status/title/summary/availableModules`

## 12. 推荐验证命令

```powershell
pnpm --filter @job-assistant/contracts typecheck
pnpm --filter api typecheck
pnpm --filter api test
pnpm --filter api build
pnpm --filter web typecheck
pnpm --filter web test
python -m pytest apps/ai-service/tests
```

## 13. 常见故障排查

### 13.1 登录后接口仍然 `401`

优先检查：

- `APP_ORIGIN` 是否正确
- 是否通过同域代理访问
- 浏览器是否带上 Cookie

### 13.2 异步任务一直停在 `pending`

优先检查：

- `api worker` 是否启动
- `ai_tasks` 表是否已创建
- worker 日志是否有 claim 或执行错误

### 13.3 `503 AI_SERVICE_UNAVAILABLE`

优先检查：

- `AI_SERVICE_URL` 是否正确
- `ai-service` 是否真的启动
- `AI_INTERNAL_SERVICE_TOKEN` 是否一致

### 13.4 WebSocket 不工作

优先检查：

- 反向代理是否支持 `/api/ai/tasks/ws` upgrade
- 前端是否正确降级到轮询

### 13.5 数据库迁移后仍报字段/表不存在

优先检查：

- 是不是只执行了 `schema.sql`，没执行新增 migration
- 当前数据库名是否和 `DATABASE_URL` 一致

## 14. 当前明确不是正式部署能力的部分

- `apps/ingest` 当前不是正式部署能力
- `/interview` / `/interview/practice` 当前只是占位工作区，不是正式面试业务域
- `apps/admin` 仍未实现

## 15. 相关文档

- [演示 Runbook](/D:/code/work%20agent/apps/api/docs/demo-runbook.md)
- [部署检查清单](/D:/code/work%20agent/apps/api/docs/deployment-checklist.md)
- [后端接口文档](/D:/code/work%20agent/apps/api/docs/backend-api.md)
- [后端进度与规范](/D:/code/work%20agent/apps/api/docs/backend-progress-and-guidelines.md)
- [前后端交接文档](/D:/code/work%20agent/apps/web/docs/frontend-backend-handoff.md)
