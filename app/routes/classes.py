from flask import Blueprint, request, jsonify, send_file

from app import db
from app.models.student import Student
from app.models.occurrence import Occurrence
from app.utils.decorators import login_required_approved
from app.services.pdf_service import build_points_pdf, build_class_occurrences_pdf

classes_bp = Blueprint("classes", __name__, url_prefix="/api")


@classes_bp.route("/classes/<path:turma>/occurrences", methods=["GET"])
@login_required_approved
def class_occurrences(turma):
    students = Student.query.filter_by(turma=turma).all()
    student_ids = [s.id for s in students]
    occs = Occurrence.query.filter(Occurrence.student_id.in_(student_ids)).order_by(Occurrence.data_hora.desc()).all() if student_ids else []
    result = []
    for occ in occs:
        d = occ.to_dict()
        st = db.session.get(Student, occ.student_id)
        d["student_nome"] = st.nome if st else None
        d["student_turma"] = st.turma if st else None
        result.append(d)
    return jsonify(result), 200


@classes_bp.route("/classes/<path:turma>/occurrences/pdf", methods=["GET"])
@login_required_approved
def class_occurrences_pdf(turma):
    students = Student.query.filter_by(turma=turma).all()
    student_ids = [s.id for s in students]
    occs = Occurrence.query.filter(Occurrence.student_id.in_(student_ids)).all() if student_ids else []
    for occ in occs:
        st = db.session.get(Student, occ.student_id)
        occ.student_nome = st.nome if st else ""
    occs.sort(key=lambda o: (o.student_nome or "", ), )
    # within same student, most recent first
    # stable sort by date desc after name asc
    occs_sorted = []
    from itertools import groupby
    for name, group in groupby(occs, key=lambda o: o.student_nome or ""):
        g = sorted(group, key=lambda o: o.data_hora, reverse=True)
        occs_sorted.extend(g)
    buf = build_class_occurrences_pdf(turma, occs_sorted)
    safe = turma.replace(" ", "_")
    return send_file(buf, mimetype="application/pdf", as_attachment=True,
                     download_name=f"ocorrencias_turma_{safe}.pdf")


@classes_bp.route("/classes/<path:turma>/points/pdf", methods=["GET"])
@login_required_approved
def class_points_pdf(turma):
    if turma == "ALL":
        students = Student.query.all()
        title = "Todas as turmas"
    else:
        students = Student.query.filter_by(turma=turma).all()
        title = turma
    buf = build_points_pdf(title, students)
    safe = title.replace(" ", "_")
    return send_file(buf, mimetype="application/pdf", as_attachment=True,
                     download_name=f"pontos_{safe}.pdf")