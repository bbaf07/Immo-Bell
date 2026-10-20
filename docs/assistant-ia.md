# Assistant IA « Awa »

Awa est une conseillère virtuelle qui **agit dans le site** : elle cherche des biens et affiche les résultats, ouvre une fiche, calcule un budget (règle du tiers), liste les pièces du dossier, ouvre la réservation et prépare un signalement d'urgence.

## Architecture

```
Navigateur (awa-chat.tsx)
   │  POST /api/assistant         même origine, aucune clé côté client
   ▼
Next.js (app/api/assistant/route.ts)   relais : limite de taille, délai 60 s
   │  POST /api/v1/assistant/chat
   ▼
FastAPI (modules/assistant)
   ├─ router.py   validation, limitation de débit, identité issue du jeton
   ├─ agent.py    boucle « modèle ↔ outils », 5 tours maximum
   ├─ tools.py    outils + autorisation (le cœur de la sécurité)
   └─ llm.py      port LLMClient + adaptateur Anthropic (Claude)
```

La réponse contient le texte (`reply`), les biens cités (`properties`, champs publics uniquement) et des **actions d'interface** (`show_results`, `open_property`, `open_booking`, `navigate`, `confirm_emergency`) que le navigateur applique.

## Activer

1. Créer une clé sur la console Anthropic et la mettre dans `.env` : `ANTHROPIC_API_KEY=...`
2. `docker compose up --build`
3. Le modèle se règle avec `IMMOBELL_ASSISTANT_MODEL` (par défaut `claude-sonnet-5-5`), le débit avec `IMMOBELL_ASSISTANT_RATE_PER_MINUTE` (12).

Sans clé, l'API répond `503` et le chat affiche « assistant non activé ».

## Règles de sécurité (appliquées dans le code, pas dans le prompt)

| Risque | Parade |
|---|---|
| Le client remplace les consignes | Rôles `user`/`assistant` seulement ; le prompt système est construit côté serveur |
| Injection de prompt via les données | Les résultats d'outils sont des données ; aucun outil n'écrit en base |
| Accès aux données d'un autre | Les outils personnels n'existent que pour un utilisateur authentifié, et l'identité vient du jeton, jamais du modèle |
| Fuite de champs internes | Les biens passent par `PropertyOut` (liste blanche) |
| Action non voulue | Réservation et urgence sont des **propositions** : l'utilisateur remplit et confirme lui-même |
| Boucle infinie / coût | 5 tours, 4 appels d'outil par tour, 20 messages et 2 000 caractères par message, limitation par minute |
| Arguments malveillants | Chaque entrée d'outil est validée par Pydantic ; une erreur revient au modèle, jamais en 500 |
| Fuite d'erreurs du fournisseur | Message neutre `502` |

Tests : `api/tests/test_assistant.py` (faux modèle scripté, aucun appel réseau).

## À faire avant la production

- Brancher `get_current_user` sur le module d'authentification (JWT en cookie httpOnly).
- Remplacer le limiteur en mémoire par Redis (partagé entre instances).
- Créer `POST /api/v1/incidents` et relier le bouton « Envoyer » de la carte de confirmation.
- Ajouter des outils personnels (mes demandes, mes pièces) en lisant uniquement les données de l'utilisateur du jeton.
- Journaliser les appels d'outils (sans le contenu des messages) pour l'audit.
