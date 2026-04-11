from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["status"] == "ok"


def test_resume_parse() -> None:
    response = client.post(
        "/internal/resume/parse",
        json={
            "rawText": "同济大学计算机科学专业，熟悉 Python、TypeScript、React，希望在上海从事前端开发。",
            "fileName": "resume.txt",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert "Python" in payload["data"]["detectedSkills"]
    assert payload["data"]["education"]["university"] == "同济大学"


def test_score_jobs() -> None:
    response = client.post(
        "/internal/recommend/score-jobs",
        json={
            "profile": {
                "userId": "user-1",
                "targetIndustries": ["互联网"],
                "targetCities": ["上海"],
                "skills": ["TypeScript", "React"],
                "preferredJobTypes": ["前端开发"],
            },
            "jobs": [
                {
                    "id": "job-1",
                    "title": "前端开发实习生",
                    "companyId": "company-1",
                    "companyName": "星河科技",
                    "companyIndustry": "互联网",
                    "workLocation": "上海",
                    "tags": ["前端", "实习"],
                    "requiredSkills": ["TypeScript", "React"],
                    "description": "负责页面开发。",
                    "isFeatured": True,
                    "deadline": "2026-04-20T00:00:00.000Z",
                    "publishedAt": "2026-04-10T00:00:00.000Z",
                    "popularity": 90,
                }
            ],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["items"][0]["jobId"] == "job-1"
    assert payload["data"]["items"][0]["score"] > 0
