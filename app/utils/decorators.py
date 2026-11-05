from functools import wraps

from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models.user import User
from app.config import Config


def get_current_user():
    ident = get_jwt_identity()
    if ident is None:
        return None
    try:
        user_id = int(ident)
    except (TypeError, ValueError):
        user_id = ident
    return db.session.get(User, user_id)


def login_required_approved(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if user is None or not user.approved:
            return jsonify({"msg": "Acesso nao autorizado"}), 403
        return fn(*args, **kwargs)
    return wrapper


def roles_required(*roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if user is None or not user.approved:
                return jsonify({"msg": "Acesso nao autorizado"}), 403
            if user.cargo not in roles:
                return jsonify({"msg": "Permissao insuficiente"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def role_group(group_name):
    """Retorna decorator usando grupo de cargos definido na config."""
    roles = getattr(Config, group_name, [])
    return roles_required(*roles)