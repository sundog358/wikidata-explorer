from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel

from wikidata_ag2_agent import AgentBridgeError, handle, safe_error_message


app = FastAPI(title="Wikidata Explorer AG2 Service")


class AgentRequest(BaseModel):
    payload: dict[str, Any]


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/run")
def run_agent(request: AgentRequest) -> dict[str, Any]:
    try:
        result = handle(request.payload)
        return {"ok": True, **result}
    except AgentBridgeError as error:
        return {"ok": False, "status": error.status, "error": str(error)}
    except Exception as error:  # noqa: BLE001 - keep provider/runtime failures sanitized.
        return {"ok": False, "status": 500, "error": safe_error_message(error)}
