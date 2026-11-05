from flask import Blueprint, jsonify, send_from_directory, current_app, request
from app.utils.decorators import login_required_approved
from app.services.config_service import get_initial_points, get_all_penalties, seed_defaults

main_bp = Blueprint("main", __name__)


@main_bp.route("/", methods=["GET"])
def index():
    return send_from_directory(current_app.static_folder, "index.html")


@main_bp.route("/register", methods=["GET"])
def register_page():
    return send_from_directory(current_app.static_folder, "register.html")


@main_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@main_bp.route("/api/config", methods=["GET"])
@login_required_approved
def public_config():
    seed_defaults()
    return jsonify({
        "initial_points": get_initial_points(),
        "penalties": get_all_penalties(),
    }), 200