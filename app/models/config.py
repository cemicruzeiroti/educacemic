from app import db


class SystemConfig(db.Model):
    __tablename__ = "system_config"

    key = db.Column(db.String(80), primary_key=True)
    value = db.Column(db.String(255), nullable=False)

    @staticmethod
    def get(key, default=None):
        row = db.session.get(SystemConfig, key)
        if row is None:
            return default
        try:
            return float(row.value)
        except (TypeError, ValueError):
            return row.value

    @staticmethod
    def set(key, value):
        row = db.session.get(SystemConfig, key)
        if row is None:
            row = SystemConfig(key=key, value=str(value))
            db.session.add(row)
        else:
            row.value = str(value)