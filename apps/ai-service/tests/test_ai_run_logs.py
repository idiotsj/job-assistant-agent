from app.repositories import AiRunLogEntry, InMemoryAiRunLogRepository


def build_entry() -> AiRunLogEntry:
    return AiRunLogEntry(
        capability="resume_diagnosis",
        pipeline="resume_diagnosis",
        provider="openai",
        model="gpt-test",
        prompt_version="v1",
        status="succeeded",
        request_id="req-log-1",
        user_id="user-1",
        input_json={
            "rawText": "同济大学计算机科学专业，熟悉 Python、React，希望在上海从事前端开发。",
            "profile": {
                "userId": "user-1",
                "targetCities": ["上海"],
                "skills": ["Python", "React"],
            },
        },
        output_json={
            "data": {
                "summary": "简历基础不错，建议补量化成果。",
                "quality": {
                    "strengths": ["技能关键词清晰。"],
                },
            }
        },
        error_json=None,
        token_usage_json={"total_tokens": 123},
        latency_ms=42,
    )


def test_full_log_mode_redacts_sensitive_resume_fields() -> None:
    repository = InMemoryAiRunLogRepository(log_mode="full")
    repository.write(build_entry())

    assert repository.entries[0].input_json["rawText"]["redacted"] is True
    assert repository.entries[0].input_json["profile"]["redacted"] is True


def test_debug_full_log_mode_keeps_explicit_opt_in_payloads() -> None:
    repository = InMemoryAiRunLogRepository(log_mode="debug-full")
    repository.write(build_entry())

    assert repository.entries[0].input_json["rawText"].startswith("同济大学")
    assert repository.entries[0].input_json["profile"]["userId"] == "user-1"


def test_minimal_log_mode_summarizes_sanitized_payloads() -> None:
    repository = InMemoryAiRunLogRepository(log_mode="minimal")
    repository.write(build_entry())

    assert repository.entries[0].input_json["type"] == "object"
    assert repository.entries[0].output_json["type"] == "object"
