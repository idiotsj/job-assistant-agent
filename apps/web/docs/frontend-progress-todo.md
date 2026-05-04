# 前后端对齐 Todo

本文档用于持续同步 `apps/web` 前端实现进度与 `apps/api` / `apps/ai-service` 后端能力现状。

适用场景：

- 前后端协作排期
- 交接时快速判断“哪个模块已经能接，哪个模块还没做”
- 每次新增能力后同步更新执行清单

## 1. 使用规则

- 每次新增公共接口、调整 contract、补一个关键页面，都应更新本文件。
- 状态只保留四种：
  - `todo`：后端已具备或已规划，前端尚未开始
  - `doing`：前端正在实现
  - `blocked`：存在依赖或决策阻塞
  - `done`：已完成并通过基本联调/构建验证
- 若某项进入 `blocked`，必须写明阻塞原因，不要只改状态。
- 如果接口路径、contract 或返回骨架变化，先更新：
  - `packages/contracts`
  - `apps/web/src/lib/api/*`
  - 本文档
  - [frontend-backend-handoff.md](/D:/code/work%20agent/apps/web/docs/frontend-backend-handoff.md)

## 2. 当前快照

- 最后更新：`2026-05-04`
- 后端主网关：`apps/api`
- 内部 AI 服务：`apps/ai-service`
- 前端当前路由结构：
  - `(dashboard)`：`/`、`/resume`、`/jobs`、`/jobs/[id]`、`/companies`、`/companies/[id]`、`/events`、`/cases`、`/schedule`、`/profile`、`/postgraduate`、`/civil-service`
  - `(auth)`：`/login`、`/register`
- 前端当前壳层现状：
  - 根布局只负责 `AuthProvider`
  - `DashboardShell + BrandTopBar` 已接到 `(dashboard)` 路由组
  - `ConversationShell` 组件已存在，但尚未接入正式页面路由

## 3. 总览面板

| 模块 | 后端状态 | 前端状态 | 当前结论 | 下一步 |
| --- | --- | --- | --- | --- |
| 登录 / 注册 / 当前用户 | ready | doing | `/login`、`/register` 和 `GET /api/auth/me` 会话恢复已落地，但新主壳层里的退出入口还未统一 | 把退出登录和身份操作补进当前主流顶栏 / 身份区 |
| 首页推荐 | ready | doing | 首页和仪表盘壳层都已存在，可继续按新母版收口模块编排与 live/demo 提示 | 收口首页任务卡、推荐区和真实状态提示 |
| 用户画像 | ready | doing | `/profile` 已可读取并保存核心字段，但还未完全对齐新版个人中心母版 | 继续补阶段任务、趋势区和更完整的身份信息编排 |
| 岗位列表 / 详情 | ready | doing | 列表页、详情页都已存在，可继续增强筛选、信息块和跳转链路 | 收口筛选、空态、详情信息分层 |
| 岗位定向分析 | ready | doing | 分析能力已接入当前页面流，但还没有迁入正式对话工作区 | 为后续 AI 对话工作区预留更清晰的承载方式 |
| 岗位定向改写建议 | ready | doing | 接口与前端 wrapper 已可用，当前仍以 V1 交互呈现 | 做建议采纳、对比展示和来源说明 |
| 简历解析 / 诊断 | ready | doing | 诊断页已可工作，仍需对齐新视觉与状态边界 | 收口最新解析、字段补全和行动清单表达 |
| 企业列表 / 详情 | ready | doing | 列表页和详情页都已存在，已具备继续联调的前端骨架 | 完善筛选体验、详情信息层级和首页引用位 |
| 学生案例 | ready | doing | 列表页已存在，支持演示态与真实数据切换 | 对齐首页引用卡和频道引用方式 |
| 活动 / 宣讲会 | ready | doing | 列表页已存在，适合作为首页和日程的内容来源 | 继续补报名提醒和时间线联动 |
| 日程 | ready | doing | `/schedule` 已落地 `page + hook + sections` 结构，并支持聚合与编辑 | 继续补来源区分、周视图和更多状态细节 |
| 考研频道 | ready | doing | 独立频道页已存在，可继续对齐新版频道壳层 | 补频道导流、解释卡和首页联动 |
| 考公频道 | ready | doing | 独立频道页已存在，可继续对齐新版频道壳层 | 补频道导流、解释卡和首页联动 |

## 4. 当前优先级清单

### P0：必须先打通

- [ ] 新主壳层补齐退出登录入口与身份操作区，不再只留在旧侧栏组件里
- [ ] 个人中心继续对齐新版母版，把已有画像能力组织成更完整的用户阶段页
- [ ] 首页真实数据切换时，明确提示当前是 `live` 还是 `demo`
- [ ] AI 页面统一处理 `401` / `404` / `503`

### P1：主链路体验

- [ ] 首页分区继续按后端结构展示，不打平成统一 feed
- [ ] 岗位列表支持真实筛选和空态
- [ ] 岗位详情页补完整信息块
- [ ] 简历诊断页补“最新解析 / 自动补全字段 / 行动清单”状态说明
- [ ] 岗位分析抽屉补“分析结果”和“改写建议”的清晰分区
- [ ] 对话工作区正式接入独立路由，不再只停留在组件基座层

### P2：扩展页面

- [ ] 企业、案例、活动、日程、双频道页面继续向新版仪表盘视觉和模块语义收口
- [ ] 首页、个人中心、就业广场、面试模拟之间补齐统一的跨页导流关系

## 5. AI 页面特殊说明

这些能力最容易因为文案或交互误导用户，前端实现时务必保持边界清晰：

- `POST /api/profile/resume/diagnose`
  - 展示重点：分数、优势、风险、行动清单
  - 不要包装成“官方评测报告”
- `POST /api/jobs/:id/resume/analyze`
  - 展示重点：匹配点、缺口、风险、下一步
  - 必须明确这是“针对当前岗位的分析”
- `POST /api/jobs/:id/resume/rewrite-suggestions`
  - 展示重点：结构化改写建议、关键词、分段建议
  - 不要写成“已自动生成最终简历”
  - 当前结果不持久化，也不保留历史版本

## 6. 容易踩坑的点

- [ ] 不要在页面里自己计算推荐分或重新排序
- [ ] 不要绕过 `src/lib/api/*` 直接请求接口
- [ ] 不要把 demo 数据和真实数据混成一个状态源
- [ ] 不要把所有错误都显示成“接口异常”
- [ ] 不要把首页后端分区结果重新打平成单一信息流
- [ ] 不要让前端直连 `apps/ai-service`

## 7. 推荐更新模板

每次更新本文件时，建议至少改这三处：

1. `最后更新`
2. `总览面板`
3. `当前优先级清单`

示例：

```md
- 最后更新：`2026-04-20`
- 岗位列表 / 详情：doing -> done
- 新阻塞：画像页等待字段文案确认
```

## 8. 相关文档

- [frontend-backend-handoff.md](/D:/code/work%20agent/apps/web/docs/frontend-backend-handoff.md)
- [frontend-api-integration.md](/D:/code/work%20agent/apps/web/docs/frontend-api-integration.md)
- [frontend-design-spec.md](/D:/code/work%20agent/apps/web/docs/frontend-design-spec.md)
- [backend-api.md](/D:/code/work%20agent/apps/web/docs/backend-api.md)
