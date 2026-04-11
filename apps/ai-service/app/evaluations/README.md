# Evaluations

这个目录用于保存 AI 能力层的离线基准样本和脚本。

当前包含：

- `samples/resume_parse_samples.json`
- `samples/job_scoring_samples.json`
- `samples/daily_advice_samples.json`
- `run_baselines.py`

建议使用方式：

1. 修改 prompt 或模型前先跑一次基准。
2. 修改后再次运行，对比输出差异。
3. 将关键样本保留下来，逐步形成回归集。

当前脚本默认：

- 优先走当前 provider 配置
- 当 `OPENAI_API_KEY` 缺失或 provider 失败时，自动落回规则版

这样即使在纯本地开发环境里，也能得到一份稳定可对照的 baseline。
