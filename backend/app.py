from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import Config
from backend.database.db import init_db
from backend.routes.customers import customers_bp
from backend.routes.machines import machines_bp
from backend.routes.tickets import tickets_bp
from backend.routes.chat import chat_bp
from backend.routes.memory import memory_bp
from backend.routes.demo import demo_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize SQLite database & seed
    init_db()

    # Register Blueprints
    app.register_blueprint(customers_bp)
    app.register_blueprint(machines_bp)
    app.register_blueprint(tickets_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(memory_bp)
    app.register_blueprint(demo_bp)

    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({
            'status': 'healthy',
            'hindsight_status': 'configured' if Config.HINDSIGHT_API_URL else 'persistent_store_active',
            'ollama_status': Config.OLLAMA_MODEL
        })

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)
