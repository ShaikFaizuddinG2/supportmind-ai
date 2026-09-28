from flask import Blueprint, jsonify
from backend.database.db import get_db_connection

customers_bp = Blueprint('customers', __name__, url_prefix='/api/customers')

@customers_bp.route('', methods=['GET'])
def list_customers():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers ORDER BY id ASC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify(rows)

@customers_bp.route('/<customer_id>', methods=['GET'])
def get_customer(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers WHERE customer_id = ? OR id = ?", (customer_id, customer_id))
    customer = cursor.fetchone()
    if not customer:
        conn.close()
        return jsonify({'error': 'Customer not found'}), 404
    
    c_dict = dict(customer)
    cursor.execute("SELECT * FROM machines WHERE customer_id = ?", (c_dict['customer_id'],))
    c_dict['machines'] = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM tickets WHERE customer_id = ? ORDER BY id DESC", (c_dict['customer_id'],))
    c_dict['tickets'] = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT COUNT(*) FROM hindsight_memories WHERE customer_id = ?", (c_dict['customer_id'],))
    c_dict['memories_count'] = cursor.fetchone()[0]

    conn.close()
    return jsonify(c_dict)
