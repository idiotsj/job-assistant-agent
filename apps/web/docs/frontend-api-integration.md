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
