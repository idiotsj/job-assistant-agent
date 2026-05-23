# 后端工作进度与开发规范

本文档用于统一当前项目后端团队的真实状态认知，覆盖：

- 现阶段已经交付的能力
- 明确未完成或仅占位的部分
- 当前开发优先级
- 后端协作与开发规范
- 下一阶段建议发展方向

适用范围：

- `apps/api`
- `apps/ai-service`
- `packages/contracts`
- `packages/database`
- 未来的 `apps/ingest`

最后更新：`2026-05-23`

## 1. 当前项目判断

当前后端已经进入“稳定化收口 + 联调闭环”阶段。

这意味着我们本轮的重点不是继续扩新业务域，而是把现有链路收口成一个稳定、可演示、可联调、可部署核对的基线：

1. 简历 AI 主链路可用
2. 岗位定向分析与改写建议可用
3. 异步任务链路可创建、可查询、可通知、可恢复
4. 文档、README、前后端交接说明一致

本轮明确不应误解为已正式开工的内容：

- `apps/ingest`
- `interview` 后端业务域
- 新一批 AI 能力扩张

## 2. 当前架构真相

当前仓库的真实分层如下：

```text
apps/web        -> 用户端前端，只消费公共业务 API
apps/api        -> 唯一公共业务网关，负责鉴权、业务规则、任务创建、主表写回
apps/ai-service -> 内部 AI 能力层，负责结构化推理、prompt、provider、fallback、AI 日志
apps/admin      -> 预留目录，未实现
apps/ingest     -> 目标中的导入层，当前未正式实现

packages/contracts -> 前后端共享 HTTP 契约
packages/database  -> schema / seed / migrations
```

系统边界原则：

- 前端不能直连 `apps/ai-service`
- AI service 不能直接写业务主表
- 所有公共能力都必须经由 `apps/api`
- 异步任务对外也必须由 `apps/api` 管理
- `apps/ingest` 目前不算已交付能力

## 3. 当前已完成能力

### 3.1 公共业务 API

当前 `apps/api` 已注册并可用的主接口包括：

- 健康检查
  - `GET /health`
- 认证
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- 用户画像
  - `GET /api/profile`
  - `PUT /api/profile`
- 简历能力
  - `POST /api/profile/resume/parse`
  - `POST /api/profile/resume/diagnose`
- 面试占位工作区
  - `GET /api/interview/practice`
- 首页推荐
  - `GET /api/recommend/home`
  - `GET /api/daily-content/today`
- 岗位
  - `GET /api/jobs`
  - `GET /api/jobs/:id`
  - `POST /api/jobs/:id/resume/analyze`
  - `POST /api/jobs/:id/resume/rewrite-suggestions`
  - `POST /api/jobs/:id/resume/rewrite-suggestions/tasks`
- AI 任务
  - `GET /api/ai/tasks`
  - `GET /api/ai/tasks/:id`
  - `GET /api/ai/tasks/ws`
- 企业
  - `GET /api/companies`
  - `GET /api/companies/:id`
- 内容与活动
  - `GET /api/cases`
  - `GET /api/events`
- 日程
  - `GET /api/schedule`
  - `POST /api/schedule`
  - `PUT /api/schedule/:id`
  - `DELETE /api/schedule/:id`
- 频道
  - `GET /api/postgraduate/advice`
  - `GET /api/civil-service/advice`

### 3.2 AI 能力层

当前 `apps/ai-service` 已具备以下内部能力：

- `POST /internal/resume/parse`
- `POST /internal/resume/diagnose`
- `POST /internal/resume/analyze-for-job`
- `POST /internal/resume/suggest-rewrite-for-job`
- `POST /internal/recommend/score-jobs`
- `POST /internal/daily/advice`

并已经落地：

- OpenAI-first provider 抽象
- prompt 版本管理
- pipeline 层封装
- provider 失败时规则 fallback
- `ai_run_logs`

### 3.3 异步任务底座

当前异步任务能力已经正式落在 `apps/api`：

- PostgreSQL 作为第一版任务队列
- 独立 worker 进程负责 claim 与执行
- Web/API 进程负责创建任务、查询任务、WebSocket 通知
- 第一条试点能力为 `job_resume_rewrite`

当前对外任务接口：

- `POST /api/jobs/:id/resume/rewrite-suggestions/tasks`
- `GET /api/ai/tasks`
- `GET /api/ai/tasks/:id`
- `GET /api/ai/tasks/ws`

当前设计边界：

- WebSocket 只做通知
- 任务详情接口是权威结果源
- 没有 worker 时任务只能创建，不能完成执行
- 第一版不做自动重试

### 3.4 当前未完成或仅占位部分

以下内容必须明确标记为未完成：

- `apps/ingest`
  - 目前不是可运行的正式导入工程
  - `schema.sql` 虽然已有导入相关表，但应用代码未交付
- `interview`
  - 前端已有 `/interview` 与 `/interview/practice` 占位入口
  - 后端当前只提供占位工作区读取接口，不代表正式 `interview` 业务域已完成
- `apps/admin`
  - 仅预留目录
  - 不在当前交付范围

## 4. 当前验证状态

截至本轮，建议作为稳定基线的验证项为：

