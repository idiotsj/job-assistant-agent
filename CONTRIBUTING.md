# Contributing

这个仓库当前主要面向 2 人协作开发，目标是保证：

- 主分支稳定
- 改动范围清晰
- 前后端和 AI 服务可以并行推进

## Branch Strategy

- `main`: 可部署、可演示的稳定分支
- `feature/*`: 新功能
- `fix/*`: 修复
- `docs/*`: 文档改动
- `refactor/*`: 结构调整

示例：

- `feature/recommend-home-ui`
- `feature/resume-parse-flow`
- `fix/profile-validation`

## Recommended Workflow

1. 从 `main` 拉最新代码
2. 新建自己的功能分支
3. 本地开发并自测
4. 提交 Pull Request
5. 至少另一位协作者 review 后再合并

## Commit Style

推荐使用简洁的语义化提交信息：

- `feat: add resume parsing endpoint`
- `fix: handle ai service fallback`
- `docs: update local setup guide`
- `refactor: split recommendation scoring workflow`
- `test: cover profile resume parse route`

## Before Opening a PR

在仓库根目录运行：

```powershell
pnpm typecheck
pnpm test
pnpm build
pnpm test:ai
```

如果改动涉及：

- Python AI 服务：确保 `python -m pytest apps/ai-service/tests` 通过
- API 契约：确认 `packages/contracts` 类型没有破坏前端调用
- 接口行为：更新 [backend-api.md](/D:/code/work%20agent/apps/api/docs/backend-api.md)

## PR Scope

尽量保持一个 PR 只解决一类问题：

- 一个业务功能
- 一个结构重构
- 一组相关 bug

避免把下面几类改动混在一起：

- 大量 UI 改动
- API 结构重构
- Python AI 逻辑升级
- 数据库 schema 修改

## Code Boundaries

### Frontend

- 页面和组件不要直接 `fetch("/api/...")`
- 统一走 `apps/web/src/lib/api/*`

### API

- `routes/` 只做请求解析、鉴权、调用 service/workflow、返回响应
- 不要在 route 里写 SQL 或推荐逻辑

### AI Service

- Python 服务只作为内部能力层
- 不对前端暴露公共业务 API

### Contracts

- 公开 HTTP 契约放在 `packages/contracts`
- 不要把后端内部 repository 实体暴露到 contracts

## Secrets

不要提交：

- `.env`
- 数据库密码
- Session secret
- 第三方 API key

只提交：

- `.env.example`
- 必要的配置说明

## Review Checklist

- 变更是否符合模块边界
- 是否保留现有 API 响应结构
- 是否补了测试或至少做了手动验证
- 是否更新了相关文档
- 是否引入了新的环境变量

## Future Admin App

`apps/admin` 当前只是预留目录，后续如果开始实现，请保持：

- 用户端 `apps/web`
- 管理端 `apps/admin`
- 公共 API `apps/api`

三者边界清晰，不互相直接引用内部实现。
