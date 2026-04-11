# 后端结构审查报告

> 说明：这份报告针对的是拆分前的 `apps/web` 内嵌后端结构，保留作为历史评审记录。当前独立后端请参考 [apps/api/docs/backend-api.md](/D:/code/work%20agent/apps/api/docs/backend-api.md)。

## 1. 审查范围

- 项目位置：`apps/web`
- 后端形态：基于 Next.js App Router 的内嵌后端
- 重点关注：
  - 后端分层与模块边界
  - 认证与配置安全性
  - 数据访问层设计
  - 测试覆盖与可维护性

---

## 2. 总体结论

当前后端采用了比较清晰的轻量单体/BFF 结构：

- `src/app/api/*`：HTTP 路由入口
- `src/server/core/*`：基础设施与通用能力
- `src/server/modules/*`：按业务域拆分的模块
- `src/server/testing/*`：测试装配与测试替身

这套结构在当前规模下是合理的，已经具备：

- 统一错误处理
- 统一参数校验
- 统一响应格式
- repository/service 分层
- 面向模块的目录组织

但从代码实现来看，后端已经出现一些早期扩展信号：应用装配逐渐集中、跨模块编排逻辑开始堆积、数据访问层约束偏弱、测试覆盖尚未覆盖关键负路径。这些问题现在还不算严重，但如果业务继续扩展，后续维护成本会明显上升。

---

## 3. 当前后端结构概览

### 3.1 路由层

API 路由位于 `src/app/api/*`，例如：

- `auth`
- `profile`
- `jobs`
- `companies`
- `cases`
- `events`
- `schedule`
- `recommend/home`
- `daily-content/today`
- `postgraduate/advice`
- `civil-service/advice`

路由层职责总体比较克制，主要负责：

- 鉴权
- 请求解析
- 调用 service
- 返回统一 JSON 响应

这一点是当前结构的优点之一。

### 3.2 Core 基建层

`src/server/core/*` 提供了后端公共能力：

- `auth`：会话与鉴权工具
- `db`：数据库客户端与事务封装
- `errors`：统一错误类型
- `http`：统一路由错误包装
- `response`：统一 JSON 响应
- `validation`：统一 query/body 校验
- `logger`：日志接口

这是目前后端一致性最好的部分。

### 3.3 业务模块层

`src/server/modules/*` 已按领域拆分为多个模块，每个模块普遍包含：

- `schema.ts`
- `repository.ts`
- `service.ts`

部分模块附带测试，例如：

- `profile/schema.test.ts`
- `recommendation/service.test.ts`
- `schedule/service.test.ts`

这种拆分方式有利于后续继续按业务域扩展。

### 3.4 应用装配层

`src/server/app/context.ts` 统一创建：

- repository
- service
- singleton context
- testing override

这是当前后端的“组合根”。它解决了装配问题，但也已经开始承担过多职责。

---

## 4. 主要优点

### 4.1 分层方向正确

整体代码并不是把所有逻辑写在 route 中，而是明确分成了：

- route
- service
- repository

这让接口职责清晰，也给测试和重构留出了空间。

### 4.2 HTTP 处理链比较统一

以下几个基础设施文件形成了一条稳定的处理链：

- `src/server/core/http/route-handler.ts`
- `src/server/core/validation/http.ts`
- `src/server/core/response/json.ts`
- `src/server/core/errors/app-error.ts`

优点：

- 异常出口统一
- 参数错误格式统一
- 成功/失败响应结构统一
- 路由层样板代码较少

### 4.3 模块命名和目录语义清晰

模块目录名与业务域基本一一对应，便于新成员快速理解代码结构，也便于后续继续扩展新领域。

### 4.4 测试替身思路是对的

`src/server/testing/create-test-app-context.ts` 通过内存版 repository 构造测试上下文，使 route/service 测试不强依赖真实数据库，这个方向是好的。

---

## 5. 主要问题与风险

### 5.1 高优先级：认证密钥存在固定兜底值

位置：

- `src/server/core/auth/config.ts`
- `src/lib/auth.ts`

当前 `NEXTAUTH_SECRET` 缺失时会退回固定值：

- `dev-nextauth-secret-change-me`

这意味着一旦部署环境漏配变量，认证签名将退化为可预测值。对于基于 JWT 的会话体系，这是明显的安全风险。

影响：

- 生产环境配置失误时风险很高
- 问题不容易在代码层被立刻发现
- 会把“配置错误”默默降级成“安全错误”

建议：

- 生产环境强制要求 `NEXTAUTH_SECRET`
- 开发环境可保留显式警告，但不要在生产环境兜底
- 最好把认证相关环境校验集中做成启动期 fail fast

### 5.2 高优先级：`context.ts` 开始变成全局耦合点

位置：

- `src/server/app/context.ts`
- `src/server/testing/create-test-app-context.ts`

`context.ts` 当前同时负责：

- 数据库连接获取
- 所有 repository 创建
- 所有 service 创建
- 单例管理
- 测试覆盖入口

随着模块继续增多，这个文件会变成后端装配的瓶颈。更明显的问题是，测试装配代码需要在另一份文件中重复维护同样的结构，未来很容易出现：

- 新模块接入时只改了生产装配，漏改测试装配
- service 依赖变化时，测试上下文同步成本越来越高
- 全局上下文越来越难做部分替换和局部测试

建议：

- 按业务域拆分 provider/factory
- 让每个模块导出自己的装配函数
- `context.ts` 只做组合，不直接承载全部创建细节
- 测试上下文尽量复用同样的模块装配协议

### 5.3 中高优先级：缺少明确的 workflow/use-case 层

位置：

- `src/server/modules/recommendation/service.ts`
- `src/server/modules/schedule/service.ts`
- `src/server/workflows/README.md`

