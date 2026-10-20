-- Schéma initial PostgreSQL (sera repris en migration Alembic).
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE user_role AS ENUM ('visitor', 'owner', 'admin');
CREATE TYPE property_status AS ENUM ('libre', 'réservé', 'occupé');
CREATE TYPE validation_status AS ENUM ('en attente', 'validé', 'refusé');

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT UNIQUE,
  phone         TEXT UNIQUE,
  name          TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'visitor',
  password_hash TEXT,                       -- argon2id
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE properties (
  id          BIGSERIAL PRIMARY KEY,
  ref         TEXT UNIQUE NOT NULL CHECK (ref ~ '^IB-[A-Z]{3}-\d{3}$'),
  owner_id    BIGINT NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL,
  type        TEXT NOT NULL,
  mode        TEXT NOT NULL,
  quartier    TEXT NOT NULL,
  location    GEOGRAPHY(Point, 4326),
  price_fcfa  BIGINT NOT NULL CHECK (price_fcfa >= 0),
  rooms       INT NOT NULL DEFAULT 0,
  surface_m2  INT NOT NULL DEFAULT 0,
  status      property_status NOT NULL DEFAULT 'libre',
  validation  validation_status NOT NULL DEFAULT 'en attente',
  pack        TEXT,                          -- Basic / Standard / Premium / Diaspora
  description TEXT,
  conditions  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON properties (quartier, status);

CREATE TABLE bookings (
  id          BIGSERIAL PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,          -- RES-2026-xxxx
  property_id BIGINT NOT NULL REFERENCES properties(id),
  user_id     BIGINT NOT NULL REFERENCES users(id),
  status      TEXT NOT NULL DEFAULT 'reçue',
  due_at      TIMESTAMPTZ NOT NULL,          -- étude du dossier sous 72 h
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id         BIGSERIAL PRIMARY KEY,
  actor_id   BIGINT REFERENCES users(id),
  action     TEXT NOT NULL,
  target     TEXT,
  at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
