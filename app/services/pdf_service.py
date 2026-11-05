import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak


def build_occurrences_pdf(student, occurrences):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f"Ocorrencias do aluno: {student.nome}", styles["Title"]))
    elements.append(Paragraph(f"Turma: {student.turma}", styles["Normal"]))
    elements.append(Paragraph(f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles["Normal"]))
    elements.append(Spacer(1, 12))

    data = [["Data/Hora", "Tipo", "Cargo", "Registrado por", "Descricao", "Pontos"]]
    for occ in occurrences:
        data.append([
            occ.data_hora.strftime("%d/%m/%Y %H:%M") if occ.data_hora else "",
            occ.tipo,
            occ.cargo_registrador,
            occ.nome_registrador,
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
    elements.append(Paragraph(f"Ponto formativo atual: {student.pontos_formativo}", styles["Heading3"]))

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
        data.append([
            occ.data_hora.strftime("%d/%m/%Y %H:%M") if occ.data_hora else "",
            getattr(occ, "student_nome", "") or "",
            occ.tipo,
            occ.nome_registrador,
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