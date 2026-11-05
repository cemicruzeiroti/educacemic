from datetime import datetime

from app import db


class Occurrence(db.Model):
    __tablename__ = "occurrences"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False, index=True)
    registered_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    cargo_registrador = db.Column(db.String(40), nullable=False)
    nome_registrador = db.Column(db.String(80), nullable=False)
    data_hora = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    tipo = db.Column(db.String(40), nullable=False)
    descricao = db.Column(db.Text, nullable=False)
    pontos_descontados = db.Column(db.Float, nullable=False, default=0.0)

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "registered_by_user_id": self.registered_by_user_id,
            "cargo_registrador": self.cargo_registrador,
            "nome_registrador": self.nome_registrador,
            "data_hora": self.data_hora.isoformat() if self.data_hora else None,
            "tipo": self.tipo,
            "descricao": self.descricao,
            "pontos_descontados": self.pontos_descontados,
        }