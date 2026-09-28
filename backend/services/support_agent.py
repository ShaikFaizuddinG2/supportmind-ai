from datetime import datetime
from backend.database.db import get_db_connection
from backend.services.hindsight_service import recall_memory, retain_memory, build_memory_context
from backend.services.llm_service import call_ollama

def process_support_chat(customer_id, machine_id, message, ticket_id=None, with_memory=True):
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Validate customer & machine
    cursor.execute("SELECT * FROM customers WHERE customer_id = ?", (customer_id,))
    customer_row = cursor.fetchone()
    if not customer_row:
        conn.close()
        raise ValueError(f"Customer '{customer_id}' not found")
    customer = dict(customer_row)

    cursor.execute("SELECT * FROM machines WHERE machine_id = ?", (machine_id,))
    machine_row = cursor.fetchone()
    if not machine_row:
        conn.close()
        raise ValueError(f"Machine '{machine_id}' not found")
    machine = dict(machine_row)

    # 2. Retrieve Hindsight memories
    recalled = {'memories': [], 'source': 'hindsight_persistent_store', 'status': 'success'}
    if with_memory:
        recalled = recall_memory(message, customer_id, machine_id, limit=5)

    # 3. Build memory context
    memory_context = build_memory_context(recalled['memories'], machine, customer) if with_memory else ""

    # 4. Recent tickets
    cursor.execute("SELECT * FROM tickets WHERE machine_id = ? ORDER BY id DESC LIMIT 2", (machine_id,))
    recent_tickets = [dict(r) for r in cursor.fetchall()]

    # 5. Call Ollama
    agent_output = call_ollama(
        customer=customer,
        machine=machine,
        message=message,
        memory_context=memory_context,
        recalled_memories=recalled['memories'],
        recent_tickets=recent_tickets,
        with_memory=with_memory
    )

    now = datetime.utcnow().isoformat() + 'Z'

    # 6. Store interaction in SQLite
    cursor.execute('''
        INSERT INTO interactions (ticket_id, customer_id, machine_id, user_message, agent_response, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (ticket_id, customer_id, machine_id, message, agent_output['response_text'], now))
    interaction_id = cursor.lastrowid
    conn.commit()
    conn.close()

    # 7. Retain useful interaction in Hindsight
    if with_memory and not agent_output['is_safety_hazard']:
        retain_memory({
            'memory_id': f"MEM-INT-{interaction_id}",
            'customer_id': customer_id,
            'machine_id': machine_id,
            'memory_type': 'episodic',
            'category': 'symptom',
            'title': f"Technician Inquiry: {message[:40]}...",
            'summary': f"User inquired: '{message}'. Guidance given: {agent_output['response_text'][:120]}...",
            'details': {
                'query': message,
                'actions': agent_output['suggested_actions']
            },
            'confidence': 0.88,
            'event_date': now.split('T')[0],
            'tags': ['interaction', machine_id.lower()]
        })

    return {
        'response': agent_output['response_text'],
        'is_safety_hazard': agent_output['is_safety_hazard'],
        'hazard_type': agent_output.get('hazard_type'),
        'memories_used': agent_output['memories_used'],
        'all_recalled_memories': recalled['memories'],
        'suggested_actions': agent_output['suggested_actions'],
        'disclaimer': agent_output['disclaimer'],
        'reflection': recalled.get('reflection'),
        'source': recalled['source'],
        'memory_status': recalled['status'],
        'interaction_id': interaction_id,
        'timestamp': now
    }
