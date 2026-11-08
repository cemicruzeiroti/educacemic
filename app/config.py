import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-change-me")
    _db_url = os.getenv("DATABASE_URL", "sqlite:///educa_cemi.db")
    # Render/Heroku provide "postgres://" which SQLAlchemy 2.x no longer accepts
    if _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)

    # Re-encode credentials safely (passwords may contain special chars like @)
    if _db_url.startswith("postgresql://") or _db_url.startswith("postgresql+psycopg2://"):
        try:
            from urllib.parse import urlsplit, urlunsplit, quote
            # strip driver suffix for parsing
            _driver = ""
            _parse_url = _db_url
            if _db_url.startswith("postgresql+psycopg2://"):
                _driver = "postgresql+psycopg2"
                _parse_url = "postgresql://" + _db_url.split("://", 1)[1]
            parts = urlsplit(_parse_url)
            host = parts.hostname or ""
            # If host still contains '@' (malformed/unencoded password), recover
            if "@" in host:
                left, host = host.rsplit("@", 1)
                # append left part to password
                pwd = (parts.password or "") + "@" + left
                user = parts.username or ""
            else:
                user = parts.username or ""
                pwd = parts.password or ""
            if user or pwd:
                user = quote(user, safe="")
                pwd = quote(pwd, safe="")
                netloc = f"{user}:{pwd}@{host}"
                if parts.port:
                    netloc += f":{parts.port}"
                _db_url = urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))
                if _driver:
                    _db_url = _db_url.replace("postgresql://", _driver + "://", 1)
        except Exception:
            pass

    # ForÃ§a o driver psycopg2 (instalado via psycopg2-binary)
    if _db_url.startswith("postgresql://"):
        _db_url = _db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    # Supabase/Postgres exigem SSL em produÃ§Ã£o (SQLite nÃ£o aceita sslmode)
    if _db_url.startswith("postgresql") and "sslmode=" not in _db_url:
        _db_url += ("&" if "?" in _db_url else "?") + "sslmode=require"
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Pontos formativos
    INITIAL_FORMATIVE_POINTS = 1.0

    # Tipos de ocorrencia e seus descontos (facilmente ajustaveis)
    OCCURRENCE_PENALTIES = {
        "ATRASO": 0.0,
        "OUTROS": 0.0,
        "ADVERTENCIA": 0.5,
        "SUSPENSAO": 1.0,
        "OCORRENCIA LEVE": 0.1,
        "OCORRENCIA MEDIA": 0.2,
        "OCORRENCIA GRAVE": 0.3,
        "CELULAR": 0.1,
    }

    # Badges (cor) por tipo de ocorrencia
    OCCURRENCE_BADGES = {
        "ATRASO": "gray",
        "OUTROS": "gray",
        "ADVERTENCIA": "red",
        "SUSPENSAO": "red",
        "OCORRENCIA LEVE": "yellow",
        "OCORRENCIA MEDIA": "orange",
        "OCORRENCIA GRAVE": "red",
        "CELULAR": "yellow",
    }

    # Tipos de ocorrencia permitidos por cargo
    OCCURRENCE_TYPES_BY_ROLE = {
        "admin": ["ATRASO", "OUTROS", "ADVERTENCIA", "SUSPENSAO", "OCORRENCIA LEVE", "OCORRENCIA MEDIA", "OCORRENCIA GRAVE", "CELULAR"],
        "soe": ["ATRASO", "OUTROS", "ADVERTENCIA", "SUSPENSAO", "OCORRENCIA LEVE", "OCORRENCIA MEDIA", "OCORRENCIA GRAVE"],
        "coordenador": ["ATRASO", "OUTROS", "ADVERTENCIA", "SUSPENSAO", "OCORRENCIA LEVE", "OCORRENCIA MEDIA", "OCORRENCIA GRAVE"],
        "supervisor": ["ATRASO", "OUTROS", "ADVERTENCIA", "SUSPENSAO", "OCORRENCIA LEVE", "OCORRENCIA MEDIA", "OCORRENCIA GRAVE"],
        "diretor": ["ATRASO", "OUTROS", "ADVERTENCIA", "SUSPENSAO", "OCORRENCIA LEVE", "OCORRENCIA MEDIA", "OCORRENCIA GRAVE"],
        "vicediretor": ["ATRASO", "OUTROS", "ADVERTENCIA", "SUSPENSAO", "OCORRENCIA LEVE", "OCORRENCIA MEDIA", "OCORRENCIA GRAVE"],
        "professor": ["CELULAR", "OCORRENCIA LEVE", "OCORRENCIA MEDIA", "OCORRENCIA GRAVE", "OUTROS"],
    }

    # Grupos de cargos (facilmente ajustaveis)
    ROLES_MANAGE_STUDENTS = ["admin", "soe", "coordenador", "supervisor", "diretor", "vicediretor"]
    ROLES_CREATE_ADMIN = ["admin"]
    ROLES_APPROVE_REGISTRATION = ["admin"]
    ROLES_ALL_AUTHENTICATED = [
        "admin", "soe", "coordenador", "supervisor", "diretor", "vicediretor", "professor"
    ]

    VALID_CARGOS = [
        "admin", "soe", "coordenador", "supervisor", "diretor", "vicediretor", "professor"
    ]

    VALID_OCCURRENCE_TYPES = list(OCCURRENCE_PENALTIES.keys())