"""Outils mis à disposition de l'agent.

Règle de sécurité : l'autorisation est appliquée ICI, dans le code, jamais dans le prompt.
- les outils publics ne lisent que des champs publics (PropertyOut, liste blanche) ;
- les outils personnels ne sont enregistrés que si un utilisateur est authentifié,
  et ne lisent que SES données (l'identifiant vient du jeton, pas du modèle) ;
- aucun outil n'écrit : les actions sensibles sont renvoyées au navigateur comme
  propositions à confirmer par l'utilisateur.
"""

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from pydantic import BaseModel, Field, ValidationError

from app.modules.properties.schemas import PropertyOut, Status
from app.modules.properties.service import PropertyService

from .schemas import UiAction

QUARTIERS = ["Bonanjo", "Akwa", "Bonapriso", "Deido", "Bali", "Bepanda", "Makepe", "Bonamoussadi", "Kotto", "Logpom"]
TYPES = ["Appartement", "Villa", "Studio", "Terrain", "Bureau", "Boutique", "Fonds de commerce"]
MODES = ["Location", "Location meublée", "Saisonnière", "Colocation", "Bail de mobilité", "Location-gérance", "Vente"]
SITUATIONS: dict[str, list[str]] = {
    "CDI": ["CNI ou passeport", "3 dernières fiches de paie", "Contrat de travail", "Attestation de travail effective", "Avis d'imposition et NIU", "Dossier du garant solidaire"],
    "CDD ou stage": ["CNI ou passeport", "Contrat de travail ou de stage", "Avis d'imposition et NIU", "Dossier du garant solidaire"],
    "Étudiant": ["CNI ou passeport", "Titre de séjour valide", "Certificat de scolarité", "Dossier du garant solidaire"],
    "Indépendant ou commerçant": ["CNI ou passeport", "Avis d'imposition et NIU", "Bilans ou relevés d'activité", "Dossier du garant solidaire"],
    "Expatrié ou mission": ["CNI ou passeport", "Titre de séjour valide", "Contrat de travail", "Attestation de travail effective"],
}
MAX_RESULTS = 8


@dataclass
class AuthUser:
    id: str
    role: str  # visitor | owner | legal | provider | admin
    name: str


@dataclass
class ToolBox:
    """État d'une requête : services, utilisateur, et ce que les outils ont produit."""

    properties: PropertyService
    user: AuthUser | None = None
    actions: list[UiAction] = field(default_factory=list)
    shown: dict[str, PropertyOut] = field(default_factory=dict)


# ---------- entrées validées ----------
class SearchIn(BaseModel):
    quartiers: list[str] = Field(default=[], max_length=10)
    types: list[str] = Field(default=[], max_length=7)
    modes: list[str] = Field(default=[], max_length=7)
    max_price: int | None = Field(default=None, ge=0, le=10**11)
    min_rooms: int | None = Field(default=None, ge=0, le=20)
    equipements: list[str] = Field(default=[], max_length=8)
    only_available: bool = False


class RefIn(BaseModel):
    ref: str = Field(pattern=r"^IB-[A-Z]{3}-\d{3}$")


class BudgetIn(BaseModel):
    monthly_net_income: int | None = Field(default=None, ge=0, le=10**10)
    rent: int | None = Field(default=None, ge=0, le=10**10)
    charges: int = Field(default=0, ge=0, le=10**9)


class DocsIn(BaseModel):
    situation: str


class NavIn(BaseModel):
    page: str
    tab: str | None = Field(default=None, max_length=20)


class EmergencyIn(BaseModel):
    type: str
    level: str = "Sous 24 h"
    ref: str | None = Field(default=None, pattern=r"^IB-[A-Z]{3}-\d{3}$")
    description: str = Field(min_length=3, max_length=300)


def _brief(p: PropertyOut) -> dict[str, Any]:
    return {"ref": p.ref, "titre": p.title, "quartier": p.q, "type": p.type, "operation": p.mode,
            "prix_fcfa": p.price, "pieces": p.rooms, "surface_m2": p.surface, "statut": p.status.value}


# ---------- implémentations ----------
def search_properties(tb: ToolBox, a: SearchIn) -> dict[str, Any]:
    qs = [q for q in a.quartiers if q in QUARTIERS]
    ty = [t for t in a.types if t in TYPES]
    mo = [m for m in a.modes if m in MODES]
    eq = [e.lower()[:30] for e in a.equipements]
    items = [
        p for p in tb.properties.search(quartier=None, type_=None, status=Status.libre if a.only_available else None,
                                        max_price=a.max_price, limit=1000, offset=0)
        if (not qs or p.q in qs) and (not ty or p.type in ty) and (not mo or p.mode in mo)
        and (not a.min_rooms or p.rooms >= a.min_rooms)
        and all(any(e in x.lower() for x in p.eq) for e in eq)
    ]
    items.sort(key=lambda p: (p.status != Status.libre, p.price))
    for p in items[:MAX_RESULTS]:
        tb.shown[p.ref] = p
    tb.actions.append(UiAction(type="show_results", payload={
        "quartiers": qs, "types": ty, "modes": mo, "max_price": a.max_price, "min_rooms": a.min_rooms}))
    return {"nombre": len(items), "resultats": [_brief(p) for p in items[:MAX_RESULTS]]}


def get_property(tb: ToolBox, a: RefIn) -> dict[str, Any]:
    p = tb.properties.get(a.ref)
    if p is None:
        raise ToolError("Référence inconnue : utilise search_properties.")
    tb.shown[p.ref] = p
    tb.actions.append(UiAction(type="open_property", payload={"ref": p.ref}))
    return {**_brief(p), "description": p.desc, "equipements": p.eq, "conditions": p.cond,
            "revenu_net_conseille_fcfa": None if p.mode == "Vente" else p.price * 3}


def check_budget(tb: ToolBox, a: BudgetIn) -> dict[str, Any]:
    out: dict[str, Any] = {"regle": "loyer + charges <= 1/3 du revenu net mensuel"}
    if a.monthly_net_income:
        out["loyer_max_fcfa"] = a.monthly_net_income // 3
    if a.rent:
        total = a.rent + a.charges
        out |= {"revenu_minimum_fcfa": total * 3, "depot_2_mois_fcfa": a.rent * 2}
        if a.monthly_net_income:
            out["conforme"] = total * 3 <= a.monthly_net_income
    return out


def required_documents(tb: ToolBox, a: DocsIn) -> dict[str, Any]:
    if a.situation not in SITUATIONS:
        raise ToolError("Situation inconnue. Valeurs : " + ", ".join(SITUATIONS))
    return {"situation": a.situation, "pieces": SITUATIONS[a.situation], "delai_etude": "72 h"}


def start_booking(tb: ToolBox, a: RefIn) -> dict[str, Any]:
    p = tb.properties.get(a.ref)
    if p is None:
        raise ToolError("Référence inconnue.")
    if p.status != Status.libre:
        raise ToolError(f"Bien non libre ({p.status.value}) : proposer les favoris.")
    tb.actions.append(UiAction(type="open_booking", payload={"ref": p.ref}))
    return {"ok": True, "note": "Formulaire ouvert côté navigateur ; l'utilisateur le remplit et l'envoie lui-même."}


PAGES = {"home", "biens", "services", "juridique", "simulateur", "espace"}


def navigate(tb: ToolBox, a: NavIn) -> dict[str, Any]:
    if a.page not in PAGES:
        raise ToolError("Page inconnue : " + ", ".join(sorted(PAGES)))
    tb.actions.append(UiAction(type="navigate", payload={"page": a.page, "tab": a.tab}))
    return {"ok": True}


def propose_emergency(tb: ToolBox, a: EmergencyIn) -> dict[str, Any]:
    assert tb.user is not None  # outil enregistré uniquement pour un utilisateur connecté
    if a.type not in {"Plomberie", "Électricité", "Serrurerie", "Autre"}:
        raise ToolError("Type inconnu.")
    tb.actions.append(UiAction(type="confirm_emergency", payload=a.model_dump()))
    return {"ok": True, "note": "Une fiche pré-remplie est affichée : l'utilisateur doit la confirmer pour l'envoyer."}


class ToolError(Exception):
    """Erreur renvoyée au modèle (il peut corriger et réessayer), jamais une erreur serveur."""


@dataclass
class Tool:
    name: str
    description: str
    model: type[BaseModel]
    fn: Callable[[ToolBox, Any], dict[str, Any]]
    needs_user: bool = False

    def spec(self) -> dict[str, Any]:
        schema = self.model.model_json_schema()
        schema.pop("title", None)
        return {"name": self.name, "description": self.description, "input_schema": schema}


TOOLS: list[Tool] = [
    Tool("search_properties", f"Cherche parmi les biens publiés à Douala et les affiche à l'écran. Quartiers : {', '.join(QUARTIERS)}. Types : {', '.join(TYPES)}. Modes : {', '.join(MODES)}. Ne jamais inventer de bien.", SearchIn, search_properties),
    Tool("get_property", "Détails publics d'un bien par sa référence (IB-XXX-000) et ouverture de sa fiche.", RefIn, get_property),
    Tool("check_budget", "Règle de solvabilité : loyer + charges <= 1/3 du revenu net mensuel.", BudgetIn, check_budget),
    Tool("required_documents", "Pièces du dossier selon la situation : " + ", ".join(SITUATIONS) + ".", DocsIn, required_documents),
    Tool("start_booking", "Ouvre le formulaire de réservation d'un bien libre. Seulement si l'utilisateur demande à réserver.", RefIn, start_booking),
    Tool("navigate", "Affiche une page du site : " + ", ".join(sorted(PAGES)) + ".", NavIn, navigate),
    Tool("propose_emergency", "Prépare un signalement d'urgence (Plomberie, Électricité, Serrurerie, Autre) que l'utilisateur devra confirmer.", EmergencyIn, propose_emergency, needs_user=True),
]


def tools_for(user: AuthUser | None) -> list[Tool]:
    return [t for t in TOOLS if not t.needs_user or user is not None]


def run_tool(tb: ToolBox, name: str, raw: dict[str, Any]) -> tuple[str, bool]:
    """Exécute un outil autorisé. Retourne (contenu JSON tronqué, est_erreur)."""
    import json

    tool = next((t for t in tools_for(tb.user) if t.name == name), None)
    if tool is None:
        return "Outil inconnu ou non autorisé.", True
    try:
        args = tool.model.model_validate(raw)
        out = tool.fn(tb, args)
    except ValidationError as e:
        return "Arguments invalides : " + "; ".join(f"{'.'.join(map(str, x['loc']))} {x['msg']}" for x in e.errors()[:5]), True
    except ToolError as e:
        return str(e), True
    return json.dumps(out, ensure_ascii=False)[:8000], False
