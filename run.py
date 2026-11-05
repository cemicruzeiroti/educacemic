from app import create_app, db
from app.models.user import User

app = create_app()


def seed_admin():
    with app.app_context():
        db.create_all()
        if User.query.filter_by(username="admin").first() is None:
            u = User(username="admin", cargo="admin", approved=True)
            u.set_password("admin")
            db.session.add(u)
            db.session.commit()
            print("Admin padrao criado -> usuario: admin / senha: admin")
        else:
            print("Admin ja existe.")
        from app.services.config_service import seed_defaults
        seed_defaults()
        print("Config padrao verificada.")


if __name__ == "__main__":
    seed_admin()
    app.run(debug=True, host="0.0.0.0", port=5000)