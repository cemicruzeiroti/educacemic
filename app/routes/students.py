import csv
import io

from flask import Blueprint, request, jsonify, send_file

from app import db
from app.models.student import Student
from app.models.occurrence import Occurrence
from app.utils.decorators import roles_required, login_required_approved, get_current_user
from app.config import Config
from app.services.pdf_service import build_occurrences_pdf

students_bp = Blueprint("students", __name__, url_prefix="/api")


@students_bp.route("/students", methods=["GET"])
@login_required_approved
def list_students():
    turma = request.args.get("turma")
    search = request.args.get("search")
    q = Student.query
    if turma:
        q = q.filter_by(turma=turma)
    if search:
        like = f"%{search}%".upper()
        q = q.filter(db.func.upper(Student.nome).like(like) | db.func.upper(Student.turma).like(like))
    return jsonify([s.to_dict() for s in q.all()]), 200


@students_bp.route("/students", methods=["POST"])
@roles_required(*Config.ROLES_MANAGE_STUDENTS)
def create_student():
    data = request.get_json() or {}
    nome = (data.get("nome") or "").strip().upper()
    turma = (data.get("turma") or "").strip()
    if not nome or not turma:
        return jsonify({"msg": "nome e turma sao obrigatorios"}), 400

    existing = Student.query.filter_by(turma=turma, nome=nome).first()
    if existing is not None:
        return jsonify({"msg": "Aluno ja cadastrado nesta turma"}), 409

    initial = Config.INITIAL_FORMATIVE_POINTS
    student = Student(nome=nome, turma=turma, pontos_formativo=initial)
    db.session.add(student)
    db.session.commit()
    return jsonify({"msg": "Aluno cadastrado", "student": student.to_dict()}), 201


@students_bp.route("/students/bulk", methods=["POST"])
@roles_required(*Config.ROLES_MANAGE_STUDENTS)
def bulk_students():
    if "file" not in request.files:
        return jsonify({"msg": "Arquivo CSV obrigatorio (campo 'file')"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"msg": "Arquivo invalido"}), 400

    stream = io.StringIO(f.stream.read().decode("utf-8-sig"), newline=None)
    reader = csv.DictReader(stream)
    created = 0
    errors = []
    seen = set()
    for i, row in enumerate(reader, start=2):
        nome = (row.get("nome") or row.get("name") or "").strip().upper()
        turma = (row.get("turma") or row.get("class") or "").strip()
        if not nome or not turma:
            errors.append({"line": i, "msg": "nome/turma ausentes"})
            continue
        if (turma, nome) in seen:
            errors.append({"line": i, "msg": "Aluno duplicado no arquivo"})
            continue
        existing = Student.query.filter_by(turma=turma, nome=nome).first()
        if existing is not None:
            errors.append({"line": i, "msg": "Aluno ja cadastrado nesta turma"})
            continue
        seen.add((turma, nome))
        student = Student(nome=nome, turma=turma, pontos_formativo=Config.INITIAL_FORMATIVE_POINTS)
        db.session.add(student)
        created += 1
    db.session.commit()
    return jsonify({"msg": "Importacao concluida", "created": created, "errors": errors}), 200


@students_bp.route("/students/<int:student_id>", methods=["PATCH"])
@roles_required(*Config.ROLES_MANAGE_STUDENTS)
def update_student(student_id):
    student = db.session.get(Student, student_id)
    if student is None:
        return jsonify({"msg": "Aluno nao encontrado"}), 404
    data = request.get_json() or {}
    if "nome" in data and data.get("nome"):
        student.nome = data["nome"].strip().upper()
    if "turma" in data and data.get("turma"):
        student.turma = data["turma"].strip()
    if "pontos_formativo" in data:
        try:
            student.pontos_formativo = float(data["pontos_formativo"])
        except (TypeError, ValueError):
            return jsonify({"msg": "pontos_formativo invalido"}), 400
    db.session.commit()
    return jsonify({"msg": "Aluno atualizado", "student": student.to_dict()}), 200


@students_bp.route("/students/<int:student_id>", methods=["DELETE"])
@roles_required(*Config.ROLES_MANAGE_STUDENTS)
def delete_student(student_id):
    student = db.session.get(Student, student_id)
    if student is None:
        return jsonify({"msg": "Aluno nao encontrado"}), 404
    db.session.delete(student)
    db.session.commit()
    return jsonify({"msg": "Aluno removido"}), 200


@students_bp.route("/students/<int:student_id>/occurrences/pdf", methods=["GET"])
@login_required_approved
def student_occurrences_pdf(student_id):
    student = db.session.get(Student, student_id)
    if student is None:
        return jsonify({"msg": "Aluno nao encontrado"}), 404
    occs = Occurrence.query.filter_by(student_id=student_id).order_by(Occurrence.data_hora.desc()).all()
    buf = build_occurrences_pdf(student, occs)
    return send_file(buf, mimetype="application/pdf", as_attachment=True,
                     download_name=f"ocorrencias_{student.id}.pdf")