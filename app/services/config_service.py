from app import db
from app.models.config import SystemConfig
from app.config import Config
from datetime import date


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


def get_bimestre_dates():
    """Retorna as datas de inicio e fim de cada bimestre."""
    result = {}
    for i in range(1, 5):
        result[f"bimestre_{i}_inicio"] = SystemConfig.get(f"bimestre_{i}_inicio", "")
        result[f"bimestre_{i}_fim"] = SystemConfig.get(f"bimestre_{i}_fim", "")
    return result


def set_bimestre_dates(data):
    """Atualiza as datas de inicio e fim de cada bimestre."""
    for i in range(1, 5):
        inicio_key = f"bimestre_{i}_inicio"
        fim_key = f"bimestre_{i}_fim"
        if inicio_key in data:
            SystemConfig.set(inicio_key, str(data[inicio_key] or ""))
        if fim_key in data:
            SystemConfig.set(fim_key, str(data[fim_key] or ""))


def calcular_bimestre(data_hora_str):
    """Calcula qual bimestre a data pertence com base nas datas configuradas."""
    if not data_hora_str:
        return None
    try:
        data = date.fromisoformat(str(data_hora_str)[:10])
    except (ValueError, TypeError):
        return None

    for i in range(1, 5):
        inicio = SystemConfig.get(f"bimestre_{i}_inicio", None)
        fim = SystemConfig.get(f"bimestre_{i}_fim", None)
        if inicio and fim:
            try:
                d_inicio = date.fromisoformat(inicio)
                d_fim = date.fromisoformat(fim)
                if d_inicio <= data <= d_fim:
                    return i
            except ValueError:
                continue
    return None