from hmac import compare_digest

from fastapi import HTTPException, Request, status

from app.dependencies import get_runtime


INTERNAL_SERVICE_TOKEN_HEADER = "x-internal-service-token"


def require_internal_service_token(request: Request) -> None:
    settings = get_runtime(request).settings
    expected_token = settings.internal_service_token

    if not expected_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Internal service token is not configured",
        )

    provided_token = request.headers.get(INTERNAL_SERVICE_TOKEN_HEADER)
    if not provided_token or not compare_digest(provided_token, expected_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized internal request",
        )
