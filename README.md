# Job Assistant Agent

`job-assistant-agent` 是一个面向学生求职场景的 AI 就业辅助项目。

当前仓库采用 monorepo，主线是：

- `apps/web` 提供用户侧体验
- `apps/api` 提供稳定公共业务接口
- `apps/ai-service` 承接更适合 AI / NLP / 结构化推理的内部能力

当前阶段目标不是继续扩新业务域，而是把现有“简历 AI + 岗位分析/改写 + 异步任务”收口成一个可稳定演示、可持续联调的闭环。

## 仓库结构

```text
apps/
├─ web/          # Next.js 用户端前端
├─ api/          # Fastify + TypeScript 公共业务网关
├─ ai-service/   # FastAPI + Python 内部 AI 能力层
└─ admin/        # 预留目录，未实现

packages/
├─ contracts/    # 前后端共享 HTTP 契约
├─ database/     # PostgreSQL schema / seed / migrations
└─ config/       # 预留共享配置目录
```

## 当前已完成能力

- 用户注册、登录、Cookie Session
- 用户画像管理
- 首页分区推荐
- 岗位、企业、学生案例、活动查询
- 日程聚合
- 考研 / 考公频道
- 简历解析
- 通用简历诊断
- 岗位定向简历分析
- 岗位定向改写建议
- 岗位改写建议异步任务链路

## 当前明确未完成

- `apps/ingest`
- `interview` 后端业务域
- `apps/admin`

说明：

- `/interview` 目前只是前端占位入口
- `apps/ingest` 目前不能当作已实现的导入层来使用

## 技术栈

- Frontend: Next.js + React
- API: Fastify + TypeScript
- AI Service: FastAPI + Python
- Database: PostgreSQL
- Package Manager: pnpm

## 本地开发

### 1. 安装依赖

```powershell
cd "D:\code\work agent"
pnpm install
```

### 2. 准备数据库

```powershell
psql -U postgres -d job_assistant -f "D:\code\work agent\packages\database\schema.sql"
psql -U postgres -d job_assistant -f "D:\code\work agent\packages\database\seed.sql"
```

如果是已有环境，优先执行 `packages/database/migrations/*`。

### 3. 启动 AI Service

```powershell
cd "D:\code\work agent\apps\ai-service"
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. 配置环境变量

关键变量：

- `DATABASE_URL`
- `SESSION_SECRET`
- `APP_ORIGIN`
- `AI_SERVICE_URL`
- `AI_INTERNAL_SERVICE_TOKEN`
- `API_PROXY_TARGET`

### 5. 启动 API

```powershell
cd "D:\code\work agent"
pnpm dev:api
```

### 6. 启动 Worker

```powershell
cd "D:\code\work agent"
pnpm --filter api dev:worker
```

说明：

- 如果不启动 worker，异步任务只能创建，不能完成执行

### 7. 启动 Web

```powershell
cd "D:\code\work agent"
pnpm dev:web
```

默认地址：

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

## 常用脚本

```powershell
pnpm typecheck
pnpm test
pnpm build
pnpm test:ai
pnpm dev:web
pnpm dev:api
pnpm dev:ai
pnpm --filter api dev:worker
```

## 当前推荐验证项

```powershell
pnpm --filter @job-assistant/contracts typecheck
pnpm --filter api typecheck
pnpm --filter api test
pnpm --filter api build
pnpm --filter web typecheck
python -m pytest apps/ai-service/tests
```

除此之外，建议再做一轮人工联调：

1. 登录
2. 打开岗位详情
3. 发起岗位分析
4. 创建改写建议异步任务
5. 验证 worker 执行
6. 验证任务详情返回结果
7. 验证 WebSocket 或轮询恢复

## 演示账号

默认种子数据提供一个演示账号：

- Email: `demo@example.com`
- Password: `Password123!`

来源：

- [seed.sql](/D:/code/work%20agent/packages/database/seed.sql)

## 关键文档

- [后端接口文档](/D:/code/work%20agent/apps/api/docs/backend-api.md)
- [后端进度与规范](/D:/code/work%20agent/apps/api/docs/backend-progress-and-guidelines.md)
- [部署检查清单](/D:/code/work%20agent/apps/api/docs/deployment-checklist.md)
- [前后端交接文档](/D:/code/work%20agent/apps/web/docs/frontend-backend-handoff.md)
- [前后端对齐 Todo](/D:/code/work%20agent/apps/web/docs/frontend-progress-todo.md)

## 协作建议

- `main` 保持稳定
- 每个功能单独开分支
- 通过 Pull Request 合并
- 每次新增接口、任务能力或重要页面时，同步更新文档

## 当前注意事项

- 前端不要直接访问 `apps/ai-service`
- 对外业务 API 统一由 `apps/api` 暴露
- WebSocket 只是任务通知通道，不是权威结果源
- `apps/ingest` 当前不是正式能力
- `/interview` 当前仍是占位入口
