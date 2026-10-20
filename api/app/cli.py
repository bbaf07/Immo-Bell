"""Création d'un compte du personnel : python -m app.cli EMAIL "Nom" admin|legal|provider (mot de passe demandé)."""

import getpass
import sys

from app.modules.auth.router import get_users

if __name__ == "__main__":
    email, name, role = sys.argv[1:4]
    if role not in ("admin", "legal", "provider"):
        sys.exit("rôle : admin, legal ou provider")
    pw = getpass.getpass("Mot de passe (8 caractères min.) : ")
    if len(pw) < 8:
        sys.exit("mot de passe trop court")
    print("créé" if get_users().create(email, name, role, pw) else "existe déjà")
