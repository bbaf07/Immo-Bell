"""Génère un aperçu de tous les modèles : python -m app.modules.messages.preview [dossier]

Écrit un fichier .html par e-mail, plus modeles-sms.txt, à relire ou à envoyer à l'équipe pour validation.
"""

import sys
from pathlib import Path

from .templates import T, render

SAMPLE = dict(name="Carine", code="RES-2026-0421", title="Appartement 3 pièces, résidence Wouri", reason="Bien déjà attribué", doc="attestation de travail effective", hours=12,
              owner="Mme Ngo Bell", ref="IB-BNJ-001", type="Plomberie", level="Urgent", provider="Plomberie du Wouri", report="Cylindre remplacé, deux clés remises.",
              amount="90 000 FCFA", delay="2 jours", subject="Dépôt de garantie", verdict="en faveur du locataire", text="Votre dossier passe en étude juridique.", link="https://immobell.cm/reinitialiser?token=exemple")

if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "docs/messages")
    out.mkdir(parents=True, exist_ok=True)
    sms = []
    for event in T:
        m = render(event, "http://localhost:3000", **SAMPLE)
        (out / f"{event}.html").write_text(m.html, encoding="utf8")
        sms.append(f"{event}\n  Objet e-mail : {m.subject}\n  SMS ({len(m.sms)}/160) : {m.sms or '(aucun)'}\n")
    (out / "modeles-sms.txt").write_text("\n".join(sms), encoding="utf8")
    print(f"{len(T)} modèles écrits dans {out}")
