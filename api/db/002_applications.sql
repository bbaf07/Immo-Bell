-- Dossiers de location : trois statuts visibles et motif de rejet obligatoire en cas de rejet.
-- Les biens viennent encore du jeu de données de l'API : pas de clé étrangère vers properties.
CREATE SEQUENCE application_seq;
CREATE TABLE applications (
  code         text PRIMARY KEY CHECK (code ~ '^RES-\d{4}-\d{4}$'),
  property_ref text NOT NULL CHECK (property_ref ~ '^IB-[A-Z]{3}-\d{3}$'),
  name         text NOT NULL,
  phone        text NOT NULL,
  email        text NOT NULL,
  situation    text NOT NULL,
  income       bigint NOT NULL CHECK (income >= 0),
  status       text NOT NULL DEFAULT 'en_analyse' CHECK (status IN ('en_analyse', 'accepte', 'rejete')),
  reason       text,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  decided_at   timestamptz,
  history      jsonb NOT NULL DEFAULT '[]',
  -- un rejet porte toujours un motif ; un accord ou une analyse n'en portent pas
  CONSTRAINT reject_needs_reason CHECK ((status = 'rejete') = (reason IS NOT NULL))
);
CREATE INDEX ON applications (status, created_at);
CREATE INDEX ON applications (property_ref);
CREATE INDEX ON applications (lower(email));
