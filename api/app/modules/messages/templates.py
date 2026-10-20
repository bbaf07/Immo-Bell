"""Modèles d'e-mails (HTML + texte) et de SMS d'Immo Bell : un modèle par événement, une seule mise en page.

Chaque modèle s'écrit avec des {variables} ; les valeurs sont échappées en HTML. Un SMS tient en 160 caractères.
"""

import re
from dataclasses import dataclass
from html import escape

GOLD, INK = "#F2B000", "#0A0A0A"
CONTACT = ("contact@immobell.cm", "Bonanjo, Douala", "Service après-vente : 8 h à 18 h")


@dataclass(frozen=True)
class Template:
    subject: str
    lines: tuple[str, ...]  # paragraphes
    sms: str
    cta: tuple[str, str] | None = None  # (libellé, chemin du site)


@dataclass(frozen=True)
class Message:
    subject: str
    text: str
    html: str
    sms: str


T: dict[str, Template] = {
    "welcome": Template("Bienvenue chez Immo Bell, {name}", ("Bonjour {name},", "Votre compte est créé. Vous pouvez dès maintenant chercher un bien, déposer une demande et suivre votre dossier depuis votre espace.", "Un nom de prestige, une gestion d'excellence."), "Immo Bell : bienvenue {name}. Votre compte est actif.", ("Ouvrir mon espace", "/espace")),
    "password_reset": Template("Réinitialisation de votre mot de passe Immo Bell", ("Bonjour,", "Vous avez demandé à choisir un nouveau mot de passe. Ce lien est valable 1 heure et ne sert qu'une fois.", "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe actuel reste valable."), "", ("Choisir un nouveau mot de passe", "{link}")),
    "request_received": Template("Demande {code} reçue", ("Bonjour {name},", "Nous avons bien reçu votre demande {code} pour « {title} ». L'analyste juridique étudie votre dossier sous 72 h.", "Gardez ce code : il identifie votre demande. Vous êtes prévenu à chaque étape."), "Immo Bell : demande {code} recue. Reponse sous 72 h.", ("Suivre ma demande", "/espace?tab=res")),
    "request_missing_doc": Template("Pièce manquante pour votre demande {code}", ("Bonjour {name},", "Il manque une pièce à votre dossier {code} : {doc}. Déposez-la dans « Mes documents » pour que l'étude puisse se poursuivre.", "Sans réponse de votre part, l'étude reste suspendue."), "Immo Bell : il manque une piece au dossier {code}. Deposez-la dans Mes documents.", ("Compléter mon dossier", "/espace?tab=docs")),
    "request_accepted": Template("Dossier accepté : demande {code}", ("Bonjour {name},", "Bonne nouvelle : votre demande {code} pour « {title} » est acceptée.", "Prochaine étape : l'état des lieux contradictoire, puis la remise des clés. Nous vous contactons pour fixer le rendez-vous."), "Immo Bell : dossier {code} accepte. Nous vous contactons pour l'etat des lieux.", ("Voir mon dossier", "/espace?tab=res")),
    "request_rejected": Template("Dossier rejeté : demande {code}", ("Bonjour {name},", "Après étude, votre demande {code} pour « {title} » n'a pas été retenue.", "Motif : {reason}.", "Vous pouvez nous écrire pour en discuter, ou consulter des biens similaires."), "Immo Bell : dossier {code} non retenu ({reason}). Ecrivez-nous pour en discuter.", ("Voir des biens similaires", "/biens")),
    "request_reminder": Template("Rappel : le dossier {code} attend une décision", ("Bonjour,", "Le dossier {code} ({name}) arrive au terme du délai de 72 h : il reste {hours} h pour décider.", "Merci de rendre votre décision dans les temps."), "Immo Bell : dossier {code}, il reste {hours} h avant la fin du delai de 72 h.", ("Ouvrir le dossier", "/espace?tab=dem")),
    "property_submitted": Template("Nouveau bien à valider : {ref}", ("Bonjour,", "{owner} a soumis le bien « {title} » ({ref}). Validation attendue après étude : photos réelles, documents de propriété, conformité de l'annonce."), "Immo Bell : nouveau bien a valider {ref}.", ("Valider le bien", "/espace?tab=valid")),
    "property_validated": Template("Votre bien {ref} est publié", ("Bonjour {name},", "Votre bien « {title} » ({ref}) a été validé : il est maintenant visible des clients.", "Vous suivez ses vues, ses demandes et ses avis depuis votre espace."), "Immo Bell : votre bien {ref} est publie.", ("Voir mes biens", "/espace?tab=biens")),
    "property_refused": Template("Votre bien {ref} n'a pas été retenu", ("Bonjour {name},", "Après étude, le bien « {title} » ({ref}) n'a pas pu être publié. Notre équipe vous précise les raisons et les corrections possibles."), "Immo Bell : votre bien {ref} n'a pas ete retenu. Nous vous contactons.", ("Contacter Immo Bell", "/espace?tab=msg")),
    "incident_received": Template("Signalement {code} reçu", ("Bonjour {name},", "Votre signalement {code} ({type}) est bien reçu. L'analyse est en cours et un prestataire agréé est dépêché selon le niveau d'urgence : {level}."), "Immo Bell : signalement {code} recu. Prestataire dispatche selon l'urgence.", ("Suivre mon signalement", "/espace?tab=sav")),
    "incident_dispatched": Template("{code} : un prestataire est en route", ("Bonjour {name},", "{provider} intervient pour votre signalement {code}. Vous serez prévenu à son arrivée."), "Immo Bell : {provider} intervient pour {code}.", ("Suivre l'intervention", "/espace?tab=sav")),
    "incident_closed": Template("Intervention {code} terminée", ("Bonjour {name},", "L'intervention {code} est clôturée. Rapport : {report}", "Une remarque ? Écrivez-nous depuis votre espace."), "Immo Bell : intervention {code} terminee.", ("Voir le rapport", "/espace?tab=sav")),
    "quote_received": Template("Demande de devis {code} reçue", ("Bonjour {name},", "Votre demande de devis {code} ({type}) est enregistrée. Un prestataire agréé vous répond avec son devis dans votre espace."), "Immo Bell : demande de devis {code} recue.", ("Suivre mon devis", "/espace?tab=sav")),
    "quote_sent": Template("Votre devis {code} est prêt", ("Bonjour {name},", "{provider} vous a adressé son devis {code} : {amount}, délai {delay}.", "Vous pouvez l'accepter ou poser vos questions depuis votre espace."), "Immo Bell : devis {code} recu, {amount}, delai {delay}.", ("Voir le devis", "/espace?tab=sav")),
    "quote_assigned": Template("Nouvelle demande de devis {code}", ("Bonjour,", "Une nouvelle demande de devis vous est attribuée : {code} ({type}).", "Merci de répondre avec votre devis dans votre espace."), "Immo Bell : nouvelle demande de devis {code} ({type}).", ("Répondre", "/espace?tab=devis")),
    "case_opened": Template("Litige {code} ouvert", ("Bonjour {name},", "Le dossier {code} ({subject}) est ouvert. La partie adverse dispose de 72 h pour répondre, puis un administrateur prend le dossier en charge."), "Immo Bell : litige {code} ouvert. Reponse de l'autre partie sous 72 h.", ("Suivre le litige", "/espace?tab=litiges")),
    "case_reply": Template("{code} : l'autre partie a répondu", ("Bonjour {name},", "L'autre partie a déposé sa réponse au dossier {code}. Vous la retrouvez dans votre espace."), "Immo Bell : reponse deposee au dossier {code}.", ("Lire la réponse", "/espace?tab=litiges")),
    "case_resolved": Template("Décision rendue : dossier {code}", ("Bonjour {name},", "Une décision a été rendue pour le dossier {code} : {verdict}.", "Si vous la contestez, vous pouvez demander un second examen depuis votre espace."), "Immo Bell : decision rendue pour {code}.", ("Lire la décision", "/espace?tab=litiges")),
    "message_new": Template("Nouveau message de votre conseillère Immo Bell", ("Bonjour {name},", "Vous avez un nouveau message dans votre espace."), "Immo Bell : nouveau message dans votre espace.", ("Lire le message", "/espace?tab=msg")),
    "notification": Template("{subject}", ("{text}",), "Immo Bell : {text}", ("Ouvrir mon espace", "/espace")),
}

# Reconnaît l'événement d'une notification du site à partir de son texte.
RULES: list[tuple[str, str]] = [
    (r"^Dossier accepté", "request_accepted"), (r"^Dossier rejeté", "request_rejected"), (r"^Demande RES-\S+ reçue", "request_received"),
    (r"a demandé une pièce", "request_missing_doc"), (r"^Signalement URG-\S+ reçu", "incident_received"), (r"dispatché", "incident_dispatched"),
    (r"^Devis DEV-\S+ reçu", "quote_sent"), (r"Nouvelle demande de devis", "quote_assigned"), (r"Nouveau message", "message_new"),
    (r"l'autre partie a répondu", "case_reply"), (r"soumis par", "property_submitted"),
]


SUBJECTS = {
    "request_accepted": "Dossier accepté", "request_rejected": "Dossier rejeté", "request_received": "Demande reçue", "request_missing_doc": "Pièce manquante",
    "incident_received": "Signalement reçu", "incident_dispatched": "Un prestataire est en route", "quote_sent": "Votre devis est prêt", "quote_assigned": "Nouvelle demande de devis",
    "message_new": "Nouveau message", "case_reply": "Réponse dans votre litige", "property_submitted": "Nouveau bien à valider",
}


def classify(text: str) -> str:
    return next((ev for rx, ev in RULES if re.search(rx, text)), "notification")


