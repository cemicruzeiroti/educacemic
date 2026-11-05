from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

from app import db
from app.models.user import User
from app.models.registration_request import RegistrationRequest
from app.config import Config

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"msg": "username e password sao obrigatorios"}), 400

    user = User.query.filter_by(username=username).first()
    if user is None or not user.check_password(password):
        return jsonify({"msg": "Credenciais invalidas"}), 401
    if not user.approved:
        return jsonify({"msg": "Cadastro ainda nao aprovado pelo admin"}), 403

    token = create_access_token(identity=str(user.id))
    return jsonify({
        "access_token": token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    cpf = (data.get("cpf") or "").strip()
    nome_completo = (data.get("nome_completo") or "").strip()
    username = (data.get("username") or "").strip()
    password = data.get("password")

    if not cpf or not nome_completo or not username or not password:
        return jsonify({"msg": "cpf, nome_completo, username e password sao obrigatorios"}), 400

    # usuario nao pode ser repetido no sistema (nem em requests pendentes)
    if User.query.filter_by(username=username).first() is not None:
        return jsonify({"msg": "Usuario ja existe"}), 409
    if User.query.filter_by(cpf=cpf).first() is not None:
        return jsonify({"msg": "CPF ja cadastrado"}), 409
    if RegistrationRequest.query.filter_by(username=username, status="pending").first() is not None:
        return jsonify({"msg": "Ja existe solicitacao pendente para este usuario"}), 409
    if RegistrationRequest.query.filter_by(cpf=cpf, status="pending").first() is not None:
        return jsonify({"msg": "Ja existe solicitacao pendente para este CPF"}), 409

    req = RegistrationRequest(username=username, cpf=cpf, nome_completo=nome_completo)
    req.set_password(password)
    db.session.add(req)
    db.session.commit()

    return jsonify({"msg": "Solicitacao de cadastro enviada. Aguarde aprovacao do admin.", "request": req.to_dict()}), 201