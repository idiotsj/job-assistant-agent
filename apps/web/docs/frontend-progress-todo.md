# 前后端对齐 Todo

本文档用于持续同步 `apps/web` 前端实现进度与当前后端真实能力状态。

最后更新：`2026-05-23`

## 1. 使用规则

- 状态只保留四种：
  - `todo`
  - `doing`
  - `blocked`
  - `done`
- 每次新增公共接口、contract、关键页面或任务链路，都应同步更新本文件
- 如果出现 `blocked`，必须写清阻塞原因
- 如果改了接口路径、返回骨架或任务语义，必须同步更新：
  - `packages/contracts`
  - `apps/web/src/lib/api/*`
  - 本文档
  - [frontend-backend-handoff.md](/D:/code/work%20agent/apps/web/docs/frontend-backend-handoff.md)

## 2. 当前快照

- 后端主网关：`apps/api`
- 内部 AI 服务：`apps/ai-service`
- 当前核心目标：稳定化收口 + 联调闭环 + 部署检查
- 当前明确未完成：
  - `apps/ingest`
  - `interview` 后端业务域

## 3. 总览面板

| 模块 | 后端状态 | 前端状态 | 当前结论 | 下一步 |
| --- | --- | --- | --- | --- |
| 登录 / 注册 / 当前用户 | ready | doing | 认证闭环已可联调 | 继续收口身份态文案和过期重登体验 |
| 首页推荐 | ready | doing | 真实分区接口已可用 | 继续细化 demo/live 提示和空态 |
| 用户画像 | ready | doing | 真实接口可用 | 继续打磨页面结构与补全提示 |
| 简历解析 / 诊断 | ready | doing | AI 页面可联调 | 统一 `401/503` 文案和状态说明 |
| 岗位列表 / 详情 | ready | doing | 真实接口可用 | 收口筛选、空态和详情信息分层 |
| 岗位定向分析 | ready | doing | 同步接口已可用 | 继续优化抽屉表达和错误分流 |
| 岗位定向改写建议 | ready | doing | 同步接口保留，异步任务接口已上线 | 优先接成异步任务闭环 |
| AI 异步任务 | ready | doing | 后端已具备创建、查询、WS 通知 | 完成页面刷新恢复与 WS 降级轮询 |
| 企业 / 案例 / 活动 | ready | doing | 基础接口可联调 | 继续收口页面层级与引用关系 |
| 日程 | ready | doing | 聚合与 CRUD 可用 | 继续区分来源与周视图状态 |
| 考研 / 考公频道 | ready | doing | 独立频道接口可用 | 继续补导流和内容编排 |
| 面试模拟 | planned | doing | `/interview` 与 `/interview/practice` 现可接占位接口 | 先接 `GET /api/interview/practice`，后续再进入真实业务域联调 |

## 4. 当前优先级

### P0

- [ ] 完成岗位改写建议异步任务闭环
- [ ] 统一 AI 页面 `401 / 404 / 503` 表达
- [ ] 页面刷新后可恢复未完成任务
- [ ] WebSocket 不可用时自动降级为轮询
- [ ] 确保最终结果以任务详情接口为准

### P1

- [ ] 首页继续按后端分区建模，不打平
- [ ] 岗位详情抽屉收口真实分析与任务态改写建议
- [ ] 简历诊断页补“最新解析 / 自动补全字段 / 行动清单”状态说明
- [ ] 收口企业、活动、案例页面的真实数据提示

### P2

- [ ] 继续打磨个人中心、首页和工作区之间的导流
- [ ] 为未来 `/interview` 正式工作区预留可复用任务态模式

## 5. AI 页面特殊说明

- `POST /api/profile/resume/diagnose`
  - 展示重点：分数、优势、风险、行动清单
- `POST /api/jobs/:id/resume/analyze`
  - 展示重点：匹配点、缺口、风险、下一步
- `POST /api/jobs/:id/resume/rewrite-suggestions`
  - 只适合作为同步短链路或兜底
- `POST /api/jobs/:id/resume/rewrite-suggestions/tasks`
  - 当前推荐作为改写建议主入口
  - 需要配套任务详情接口
  - WebSocket 只做通知

## 6. 容易踩坑的点

- [ ] 不要绕过 `src/lib/api/*`
- [ ] 不要把 demo 数据和实时数据混成一个状态源
- [ ] 不要把所有错误都渲染成系统异常
- [ ] 不要把首页分区结果打平成统一信息流
- [ ] 不要让前端直连 `apps/ai-service`
- [ ] 不要把任务通知事件当成最终结果
- [ ] 不要忘记 worker 进程

## 7. 推荐更新模板

每次更新至少同步：

1. `最后更新`
2. `总览面板`
3. `当前优先级`

示例：

```md
- 最后更新：`2026-05-08`
- AI 异步任务：doing -> done
- 新阻塞：WebSocket 在某代理环境不可用，已降级为轮询
```

## 8. 相关文档

- [frontend-backend-handoff.md](/D:/code/work%20agent/apps/web/docs/frontend-backend-handoff.md)
- [backend-api.md](/D:/code/work%20agent/apps/web/docs/backend-api.md)
- [backend-progress-and-guidelines.md](/D:/code/work%20agent/apps/api/docs/backend-progress-and-guidelines.md)
- [deployment-checklist.md](/D:/code/work%20agent/apps/api/docs/deployment-checklist.md)
