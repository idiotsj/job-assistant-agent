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

- 最后更新：`2026-04-17`
- 后端主网关：`apps/api`
- 内部 AI 服务：`apps/ai-service`
- 前端当前已有页面骨架：
  - `/`
  - `/jobs`
  - `/resume`

## 3. 总览面板

| 模块 | 后端状态 | 前端状态 | 当前结论 | 下一步 |
| --- | --- | --- | --- | --- |
| 登录 / 注册 / 当前用户 | ready | todo | 接口已可用，但前端登录链路未成型 | 做登录页、注册页、`/api/auth/me` 初始化 |
| 首页推荐 | ready | doing | 已有首页控制中心骨架，可继续联调真实数据 | 收口 demo/live 状态与真实错误提示 |
| 用户画像 | ready | todo | 后端已具备完整读取和更新能力 | 做画像页与首次补全引导 |
| 岗位列表 / 详情 | ready | doing | 已有岗位页骨架，可继续接筛选和详情增强 | 做筛选、空态、真实详情展示 |
| 岗位定向分析 | ready | doing | 抽屉结构已落地，后端可用 | 补登录态、错误态、真实数据细节 |
| 岗位定向改写建议 | ready | doing | 接口与前端 wrapper 已可用 | 做“建议采纳”交互设计，但不要伪装成自动改写 |
| 简历解析 / 诊断 | ready | doing | 诊断页骨架已落地 | 收口状态设计，补文案边界 |
| 企业列表 / 详情 | ready | todo | 后端已具备 | 做企业列表页 |
| 学生案例 | ready | todo | 后端已具备 | 做案例列表或首页扩展卡片 |
| 活动 / 宣讲会 | ready | todo | 后端已具备 | 做活动列表与近期活动区 |
| 日程 | ready | todo | 后端聚合逻辑已具备 | 做时间线页，并区分可编辑来源 |
| 考研频道 | ready | todo | 后端已具备独立频道接口 | 做独立页面，不混入首页 |
| 考公频道 | ready | todo | 后端已具备独立频道接口 | 做独立页面，不混入首页 |

## 4. 当前优先级清单

### P0：必须先打通

- [ ] 登录页 / 注册页 / 退出按钮
- [ ] 全局登录态恢复：基于 `GET /api/auth/me`
- [ ] 用户画像页：至少能编辑 `targetCities`、`targetIndustries`、`skills`、`preferredJobTypes`
- [ ] 首页真实数据切换时，明确提示当前是 `live` 还是 `demo`
- [ ] AI 页面统一处理 `401` / `404` / `503`

### P1：主链路体验

- [ ] 首页分区继续按后端结构展示，不打平成统一 feed
- [ ] 岗位列表支持真实筛选和空态
- [ ] 岗位详情页补完整信息块
- [ ] 简历诊断页补“最新解析 / 自动补全字段 / 行动清单”状态说明
- [ ] 岗位分析抽屉补“分析结果”和“改写建议”的清晰分区

### P2：扩展页面

- [ ] 企业列表页
- [ ] 学生案例页
- [ ] 活动 / 宣讲会页
- [ ] 日程页
- [ ] 考研频道
- [ ] 考公频道

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
