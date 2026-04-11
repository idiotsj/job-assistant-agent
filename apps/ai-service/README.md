# AI Service

`apps/ai-service` 是面向内部调用的 Python AI 能力层，负责承接更适合 Python 生态的能力：

- 简历解析
- 岗位匹配与增强打分
- 后续可扩展到 embeddings、RAG、LLM 工作流

它不是对外公开网关，前端不直接访问。外部请求仍统一进入 `apps/api`，由 `apps/api` 再调用本服务并负责降级。

## 当前已实现接口

### `GET /health`

健康检查。

### `POST /internal/resume/parse`

输入简历原文，返回结构化提取结果：

- `summary`
- `detectedSkills`
- `detectedJobTypes`
- `detectedCities`
- `education`
- `confidence`

### `POST /internal/recommend/score-jobs`

输入用户画像与岗位候选集，返回结构化打分：

- `jobId`
- `score`
- `reason`
- `signals`

当前还是规则增强版实现，但接口已经预留好了，后续可以在不改 `apps/api` 的情况下，替换为更复杂的 Python 推理逻辑。

## 本地运行

1. 创建虚拟环境并安装依赖

```powershell
cd D:\code\work agent\apps\ai-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
```

2. 启动服务

```powershell
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. 健康检查

```powershell
Invoke-WebRequest http://localhost:8000/health
```

## 测试

```powershell
cd D:\code\work agent\apps\ai-service
python -m pytest
```
