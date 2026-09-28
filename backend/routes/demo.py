from flask import Blueprint, jsonify
from backend.database.db import get_db_connection
from backend.database.seed import seed_all

demo_bp = Blueprint('demo', __name__, url_prefix='/api/demo')

@demo_bp.route('/seed', methods=['POST'])
def seed_demo():
    conn = get_db_connection()
    seed_all(conn)
    conn.close()
    return jsonify({'success': True, 'message': 'Demo data seeded successfully.'})

@demo_bp.route('/reset', methods=['POST'])
def reset_demo():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM interactions")
    cursor.execute("DELETE FROM tickets")
    cursor.execute("DELETE FROM machines")
    cursor.execute("DELETE FROM customers")
    cursor.execute("DELETE FROM hindsight_memories")
    conn.commit()
    seed_all(conn)
    conn.close()
    return jsonify({'success': True, 'message': 'Database reset to baseline demo state.'})
