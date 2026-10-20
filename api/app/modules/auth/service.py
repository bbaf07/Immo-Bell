"""Comptes et sessions : mots de passe hachés (scrypt, bibliothèque standard), jeton de session signé HMAC.

Dépôt PostgreSQL si IMMOBELL_DATABASE_URL commence par « postgresql », sinon mémoire (perdu à l'arrêt).
"""

import base64
import secrets
import hashlib
import hmac
import json
import os
import time
from pathlib import Path
from threading import Lock

import psycopg
from psycopg.rows import dict_row
from pydantic import BaseModel, Field

SESSION_SECONDS = 7 * 24 * 3600
SCHEMA = Path(__file__).parents[3] / "db" / "003_users.sql"
PUBLIC_ROLES = ("visitor", "owner")  # seuls rôles qu'on peut choisir à l'inscription


class UserOut(BaseModel):
    email: str
    name: str
    role: str


class Credentials(BaseModel):
    email: str = Field(max_length=120, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=8, max_length=128)


class Forgot(BaseModel):
    email: str = Field(max_length=120, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class Reset(BaseModel):
    token: str = Field(min_length=20, max_length=100)
    password: str = Field(min_length=8, max_length=128)


class Register(Credentials):
    name: str = Field(min_length=2, max_length=80)
    role: str = Field(default="visitor", pattern=r"^(visitor|owner)$")


def hash_password(pw: str) -> str:
    salt = os.urandom(16)
    h = hashlib.scrypt(pw.encode(), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return f"scrypt${salt.hex()}${h.hex()}"


def check_password(pw: str, stored: str) -> bool:
    try:
        _, salt, h = stored.split("$")
        got = hashlib.scrypt(pw.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1, dklen=32)
        return hmac.compare_digest(got.hex(), h)
    except ValueError:
        return False


DUMMY_HASH = hash_password("x" * 12)  # même coût de calcul pour un e-mail inconnu : pas de différence de timing


def sign(email: str, secret: str, now: float | None = None) -> str:
    body = base64.urlsafe_b64encode(json.dumps({"e": email, "x": int((now or time.time()) + SESSION_SECONDS)}).encode()).decode()
    return body + "." + hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()


def verify(token: str, secret: str, now: float | None = None) -> str | None:
    body, _, mac = token.partition(".")
    if not hmac.compare_digest(mac, hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()):
        return None
    try:
        d = json.loads(base64.urlsafe_b64decode(body))
    except ValueError:
        return None
    return d["e"] if d.get("x", 0) > (now or time.time()) else None


class UserStore:
    def __init__(self, url: str | None) -> None:
        self._pg = url.replace("+psycopg", "") if url and url.startswith("postgresql") else None
        self._mem: dict[str, tuple[str, str, str]] = {}  # email -> (nom, rôle, hachage)
        self._lock = Lock()
        self._attempts: dict[str, list[float]] = {}
        self._resets: dict[str, tuple[str, float]] = {}  # hachage du jeton -> (e-mail, expiration)
        if self._pg:
            with self._conn() as c:
                if not c.execute("SELECT to_regclass('users_auth') AS t").fetchone()["t"]:
                    c.execute(SCHEMA.read_text(encoding="utf8"))
                c.execute("CREATE TABLE IF NOT EXISTS password_resets (token_hash text PRIMARY KEY, email text NOT NULL, expires_at timestamptz NOT NULL)")

    def _conn(self) -> psycopg.Connection:
        return psycopg.connect(self._pg, row_factory=dict_row)  # type: ignore[arg-type]

    def get(self, email: str) -> tuple[UserOut, str] | None:
        email = email.lower()
        if self._pg:
            with self._conn() as c:
                r = c.execute("SELECT name, role, password_hash FROM users_auth WHERE email = %s", (email,)).fetchone()
            return (UserOut(email=email, name=r["name"], role=r["role"]), r["password_hash"]) if r else None
        m = self._mem.get(email)
        return (UserOut(email=email, name=m[0], role=m[1]), m[2]) if m else None

    def create(self, email: str, name: str, role: str, pw: str) -> UserOut | None:
        """None si l'e-mail existe déjà."""
        email = email.lower()
        h = hash_password(pw)
        if self._pg:
            with self._conn() as c:
                r = c.execute("INSERT INTO users_auth (email, name, role, password_hash) VALUES (%s,%s,%s,%s) ON CONFLICT DO NOTHING RETURNING email", (email, name, role, h)).fetchone()
            return UserOut(email=email, name=name, role=role) if r else None
        with self._lock:
            if email in self._mem:
                return None
            self._mem[email] = (name, role, h)
        return UserOut(email=email, name=name, role=role)

    def throttled(self, key: str, limit: int = 8, window: int = 60) -> bool:
        """Au plus `limit` tentatives de connexion par minute et par clé (e-mail + IP)."""
        now = time.time()
        with self._lock:
            hits = [t for t in self._attempts.get(key, []) if now - t < window]
            hits.append(now)
            self._attempts[key] = hits
            return len(hits) > limit

    # -- réinitialisation du mot de passe : jeton à usage unique, valable une heure, stocké haché ---------------
    @staticmethod
    def _h(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    def new_reset(self, email: str) -> str:
        token = secrets.token_urlsafe(32)
        if self._pg:
            with self._conn() as c:
                c.execute("INSERT INTO password_resets (token_hash, email, expires_at) VALUES (%s,%s, now() + interval '1 hour')", (self._h(token), email.lower()))
        else:
            self._resets[self._h(token)] = (email.lower(), time.time() + 3600)
        return token

    def use_reset(self, token: str, new_password: str) -> bool:
        """Change le mot de passe si le jeton est valide, puis le consomme."""
        h, pw = self._h(token), hash_password(new_password)
        if self._pg:
            with self._conn() as c:
                r = c.execute("DELETE FROM password_resets WHERE token_hash = %s AND expires_at > now() RETURNING email", (h,)).fetchone()
                if r:
                    c.execute("UPDATE users_auth SET password_hash = %s WHERE email = %s", (pw, r["email"]))
            return bool(r)
        with self._lock:
            got = self._resets.pop(h, None)
            if not got or got[1] < time.time() or got[0] not in self._mem:
                return False
            name, role, _ = self._mem[got[0]]
            self._mem[got[0]] = (name, role, pw)
            return True