当前跨模块编排逻辑主要放在 service 中，例如：

- 推荐逻辑会同时读 profile、jobs、cases、events、daily content
- 日程逻辑会聚合 user item、job deadline、event、exam item

这类逻辑在 V1 放在 service 里可以接受，但一旦规则继续增加，就会出现：

- service 既做领域逻辑，又做应用编排
- 跨模块依赖不断增加
- 异步任务、缓存、刷新策略难以自然落位

目前 `workflows` 目录还是预留状态，说明这层尚未真正建立。

建议：

- 对“推荐”“聚合日程”“每日内容生成”这类跨域流程引入 workflow/use-case 层
- repository 保持数据访问职责
- domain service 保持本领域逻辑
- workflow 负责聚合、降级、排序、编排和异步扩展

### 5.4 中优先级：数据访问层约束偏弱，后续易膨胀

位置：

- `src/server/core/db/client.ts`
- 各模块 `repository.ts`

目前 repository 层已经把 SQL 隔离出来，但底层仍然广泛依赖 `unsafeQuery`。虽然当前查询大多仍使用参数绑定，短期可控，但后续有几个隐患：

- 动态 SQL 片段越来越多
- 字段映射代码在各 repository 中重复
- 分页、排序、条件拼接模式会不断复制
- 误用字符串拼接时更容易带入安全问题

建议：

- 抽统一的查询 helper
- 抽统一的 row mapper 或 select 片段
- 统一分页查询模板
- 如果后端继续增长，可考虑更强约束的数据访问抽象

### 5.5 中优先级：测试覆盖还不够完整

位置：

- `src/app/api/routes.test.ts`
- `src/server/testing/create-test-app-context.ts`

当前测试主要覆盖：

- 若干 route 的 happy path
- 少量鉴权场景
- 基本 CRUD

但以下内容仍缺少系统覆盖：

- 参数校验失败
- 非法 body
- 未找到资源
- 认证回调链路
- `daily-content/today`
- `postgraduate/advice`
- `civil-service/advice`
- service 的异常与降级分支

此外，测试运行本身还有稳定性问题：

- 在当前工作区路径 `D:\code\work agent` 下执行 `pnpm --filter web test`
- Vitest 启动阶段报错：`spawn EPERM`

这更像工具链/路径兼容问题，但会直接影响日常后端迭代效率。

建议：

- 先修复测试运行稳定性
- 再补关键接口的负路径和鉴权路径测试
- 对 recommendation/schedule 这类编排逻辑加强 service 单测

### 5.6 中优先级：数据库 schema 与代码能力存在“预留但未落地”的信号

位置：

- `db/schema.sql`

数据库里已经有：

- `password_reset_tokens`
- `email_verification_tokens`

但当前 V1 主要实现的是：

- 注册
- credentials 登录
- 当前用户

这说明 schema 已经为后续认证能力留了空间，但代码层尚未真正落地对应流程。现在问题不大，但如果继续这样扩展，容易出现：

- schema 比业务实现超前
- 文档与实际行为慢慢分离
- 后续接手的人难判断“已完成”还是“预留”

建议：

- 对预留表明确标注状态
- 在文档中区分“已上线能力”和“预留能力”
- 后续认证扩展优先围绕现有表结构继续推进

---

## 6. 架构演进建议

### 6.1 短期建议

适合立即处理，投入小、收益高：

1. 去掉生产环境的固定 `NEXTAUTH_SECRET` 兜底
2. 为未覆盖 API 补 route 测试
3. 为参数校验失败、未授权、资源不存在补负路径测试
4. 解决 Vitest 在当前路径下的启动问题

### 6.2 中期建议

适合在功能继续迭代前逐步做：

1. 把 `context.ts` 拆成模块化装配
2. 为跨域逻辑增加 workflow/use-case 层
3. 抽象 repository 公共查询模板
4. 统一分页、排序、过滤器拼装方式

### 6.3 长期建议

如果后续后端继续扩展到更多业务域或异步任务：

1. 引入真正的后台任务/定时任务机制
2. 把推荐、每日内容刷新、日程聚合从同步请求中逐步分离
3. 建立更系统的 observability 能力：
   - 结构化日志
   - 请求 ID
   - 关键流程埋点
   - 错误分级

---

## 7. 推荐的目标分层

建议后续逐步演进为如下结构：

- `app/api`
  - 只处理 HTTP 输入输出
- `server/core`
  - 通用基础设施
- `server/modules/*`
  - 领域对象、schema、repository、domain service
- `server/workflows/*`
  - 跨模块编排、聚合、推荐、异步流程
- `server/app/*`
  - 应用装配与依赖注册

这样做的收益：

- route 更薄
- service 更纯
- 跨域逻辑有明确归属
- 测试粒度更清晰
- 后续拆异步任务时路径更自然

---

## 8. 优先级排序

### P1

- 移除生产环境固定认证密钥兜底
- 修复测试启动失败问题

### P2

- 为未覆盖路由与负路径补测试
- 拆薄 `context.ts`

### P3

- 引入 workflow/use-case 层
- 统一 repository 公共查询模式

---

## 9. 最终评价

这是一个基础打得还不错的 V1 后端。

优点在于：

- 分层方向正确
- 代码风格整体一致
- 模块边界在当前规模下比较清晰
- 路由层没有明显失控

当前最需要注意的不是“推倒重来”，而是控制结构继续演化的方向：

- 不要让 `context.ts` 继续膨胀成全局依赖中心
- 不要让跨模块编排继续堆在 service 里
- 不要让测试只覆盖 happy path
- 不要让安全配置通过默认值悄悄降级

如果按本报告的优先级推进，这个后端完全可以比较平滑地从 V1 走向更稳定的 V2。
