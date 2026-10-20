from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

from app.modules.properties.schemas import PropertyOut


class ChatMessage(BaseModel):
    """Un tour de conversation envoyé par le navigateur.

    Seuls les rôles user/assistant sont acceptés : le prompt système reste côté serveur
    et ne peut jamais être fourni ni remplacé par le client.
    """

    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class PageContext(BaseModel):
    page: Literal["home", "biens", "bien", "services", "juridique", "simulateur", "espace"] = "home"
    ref: str | None = Field(default=None, pattern=r"^IB-[A-Z]{3}-\d{3}$")


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)
    lang: Literal["fr", "en"] = "fr"
    context: PageContext = PageContext()

    @field_validator("messages")
    @classmethod
    def last_is_user(cls, v: list[ChatMessage]) -> list[ChatMessage]:
        if v[-1].role != "user":
            raise ValueError("le dernier message doit venir de l'utilisateur")
        return v


ActionType = Literal["show_results", "open_property", "open_booking", "navigate", "confirm_emergency"]


class UiAction(BaseModel):
    """Action proposée à l'interface. Le serveur n'exécute jamais d'écriture lui-même :
    le navigateur applique la navigation, et toute écriture passe par un écran de confirmation."""

    type: ActionType
    payload: dict[str, Any] = {}


class ChatResponse(BaseModel):
    reply: str
    actions: list[UiAction] = []
    properties: list[PropertyOut] = []
    tool_calls: int = 0
