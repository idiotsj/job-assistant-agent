# `apps/web` 前后端交接文档

本文档面向继续开发当前 `apps/web` 前端的同学，目标是让接手者能快速完成：

- 本地启动
- 前后端联调
- AI 页面接入
- 异步任务闭环联调
- 部署前核对

最后更新：`2026-05-08`

## 1. 当前项目真相

### 1.1 当前仓库结构

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

### 1.2 当前边界

- 前端只能访问 `apps/api`
- 前端不能直连 `apps/ai-service`
- 所有接口统一走 `apps/web/src/lib/api/*`
- 共享契约以 `packages/contracts` 为真相源
- 当前异步任务的权威结果源是 `GET /api/ai/tasks/:id`
- WebSocket 只做通知，不做最终结果承载

### 1.3 当前明确未完成的部分

- `apps/ingest` 不是当前可运行能力
- `/interview` 目前只是前端占位入口，不代表后端已完成该业务域
- `apps/admin` 仍未实现

## 2. 当前可联调能力

### 2.1 公共接口能力

当前后端已具备：

- 登录 / 注册 / 当前用户
- 用户画像读取与更新
- 简历解析
- 通用简历诊断
- 首页分区推荐
- 岗位列表 / 详情
- 岗位定向简历分析
- 岗位定向改写建议
- 改写建议异步任务版接口
- 企业、案例、活动
- 日程聚合
- 考研频道
- 考公频道

### 2.2 AI 能力接入方式

当前 AI 页面推荐接法：

- 简历解析
  - `POST /api/profile/resume/parse`
- 简历诊断
  - `POST /api/profile/resume/diagnose`
- 岗位定向分析
  - `POST /api/jobs/:id/resume/analyze`
- 岗位定向改写建议
  - 同步接口仍保留：`POST /api/jobs/:id/resume/rewrite-suggestions`
  - 当前更推荐异步增强入口：`POST /api/jobs/:id/resume/rewrite-suggestions/tasks`

### 2.3 当前推荐的岗位页闭环

岗位页当前推荐这样接：

1. 同步调用 `POST /api/jobs/:id/resume/analyze`
2. 异步创建改写建议任务 `POST /api/jobs/:id/resume/rewrite-suggestions/tasks`
3. 用 `GET /api/ai/tasks/:id` 拉取任务详情
4. 同时可选订阅 `GET /api/ai/tasks/ws`
5. 页面刷新后，通过 `GET /api/ai/tasks` 恢复当前岗位的未完成任务

## 3. 本地启动

### 3.1 推荐启动顺序

1. 安装 Node 依赖
2. 准备 PostgreSQL
3. 启动 `apps/ai-service`
4. 启动 `apps/api`
5. 启动 `apps/api worker`
6. 启动 `apps/web`

### 3.2 安装依赖

```powershell
cd "D:\code\work agent"
pnpm install
```

### 3.3 准备数据库

```powershell
psql -U postgres -d job_assistant -f "D:\code\work agent\packages\database\schema.sql"
psql -U postgres -d job_assistant -f "D:\code\work agent\packages\database\seed.sql"
```

如果是已有环境，优先执行 `packages/database/migrations/*`。

### 3.4 启动 AI Service

```powershell
cd "D:\code\work agent\apps\ai-service"
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3.5 启动 API

```powershell
cd "D:\code\work agent"
pnpm dev:api
```

### 3.6 启动 Worker

```powershell
cd "D:\code\work agent"
pnpm --filter api dev:worker
```

没有 worker 时：

- 任务可以创建
- 但不会执行完成

### 3.7 启动 Web

```powershell
cd "D:\code\work agent"
pnpm dev:web
```

默认地址：

- Web：`http://localhost:3000`
- API：`http://localhost:3001`

## 4. 环境变量

### 4.1 `apps/api`

必需：

- `DATABASE_URL`
- `SESSION_SECRET`
- `APP_ORIGIN`
- `AI_SERVICE_URL`
- `AI_INTERNAL_SERVICE_TOKEN`

建议确认：

- `API_HOST`
- `API_PORT`
- `SESSION_COOKIE_NAME`
- `AI_SERVICE_TIMEOUT_MS`

### 4.2 `apps/web`

- `API_PROXY_TARGET`

### 4.3 推荐本地值

```powershell
$env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/job_assistant"
$env:SESSION_SECRET="replace-with-a-long-random-secret"
$env:APP_ORIGIN="http://localhost:3000"
$env:AI_SERVICE_URL="http://localhost:8000"
$env:AI_INTERNAL_SERVICE_TOKEN="replace-with-a-shared-internal-token"
$env:API_PROXY_TARGET="http://localhost:3001"
```

