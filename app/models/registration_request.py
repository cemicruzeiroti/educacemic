from datetime import datetime

from app import db


class RegistrationRequest(db.Model):
    __tablename__ = "registration_requests"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    cpf = db.Column(db.String(20), nullable=True, index=True)
    nome_completo = db.Column(db.String(120), nullable=True)
    cargo_solicitado = db.Column(db.String(40), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="pending")  # pending/approved/rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "cpf": self.cpf,
            "nome_completo": self.nome_completo,
            "cargo_solicitado": self.cargo_solicitado,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }