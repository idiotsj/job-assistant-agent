# 前端接口接入说明

当前 `apps/web` 不再内嵌后端。

## 1. 请求方式

- 页面和组件禁止直接访问 `src/server/**`
- 页面和组件禁止直接写 `fetch("/api/...")`
- 所有接口统一通过 `src/lib/api/*` 调用

## 2. 本地开发

- `web` 默认把 `/api/*` 代理到 `API_PROXY_TARGET`
- 默认值：`http://localhost:3001`
- 可通过 [apps/web/.env.example](/D:/code/work%20agent/apps/web/.env.example) 配置

## 3. 共享契约

- 前后端共享的公开 schema 和类型位于 `packages/contracts`

## 4. 当前 API wrapper

- `src/lib/api/auth.ts`：登录、注册、退出、当前用户
- `src/lib/api/profile.ts`：画像读取更新、简历解析、通用简历诊断
- `src/lib/api/jobs.ts`：岗位列表、岗位详情、岗位定向分析、岗位定向改写建议
- `src/lib/api/ai-tasks.ts`：岗位改写建议异步任务创建、任务查询、WebSocket 订阅
- `src/lib/api/companies.ts`：企业列表、企业详情
- `src/lib/api/cases.ts`：学生案例列表
- `src/lib/api/events.ts`：活动列表
- `src/lib/api/recommendation.ts`：首页分区推荐
- `src/lib/api/daily-content.ts`：今日建议、精选企业、精选岗位
- `src/lib/api/schedule.ts`：日程聚合与用户自定义日程 CRUD
- `src/lib/api/postgraduate.ts`：考研建议频道
- `src/lib/api/civil-service.ts`：考公建议频道
- `src/lib/api/interview.ts`：面试练习区占位工作区

## 5. 简历相关前端约定

- 简历相关接口当前都使用 `rawText` 文本输入，不支持直接上传二进制文件
- `POST /api/jobs/:id/resume/rewrite-suggestions` 返回的是结构化改写建议，不是整份自动改写后的简历正文
- `GET /api/ai/tasks/:id` 是异步改写建议的权威结果源，任务列表和 WebSocket 只用于恢复与通知
- `GET /api/interview/practice` 当前只返回占位工作区数据，不代表完整面试业务域已经上线
- 所有依赖 AI 的接口都仍然只通过 `apps/api` 调用，前端不要直连 `apps/ai-service`
