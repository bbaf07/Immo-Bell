# 0001 — Architecture : monolithe modulaire

**Statut :** accepté (à valider par l'équipe)

## Décision
- **web/** : Next.js 15 (App Router), TypeScript, Tailwind CSS 4, Motion pour les animations. Composants d'interface au format shadcn/21st.dev (`src/components/ui`, utilitaire `cn`).
- **api/** : FastAPI, un dossier par module métier (`properties`, puis `auth`, `bookings`, `reviews`, `admin`, `audit`, `notifications`, `legal`, `incidents`, `mandates`, `logistics`).
- Chaque module suit `router → service → repository`. Les routes n'accèdent jamais directement à la base.
- PostgreSQL + PostGIS, Redis (cache, files d'attente), Docker Compose en développement.
- Migrations Alembic en mode « expand / contract » pour éviter les coupures.

## Conséquences
- Un seul déploiement à gérer au début ; un module pourra être extrait plus tard si nécessaire.
- Le front fonctionne avec les données de démonstration tant que `IMMOBELL_API_URL` n'est pas défini.
