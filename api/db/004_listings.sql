-- Annonces : une ligne par bien. La validation (en attente / validé / refusé / archivé) est contrôlée par le serveur.
CREATE TABLE listings (
  ref        text PRIMARY KEY CHECK (ref ~ '^IB-[A-Z]{3}-\d{3}$'),
  owner      text NOT NULL,
  validation text NOT NULL CHECK (validation IN ('en attente', 'validé', 'refusé', 'archivé')),
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON listings (validation);
CREATE INDEX ON listings (owner);
