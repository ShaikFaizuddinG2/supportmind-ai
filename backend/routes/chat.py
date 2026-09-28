from flask import Blueprint, jsonify, request
from backend.services.support_agent import process_support_chat
from backend.services.llm_service import call_ollama
from backend.services.hindsight_service import recall_memory, build_memory_context
from backend.database.db import get_db_connection

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')

@chat_bp.route('', methods=['POST'])
def chat():
    data = request.json or {}
    customer_id = data.get('customer_id')
    machine_id = data.get('machine_id')
    message = data.get('message', '').strip()
    ticket_id = data.get('ticket_id')
    with_memory = data.get('with_memory', True)

    if not message:
        return jsonify({'error': 'Message cannot be empty'}), 400
    if not customer_id or not machine_id:
        return jsonify({'error': 'Missing customer_id or machine_id'}), 400

    try:
        result = process_support_chat(customer_id, machine_id, message, ticket_id, with_memory)
        return jsonify(result)
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/compare', methods=['POST'])
def compare():
    data = request.json or {}
    customer_id = data.get('customer_id')
    machine_id = data.get('machine_id')
    message = data.get('message', '').strip()

    if not customer_id or not machine_id or not message:
        return jsonify({'error': 'Missing customer_id, machine_id, or message'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers WHERE customer_id = ?", (customer_id,))
    c_row = cursor.fetchone()
    cursor.execute("SELECT * FROM machines WHERE machine_id = ?", (machine_id,))
    m_row = cursor.fetchone()
    conn.close()

    if not c_row or not m_row:
        return jsonify({'error': 'Customer or machine not found'}), 404

    customer = dict(c_row)
    machine = dict(m_row)

    # 1. Without Memory
    without_res = call_ollama(customer, machine, message, memory_context="", recalled_memories=[], with_memory=False)

    # 2. With Hindsight Memory
    recalled = recall_memory(message, customer_id, machine_id, limit=5)
    memory_context = build_memory_context(recalled['memories'], machine, customer)
    with_res = call_ollama(customer, machine, message, memory_context=memory_context, recalled_memories=recalled['memories'], with_memory=True)

    return jsonify({
        'query': message,
        'without_memory': {
            'response': without_res['response_text'],
            'suggested_actions': without_res['suggested_actions'],
            'memories_count': 0,
            'label': 'WITHOUT HINDSIGHT'
        },
        'with_hindsight': {
            'response': with_res['response_text'],
            'memories_used': with_res['memories_used'],
            'recalled_memories': recalled['memories'],
            'suggested_actions': with_res['suggested_actions'],
            'reflection': recalled.get('reflection'),
            'label': 'WITH HINDSIGHT PERSISTENT MEMORY'
        }
    })