class _Safe(dict[str, str]):
    def __missing__(self, key: str) -> str:
        return ""


def render(event: str, site_url: str, **v: object) -> Message:
    t = T[event]
    raw = _Safe({k: str(x) for k, x in v.items()})
    esc = _Safe({k: escape(str(x)) for k, x in v.items()})
    subject = t.subject.format_map(raw)
    lines_t = [ln.format_map(raw) for ln in t.lines]
    lines_h = [ln.format_map(esc) for ln in t.lines]
    link = t.cta[1].format_map(raw) if t.cta else ""
    url = link if link.startswith("http") else site_url.rstrip("/") + link
    text = "\n\n".join(lines_t + ([f"{t.cta[0]} : {url}"] if t.cta else []) + ["— Immo Bell · " + " · ".join(CONTACT)])
    return Message(subject, text, _html(subject, lines_h, t.cta[0] if t.cta else None, url, site_url), t.sms.format_map(raw)[:160])


def _html(title: str, paras: list[str], cta: str | None, url: str, site_url: str) -> str:
    body = "".join(f'<p style="margin:0 0 16px;line-height:1.6;color:{INK};font-size:15px">{p}</p>' for p in paras)
    button = f'<p style="margin:24px 0 8px"><a href="{escape(url)}" style="background:{GOLD};color:{INK};text-decoration:none;font-weight:700;padding:13px 22px;display:inline-block">{escape(cta)}</a></p>' if cta else ""
    return (
        '<!doctype html><html lang="fr"><body style="margin:0;background:#f6f3ec;font-family:Montserrat,Arial,sans-serif">'
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">'
        '<table role="presentation" width="600" style="max-width:600px;background:#ffffff;border:1px solid #e6dfcf" cellpadding="0" cellspacing="0">'
        f'<tr><td style="padding:22px 28px;border-bottom:3px solid {GOLD}"><img src="{escape(site_url.rstrip("/"))}/logo.png" alt="Immo Bell" height="56" style="display:block;height:56px"></td></tr>'
        f'<tr><td style="padding:28px"><h1 style="margin:0 0 18px;font-size:20px;color:{INK}">{escape(title)}</h1>{body}{button}</td></tr>'
        f'<tr><td style="padding:18px 28px;background:{INK};color:#cfc8b6;font-size:12px;line-height:1.6">{CONTACT[0]} · {CONTACT[1]}<br>{CONTACT[2]}</td></tr>'
        "</table></td></tr></table></body></html>"
    )


def notification(text: str, site_url: str) -> Message:
    """E-mail d'une notification du site : le texte tel quel, avec un objet qui dit de quoi il s'agit."""
    return render("notification", site_url, subject=SUBJECTS.get(classify(text), "Notification Immo Bell"), text=text)
