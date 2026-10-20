-- Notifications et messages : `email` = destinataire (notification) ou client de la conversation (message).
CREATE TABLE inbox (
  kind       text NOT NULL CHECK (kind IN ('notif', 'msg')),
  key        text NOT NULL,
  email      text NOT NULL,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, key)
);
CREATE INDEX ON inbox (kind, email);
