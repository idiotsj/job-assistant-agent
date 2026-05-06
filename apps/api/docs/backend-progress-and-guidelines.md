# 后端工作进度与开发规范

本文档用于统一当前项目后端相关团队的认知，包括：

- 当前后端整体进度
- 已落地能力与未完成能力
- 未来阶段规划
- 开发注意事项
- 协作行为规范

适用范围：

- `apps/api`
- `apps/ai-service`
- `apps/ingest`
- `packages/contracts`
- `packages/database`

最后更新：`2026-05-05`

## 1. 项目定位

当前产品主线仍然是“就业优先”的学生就业辅助智能体。

后端职责不是单纯提供 CRUD，而是承接三类能力：

1. 稳定业务网关
2. AI 能力编排与降级
3. 数据导入与内容供给

当前整体架构已经稳定为：

```text
apps/web        -> 用户端前端，只消费公共业务 API
apps/api        -> 唯一公共业务网关，负责鉴权、业务规则、主表写入
apps/ai-service -> 内部 AI 能力层，负责推理、结构化输出、AI 日志
apps/ingest     -> 预留中的 CLI-first 数据导入层，目标承接外部与策展内容入库
packages/*
  contracts     -> 共享 HTTP 契约
  database      -> schema / seed / migrations
```

当前系统边界原则：

- 前端不能直连 `apps/ai-service`
- AI service 不能直接写业务主表
- 导入层不能绕过标准化和校验直接写入业务表
- 所有公共对外能力统一经由 `apps/api`

## 2. 当前进度总览

### 2.1 已经完成并可用的后端能力

#### 公共业务接口

当前 `apps/api` 已经具备并注册了以下主接口：

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
- 案例与活动
  - `GET /api/cases`
  - `GET /api/events`
- 日程
  - `GET /api/schedule`
  - `POST /api/schedule`
  - `PUT /api/schedule/:id`
  - `DELETE /api/schedule/:id`
- 频道内容
  - `GET /api/postgraduate/advice`
  - `GET /api/civil-service/advice`

#### AI 能力层

当前 `apps/ai-service` 已具备下列内部能力：

- `POST /internal/resume/parse`
- `POST /internal/resume/diagnose`
- `POST /internal/resume/analyze-for-job`
- `POST /internal/resume/suggest-rewrite-for-job`
- `POST /internal/recommend/score-jobs`
- `POST /internal/daily/advice`

并已完成这些能力的：

- OpenAI-first provider 抽象
- prompt 版本管理
- pipeline 层封装
- provider 失败时的规则 fallback
- `ai_run_logs` 记录

#### 数据导入层

数据导入能力当前还不能算“已完成并可用”。

目前可以确认的是：

- `apps/ingest` 目录已经预留
- `packages/database/schema.sql` 中已经存在：
  - `import_batches`
  - `import_batch_errors`
- 数据库层已经为导入能力预留了部分结构

但当前仓库状态仍存在明显缺口：

- `apps/ingest` 下没有可维护的 Python 源码文件
- 当前只能看到目录结构和 `__pycache__` 痕迹
- CLI 入口、normalizer、matcher、importer 的正式源码不在当前工作区可用状态

因此现阶段应将导入层视为：

- 已有目标结构与数据库预留
- 但应用代码未完整入库
- 暂时不能作为“可直接运行”的正式能力对外宣称

导入层目标设计仍然保持为：

- 支持格式：
  - `CSV`
  - `JSON array`
- 支持事实数据：
  - `companies`
  - `jobs`
  - `career_events`
- 支持人工策展内容：
  - `student_cases`
  - `daily_content`
  - `postgraduate_advice`
  - `civil_service_advice`

### 2.2 当前前端联调状态

当前前端已经不再是最初的少数页面骨架，而是正式进入多路由、多壳层阶段。

前端当前已存在页面入口：

