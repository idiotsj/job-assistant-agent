# 部署检查清单

本文档用于当前阶段的本地演示联调和云端环境核对，不等同于正式生产上线手册。

目标：

- 让另一个同学可以按清单独立核对环境
- 避免出现“本地能跑，但云端少进程、少变量、少代理配置”的问题
- 明确当前异步 AI 任务链路需要的最小运行组合

最后更新：`2026-05-08`

## 1. 当前最小运行组合

当前项目若要完整演示“登录 + 岗位分析 + 异步改写建议任务”，最少需要：

1. `web`
2. `api`
3. `api worker`
4. `PostgreSQL`

如果要演示真实 AI 效果而不是纯依赖后端降级语义，还需要：

5. `ai-service`

说明：

- `web` 负责用户页面和 `/api/*` 代理
- `api` 负责公共业务接口、鉴权、任务创建、任务查询
- `api worker` 负责 claim 并执行异步 AI 任务
- `ai-service` 负责简历解析、诊断、岗位分析、岗位改写建议等内部 AI 推理

## 2. 必要环境变量

### `apps/api`

- `DATABASE_URL`
- `SESSION_SECRET`
- `APP_ORIGIN`
- `AI_SERVICE_URL`
- `AI_INTERNAL_SERVICE_TOKEN`

建议同时确认：

- `API_HOST`
- `API_PORT`
- `SESSION_COOKIE_NAME`
- `AI_SERVICE_TIMEOUT_MS`

### `apps/web`

- `API_PROXY_TARGET`

### `apps/ai-service`

- `DATABASE_URL`
- `AI_INTERNAL_SERVICE_TOKEN`
- `OPENAI_API_KEY`

如果当前阶段只验证“API 能否正确返回 503 或 fallback 结果”，可以临时不配置 `OPENAI_API_KEY`，但需要知道这不代表真实模型链路已打通。

## 3. 数据库检查

必须确认以下脚本和迁移已经执行：

- `packages/database/schema.sql`
- `packages/database/migrations/*`

当前阶段重点确认：

- `ai_tasks` 表已存在
- `ai_run_logs` 表已存在
- `user_profiles`、`jobs`、`companies`、`career_events` 等主表已存在

如果需要演示页面有数据，建议再执行：

- `packages/database/seed.sql`

## 4. 反向代理与网络检查

前端和 API 推荐保持同域路径代理模式：

- 前端站点：`/`
- 后端接口：`/api/*`

必须确认以下路径已被正确代理：

- `/api/*`
- `/health`
- `/api/ai/tasks/ws`

特别注意：

- `/api/ai/tasks/ws` 需要 WebSocket upgrade
- 如果反向代理没有显式放通 upgrade，异步任务前端会退化为轮询
- 轮询可兜底，但不代表 WebSocket 链路已经正确部署

## 5. 本地最小启动命令

仓库根目录安装依赖：

```powershell
cd "D:\code\work agent"
pnpm install
```

启动 `ai-service`：

```powershell
cd "D:\code\work agent\apps\ai-service"
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动 `api`：

```powershell
cd "D:\code\work agent"
pnpm dev:api
```

启动 `api worker`：

```powershell
cd "D:\code\work agent"
pnpm --filter api dev:worker
```

启动 `web`：

```powershell
cd "D:\code\work agent"
pnpm dev:web
```

## 6. 验收路径

### 基础链路

1. 打开 `http://localhost:3000`
2. 登录演示账号
3. 打开一个岗位详情页
4. 打开岗位分析抽屉
5. 粘贴简历文本并触发分析

### 异步任务链路

1. `POST /api/jobs/:id/resume/rewrite-suggestions/tasks` 创建成功
2. 页面进入 `pending` / `running`
3. `api worker` 成功 claim 并执行任务
4. `GET /api/ai/tasks/:id` 能查到最新状态
5. WebSocket 正常时收到 `task.updated`
6. WebSocket 不可用时页面自动降级到轮询
7. 页面最终以 `GET /api/ai/tasks/:id` 返回结果为准

### 降级语义

1. 停掉 `ai-service`
2. 再次触发同步 AI 接口或异步任务
3. 确认：
   - 同步简历类接口按当前设计返回 `503`
   - 已创建的异步任务进入 `failed`
   - 页面不会空白，也不会无限重连刷接口

## 7. 云端核对清单

- [ ] `web`、`api`、`api worker` 至少三个进程都已部署
- [ ] 若要真实 AI，`ai-service` 已部署且可被 `api` 访问
- [ ] `DATABASE_URL`、`SESSION_SECRET`、`APP_ORIGIN` 已配置
- [ ] `AI_SERVICE_URL`、`AI_INTERNAL_SERVICE_TOKEN` 已配置一致
- [ ] 数据库 schema 与 migrations 已执行
- [ ] `ai_tasks` 表已存在
- [ ] `/api/*` 代理正常
- [ ] `/api/ai/tasks/ws` WebSocket upgrade 正常
- [ ] 登录后 Cookie Session 能维持
- [ ] 创建任务后 worker 能消费
- [ ] 任务详情接口能查到成功或失败结果

## 8. 当前明确不应误解为已完成的能力

- `apps/ingest` 不是本轮可部署能力
- `/interview` 目前仍是前端占位入口，不是正式后端业务域
- WebSocket 只是通知通道，不是权威结果源
- 没有 worker 时，异步任务接口只能创建任务，不能完成执行
