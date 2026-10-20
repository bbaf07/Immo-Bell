import time
from collections import defaultdict, deque
from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.config import get_settings
from app.modules.properties.router import get_service

from .agent import run_agent
from .llm import AnthropicClient, LLMClient
from .schemas import ChatRequest, ChatResponse
from .tools import AuthUser, ToolBox

router = APIRouter(prefix="/api/v1/assistant", tags=["assistant"])


@lru_cache
def get_llm() -> LLMClient | None:
    s = get_settings()
    if not s.anthropic_api_key:
        return None
    return AnthropicClient(api_key=s.anthropic_api_key, model=s.assistant_model)


def get_current_user() -> AuthUser | None:
    """À brancher sur le module d'authentification (JWT en cookie httpOnly).

    L'identité vient TOUJOURS du jeton vérifié côté serveur, jamais du corps de la requête."""
    return None


class RateLimiter:
    """Limiteur simple en mémoire (fenêtre glissante). En production : Redis, partagé entre instances."""

    def __init__(self, per_minute: int) -> None:
        self.per_minute = per_minute
        self.hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.monotonic()
        q = self.hits[key]
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= self.per_minute:
            raise HTTPException(status_code=429, detail="Trop de messages, réessayez dans une minute.")
        q.append(now)


@lru_cache
def get_limiter() -> RateLimiter:
    return RateLimiter(get_settings().assistant_rate_per_minute)


@router.post("/chat", response_model=ChatResponse)
def chat(
    req: ChatRequest,
    request: Request,
    llm: Annotated[LLMClient | None, Depends(get_llm)],
    user: Annotated[AuthUser | None, Depends(get_current_user)],
    limiter: Annotated[RateLimiter, Depends(get_limiter)],
) -> ChatResponse:
    if llm is None:
        raise HTTPException(status_code=503, detail="Assistant non configuré (IMMOBELL_ANTHROPIC_API_KEY).")
    limiter.check(user.id if user else (request.client.host if request.client else "anon"))
    tb = ToolBox(properties=get_service(), user=user)
    try:
        return run_agent(llm, req, tb)
    except HTTPException:
        raise
    except Exception as e:  # erreur du fournisseur : message neutre, pas de détail interne
        raise HTTPException(status_code=502, detail="Assistant momentanément indisponible.") from e
