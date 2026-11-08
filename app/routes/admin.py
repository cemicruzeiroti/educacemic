from flask import Blueprint, request, jsonify

from app import db
from app.models.user import User
from app.models.registration_request import RegistrationRequest
from app.utils.decorators import roles_required, get_current_user
from app.config import Config
from app.services.config_service import get_initial_points, get_all_penalties, recalculate_all_points, seed_defaults
from app.models.config import SystemConfig

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/registration-requests", methods=["GET"])
@roles_required(*Config.ROLES_APPROVE_REGISTRATION)
def list_registration_requests():
    status = request.args.get("status", "pending")
    reqs = RegistrationRequest.query.filter_by(status=status).all()
    return jsonify([r.to_dict() for r in reqs]), 200


@admin_bp.route("/registration-requests/<int:req_id>/approve", methods=["POST"])
@roles_required(*Config.ROLES_APPROVE_REGISTRATION)
def approve_registration(req_id):
    req = db.session.get(RegistrationRequest, req_id)
    if req is None or req.status != "pending":
        return jsonify({"msg": "Solicitacao nao encontrada ou ja processada"}), 404

    data = request.get_json(silent=True) or {}
    cargo = data.get("cargo", "professor")
    if cargo not in Config.VALID_CARGOS:
        return jsonify({"msg": "cargo invalido"}), 400

    if User.query.filter_by(username=req.username).first() is not None:
        return jsonify({"msg": "Usuario ja existe"}), 409

    user = User(username=req.username, cargo=cargo, approved=True, cpf=req.cpf, nome_completo=req.nome_completo)
    user.password_hash = req.password_hash
    db.session.add(user)
    req.status = "approved"
    req.cargo_solicitado = cargo
    db.session.commit()
    return jsonify({"msg": "Cadastro aprovado", "user": user.to_dict()}), 200


@admin_bp.route("/registration-requests/<int:req_id>/reject", methods=["POST"])
@roles_required(*Config.ROLES_APPROVE_REGISTRATION)
def reject_registration(req_id):
    req = db.session.get(RegistrationRequest, req_id)
    if req is None or req.status != "pending":
        return jsonify({"msg": "Solicitacao nao encontrada ou ja processada"}), 404
    req.status = "rejected"
    db.session.commit()
    return jsonify({"msg": "Cadastro rejeitado"}), 200


@admin_bp.route("/users", methods=["POST"])
@roles_required(*Config.ROLES_CREATE_ADMIN)
def create_admin():
    from flask_jwt_extended import get_jwt_identity
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password")
    cargo = data.get("cargo", "admin")
    admin_password = data.get("admin_password")

    if not username or not password or not admin_password:
        return jsonify({"msg": "username, password e admin_password sao obrigatorios"}), 400
    if cargo not in Config.VALID_CARGOS:
        return jsonify({"msg": "cargo invalido"}), 400

    current = db.session.get(User, int(get_jwt_identity()))
    if current is None or not current.check_password(admin_password):
        return jsonify({"msg": "Senha do admin incorreta"}), 403

    if User.query.filter_by(username=username).first() is not None:
        return jsonify({"msg": "Usuario ja existe"}), 409

    user = User(username=username, cargo=cargo, approved=True)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({"msg": "Usuario criado", "user": user.to_dict()}), 201


@admin_bp.route("/users/<int:user_id>/cargo", methods=["PATCH"])
@roles_required(*Config.ROLES_CREATE_ADMIN)
def update_user_cargo(user_id):
    user = db.session.get(User, user_id)
    if user is None:
        return jsonify({"msg": "Usuario nao encontrado"}), 404
    data = request.get_json() or {}
    cargo = data.get("cargo")
    if cargo not in Config.VALID_CARGOS:
        return jsonify({"msg": "cargo invalido"}), 400
    user.cargo = cargo
    db.session.commit()
    return jsonify({"msg": "Cargo atualizado", "user": user.to_dict()}), 200


@admin_bp.route("/users", methods=["GET"])
@roles_required(*Config.ROLES_CREATE_ADMIN)
def list_users():
    users = User.query.order_by(User.id.desc()).all()
    return jsonify([u.to_dict() for u in users]), 200


@admin_bp.route("/users/<int:user_id>/reset-password", methods=["POST"])
@roles_required(*Config.ROLES_CREATE_ADMIN)
def reset_password(user_id):
    user = db.session.get(User, user_id)
    if user is None:
        return jsonify({"msg": "Usuario nao encontrado"}), 404
    new_pwd = user.cpf or user.username
    user.set_password(new_pwd)
    db.session.commit()
    return jsonify({"msg": "Senha resetada para o CPF do usuario"}), 200


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@roles_required(*Config.ROLES_CREATE_ADMIN)
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if user is None:
        return jsonify({"msg": "Usuario nao encontrado"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"msg": "Usuario removido"}), 200


@admin_bp.route("/config", methods=["GET"])
@roles_required(*Config.ROLES_CREATE_ADMIN)
def get_config():
    seed_defaults()
    return jsonify({
        "initial_points": get_initial_points(),
        "penalties": get_all_penalties(),
    }), 200


@admin_bp.route("/config", methods=["PUT"])
@roles_required(*Config.ROLES_CREATE_ADMIN)
def update_config():
    data = request.get_json() or {}
    if "initial_points" in data:
        try:
            SystemConfig.set("initial_points", float(data["initial_points"]))
        except (TypeError, ValueError):
            return jsonify({"msg": "initial_points invalido"}), 400
    penalties = data.get("penalties") or {}
    for tipo, val in penalties.items():
        if tipo not in Config.OCCURRENCE_PENALTIES:
            continue
        try:
            SystemConfig.set(f"penalty_{tipo}", float(val))
        except (TypeError, ValueError):
            return jsonify({"msg": f"penalidade invalida: {tipo}"}), 400
    db.session.commit()
    recalculate_all_points()
    return jsonify({"msg": "Configuracao atualizada e pontos recalculados"}), 200


@admin_bp.route("/recalculate-points", methods=["POST"])
@roles_required(*Config.ROLES_CREATE_ADMIN)
def recalculate_all_students_points():
    from app.models.student import Student
    from app.models.occurrence import Occurrence
    from app.config import Config
    students = Student.query.all()
    count = 0
    for s in students:
        occs = Occurrence.query.filter_by(student_id=s.id).all()
        total_discount = sum(occ.pontos_descontados or 0 for occ in occs)
        s.pontos_formativo = max(0.0, Config.INITIAL_FORMATIVE_POINTS - total_discount)
        count += 1
    db.session.commit()
    return jsonify({"msg": f"Pontos recalculados para {count} alunos"}), 200