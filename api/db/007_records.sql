-- Devis, urgences, litiges, avis, favoris : un enregistrement JSON par objet (clé = code, ou ref|date|auteur pour un avis).
CREATE TABLE records (
  kind       text NOT NULL CHECK (kind IN ('quote', 'incident', 'case', 'review', 'fav')),
  key        text NOT NULL,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, key)
);
