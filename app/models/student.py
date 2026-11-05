from datetime import datetime

from app import db


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    turma = db.Column(db.String(60), nullable=False, index=True)
    pontos_formativo = db.Column(db.Float, nullable=False, default=1.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    occurrences = db.relationship(
        "Occurrence", backref="student", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "turma": self.turma,
            "pontos_formativo": self.pontos_formativo,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }