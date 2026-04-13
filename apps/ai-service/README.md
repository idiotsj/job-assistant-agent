# AI Service

`apps/ai-service` 是内部 AI 能力层，职责已经重构为：

- `api/`：内部 HTTP 路由
- `providers/`：模型供应商适配层，当前是 OpenAI-first
- `pipelines/`：能力编排层，负责 prompt、provider、fallback、post-processing
- `prompts/`：按能力和版本管理 prompt
- `repositories/`：`ai_run_logs` 落库
- `evaluations/`：离线基准样本与脚本

它不是公共网关。前端仍然只访问 `apps/api`，由 `apps/api` 转调本服务。

## 当前内部接口

### `GET /health`

基础健康检查。

### `POST /internal/resume/parse`

输入简历文本，输出：

- `data.parsed`
- `data.patch`
- `meta`

其中 `meta` 包含：

- `provider`
- `model`
- `promptVersion`
- `latencyMs`
- `fallbackUsed`

### `POST /internal/resume/diagnose`

输入简历原文、最新解析结果和当前画像，输出：

- `data.overallScore`
- `data.summary`
- `data.quality`
- `data.alignment`
- `data.actionPlan`
- `meta`

当前策略是：

- `apps/api` 先调用 `resume_parse`
- 再把 `rawText + parsedResume + profile` 交给 `resume_diagnosis`
- provider 不可用时自动 fallback 到规则版诊断
- 每次调用都会写 `ai_run_logs`，capability 固定为 `resume_diagnosis`

### `POST /internal/recommend/score-jobs`

输入用户画像和岗位候选集，输出岗位打分列表与 `meta`。

当前策略是：

- 规则基线负责稳定排序
- OpenAI provider 只负责增强信号和理由
- provider 不可用时自动 fallback 到规则版

### `POST /internal/daily/advice`

输入用户画像、精选建议和今日企业/岗位上下文，输出一条个性化每日建议与 `meta`。

## 环境变量

参考 [`.env.example`](D:\code\work%20agent\apps\ai-service\.env.example)：

- `AI_SERVICE_NAME`
- `AI_SERVICE_ENV`
- `DATABASE_URL`
- `AI_LOG_MODE`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL_RESUME_PARSE`
- `OPENAI_MODEL_RESUME_DIAGNOSIS`
- `OPENAI_MODEL_JOB_SCORING`
- `OPENAI_MODEL_DAILY_ADVICE`

日志模式约定：

- 开发环境默认 `full`
- 生产环境默认 `minimal`

## 本地运行

```powershell
cd D:\code\work agent\apps\ai-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 测试

```powershell
python -m pytest apps/ai-service/tests
```

## 离线评估

样本和脚本位于：

- [run_baselines.py](D:\code\work%20agent\apps\ai-service\app\evaluations\run_baselines.py)
- [README.md](D:\code\work%20agent\apps\ai-service\app\evaluations\README.md)

运行方式：

```powershell
python apps/ai-service/app/evaluations/run_baselines.py
```
