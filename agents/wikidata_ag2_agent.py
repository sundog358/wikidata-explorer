"""AG2 runtime bridge for Wikidata Explorer.

The Next.js API routes call this script with one JSON payload on stdin and read
one JSON object from stdout. Keep stdout machine-readable: diagnostics go to
stderr and client-facing errors are sanitized before returning.
"""

from __future__ import annotations

import contextlib
import io
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

from autogen import ConversableAgent, LLMConfig

ROOT = Path(__file__).resolve().parents[1]
API_BASE_URL = "https://www.wikidata.org/w/api.php"


class AgentBridgeError(Exception):
    def __init__(self, message: str, status: int = 500) -> None:
        super().__init__(message)
        self.status = status


def read_project_env_value(name: str) -> str | None:
    env_path = ROOT / ".env"
    if env_path.exists():
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            if key.strip() != name:
                continue
            value = value.strip()
            if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
                value = value[1:-1]
            return value or None
    return os.getenv(name) or None


def safe_error_message(error: Exception) -> str:
    message = str(error).lower()
    if "api key" in message or "401" in message or "unauthorized" in message or "authentication" in message:
        return "The OpenAI API key was rejected by the AG2 provider configuration."
    if "rate" in message or "quota" in message or "429" in message:
        return "The OpenAI API is rate limited or out of quota."
    if "model" in message or "404" in message:
        return "The configured OpenAI model is unavailable for this key."
    if "timeout" in message:
        return "The AG2 agent timed out while generating a response."
    return "The AG2 Wikidata agent could not complete the response."


def llm_config(max_tokens: int) -> LLMConfig:
    api_key = read_project_env_value("OPENAI_API_KEY")
    if not api_key:
        raise AgentBridgeError("OpenAI API key is not configured for the AG2 agent.", 503)

    model = read_project_env_value("OPENAI_MODEL") or "gpt-4o-mini"
    timeout = int(read_project_env_value("AG2_AGENT_TIMEOUT_SECONDS") or "30")

    return LLMConfig(
        {
            "api_type": "openai",
            "model": model,
            "api_key": api_key,
            "timeout": timeout,
            "max_retries": 0,
            "max_tokens": max_tokens,
        }
    )


def final_text_from_chat_result(result: Any) -> str:
    summary = getattr(result, "summary", None)
    if isinstance(summary, str) and summary.strip():
        return summary.strip()

    history = getattr(result, "chat_history", None) or []
    for message in reversed(history):
        if isinstance(message, dict):
            content = message.get("content")
            if isinstance(content, str) and content.strip():
                return content.strip()

    raise AgentBridgeError("AG2 returned an empty response.", 502)


def run_agent(*, name: str, system_message: str, prompt: str, max_tokens: int) -> str:
    agent = ConversableAgent(
        name=name,
        system_message=system_message,
        llm_config=llm_config(max_tokens),
        human_input_mode="NEVER",
        code_execution_config=False,
        max_consecutive_auto_reply=1,
    )
    user = ConversableAgent(
        name="wikidata_explorer_ui",
        human_input_mode="NEVER",
        llm_config=False,
        code_execution_config=False,
        max_consecutive_auto_reply=1,
    )

    captured = io.StringIO()
    with contextlib.redirect_stdout(captured):
        result = user.initiate_chat(
            recipient=agent,
            message=prompt,
            max_turns=1,
            silent=True,
            summary_method="last_msg",
        )
    diagnostics = captured.getvalue().strip()
    if diagnostics:
        print(diagnostics, file=sys.stderr)

    return final_text_from_chat_result(result)


def value_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False)


def http_json(url: str) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": "WikidataExplorerAG2/0.1"})
    with urllib.request.urlopen(request, timeout=20) as response:  # noqa: S310 - fixed Wikidata URL.
        return json.loads(response.read().decode("utf-8"))


def wikidata_api(params: dict[str, str]) -> dict[str, Any]:
    query = urllib.parse.urlencode({**params, "format": "json", "origin": "*"})
    return http_json(f"{API_BASE_URL}?{query}")


def entity_id_from_datavalue(value: Any) -> str | None:
    if not isinstance(value, dict):
        return None
    entity_type = value.get("entity-type")
    numeric_id = value.get("numeric-id")
    if not entity_type or not numeric_id:
        return None
    prefix = "P" if entity_type == "property" else "Q"
    return f"{prefix}{numeric_id}"


def fetch_labels(ids: list[str]) -> dict[str, str]:
    unique_ids = []
    for item_id in ids:
        if item_id and item_id not in unique_ids:
            unique_ids.append(item_id)
    if not unique_ids:
        return {}

    labels: dict[str, str] = {}
    for offset in range(0, len(unique_ids), 50):
        chunk = unique_ids[offset : offset + 50]
        data = wikidata_api(
            {
                "action": "wbgetentities",
                "ids": "|".join(chunk),
                "props": "labels",
                "languages": "en",
                "languagefallback": "1",
            }
        )
        for entity_id, entity in (data.get("entities") or {}).items():
            labels[entity_id] = ((entity.get("labels") or {}).get("en") or {}).get("value") or entity_id
    return labels


def snak_display(snak: dict[str, Any], labels: dict[str, str]) -> str:
    if snak.get("snaktype") == "somevalue":
        return "Unknown value"
    if snak.get("snaktype") == "novalue":
        return "No value"

    data_value = snak.get("datavalue") or {}
    raw_value = data_value.get("value")
    entity_id = entity_id_from_datavalue(raw_value)
    if entity_id:
        return f"{labels.get(entity_id, entity_id)} ({entity_id})"

    datatype = snak.get("datatype")
    if datatype == "time" and isinstance(raw_value, dict):
        return str(raw_value.get("time", "")).replace("T00:00:00Z", "").lstrip("+")
    if datatype == "quantity" and isinstance(raw_value, dict):
        amount = raw_value.get("amount", "")
        unit = raw_value.get("unit")
        return f"{amount} {unit}" if unit and unit != "1" else str(amount)
    if datatype == "globecoordinate" and isinstance(raw_value, dict):
        return f"{raw_value.get('latitude')}, {raw_value.get('longitude')}"
    if datatype == "monolingualtext" and isinstance(raw_value, dict):
        return str(raw_value.get("text", ""))
    if isinstance(raw_value, str):
        return raw_value
    return value_text(raw_value)


def collect_claim_ids(claims: dict[str, Any]) -> list[str]:
    ids = set(claims.keys())
    for property_claims in claims.values():
        for claim in property_claims[:8]:
            entity_id = entity_id_from_datavalue(((claim.get("mainsnak") or {}).get("datavalue") or {}).get("value"))
            if entity_id:
                ids.add(entity_id)
    return sorted(ids)


def fetch_entity_brief(entity_id: str) -> dict[str, Any]:
    normalized_id = entity_id.strip().upper()
    if not normalized_id.startswith(("Q", "P")) or not normalized_id[1:].isdigit():
        raise AgentBridgeError(f"{entity_id} is not a valid Wikidata entity ID.", 400)

    data = wikidata_api(
        {
            "action": "wbgetentities",
            "ids": normalized_id,
            "props": "labels|descriptions|claims",
            "languages": "en",
            "languagefallback": "1",
        }
    )
    entity = (data.get("entities") or {}).get(normalized_id)
    if not entity or entity.get("missing"):
        raise AgentBridgeError(f"No Wikidata entity found for {normalized_id}.", 404)

    claims = entity.get("claims") or {}
    labels = fetch_labels(collect_claim_ids(claims))
    statements = []
    for property_id, property_claims in list(claims.items())[:20]:
        for claim in property_claims[:2]:
            qualifiers = sum(len(values) for values in (claim.get("qualifiers") or {}).values())
            references = len(claim.get("references") or [])
            statements.append(
                {
                    "propertyId": property_id,
                    "propertyLabel": labels.get(property_id, property_id),
                    "rank": claim.get("rank", "normal"),
                    "value": snak_display(claim.get("mainsnak") or {}, labels),
                    "qualifierCount": qualifiers,
                    "referenceCount": references,
                }
            )
            if len(statements) >= 18:
                break
        if len(statements) >= 18:
            break

    return {
        "id": normalized_id,
        "type": entity.get("type", "item"),
        "label": ((entity.get("labels") or {}).get("en") or {}).get("value") or labels.get(normalized_id, normalized_id),
        "description": ((entity.get("descriptions") or {}).get("en") or {}).get("value") or "No description available.",
        "statements": statements,
    }


def entity_context_lines(entity: dict[str, Any]) -> list[str]:
    lines = [
        f"Entity: {entity.get('label')} ({entity.get('id')})",
        f"Type: {entity.get('type')}",
        f"Description: {entity.get('description')}",
        "",
        "Statements:",
    ]

    for index, statement in enumerate(entity.get("statements", []), start=1):
        value = value_text(statement.get("value"))
        rank = statement.get("rank") or "normal"
        qualifiers = statement.get("qualifierCount")
        references = statement.get("referenceCount")
        if qualifiers is None:
            qualifiers = len(statement.get("qualifiers") or [])
        if references is None:
            references = len(statement.get("references") or [])
        lines.append(
            f"{index}. {statement.get('propertyLabel')} ({statement.get('propertyId')}) "
            f"[{rank}] = {value} | qualifiers={qualifiers} references={references}"
        )

        for qualifier in (statement.get("qualifiers") or [])[:4]:
            lines.append(
                f"   qualifier: {qualifier.get('propertyLabel')} ({qualifier.get('propertyId')}) = {value_text(qualifier.get('value'))}"
            )
        for reference in (statement.get("references") or [])[:3]:
            parts = reference.get("parts") or []
            rendered = "; ".join(
                f"{part.get('propertyLabel')} ({part.get('propertyId')}) = {value_text(part.get('value'))}"
                for part in parts[:4]
            )
            if rendered:
                lines.append(f"   reference: {rendered}")
    return lines


def build_entity_summary_prompt(entity: dict[str, Any]) -> str:
    return "\n".join(
        [
            *entity_context_lines(entity),
            "",
            "Write a concise summary with three sections: Key facts, Evidence notes, Suggested next checks.",
        ]
    )


def build_chat_prompt(messages: list[dict[str, str]]) -> str:
    rendered = []
    for message in messages[-12:]:
        role = message.get("role", "user")
        content = message.get("content", "")
        rendered.append(f"{role.upper()}: {content}")
    rendered.append("ASSISTANT:")
    return "\n\n".join(rendered)


def build_workflow_prompt(action: str, payload: dict[str, Any]) -> tuple[str, str, str, int]:
    entity = payload.get("entity")
    entity_id = payload.get("entityId") or (entity or {}).get("id")

    if action == "research":
        if not entity_id:
            raise AgentBridgeError("Research agent requires an entity ID.", 400)
        fetched = fetch_entity_brief(str(entity_id))
        return (
            "wikidata_research_agent",
            "You are a Wikidata Research Agent. You fetch and interpret entity context, then suggest practical next research steps.",
            "\n".join([
                *entity_context_lines(fetched),
                "",
                "Write: Overview, strongest relationships, data-quality risks, and next entities/properties to inspect.",
            ]),
            850,
        )

    if not isinstance(entity, dict):
        raise AgentBridgeError("This AG2 workflow requires visible entity context.", 400)

    if action == "graph":
        return (
            "wikidata_graph_analyst",
            "You are a Graph Analyst Agent. Explain relationship structure and useful traversal paths from Wikidata statements.",
            "\n".join([
                *entity_context_lines(entity),
                "",
                "Explain the most important graph neighborhoods, relationship clusters, weak edges, and 3 suggested next clicks.",
            ]),
            800,
        )

    if action == "verify":
        return (
            "wikidata_citation_verifier",
            "You are a Citation and Verifier Agent. Inspect statement ranks, qualifiers, references, and IDs. Do not invent citations.",
            "\n".join([
                *entity_context_lines(entity),
                "",
                "Classify evidence quality as strong, mixed, or weak. Call out unreferenced important claims, qualifier nuance, deprecated claims, and exact Wikidata IDs to verify next.",
            ]),
            850,
        )

    if action == "report":
        return (
            "wikidata_report_agent",
            "You are a Report Agent. Produce clean Markdown research notes from supplied Wikidata context.",
            "\n".join([
                *entity_context_lines(entity),
                "",
                "Create a Markdown report with sections: Summary, Key statements, Evidence notes, Graph leads, Open questions.",
            ]),
            1000,
        )

    if action == "compare":
        compare_id = payload.get("compareEntityId")
        if not compare_id:
            raise AgentBridgeError("Comparison agent requires a second entity ID.", 400)
        first = entity
        second = fetch_entity_brief(str(compare_id))
        return (
            "wikidata_comparison_agent",
            "You are a Comparison Agent. Compare two Wikidata entities using supplied/fetched statements and IDs.",
            "\n".join([
                "FIRST ENTITY",
                *entity_context_lines(first),
                "",
                "SECOND ENTITY",
                *entity_context_lines(second),
                "",
                "Compare these entities. Include shared themes, unique statements, evidence differences, graph overlap hints, and next checks.",
            ]),
            1000,
        )

    raise AgentBridgeError("Unsupported AG2 workflow action.", 400)


def handle(payload: dict[str, Any]) -> dict[str, Any]:
    mode = payload.get("mode")

    if mode == "entity_summary":
        entity = payload.get("entity")
        if not isinstance(entity, dict):
            raise AgentBridgeError("Entity summary payload is missing entity context.", 400)
        text = run_agent(
            name="wikidata_entity_summarizer",
            system_message=(
                "You are an AG2 Wikidata research agent inside Wikidata Explorer. "
                "Use only the supplied entity context. Mention Wikidata IDs when useful. "
                "Be concise and separate grounded facts from suggested next checks."
            ),
            prompt=build_entity_summary_prompt(entity),
            max_tokens=650,
        )
        return {"summary": text}

    if mode == "workflow":
        action = payload.get("action")
        if not isinstance(action, str):
            raise AgentBridgeError("AG2 workflow payload must include an action.", 400)
        name, system_message, prompt, max_tokens = build_workflow_prompt(action, payload)
        text = run_agent(name=name, system_message=system_message, prompt=prompt, max_tokens=max_tokens)
        return {"result": text}

    if mode == "chat":
        messages = payload.get("messages")
        if not isinstance(messages, list) or not messages:
            raise AgentBridgeError("Chat payload must include messages.", 400)
        text = run_agent(
            name="wikidata_research_chat",
            system_message=(
                "You are an AG2 research assistant for Wikidata Explorer. Help users reason about "
                "Wikidata entities, properties, statement quality, references, graph exploration, and linked data. "
                "Do not claim to have browsed live Wikidata unless context was supplied by the user."
            ),
            prompt=build_chat_prompt(messages),
            max_tokens=700,
        )
        return {"message": text}

    raise AgentBridgeError("Unsupported AG2 agent mode.", 400)


def main() -> None:
    try:
        payload = json.loads(sys.stdin.read() or "{}")
        result = handle(payload)
        print(json.dumps({"ok": True, **result}, ensure_ascii=False))
    except AgentBridgeError as error:
        print(json.dumps({"ok": False, "status": error.status, "error": str(error)}, ensure_ascii=False))
        sys.exit(0)
    except Exception as error:  # noqa: BLE001 - sanitize all provider/runtime failures.
        print(str(error), file=sys.stderr)
        print(json.dumps({"ok": False, "status": 500, "error": safe_error_message(error)}, ensure_ascii=False))
        sys.exit(0)


if __name__ == "__main__":
    main()