- `pnpm --filter @job-assistant/contracts typecheck`
- `pnpm --filter api typecheck`
- `pnpm --filter api test`
- `pnpm --filter api build`
- `pnpm --filter web test`
- `pnpm --filter web typecheck`
- `pnpm typecheck`
- `python -m pytest apps/ai-service/tests`

除此之外，还需要做联调验证：

1. 登录
2. 打开岗位详情
3. 发起岗位分析
4. 创建改写建议异步任务
5. worker 成功执行
6. `GET /api/ai/tasks/:id` 返回最终结果
7. WebSocket 可用时收到通知
8. WebSocket 不可用时页面自动降级到轮询

## 5. 当前开发优先级

### P0

- 收口岗位改写建议的异步任务闭环
- 统一 AI 页面 `401 / 404 / 503` 的错误语义
- 确保 worker 与 WebSocket 链路在本地和部署环境都可验证
- 保证文档不再把 `apps/ingest` 写成已完成
- 保证文档明确 `/interview` 仍是占位入口

### P1

- 稳定现有岗位、企业、活动、日程等资源接口的真实联调体验
- 收口 demo/live 双态与真实 API 状态之间的表达
- 完善部署检查清单、最小运行组合和环境变量说明

### P2

- 评估 `apps/ingest` 正式落地时机
- 评估 `interview` 业务域何时开工

## 6. 现阶段最重要的开发规范

### 6.1 路由层规范

路由层只做：

- 鉴权
- 参数解析
- 调用 service / workflow
- 返回统一响应

路由层禁止：

- 写 SQL
- 写 AI prompt
- 写推荐打分逻辑
- 写复杂跨模块编排

### 6.2 模块边界规范

- `modules/*`
  - 负责单业务域逻辑
  - 保持 `schema + repository + service`
- `workflows/*`
  - 负责跨模块编排
  - 例如推荐、岗位简历工作流、任务执行复用流程
- `integrations/*`
  - 负责内部或外部服务接入
- `core/*`
  - 负责基础设施

判断原则：

- 单域规则优先放 `service`
- 跨域协同优先放 `workflow`
- 调外部服务优先放 `integration`

### 6.3 AI 边界规范

- `apps/ai-service` 只负责：
  - provider 调用
  - prompt 版本
  - pipeline
  - fallback
  - AI 日志
- `apps/ai-service` 不得直接写：
  - `user_profiles`
  - `jobs`
  - `companies`
  - `student_cases`
  - 任何业务主表

业务写回必须仍由 `apps/api` 控制。

### 6.4 契约规范

所有公共 HTTP 契约以 `packages/contracts` 为真相源。

修改公共接口时，必须同步更新：

- `packages/contracts`
- `apps/api`
- `apps/web/src/lib/api/*`
- `apps/api/docs/backend-api.md`
- `apps/web/docs/frontend-backend-handoff.md`
- `apps/web/docs/frontend-progress-todo.md`

### 6.5 错误语义规范

- `401`
  - 未登录或会话无效
- `404`
  - 资源不存在
- `409`
  - 冲突
- `503`
  - 依赖服务不可用

特别说明：

- provider 失败但 pipeline 已 fallback 时，公共接口应尽量返回可用结果
- AI service 不可达、任务存储不可用、worker 恢复超时等依赖故障，统一按 `503` 或任务失败稳定错误码表达

### 6.6 异步任务规范

当前阶段默认规则：

- 新的重型 AI 能力优先考虑异步化
- WebSocket 只做通知，不做权威结果载体
- 前端必须以任务详情接口返回为准
- 页面刷新后应能通过任务列表恢复上下文
- 任务失败结果必须保留稳定 `error.code`

## 7. 当前风险点

### 7.1 异步运行风险

异步任务底座已进入公共接口层，意味着：

- worker 进程必须被纳入本地与云端运行编排
- 少一个 worker，任务链路就不是完整闭环
- WebSocket 如果没有正确升级，前端必须走轮询兜底

### 7.2 文档漂移风险

当前项目演进较快，如果不及时同步文档，会直接造成：

- 前端误判后端未实现
- 后端误判前端已接完
- 新接手同学被旧文档误导

### 7.3 伪完成风险

需要避免：

- 把占位路由包装成已完成业务域
- 把数据库预留表结构包装成已交付应用能力
- 把有 demo 回退的页面误写成已完成联调闭环

## 8. 推荐的下一步顺序

建议按以下顺序推进：

1. 收口现有异步任务闭环和错误语义
2. 完成文档、README、交接说明同步
3. 补部署检查与最小运行组合说明
4. 再单独评估 `apps/ingest`
5. 最后启动 `interview` 模块 V1

## 9. 文档维护要求

以下情况必须同步更新文档：

- 新增公共 API
- 新增内部 AI 能力
- contract 变化
- 新增异步任务能力
- 调整部署方式或最小运行组合

优先更新位置：

- [backend-api.md](/D:/code/work%20agent/apps/api/docs/backend-api.md)
- [deployment-checklist.md](/D:/code/work%20agent/apps/api/docs/deployment-checklist.md)
- 本文档
- [frontend-backend-handoff.md](/D:/code/work%20agent/apps/web/docs/frontend-backend-handoff.md)
- [frontend-progress-todo.md](/D:/code/work%20agent/apps/web/docs/frontend-progress-todo.md)
