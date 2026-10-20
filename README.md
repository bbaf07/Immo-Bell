# Immo Bell : plateforme de gestion locative et de services (Douala)

Un nom de prestige, une gestion d'excellence. Site **Next.js** (`web/`) et **API FastAPI + PostgreSQL** (`api/`).

> **Pour présenter la démonstration, il suffit du site** : aucune base de données, aucune clé, aucun compte à créer.

## Démonstration en 3 commandes

Prérequis : [Node.js 20 ou plus](https://nodejs.org) et Git.

```bash
git clone <adresse-du-depot>
cd immobell/web
npm install
npm run dev
```

Ouvrir **http://localhost:3000**. Le premier démarrage compile pendant environ une minute.

- **Mon espace** → choisir l'un des 5 profils de démonstration : Client, Propriétaire, Analyste juridique, Prestataire agréé, Administrateur.
- Le bouton **Réinitialiser la démo** (pied de page) remet les données d'exemple à zéro avant chaque présentation.
- **FR / EN**, thème clair ou sombre, **Mode économie** pour les connexions lentes.
- Les données de démonstration restent dans le navigateur de chacun : deux personnes ne voient pas les mêmes actions.

Le déroulé conseillé de 10 minutes est dans [docs/guide-demo.md](docs/guide-demo.md).

## Rapports

| Document | Contenu |
|---|---|
| [docs/rapports/Rapport-1-Site-ImmoBell.pdf](docs/rapports/Rapport-1-Site-ImmoBell.pdf) | Ce que fait le site, architecture, sécurité, état d'avancement, déroulé de démonstration |
| [docs/rapports/Rapport-2-Mise-en-place-Douala.pdf](docs/rapports/Rapport-2-Mise-en-place-Douala.pdf) | Offre, équipe, locaux, installations, cadre juridique, calendrier, budget (hypothèses à valider) |

Autres documents prêts à imprimer : [fiches des services](docs/fiches-services), [documents à remplir](docs/documents-a-remplir) (état des lieux, devis, rapport d'intervention), [contrats de travail](docs/contrats-de-travail) (modèles à faire valider par un juriste), [modèles d'e-mails et de SMS](docs/messages).

## Serveur réel (facultatif)

Comptes réels, base PostgreSQL, e-mails. Pas nécessaire pour la démonstration.

```bash
cd api
python -m venv .venv && source .venv/bin/activate     # Windows : .venv\Scripts\activate
pip install -r requirements-dev.txt
pytest -q                                              # 80 tests
export IMMOBELL_DATABASE_URL=postgresql+psycopg://utilisateur:motdepasse@127.0.0.1:5432/immobell
export IMMOBELL_STAFF_TOKEN=un-jeton-long
uvicorn app.main:app --port 8000                       # http://localhost:8000/docs
```

Sans `IMMOBELL_DATABASE_URL`, l'API garde les données en mémoire. Pour que le site utilise l'API, le lancer avec `IMMOBELL_API_URL=http://127.0.0.1:8000` (par exemple `IMMOBELL_API_URL=http://127.0.0.1:8000 npm run dev` dans `web`). Sans cette variable, le site fonctionne seul, en mode démonstration.

Créer un compte du personnel : `python -m app.cli adresse@exemple.cm "Nom" admin`.

Variables d'environnement (jamais dans le code) : `IMMOBELL_SESSION_SECRET` (obligatoire hors développement), `IMMOBELL_SMTP_HOST/PORT/USER/PASSWORD/FROM` (e-mails réels, sinon écrits dans les journaux), `ANTHROPIC_API_KEY` (assistant Awa ; sans clé il fonctionne en mode démonstration).

Avec Docker : `cp .env.example .env`, changer le mot de passe, puis `docker compose up --build`.

## Structure

```
web/                site Next.js : pages, espaces par rôle, impressions (/imprimer)
api/                API FastAPI : comptes, biens, demandes, messages, devis, urgences, litiges, avis
  app/modules/      un dossier par métier (router → service → stockage)
  app/ports/        interfaces SMS, e-mail, stockage, paiement
  db/               schémas PostgreSQL
docs/               rapports, guide de démonstration, fiches, contrats, modèles de messages
```

## État

Complet en démonstration. Serveur réel développé et testé. Restent à contracter avant l'ouverture au public : hébergement et domaine, SMS, paiement Mobile Money, stockage des photos, audit de sécurité. Détail dans le rapport n° 1.
