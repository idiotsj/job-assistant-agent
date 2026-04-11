# Job Assistant Agent

`job-assistant-agent` 是一个面向学生求职场景的 AI 就业辅助项目。

当前仓库采用 monorepo 结构，核心方向是：

- 前端提供用户侧体验
- TypeScript API 提供稳定业务接口
- Python AI Service 承接更适合 AI / NLP / 推荐增强的能力

V1 产品主线聚焦“就业优先”，首页围绕岗位、学生案例、宣讲会、每日建议服务；考研建议和考公建议作为独立频道，不混入首页主推荐流。

## Repo Structure

```text
apps/
├─ web/          # Next.js 用户端前端
├─ api/          # Fastify + TypeScript 独立后端
├─ ai-service/   # FastAPI + Python 内部 AI 能力层
└─ admin/        # 预留目录，暂未实现

packages/
├─ contracts/    # 前后端共享 HTTP 契约
├─ database/     # PostgreSQL schema / seed
└─ config/       # 预留共享配置目录
```

## Tech Stack

- Frontend: Next.js + React
- API: Fastify + TypeScript
- AI Service: FastAPI + Python
- Database: PostgreSQL
- Package Manager: pnpm

## Core Capabilities

- 用户注册、登录、Cookie Session
- 用户画像管理
- 首页分区推荐
- 岗位、企业、学生案例、宣讲会查询
- 日程聚合
- 考研建议 / 考公建议频道
- 简历解析接入画像

## Local Development

### 1. Install Node Dependencies

```powershell
cd "D:\code\work agent"
pnpm install
```

### 2. Prepare PostgreSQL

数据库脚本位于：

- [schema.sql](/D:/code/work%20agent/packages/database/schema.sql)
- [seed.sql](/D:/code/work%20agent/packages/database/seed.sql)

示例导入方式：

```powershell
psql -U postgres -d job_assistant -f "D:\code\work agent\packages\database\schema.sql"
psql -U postgres -d job_assistant -f "D:\code\work agent\packages\database\seed.sql"
```

### 3. Start Python AI Service

```powershell
cd "D:\code\work agent\apps\ai-service"
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Configure API Environment

参考：

- [apps/api/.env.example](/D:/code/work%20agent/apps/api/.env.example)
- [apps/ai-service/.env.example](/D:/code/work%20agent/apps/ai-service/.env.example)

示例：

```powershell
$env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/job_assistant"
$env:SESSION_SECRET="replace-with-a-long-random-secret"
$env:AI_SERVICE_URL="http://localhost:8000"
```

### 5. Start API and Web

```powershell
cd "D:\code\work agent"
pnpm dev:api
```

另开一个终端：

```powershell
cd "D:\code\work agent"
pnpm dev:web
```

前端默认访问：

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

前端通过 Next.js rewrites 代理 `/api/*` 到 API 服务。

## Useful Scripts

在仓库根目录：

```powershell
pnpm typecheck
pnpm test
pnpm build
pnpm test:ai
pnpm dev:web
pnpm dev:api
pnpm dev:ai
```

## Verification

推荐至少执行下面四项：

```powershell
pnpm typecheck
pnpm test
pnpm build
pnpm test:ai
```

当前这些校验已经在本地通过。

## Demo Account

种子数据默认提供一个演示账号：

- Email: `demo@example.com`
- Password: `Password123!`

来源：

- [seed.sql](/D:/code/work%20agent/packages/database/seed.sql)

## API Docs

后端接口文档见：

- [backend-api.md](/D:/code/work%20agent/apps/api/docs/backend-api.md)

## Collaboration

建议协作方式：

- `main` 只放稳定代码
- 每个功能单独开分支
- 通过 Pull Request 合并

推荐分支命名：

- `feature/profile-resume-parse`
- `feature/home-page-ui`
- `fix/session-cookie`

具体协作规则见：

- [CONTRIBUTING.md](/D:/code/work%20agent/CONTRIBUTING.md)

## Notes

- 不要提交 `.env`、数据库本地连接串、真实账号密钥
- 前端不要直接访问 Python AI Service
- 对外业务 API 统一由 `apps/api` 暴露
- Python 能力优先用于简历解析、推荐增强、后续 LLM 工作流
