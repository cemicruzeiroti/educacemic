from app import db
from app.models.config import SystemConfig
from app.config import Config


def get_initial_points():
    val = SystemConfig.get("initial_points", None)
    if val is None:
        return Config.INITIAL_FORMATIVE_POINTS
    return float(val)


def get_penalty(tipo):
    key = f"penalty_{tipo}"
    val = SystemConfig.get(key, None)
    if val is None:
        return Config.OCCURRENCE_PENALTIES.get(tipo, 0.0)
    return float(val)


def get_all_penalties():
    result = {}
    for tipo in Config.OCCURRENCE_PENALTIES:
        result[tipo] = get_penalty(tipo)
    return result


def seed_defaults():
    if SystemConfig.get("initial_points", None) is None:
        SystemConfig.set("initial_points", Config.INITIAL_FORMATIVE_POINTS)
    for tipo, val in Config.OCCURRENCE_PENALTIES.items():
        if SystemConfig.get(f"penalty_{tipo}", None) is None:
            SystemConfig.set(f"penalty_{tipo}", val)
    db.session.commit()


def recalculate_all_points():
    from app.models.student import Student
    from app.models.occurrence import Occurrence
    initial = get_initial_points()
    penalties = get_all_penalties()
    for student in Student.query.all():
        occs = Occurrence.query.filter_by(student_id=student.id).all()
        total = initial
        for occ in occs:
            occ.pontos_descontados = penalties.get(occ.tipo, occ.pontos_descontados or 0.0)
            total -= occ.pontos_descontados
        student.pontos_formativo = max(0.0, total)
    db.session.commit()