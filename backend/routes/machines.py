from flask import Blueprint, jsonify
from backend.database.db import get_db_connection
from backend.services.hindsight_service import recall_memory, reflect_memory

machines_bp = Blueprint('machines', __name__, url_prefix='/api/machines')

@machines_bp.route('', methods=['GET'])
def list_machines():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT m.*, c.company_name, c.contact_name,
            (SELECT COUNT(*) FROM tickets t WHERE t.machine_id = m.machine_id AND t.status != 'Resolved') as open_tickets_count,
            (SELECT issue FROM tickets t WHERE t.machine_id = m.machine_id ORDER BY t.id DESC LIMIT 1) as last_issue
        FROM machines m
        JOIN customers c ON m.customer_id = c.customer_id
        ORDER BY m.id ASC
    ''')
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify(rows)

@machines_bp.route('/<machine_id>', methods=['GET'])
def get_machine(machine_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT m.*, c.company_name, c.contact_name, c.email, c.phone, c.location as customer_location
        FROM machines m
        JOIN customers c ON m.customer_id = c.customer_id
        WHERE m.machine_id = ? OR m.id = ?
    ''', (machine_id, machine_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Machine not found'}), 404

    m_dict = dict(row)
    cursor.execute("SELECT * FROM tickets WHERE machine_id = ? ORDER BY id DESC", (m_dict['machine_id'],))
    m_dict['tickets'] = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM interactions WHERE machine_id = ? ORDER BY id DESC LIMIT 15", (m_dict['machine_id'],))
    m_dict['interactions'] = [dict(r) for r in cursor.fetchall()]
    conn.close()

    memories_res = recall_memory('', m_dict['customer_id'], m_dict['machine_id'], limit=20)
    m_dict['memories'] = memories_res['memories']
    m_dict['reflection'] = reflect_memory(m_dict['customer_id'], m_dict['machine_id'])

    return jsonify(m_dict)