- `(dashboard)`
  - `/`
  - `/resume`
  - `/jobs`
  - `/jobs/[id]`
  - `/companies`
  - `/companies/[id]`
  - `/events`
  - `/cases`
  - `/schedule`
  - `/profile`
  - `/postgraduate`
  - `/civil-service`
  - `/interview`
- `(auth)`
  - `/login`
  - `/register`

这意味着：

- 后端现有资源型接口已经足够支撑大多数页面真实联调
- 后端下一阶段不再只是“把已有页面需要的基础接口补齐”
- 现在更重要的是：
  - 稳定现有接口行为
  - 给前端更清晰的错误语义
  - 开始承接前端已经出现入口但尚无真实后端能力的模块

### 2.3 当前验证状态

当前实测状态：

- `pnpm --filter @job-assistant/contracts typecheck` 通过
- `pnpm --filter api typecheck` 通过
- `pnpm --filter api test` 通过
- `pnpm --filter api build` 通过
- `python -m pytest apps/ai-service/tests` 通过

说明：

- `apps/api` 的 test/typecheck 阻塞已解除
- 当前新增的异步任务底座也已纳入 `apps/api` 测试范围

### 2.4 当前已确认的实现偏差

这部分不是对外接口兼容问题，但属于当前实现和规范之间已经确认的偏差，后续需要逐步收口：

- `GET /health` 已实现，但旧文档没有完整记录
- `POST /api/auth/login` 与 `POST /api/auth/logout` 已抽为独立处理文件
- 由于 Cookie Session 仍由 Fastify 挂载，两者通过注册层桥接 session 读写
- 部分业务模块已经直接复用 `@job-assistant/contracts`
  - 例如 `jobs/profile/companies`
- 因此“内部 schema 与 contracts 完全双轨复制”这个判断并不准确
- 但仍需要继续留意剩余模块是否存在契约漂移风险

## 3. 当前阶段判断

### 3.1 已进入“产品化收口”阶段

项目已经明显不处于“只有几张演示页面”的最早期阶段。

现在后端面对的是：

- 前端多页面开始真实消费 API
- AI 能力已经形成可复用底座
- 数据导入已有目录与数据库预留，但应用层仍未完整落地
- 页面开始要求更稳定的错误语义、空态和边界

因此接下来的后端开发重点应该从“多做几个接口”转向：

- 提高现有能力稳定性
- 保证测试和回归链路
- 为下一批真正的重要业务模块铺路

### 3.2 当前最值得进入下一阶段的能力

从当前代码和前端状态看，下一阶段最值得正式推进的是：

1. 异步 AI 任务底座继续稳定化
2. 面试模拟
3. 更真实的数据供给

原因：

- 已有同步 AI 能力开始进入“同步保留 + 异步并行新增”的阶段
- `/interview` 已经进入正式导航，但当前只有占位页，没有真实后端能力
- 首页和多频道页面已经需要更多真实内容支撑，不能长期依赖 demo 数据
- 简历 AI 能力已经有了，但结果表达、错误语义和可运维性还需要继续收口

## 4. 未来发展规划

### 4.1 短期规划：稳定化与补短板

短期目标是把当前系统从“功能已成型”推进到“可以持续迭代的稳定基线”。

建议优先顺序：

1. 继续收口已有接口行为和文档
2. 稳定异步任务底座与岗位定向改写建议试点
3. 把 `apps/ingest` 从“目录与数据库预留”推进到“真正可运行的源码工程”
4. 启动面试模拟 V1

短期重点事项：

- 统一 `401 / 404 / 409 / 503` 的使用语义
- 明确 AI 接口在 provider 失败和 service 不可达时的行为区别
- 让前端 demo/live 双态更容易和真实 API 对齐
- 给后续面试模块留出清晰的业务域边界
- 稳定 `HTTP 创建任务 + 查询任务 + WebSocket 通知` 这条异步基础链路

### 4.2 中期规划：面试模拟与异步能力

中期最重要的新业务域建议是 `interview`。

