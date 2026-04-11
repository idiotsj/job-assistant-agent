import json
from typing import Any

import httpx

from app.core.config import Settings
from app.providers.base import (
    ProviderExecutionError,
    ProviderNotConfiguredError,
    StructuredLLMProvider,
    StructuredProviderRequest,
    StructuredProviderResponse,
)


class OpenAIStructuredProvider(StructuredLLMProvider):
    provider_name = "openai"

    def __init__(self, settings: Settings):
        self._settings = settings

    async def generate_structured(
        self,
        request: StructuredProviderRequest,
    ) -> StructuredProviderResponse:
        if not self._settings.openai_api_key:
            raise ProviderNotConfiguredError("OPENAI_API_KEY is not configured")

        payload = {
            "model": request.model,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "messages": [
                {
                    "role": "system",
                    "content": request.system_prompt,
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "capability": request.capability,
                            "input": request.input_payload,
                            "response_schema": request.response_model.model_json_schema(),
                            "metadata": request.metadata,
                        },
                        ensure_ascii=False,
                    ),
                },
            ],
        }

        headers = {
            "authorization": f"Bearer {self._settings.openai_api_key}",
            "content-type": "application/json",
        }
        if request.request_id:
            headers["x-request-id"] = request.request_id

        url = f"{self._settings.openai_base_url.rstrip('/')}/chat/completions"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise ProviderExecutionError(f"OpenAI request failed: {exc}") from exc

        body = response.json()
        try:
            content = body["choices"][0]["message"]["content"]
            parsed_json = json.loads(content)
            parsed_model = request.response_model.model_validate(parsed_json)
        except (KeyError, IndexError, TypeError, json.JSONDecodeError, ValueError) as exc:
            raise ProviderExecutionError("OpenAI response was not valid structured JSON") from exc

        usage = body.get("usage")
        return StructuredProviderResponse(
            data=parsed_model,
            provider=self.provider_name,
            model=request.model,
            token_usage=usage if isinstance(usage, dict) else None,
            raw_response=body if isinstance(body, dict) else None,
        )
