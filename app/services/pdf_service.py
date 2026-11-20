import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak

from flask import current_app
from app.models.config import SystemConfig


def get_initial_points():
    val = SystemConfig.get("initial_points", None)
    if val is None:
        return current_app.config.get("INITIAL_FORMATIVE_POINTS", 1.0)
    return float(val)


def build_occurrences_pdf(student, occurrences):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    initial_points = get_initial_points()

    elements.append(Paragraph(f"Ocorrencias do aluno: {student.nome}", styles["Title"]))
    elements.append(Paragraph(f"Turma: {student.turma}", styles["Normal"]))
    elements.append(Paragraph(f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles["Normal"]))
    elements.append(Spacer(1, 12))

    # Agrupar ocorrencias por bimestre
    occ_by_bim = {}
    occ_no_bim = []
    for occ in occurrences:
        if occ.bimestre:
            occ_by_bim.setdefault(occ.bimestre, []).append(occ)
        else:
            occ_no_bim.append(occ)

    bim_order = [1, 2, 3, 4]
    all_bims = sorted(list(set([b for b in occ_by_bim.keys() if b] + [b for b in bim_order if b in occ_by_bim])))

    for bim in all_bims:
        occs = occ_by_bim.get(bim, [])
        descontos_bim = sum((o.pontos_descontados or 0) for o in occs)
        pontos_atual = max(0.0, initial_points - descontos_bim)
        elements.append(Paragraph(f"Bimestre {bim} - Ponto formativo {pontos_atual}", styles["Heading2"]))
        elements.append(Spacer(1, 6))
        data = [["Data/Hora", "Tipo", "Registrado por", "Descricao", "Pontos"]]
        for occ in occs:
            registrado_por = f"{occ.nome_registrador} ({occ.cargo_registrador})"
            data.append([
                occ.data_hora.strftime("%d/%m/%Y %H:%M") if occ.data_hora else "",
                occ.tipo,
                registrado_por,
                (occ.descricao or "")[:60],
                f"-{occ.pontos_descontados}",
            ])

        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 10))

    if occ_no_bim:
        elements.append(Paragraph("Sem bimestre definido", styles["Heading2"]))
        elements.append(Spacer(1, 6))
        data = [["Data/Hora", "Tipo", "Registrado por", "Descricao", "Pontos"]]
        for occ in occ_no_bim:
            registrado_por = f"{occ.nome_registrador} ({occ.cargo_registrador})"
            data.append([
                occ.data_hora.strftime("%d/%m/%Y %H:%M") if occ.data_hora else "",
                occ.tipo,
                registrado_por,
                (occ.descricao or "")[:60],
                f"-{occ.pontos_descontados}",
            ])

        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 12))

    elements.append(Spacer(1, 12))

    doc.build(elements)
    buffer.seek(0)
    return buffer


def build_class_occurrences_pdf(turma, occurrences):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f"Ocorrencias da turma: {turma}", styles["Title"]))
    elements.append(Paragraph(f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles["Normal"]))
    elements.append(Spacer(1, 12))

    data = [["Data", "Aluno", "Tipo", "Registrado por", "Descricao"]]
    for occ in occurrences:
        registrado_por = f"{occ.nome_registrador} ({occ.cargo_registrador})"
        data.append([
            occ.data_hora.strftime("%d/%m/%Y %H:%M") if occ.data_hora else "",
            getattr(occ, "student_nome", "") or "",
            occ.tipo,
            registrado_por,
            (occ.descricao or "")[:60],
        ])

    table = Table(data, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)
    return buffer


def build_points_pdf(turma, students):
    students = sorted(students or [], key=lambda s: (str(s.turma or ""), (s.nome or "")))
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    title = "Todas as turmas" if turma == "ALL" else f"Turma: {turma}"
    elements.append(Paragraph(f"Ponto formativo - {title}", styles["Title"]))
    elements.append(Paragraph(f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles["Normal"]))
    elements.append(Spacer(1, 12))

    # group by turma
    from itertools import groupby
    first = True
    for t, group in groupby(students, key=lambda s: str(s.turma or "")):
        if not first:
            elements.append(PageBreak())
        first = False
        data = [["Turma", "Nome", "Ponto formativo"]]
        for s in group:
            data.append([s.turma, s.nome, f"{s.pontos_formativo}"])
        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 12))

    doc.build(elements)
    buffer.seek(0)
    return buffer
