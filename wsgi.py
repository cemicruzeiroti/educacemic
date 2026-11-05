import os
from app import create_app

app = create_app()
# Ensure tables exist and seed admin on first boot (safe for SQLite)
with app.app_context():
    from app import db
    from app.models.user import User
    db.create_all()
    if User.query.filter_by(username="admin").first() is None:
        u = User(username="admin", cargo="admin", approved=True)
        u.set_password("admin")
        db.session.add(u)
        db.session.commit()
    from app.services.config_service import seed_defaults
    seed_defaults()