## 5. 前端调用规则

### 5.1 统一调用层

页面和组件禁止直接写 `fetch("/api/...")`。

统一通过：

- `apps/web/src/lib/api/client.ts`
- `apps/web/src/lib/api/*`

这里已经统一处理：

- `credentials: "include"`
- `Content-Type`
- `Accept`
- `cache: "no-store"`
- query string 构造
- `ApiError`
- contract 校验

### 5.2 错误语义

当前 AI 页面应统一按下面语义展示：

- `401`
  - 未登录或登录态失效
  - 应引导重新登录
- `404`
  - 岗位、任务或资源不存在
  - 应展示资源不存在，而不是系统异常
- `503`
  - AI service、任务存储或依赖不可用
  - 应展示“稍后再试”型文案，并保留重试入口
- provider 失败但后端已 fallback
  - 前端按成功结果展示，不额外弹系统报错

### 5.3 `x-request-id`

后端会返回 `x-request-id`。

建议前端在开发环境把它打到控制台，方便排查：

- 请求失败时
- 任务执行失败时
- AI 页面拿到 `503` 时

## 6. 异步任务接入说明

### 6.1 当前接口

- `POST /api/jobs/:id/resume/rewrite-suggestions/tasks`
- `GET /api/ai/tasks`
- `GET /api/ai/tasks/:id`
- `GET /api/ai/tasks/ws`

### 6.2 当前任务状态建议

页面至少覆盖：

- `idle`
- `creating`
- `pending`
- `running`
- `succeeded`
- `failed`

### 6.3 当前恢复建议

页面刷新后：

1. 调 `GET /api/ai/tasks`
2. 找到当前岗位对应的 `job_resume_rewrite` 任务
3. 如果仍在 `pending/running`，恢复订阅或轮询
4. 如果已 `succeeded`，再调一次 `GET /api/ai/tasks/:id` 读取权威结果

### 6.4 WebSocket 使用建议

当前协议：

客户端发送：

```json
{
  "type": "subscribe",
  "taskIds": ["task-1"]
}
```

服务端推送：

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

接入原则：

- WebSocket 只做通知
- 收到通知后，最终仍请求一次任务详情
- WebSocket 断开或不可用时，自动降级为轮询
- 不要无限重连刷接口

## 7. 当前推荐联调路径

### 7.1 登录

使用演示账号：

- `demo@example.com`
- `Password123!`

### 7.2 AI 页面联调

推荐顺序：

1. `/resume`
   - 验证解析
   - 验证诊断
2. `/jobs/[id]`
   - 验证岗位详情
   - 验证岗位分析
   - 验证改写建议异步任务

### 7.3 当前异步任务闭环验收

1. 登录
2. 打开岗位详情
3. 输入简历文本
4. 创建改写建议任务
5. 页面进入 `pending/running`
6. worker 执行
7. 页面收到通知或轮询结果
8. 页面用任务详情结果刷新改写建议

## 8. 页面实现建议

### 8.1 首页

- 首页继续按后端分区建模
- 不要打平成统一 feed

### 8.2 简历诊断

- 强调分数、优势、风险、行动清单
- 不要包装成官方测评报告

### 8.3 岗位定向分析

- 强调匹配点、缺口、风险、下一步
- 必须明确是“针对当前岗位”的分析

### 8.4 岗位定向改写建议

- 强调 diff 级改写建议、关键词、行动清单
- 不要包装成“自动生成完整简历”
- 当前不持久化历史版本

### 8.5 `/interview`

- 当前只能当作占位入口和未来工作区预留
- 不应向用户暗示后端能力已上线

## 9. 当前容易踩坑的点

- 不要绕过 `src/lib/api/*`
- 不要把 demo 数据和实时数据混成一个状态源
- 不要把所有错误都显示成同一种系统异常
- 不要把首页分区结果重新打平成单信息流
- 不要让前端直连 `apps/ai-service`
- 不要把任务通知当成最终结果
- 不要忽略 worker 进程

## 10. 相关真相源

- [backend-api.md](/D:/code/work%20agent/apps/api/docs/backend-api.md)
- [backend-progress-and-guidelines.md](/D:/code/work%20agent/apps/api/docs/backend-progress-and-guidelines.md)
- [deployment-checklist.md](/D:/code/work%20agent/apps/api/docs/deployment-checklist.md)
- [frontend-progress-todo.md](/D:/code/work%20agent/apps/web/docs/frontend-progress-todo.md)
- `packages/contracts/src/*`
- `apps/web/src/lib/api/*`

如果接口、contract 或能力边界发生变化，优先更新 contract 与 wrapper，然后同步修改这份文档。
