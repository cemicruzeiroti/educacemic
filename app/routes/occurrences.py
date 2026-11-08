from flask import Blueprint, request, jsonify
from datetime import datetime

from zoneinfo import ZoneInfo
from app import db
from app.models.student import Student
from app.models.occurrence import Occurrence
from app.models.user import User
from app.utils.decorators import login_required_approved, get_current_user
from app.config import Config
from app.services.config_service import get_penalty


def recalculate_student_points(student_id):
    """Recalcula os pontos do aluno baseado em todas as suas ocorrÃªncias."""
    student = db.session.get(Student, student_id)
    if student is None:
        return
    initial = Config.INITIAL_FORMATIVE_POINTS
    occs = Occurrence.query.filter_by(student_id=student_id).all()
    total_discount = sum(occ.pontos_descontados or 0 for occ in occs)
    student.pontos_formativo = max(0.0, initial - total_discount)
    db.session.commit()

occurrences_bp = Blueprint("occurrences", __name__, url_prefix="/api")


@occurrences_bp.route("/occurrences", methods=["POST"])
@login_required_approved
def create_occurrence():
    user = get_current_user()
    data = request.get_json() or {}
    student_id = data.get("student_id")
    tipo = data.get("tipo")
    descricao = (data.get("descricao") or "").strip()
    data_hora_input = data.get("data_hora")

    if not student_id or not tipo or not descricao:
        return jsonify({"msg": "student_id, tipo e descricao sao obrigatorios"}), 400
    if tipo not in Config.OCCURRENCE_PENALTIES:
        return jsonify({"msg": "tipo invalido"}), 400

    allowed = Config.OCCURRENCE_TYPES_BY_ROLE.get(user.cargo, [])
    if tipo not in allowed:
        return jsonify({"msg": "Seu cargo nao pode registrar este tipo de ocorrencia"}), 403

    student = db.session.get(Student, student_id)
    if student is None:
        return jsonify({"msg": "Aluno nao encontrado"}), 404

    now_sp = datetime.now(ZoneInfo("America/Sao_Paulo"))
    if data_hora_input:
        try:
            # accept ISO string (with or without offset)
            dt = datetime.fromisoformat(data_hora_input.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=ZoneInfo("America/Sao_Paulo"))
            dt = dt.astimezone(ZoneInfo("America/Sao_Paulo"))
        except ValueError:
            return jsonify({"msg": "data_hora invalida"}), 400
        if dt > now_sp:
            return jsonify({"msg": "Nao e permitido registrar ocorrencia em data futura"}), 400
        data_hora = dt
    else:
        data_hora = now_sp

    penalty = get_penalty(tipo)
    occ = Occurrence(
        student_id=student_id,
        registered_by_user_id=user.id,
        cargo_registrador=user.cargo,
        nome_registrador=user.nome_completo or user.username,
        data_hora=data_hora,
        tipo=tipo,
        descricao=descricao,
        pontos_descontados=penalty,
    )
    db.session.add(occ)
    db.session.flush()
    recalculate_student_points(student_id)
    db.session.commit()
    return jsonify({"msg": "Ocorrencia registrada", "occurrence": occ.to_dict()}), 201


@occurrences_bp.route("/occurrences", methods=["GET"])
@login_required_approved
def list_occurrences():
    student_id = request.args.get("student_id", type=int)
    turma = request.args.get("turma")
    q = Occurrence.query
    if student_id:
        q = q.filter_by(student_id=student_id)
    if turma:
        ids = [s.id for s in Student.query.filter_by(turma=turma).all()]
        q = q.filter(Occurrence.student_id.in_(ids)) if ids else q.filter(False)
    occs = q.order_by(Occurrence.data_hora.desc()).all()
    result = []
    for occ in occs:
        d = occ.to_dict()
        st = db.session.get(Student, occ.student_id)
        d["student_nome"] = st.nome if st else None
        d["student_turma"] = st.turma if st else None
        result.append(d)
    return jsonify(result), 200


@occurrences_bp.route("/occurrences/count", methods=["GET"])
@login_required_approved
def count_occurrences():
    return jsonify({"count": Occurrence.query.count()}), 200


@occurrences_bp.route("/occurrences/<int:occ_id>", methods=["GET"])
@login_required_approved
def get_occurrence(occ_id):
    occ = db.session.get(Occurrence, occ_id)
    if occ is None:
        return jsonify({"msg": "Ocorrencia nao encontrada"}), 404
    return jsonify(occ.to_dict()), 200


@occurrences_bp.route("/occurrences/<int:occ_id>", methods=["DELETE"])
@login_required_approved
def delete_occurrence(occ_id):
    user = get_current_user()
    occ = db.session.get(Occurrence, occ_id)
    if occ is None:
        return jsonify({"msg": "Ocorrencia nao encontrada"}), 404
    if user is None or (user.cargo != "admin" and occ.registered_by_user_id != user.id):
        return jsonify({"msg": "Sem permissao para remover esta ocorrencia"}), 403
    student_id = occ.student_id
    db.session.delete(occ)
    db.session.flush()
    recalculate_student_points(student_id)
    db.session.commit()
    return jsonify({"msg": "Ocorrencia removida"}), 200