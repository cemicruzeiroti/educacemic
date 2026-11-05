from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    cargo = db.Column(db.String(40), nullable=False, default="professor")
    approved = db.Column(db.Boolean, default=False, nullable=False)
    cpf = db.Column(db.String(20), unique=True, nullable=True, index=True)
    nome_completo = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "cargo": self.cargo,
            "approved": self.approved,
            "cpf": self.cpf,
            "nome_completo": self.nome_completo,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }