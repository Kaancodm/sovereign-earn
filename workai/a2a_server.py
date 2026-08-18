"""
WorkAI - A2A Server (Python/FastAPI) fuer Oracle Cloud VPS

Gefixte Version des Skeletons:
- FIX 1: Depends-Import ergaenzt (Original crasht beim Start)
- FIX 2: Agent Card wird als JSON-Objekt ausgeliefert (Original haette
         den String doppelt enkodiert)
- FIX 3: datetime.utcnow() (deprecated) -> datetime.now(timezone.utc)

Requirements:
  pip install fastapi uvicorn python-dotenv

TODO: Skill-Handler mit echter Claude/Gemini-Orchestrierung ersetzen.
"""

from fastapi import FastAPI, Request, HTTPException, Header, Depends
from fastapi.responses import JSONResponse
import os
import json
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any

app = FastAPI(title="WorkAI A2A Server", version="0.9.1")

# === Config ===
API_KEY = os.getenv("SOVEREIGN_API_KEY", "change-me-in-production")

# Agent Card einmal beim Start laden
with open("01_WorkAI_Agent_Card.json", "r", encoding="utf-8") as f:
    AGENT_CARD = json.load(f)


def verify_api_key(x_sovereign_api_key: Optional[str] = Header(None)):
    if x_sovereign_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API Key")
    return True


@app.get("/.well-known/agent-card.json")
async def get_agent_card():
    """Public Agent Card for discovery"""
    return JSONResponse(
        content=AGENT_CARD,
        headers={
            "Cache-Control": "public, max-age=3600",
            "ETag": '"workai-v0.9.1"',
        },
    )


@app.post("/a2a/v1")
async def a2a_jsonrpc(request: Request, authorized: bool = Depends(verify_api_key)):
    """
    Main A2A JSON-RPC endpoint.
    Supports message/send and message/stream (stream simplified here).
    """
    body = await request.json()

    method = body.get("method")
    params = body.get("params", {})
    req_id = body.get("id")

    if method not in ["message/send", "message/stream"]:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32601, "message": "Method not found"},
        }

    message = params.get("message", {})
    metadata = message.get("metadata", {})
    preferred_skill = metadata.get("preferredSkill", "general-companion")

    parts = message.get("parts", [])
    text_content = ""
    for part in parts:
        if part.get("type") == "text" or "text" in part:
            text_content = part.get("text", "")

    try:
        if preferred_skill == "mu-build-advisor":
            result = await handle_mu_build_advisor(text_content)
        elif preferred_skill == "sensei-matcher":
            result = await handle_sensei_matcher(text_content)
        elif preferred_skill == "fraud-analyzer":
            result = await handle_fraud_analyzer(text_content)
        else:
            result = await handle_general(text_content)

        task = {
            "id": str(uuid.uuid4()),
            "status": {
                "state": "COMPLETED",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            "artifacts": [
                {
                    "artifactId": str(uuid.uuid4()),
                    "parts": [
                        {
                            "type": "text",
                            "text": result if isinstance(result, str) else json.dumps(result, ensure_ascii=False),
                        }
                    ],
                }
            ],
        }

        return {"jsonrpc": "2.0", "id": req_id, "result": task}

    except Exception as e:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32000, "message": str(e)},
        }


# === Skill Handlers (TODO: echte Claude/Gemini-Logik) ===

async def handle_mu_build_advisor(content: str) -> str:
    return (
        "Build-Analyse (Beispiel):\n"
        "Fuer einen Royal Knight Level 392 empfehle ich aktuell eine staerkere ENE-Ausrichtung "
        "fuer bessere Survivability im Arena/Crusade. Konkrete Stat-Verteilung folgt..."
    )


async def handle_sensei_matcher(content: str) -> Dict[str, Any]:
    return {
        "recommendations": [
            {
                "senseiName": "Sensei Arkani",
                "class": "Archmage",
                "server": "EU-104",
                "matchScore": 0.92,
                "reason": "Spezialisiert auf Agility-Wizard Builds und hat noch freie Schuelerplaetze.",
            }
        ]
    }


async def handle_fraud_analyzer(content: str) -> Dict[str, Any]:
    return {"riskScore": 0.18, "flags": [], "recommendation": "normal"}


async def handle_general(content: str) -> str:
    return "Allgemeine Companion-Antwort. Hier wuerde dein Claude/Gemini-Orchestrator antworten."


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