建议 V1 目标不是实时数字人，而是一个可控的同步式训练闭环：

- 创建面试会话
- 基于岗位或方向生成题目
- 记录用户回答
- 生成结构化反馈
- 保存本次训练结论

建议新增模块：

- `modules/interview`
  - `schema.ts`
  - `repository.ts`
  - `service.ts`
- `workflows/interview`
  - `run-interview-session.ts`
  - `score-interview-answer.ts`

建议新增公共接口：

- `POST /api/interview/sessions`
- `GET /api/interview/sessions/:id`
- `POST /api/interview/sessions/:id/answer`
- `POST /api/interview/sessions/:id/finish`
- 可选：
  - `GET /api/interview/sessions`

建议新增 AI 能力：

- `POST /internal/interview/generate-questions`
- `POST /internal/interview/score-answer`
- `POST /internal/interview/summarize-session`

### 4.3 长期规划：异步工作流与反馈闭环

当前系统已经有 workflow 和 pipeline 的雏形，并新增了第一版异步 AI 任务底座。

长期规划可以分三块：

#### 异步工作流

- 推荐预计算
- 周报生成
- AI 面试总结
- 批量内容生成

#### 用户反馈闭环

- AI 结果反馈标记
- 推荐点击/采纳反馈
- 诊断/改写建议采纳情况记录

#### 数据侧增强

- 更系统的批量导入
- 导入审计与回滚能力
- 更规范的内容运营后台能力

## 5. 当前后端开发优先级建议

建议当前开发优先级如下：

### P0：必须先处理

- 校验 `apps/api` 当前所有已注册路由是否仍与 `packages/contracts` 对齐
- 继续确保 AI 依赖不可用时首页和简历能力有明确降级语义
- 校验异步任务 worker 与 WebSocket 通知链路在本地和部署环境都可稳定运行

### P1：继续打磨现有能力

- 岗位列表、企业列表、活动列表的筛选与分页体验继续稳定化
- 画像页相关返回数据适配新版前端个人中心编排
- 简历诊断与岗位分析接口继续明确错误与 fallback 表达
- 数据导入从“数据库已预留”推进到“源码落地 + 第一批真实样本接入”

### P2：下一块正式新功能

- 启动 `interview` 业务域
- 先做文本问答与结构化复盘，不直接进入实时音视频

## 6. 开发注意事项

### 6.1 公共业务 API 规范

- 所有公共接口都必须通过 `apps/api` 暴露
- 路由层只做：
  - 鉴权
  - 解析参数
  - 调 service/workflow
  - 返回统一响应
- 路由层禁止：
  - 写 SQL
  - 写推荐逻辑
  - 写 AI prompt 逻辑
  - 写复杂聚合编排

### 6.2 模块边界规范

- `modules/*` 负责单业务域逻辑
- `workflows/*` 负责跨模块编排
- `integrations/*` 负责外部或内部服务接入
- `core/*` 负责基础设施，不承担业务语义

判断原则：

- 如果一个能力只需要一个模块的数据和规则，优先放 `service`
- 如果一个能力要跨多个模块协同，优先放 `workflow`
- 如果一个能力只是调用模型、外部服务、第三方接口，优先放 `integration`

### 6.3 AI 能力规范

- AI service 只负责：
  - provider 调用
  - prompt 版本
  - pipeline 编排
  - fallback
  - AI 日志
- AI service 不得直接写：
  - `user_profiles`
  - `jobs`
  - `companies`
  - `student_cases`
  - 其他业务主表
- 业务写回必须仍由 `apps/api` 控制

### 6.4 数据导入规范

- 导入必须走：
  - 原始文件
  - 标准化
  - schema 校验
  - 去重匹配
  - upsert
  - batch/error 记录
- 不可信原始数据禁止直接写业务表
- `seed.sql` 只用于演示，不作为正式导入渠道

### 6.5 契约规范

