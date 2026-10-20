"""Port vers le modèle de langage, et son adaptateur Anthropic.

Le module assistant ne dépend que de `LLMClient` : on peut changer de fournisseur
ou utiliser un faux client dans les tests sans toucher à la logique de l'agent.
"""

from dataclasses import dataclass, field
from typing import Any, Protocol


@dataclass
class ToolCall:
    id: str
    name: str
    input: dict[str, Any]


@dataclass
class LLMTurn:
    text: str = ""
    tool_calls: list[ToolCall] = field(default_factory=list)
    raw_content: list[dict[str, Any]] = field(default_factory=list)  # à renvoyer tel quel au tour suivant


class LLMClient(Protocol):
    def complete(self, *, system: str, messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> LLMTurn: ...


class AnthropicClient:
    """Adaptateur Claude (API Messages, appel d'outils)."""

    def __init__(self, api_key: str, model: str, max_tokens: int = 800, timeout_s: float = 30.0) -> None:
        import anthropic  # import local : l'API démarre même sans le paquet tant que l'assistant est désactivé

        self._client = anthropic.Anthropic(api_key=api_key, timeout=timeout_s, max_retries=2)
        self._model = model
        self._max_tokens = max_tokens

    def complete(self, *, system: str, messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> LLMTurn:
        r = self._client.messages.create(
            model=self._model, max_tokens=self._max_tokens, system=system, messages=messages, tools=tools
        )
        turn = LLMTurn()
        for b in r.content:
            if b.type == "text":
                turn.text += b.text
                turn.raw_content.append({"type": "text", "text": b.text})
            elif b.type == "tool_use":
                turn.tool_calls.append(ToolCall(id=b.id, name=b.name, input=dict(b.input or {})))
                turn.raw_content.append({"type": "tool_use", "id": b.id, "name": b.name, "input": b.input})
        return turn
