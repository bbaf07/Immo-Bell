# Suivi des coûts — Immo Bell

Mettre à jour à chaque nouveau service. Montants indicatifs à vérifier au moment de souscrire.

| Poste | Service envisagé | Coût mensuel | Alternative si migration | Remarque |
|---|---|---|---|---|
| Hébergement web + API | VPS (Hostinger KVM, OVH, Hetzner…) | à chiffrer | autre VPS, Docker identique | L'hébergement mutualisé ne peut pas faire tourner FastAPI |
| Base de données | PostgreSQL + PostGIS sur le VPS | inclus | Postgres managé (Neon, Supabase) | Sauvegardes quotidiennes obligatoires |
| Nom de domaine | immobell.cm ou .com | à chiffrer | — | Vérifier la disponibilité |
| SMS (OTP, alertes) | à choisir | au volume | autre fournisseur via `SmsProvider` | |
| Email transactionnel | à choisir | palier gratuit possible | autre via `EmailProvider` | |
| Paiement | Mobile Money (Orange, MTN) | commission | autre via `PaymentProvider` | |
| Stockage photos | stockage objet compatible S3 | au volume | autre via `StorageProvider` | |

**Règle :** chaque service externe passe par un port (`api/app/ports/providers.py`). Changer de prestataire = écrire un adaptateur, sans toucher au métier.
