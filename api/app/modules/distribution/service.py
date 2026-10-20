import re
import unicodedata
from enum import Enum

from app.modules.properties.schemas import PropertyOut


class Platform(str, Enum):
    facebook = "facebook"
    whatsapp = "whatsapp"
    instagram = "instagram"
    airbnb = "airbnb"
    booking = "booking"


SHORT_STAY_ONLY = {Platform.airbnb, Platform.booking}
LIMITS = {Platform.instagram: 2200, Platform.airbnb: 50}  # légende Instagram ; titre Airbnb

MODEL = {"Location": "À louer", "Vente": "À vendre", "Saisonnière": "Séjour court"}


def _fcfa(n: int) -> str:
    return f"{n:,}".replace(",", "\u202f") + " FCFA"


def _tag(t: str) -> str:
    s = unicodedata.normalize("NFD", t)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return "#" + "".join(w.capitalize() for w in re.split(r"[^A-Za-z0-9]+", s) if w)


def _rooms(p: PropertyOut) -> str:
    return "Terrain nu" if not p.rooms else f"{p.rooms} pièce{'s' if p.rooms > 1 else ''}"


class PlatformNotAllowed(ValueError):
    pass


def listing_text(p: PropertyOut, platform: Platform, site_url: str) -> str:
    """Fiche prête à copier. Aucune publication automatique : ces plateformes l'exigent via un partenariat."""
    if platform in SHORT_STAY_ONLY and p.mode != "Saisonnière":
        raise PlatformNotAllowed("Cette plateforme est réservée aux séjours courts")
    unit = "" if p.mode == "Vente" else " / nuit" if p.mode == "Saisonnière" else " / mois"
    price, m, url = _fcfa(p.price) + unit, MODEL.get(p.mode, p.mode), f"{site_url}/biens/{p.ref}"
    eq = ", ".join(p.eq[:6])
    if platform is Platform.whatsapp:
        return f"*{m} · {p.title}*\n📍 {p.q}, Douala\n💰 {price}\n📐 {p.surface} m² · {_rooms(p)}\n\nAnnonce complète : {url}\nDossier étudié par le pôle juridique Immo Bell."
    if platform is Platform.instagram:
        return f"{p.title} ✨\n📍 {p.q}, Douala · {price}\n{_rooms(p)} · {p.surface} m²\n\n{' · '.join(p.eq[:3])}\nAnnonce complète : lien dans la bio.\n\n#Douala #Cameroun #Immobilier {_tag(p.type)} {_tag(p.q)} #ImmoBell"[:2200]
    if platform in SHORT_STAY_ONLY:
        title = p.title if len(p.title) <= 50 else p.title[:49] + "…"
        return f"TITRE\n{title}\n\nDESCRIPTION\n{p.desc}\n\nL'ESPACE\n{_rooms(p)}, {p.surface} m². Équipements : {eq}.\n\nQUARTIER\n{p.q}, Douala.\n\nTARIF\n{price}\n\nRÈGLES DE LA MAISON\n{p.cond or 'À préciser avec le bailleur.'}\n\nACCUEIL\nConciergerie et service après-vente Immo Bell, de 8 h à 18 h."
    return f"🏠 {m} · {p.title}\n📍 {p.q}, Douala\n💰 {price}\n📐 {p.surface} m² · {_rooms(p)}\n✅ {eq}\n\n{p.desc}\n\nDossier étudié par le pôle juridique Immo Bell, réponse sous 72 h.\n👉 Annonce complète : {url}\n✉️ contact@immobell.cm\n\n#Douala #Immobilier {_tag(p.type)} {_tag(p.q)} #ImmoBell"
