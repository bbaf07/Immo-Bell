-- Demandes de réservation déposées par les clients ; l'état détaillé (étapes, pièces, décision) est dans `data`.
CREATE TABLE requests (
  code       text PRIMARY KEY CHECK (code ~ '^RES-\d{4}-\d{4}$'),
  by_email   text NOT NULL,
  ref        text NOT NULL CHECK (ref ~ '^IB-[A-Z]{3}-\d{3}$'),
  status     text NOT NULL,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON requests (by_email);
CREATE INDEX ON requests (ref);
