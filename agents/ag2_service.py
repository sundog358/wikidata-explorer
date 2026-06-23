import hmac
import os
from typing import Annotated, Any

from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel

from wikidata_ag2_agent import AgentBridgeError, handle, safe_error_message


AG2_SERVICE_TOKEN_MIN_LENGTH = 32
_TRUE_VALUES = {"1", "true", "yes", "on"}


def docs_enabled() -> bool:
    return os.getenv("AG2_ENABLE_DOCS", "").strip().lower() in _TRUE_VALUES


app = FastAPI(
    title="Wikidata Explorer AG2 Service",
    docs_url="/docs" if docs_enabled() else None,
    redoc_url=None,
    openapi_url="/openapi.json" if docs_enabled() else None,
)


class AgentRequest(BaseModel):
    payload: dict[str, Any]


def configured_service_token() -> str:
    return os.getenv("AG2_SERVICE_TOKEN", "").strip()


def require_service_token(authorization: Annotated[str | None, Header()] = None) -> None:
    token = configured_service_token()
    if len(token) < AG2_SERVICE_TOKEN_MIN_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AG2 service token is not configured.",
        )

    expected = f"Bearer {token}"
    if not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="AG2 service authentication failed.",
            headers={"WWW-Authenticate": "Bearer"},
        )


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/run")
def run_agent(request: AgentRequest, _: Annotated[None, Depends(require_service_token)]) -> dict[str, Any]:
    try:
        result = handle(request.payload)
        return {"ok": True, **result}
    except AgentBridgeError as error:
        return {"ok": False, "status": error.status, "error": str(error)}
    except Exception as error:  # noqa: BLE001 - keep provider/runtime failures sanitized.
        return {"ok": False, "status": 500, "error": safe_error_message(error)}
