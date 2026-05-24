# 演示 Runbook

本文档面向当前阶段的功能演示，目标是让演示者按固定路径稳定走完“登录 -> 简历 AI -> 岗位分析 -> 异步改写任务 -> 面试占位工作区”闭环。

最后更新：`2026-05-24`

## 1. 演示目标

当前推荐演示的主线是：

1. 用户登录与会话保持
2. 简历解析与通用诊断
3. 岗位定向分析
4. 岗位定向改写建议异步任务
5. 面试练习区占位接口联调

本轮不建议在演示中把下面内容说成“已经正式完成”：

- `apps/ingest`
- 完整 `interview` 业务域
- `apps/admin`

## 2. 最小启动组合

要完整演示当前闭环，最少启动：

1. `PostgreSQL`
2. `web`
3. `api`
4. `api worker`

如果要展示真实 AI 效果，而不是只看失败/降级语义，还需要：

5. `ai-service`

## 3. 启动顺序

### 3.1 安装依赖

```powershell
cd "D:\code\work agent"
pnpm install
```

### 3.2 初始化数据库

```powershell
psql -U postgres -d job_assistant -f "D:\code\work agent\packages\database\schema.sql"
psql -U postgres -d job_assistant -f "D:\code\work agent\packages\database\seed.sql"
```

如果是已有环境，优先执行：

```powershell
psql -U postgres -d job_assistant -f "D:\code\work agent\packages\database\migrations\20260413_add_schedule_items_user_fk.sql"
psql -U postgres -d job_assistant -f "D:\code\work agent\packages\database\migrations\20260505_add_ai_tasks.sql"
```

### 3.3 启动 `ai-service`

```powershell
cd "D:\code\work agent\apps\ai-service"
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3.4 启动 `api`

```powershell
cd "D:\code\work agent"
pnpm dev:api
```

### 3.5 启动 `api worker`

```powershell
cd "D:\code\work agent"
pnpm dev:worker
```

### 3.6 启动 `web`

```powershell
cd "D:\code\work agent"
pnpm dev:web
```

默认地址：

- Web：`http://localhost:3000`
- API：`http://localhost:3001`
- AI Service：`http://localhost:8000`

## 4. 演示前检查

- 已配置 `DATABASE_URL`
- 已配置 `SESSION_SECRET`
- 已配置 `APP_ORIGIN`
- 已配置 `AI_SERVICE_URL`
- 已配置 `AI_INTERNAL_SERVICE_TOKEN`
- `ai_tasks` 表已存在
- `api worker` 正在运行
- 前端能通过同域代理访问 `/api/*`

## 5. 推荐演示路径

### Step 1. 登录

使用演示账号：

- Email：`demo@example.com`
- Password：`Password123!`

预期结果：

- 登录成功
- 刷新页面后仍能保持会话

### Step 2. 进入简历工作区

页面：

- `/resume`

建议演示顺序：

1. 先展示演示态
2. 粘贴一段简历纯文本
3. 点击“结构解析”
4. 再点击“AI 体检”

预期结果：

- 页面能区分 demo / live
- 解析后出现结构化字段与保守画像补丁
- 诊断后出现总分、优势、风险、行动清单

### Step 3. 进入岗位详情与岗位分析

页面：

- `/jobs`

建议演示顺序：

1. 打开某个岗位详情抽屉
2. 粘贴同一份简历文本
3. 触发岗位定向分析

预期结果：

- 返回匹配点、缺口、风险、下一步
- 页面明确区分 live 分析与 demo 兜底

### Step 4. 演示异步改写建议任务

在岗位分析抽屉继续操作：

1. 创建改写建议任务
2. 观察任务从 `pending/running` 到完成
3. 等待 worker 执行
4. 页面通过 WebSocket 或轮询更新
5. 最终结果以任务详情接口为准刷新

预期结果：

- 页面出现任务状态提示
- worker 正常消费
- 页面刷新后仍可恢复最近任务
- 任务完成后显示真实改写建议

### Step 5. 演示面试占位工作区

页面：

- `/interview`
- `/interview/practice`

建议演示顺序：

1. 先进入 `/interview` 展示模块入口
2. 再进入 `/interview/practice`
3. 说明这里现在接的是“真实占位接口”，不是完整面试引擎

预期结果：

- 页面能同步 `/api/interview/practice`
- 页面展示工作区状态、模块信息和推荐动作
- 未登录时不会伪装成真实练习结果

## 6. 降级演示方案

如果要顺便展示系统的稳定性，可以临时停掉 `ai-service` 再试一次。

建议演示点：

1. 简历诊断返回 `503`
2. 岗位分析返回 `503`
3. 已创建的改写任务进入 `failed`
4. 页面仍能展示已有结构和错误提示，不会白屏

说明口径：

- 这是当前阶段的依赖故障语义
- 不代表 AI 能力本身消失
- Web 网关和任务系统仍然可观察、可恢复

## 7. 演示时的建议口径

建议强调：

- 当前主线是“就业优先”
- 简历 AI 与岗位分析/改写是当前核心闭环
- 重型 AI 能力正在转向异步任务化
- 面试模块已经具备真实 `/api` 占位入口，后续会在这个工作区继续扩展

建议避免说：

- “面试模拟已经完整上线”
- “数据导入后台已经可以正式使用”
- “现在已经是生产可直接上线版本”

## 8. 演示后快速验收命令

```powershell
pnpm --filter @job-assistant/contracts typecheck
pnpm --filter api typecheck
pnpm --filter api test
pnpm --filter api build
pnpm --filter web typecheck
python -m pytest apps/ai-service/tests
```

## 9. 相关文档

- [后端接口文档](/D:/code/work%20agent/apps/api/docs/backend-api.md)
- [部署检查清单](/D:/code/work%20agent/apps/api/docs/deployment-checklist.md)
- [部署与运行手册](/D:/code/work%20agent/apps/api/docs/deployment-guide.md)
- [前后端交接文档](/D:/code/work%20agent/apps/web/docs/frontend-backend-handoff.md)