- 所有公共 HTTP 契约以 `packages/contracts` 为真相源
- 修改公共接口时，必须同步更新：
  - `packages/contracts`
  - `apps/api`
  - `apps/web/src/lib/api/*`
  - 接口文档 / 交接文档

补充说明：

- 当前已有多个模块直接从 `@job-assistant/contracts` 复用 schema 和 type
- 后续应继续优先复用共享契约，而不是在 `apps/api` 内复制一份近似 schema

### 6.6 错误语义规范

- `401`：未登录或会话无效
- `404`：资源不存在
- `409`：冲突，如邮箱已注册
- `503`：依赖服务不可用，如 AI service 不可达
- provider 失败但有 fallback 时：
  - 公共接口应尽量返回可用结果
  - 不要把可降级的问题轻易升级成整个请求失败

## 7. 开发行为规范

### 7.1 修改前必须先确认的事情

- 这次修改属于 `module`、`workflow`、`integration` 还是 `core`
- 是否会影响 `packages/contracts`
- 是否会影响前端现有页面或 `src/lib/api/*`
- 是否会影响 AI service 或 ingest 的边界

### 7.2 代码修改要求

- 新增公共能力时优先写测试，再落路由
- 复杂能力必须先想清楚模块边界，不要把逻辑堆到 route
- 能通过已有 workflow 复用的，不要在新路由重复编排
- 如果是 AI 能力新增，优先保持“同步可用、异步预留”的策略

### 7.3 文档更新要求

以下情况必须同步更新文档：

- 新增公共 API
- 新增内部 AI 能力
- 修改 contract
- 修改前后端协作边界
- 新增正式业务模块

优先更新位置：

- `apps/api/docs/backend-api.md`
- 本文档
- `apps/web/docs/frontend-backend-handoff.md`
- `apps/web/docs/frontend-progress-todo.md`

### 7.4 联调行为规范

- 不要让前端直接猜测后端行为
- 如果接口行为、错误语义、空态策略有变化，先同步文档
- 对 AI 结果的表达必须保持“辅助建议”边界，不写成“绝对结论”

## 8. 现在最需要团队注意的风险

### 8.1 异步运行风险

异步任务底座已经入库并接入公共接口，这意味着：

- worker 进程需要被纳入本地启动和部署编排
- 前端后续会开始同时消费同步接口和任务接口
- 文档与交接文件如果不同步，协作方很容易误解当前能力边界

### 8.2 文档与代码状态漂移风险

当前根目录 README 的状态已经落后于真实代码结构。

这说明项目正在快速演进，文档如果不及时同步，会出现：

- 前端以为后端没做
- 后端以为前端还没接
- 接手同学被旧文档误导

### 8.3 伪完成风险

现在前端已经有 `/interview` 等正式入口。

后端后续开发要注意：

- 不要用“先放个假接口”让页面看起来像完成了
- 占位态可以有，但必须明确说明是占位
- 新能力进入主导航之前，最好先有最小可用闭环

## 9. 推荐的下一步执行顺序

建议后端下一阶段按下面顺序推进：

1. 做一轮现有接口稳定化与文档同步
2. 稳定岗位定向简历改写的异步任务试点
3. 补齐 `apps/ingest` 的正式源码，再接入第一批真实导入样本
4. 启动 `interview` 模块 V1，并优先按异步能力思路设计
5. 为后续反馈闭环预留表结构与边界

## 10. 维护建议

为了让这份文档持续可用，建议每次后端阶段性迭代后至少同步下面几项：

- 当前日期
- 当前验证状态
- 当前优先级
- 已完成模块
- 未完成但已经进入导航或产品主流程的模块

如果新增的是 AI 能力或新业务域，应同时同步：

- `apps/api/docs/backend-api.md`
- `apps/web/docs/frontend-backend-handoff.md`
- `apps/web/docs/frontend-progress-todo.md`

这样前后端、AI、数据导入三条线才不会各自演进成三套状态表述。
