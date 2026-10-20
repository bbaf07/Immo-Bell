-- Comptes du site (inscription, connexion). Les rôles du personnel sont créés par la ligne de commande, jamais à l'inscription.
CREATE TABLE users_auth (
  email         text PRIMARY KEY CHECK (email = lower(email)),
  name          text NOT NULL,
  role          text NOT NULL CHECK (role IN ('visitor', 'owner', 'legal', 'provider', 'admin')),
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
