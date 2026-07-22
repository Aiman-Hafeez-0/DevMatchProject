from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os

from socketio_instance import socketio
from auth import auth_bp
from profiles import profiles_bp
from projects import projects_bp
from chat import chat_bp
from db import get_db_connection

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'supersecretkey123')

# Upload folder — files are saved here and served back as static URLs
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB limit

# Local dev ports are always allowed. Add your live frontend URL(s) via the
# FRONTEND_URLS env var (comma-separated) once deployed — e.g.
# FRONTEND_URLS=https://devmatch.vercel.app
_extra_origins = [o.strip() for o in os.getenv("FRONTEND_URLS", "").split(",") if o.strip()]

CORS(app, supports_credentials=True, origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://localhost:5175",
] + _extra_origins, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(profiles_bp, url_prefix="/profiles")
app.register_blueprint(projects_bp, url_prefix="/projects")
app.register_blueprint(chat_bp, url_prefix="/chat")

@app.route('/')
def home():
    return {"message": "connected to devmatch!"}

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    """Serve uploaded files (images, docs, etc.) directly."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

socketio.init_app(app)

if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    socketio.run(app, host='0.0.0.0', port=5000, debug=debug_mode)
