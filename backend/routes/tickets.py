from flask import Blueprint, jsonify, request
from datetime import datetime
from backend.database.db import get_db_connection
from backend.services.hindsight_service import retain_memory, recall_memory

tickets_bp = Blueprint('tickets', __name__, url_prefix='/api/tickets')

@tickets_bp.route('', methods=['GET'])
def list_tickets():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT t.*, c.company_name, m.machine_name, m.model
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.customer_id
        LEFT JOIN machines m ON t.machine_id = m.machine_id
        ORDER BY t.id DESC
    ''')
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify(rows)

@tickets_bp.route('/<ticket_id>', methods=['GET'])
def get_ticket(ticket_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT t.*, c.company_name, c.contact_name, m.machine_name, m.model, m.operating_environment
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.customer_id
        LEFT JOIN machines m ON t.machine_id = m.machine_id
        WHERE t.ticket_id = ? OR t.id = ?
    ''', (ticket_id, ticket_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Ticket not found'}), 404
    
    t_dict = dict(row)
    cursor.execute("SELECT * FROM interactions WHERE ticket_id = ? OR machine_id = ? ORDER BY id ASC", (t_dict['ticket_id'], t_dict['machine_id']))
    t_dict['interactions'] = [dict(r) for r in cursor.fetchall()]
    conn.close()

    memories_res = recall_memory(t_dict['issue'], t_dict['customer_id'], t_dict['machine_id'], limit=5)
    t_dict['related_memories'] = memories_res['memories']

    return jsonify(t_dict)

@tickets_bp.route('', methods=['POST'])
def create_ticket():
    data = request.json or {}
    customer_id = data.get('customer_id')
    machine_id = data.get('machine_id')
    issue = data.get('issue')
    severity = data.get('severity', 'Medium')

    if not customer_id or not machine_id or not issue:
        return jsonify({'error': 'Missing customer_id, machine_id, or issue'}), 400

    now = datetime.utcnow().isoformat() + 'Z'
    ticket_id = f"TCK-{int(datetime.utcnow().timestamp()) % 10000:04d}"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO tickets (ticket_id, customer_id, machine_id, issue, severity, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'Open', ?)
    ''', (ticket_id, customer_id, machine_id, issue, severity, now))
    conn.commit()

    cursor.execute("SELECT * FROM tickets WHERE ticket_id = ?", (ticket_id,))
    new_ticket = dict(cursor.fetchone())
    conn.close()

    retain_memory({
        'memory_id': f"MEM-TCK-{ticket_id}",
        'customer_id': customer_id,
        'machine_id': machine_id,
        'memory_type': 'episodic',
        'category': 'symptom',
        'title': f"Support Ticket Initiated: {issue[:45]}",
        'summary': f"Ticket {ticket_id} opened: {issue}",
        'details': {'issue': issue, 'severity': severity, 'status': 'Open'},
        'confidence': 0.90,
        'event_date': now.split('T')[0],
        'tags': ['ticket', severity.lower()]
    })

    return jsonify(new_ticket), 201
