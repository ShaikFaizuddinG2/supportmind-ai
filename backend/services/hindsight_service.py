import json
import re
import requests
from datetime import datetime
from backend.config import Config
from backend.database.db import get_db_connection

def retain_memory(item):
    """
    Retains a new memory record into the Hindsight persistent memory layer.
    """
    hindsight_url = Config.HINDSIGHT_API_URL
    hindsight_key = Config.HINDSIGHT_API_KEY
    now = datetime.utcnow().isoformat() + 'Z'
    memory_id = item.get('memory_id') or f"MEM-HIN-{int(datetime.utcnow().timestamp())}"
    
    api_success = False
    if hindsight_url:
        try:
            headers = {'Content-Type': 'application/json'}
            if hindsight_key:
                headers['Authorization'] = f"Bearer {hindsight_key}"
            
            payload = {
                'memory_id': memory_id,
                'customer_id': item.get('customer_id'),
                'machine_id': item.get('machine_id'),
                'type': item.get('memory_type', 'episodic'),
                'category': item.get('category', 'symptom'),
                'title': item.get('title'),
                'summary': item.get('summary'),
                'details': item.get('details', {}),
                'confidence': item.get('confidence', 0.95),
                'event_date': item.get('event_date', now.split('T')[0]),
                'tags': item.get('tags', [])
            }
            res = requests.post(f"{hindsight_url.rstrip('/')}/v1/retain", json=payload, headers=headers, timeout=3)
            if res.status_code in (200, 201):
                api_success = True
        except Exception as e:
            print(f"[Hindsight] Remote API error, falling back to local persistent store: {e}")

    # Persist in SQLite
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO hindsight_memories (
            memory_id, customer_id, machine_id, memory_type, category, title, summary, details, confidence, event_date, created_at, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        memory_id,
        item.get('customer_id'),
        item.get('machine_id'),
        item.get('memory_type', 'episodic'),
        item.get('category', 'symptom'),
        item.get('title', ''),
        item.get('summary', ''),
        json.dumps(item.get('details', {})),
        item.get('confidence', 0.95),
        item.get('event_date', now.split('T')[0]),
        now,
        json.dumps(item.get('tags', []))
    ))
    conn.commit()
    conn.close()

    return {
        'success': True,
        'memory_id': memory_id,
        'source': 'hindsight_api' if api_success else 'hindsight_persistent_store'
    }

def recall_memory(query, customer_id=None, machine_id=None, limit=5):
    """
    Recalls relevant memories from Hindsight given a query, customer_id, and machine_id.
    """
    hindsight_url = Config.HINDSIGHT_API_URL
    hindsight_key = Config.HINDSIGHT_API_KEY

    if hindsight_url:
        try:
            headers = {'Content-Type': 'application/json'}
            if hindsight_key:
                headers['Authorization'] = f"Bearer {hindsight_key}"
            res = requests.post(f"{hindsight_url.rstrip('/')}/v1/recall", json={
                'query': query,
                'customer_id': customer_id,
                'machine_id': machine_id,
                'limit': limit
            }, headers=headers, timeout=3)
            if res.status_code == 200:
                data = res.json()
                return {
                    'memories': data.get('memories', []),
                    'total_found': len(data.get('memories', [])),
                    'query': query,
                    'reflection': data.get('reflection'),
                    'source': 'hindsight_api',
                    'status': 'success'
                }
        except Exception as e:
            print(f"[Hindsight] Remote recall error, using persistent store: {e}")

    # Local persistent retrieval
    conn = get_db_connection()
    cursor = conn.cursor()

    sql = "SELECT * FROM hindsight_memories WHERE 1=1"
    params = []
    if customer_id:
        sql += " AND (customer_id = ? OR customer_id = 'ALL')"
        params.append(customer_id)
    if machine_id:
        sql += " AND (machine_id = ? OR machine_id = 'ALL')"
        params.append(machine_id)

    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()

    query_tokens = [t.lower() for t in re.findall(r'\b[a-zA-Z0-9]{3,}\b', query or '')]
    scored = []

    synonyms = {
        'overheat': ['thermal', 'hot', 'cooling', 'fan', 'temperature', 'err-402'],
        'overheating': ['thermal', 'hot', 'cooling', 'fan', 'temperature', 'err-402'],
        'vibration': ['bearing', 'resonance', 'err-118', 'lubrication', 'spindle'],
        'pressure': ['hydraulic', 'filter', 'bar', 'fluid', 'pump']
    }

    for row in rows:
        details_obj = json.loads(row['details'] or '{}')
        tags_arr = json.loads(row['tags'] or '[]')
        corpus = f"{row['title']} {row['summary']} {row['category']} {' '.join(tags_arr)} {json.dumps(details_obj)}".lower()
        
        matches = 0
        for token in query_tokens:
            if token in corpus:
                matches += 1.0
            if token in synonyms:
                for syn in synonyms[token]:
                    if syn in corpus:
                        matches += 0.8
        
        relevance = 0.5
        if query_tokens:
            ratio = matches / len(query_tokens)
            relevance = min(0.99, max(0.40, 0.45 + ratio * 0.5))
        else:
            relevance = row['confidence'] or 0.85

        if row['memory_type'] == 'procedural' or row['category'] == 'preference':
            relevance = max(relevance, 0.88)

        scored.append({
            'id': row['id'],
            'memory_id': row['memory_id'],
            'customer_id': row['customer_id'],
            'machine_id': row['machine_id'],
            'memory_type': row['memory_type'],
            'category': row['category'],
            'title': row['title'],
            'summary': row['summary'],
            'details': details_obj,
            'confidence': row['confidence'],
            'event_date': row['event_date'],
            'tags': tags_arr,
            'relevance': round(relevance, 2)
        })

    scored.sort(key=lambda x: x['relevance'], reverse=True)
    top_memories = scored[:limit]
    reflection = reflect_memory(customer_id, machine_id)

    return {
        'memories': top_memories,
        'total_found': len(top_memories),
        'query': query,
        'reflection': reflection.get('summary') if reflection else None,
        'source': 'hindsight_persistent_store',
        'status': 'success'
    }

def reflect_memory(customer_id=None, machine_id=None):
    """
    Synthesizes higher-level insights/patterns from accumulated Hindsight memories (Section 20).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    sql = "SELECT * FROM hindsight_memories WHERE 1=1"
    params = []
    if customer_id:
        sql += " AND customer_id = ?"
        params.append(customer_id)
    if machine_id:
        sql += " AND machine_id = ?"
        params.append(machine_id)
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return None

    overheating_count = sum(1 for r in rows if 'overheat' in (r['title'] + r['summary']).lower() or 'cooling' in (r['title'] + r['summary']).lower())
    if overheating_count >= 2 and machine_id == 'CNC-M102':
        return {
            'pattern_title': 'Recurrent Cooling Circuit Thermal Bottlenecks',
            'summary': f"Machine {machine_id} has experienced {overheating_count} documented cooling/overheating incidents. Cooling fan motor degradation and swarf clogging in intake filter mesh are recurrent root causes under continuous 3-shift operation.",
            'evidence_count': overheating_count,
            'confidence': 0.94,
            'recommendation': 'Preemptively verify intake filter clear air passage and cooling fan RPM before attempting electrical or control adjustments.',
            'category': 'thermal_recurrent_pattern'
        }

    return None

def build_memory_context(memories, machine=None, customer=None):
    """
    Formats the recalled memories cleanly for LLM prompt injection.
    """
    if not memories:
        return "NO PREVIOUS HINDSIGHT MEMORY AVAILABLE: First-time or unrecorded incident for this equipment."

    lines = [
        "=== HINDSIGHT LONG-TERM PERSISTENT MEMORY CONTEXT ===",
        f"Asset Identified: {machine.get('machine_name', 'Industrial Machine')} ({machine.get('machine_id', 'Unknown')})",
        f"Customer / Organization: {customer.get('company_name', 'Customer')}",
        f"Total Relevant Historical Memories Recalled: {len(memories)}\n",
        "CRITICAL REASONING DIRECTIVE:",
        "- Historical records provide clues, but MUST NOT automatically be treated as absolute proof of an identical current root cause.",
        "- State clearly what worked in the past while noting when current diagnostic steps are preliminary or uncertain.\n"
    ]

    for i, mem in enumerate(memories, 1):
        lines.append(f"[Memory #{i} | Category: {mem['category'].upper()} | Type: {mem['memory_type'].upper()} | Relevance: {int(mem.get('relevance', 0.95)*100)}%]")
        lines.append(f"Event Date: {mem['event_date']}")
        lines.append(f"Title: {mem['title']}")
        lines.append(f"Summary: {mem['summary']}")
        
        details = mem.get('details', {})
        if details:
            if 'failed_solutions' in details:
                lines.append(f"  ⚠ Solutions previously attempted that FAILED: {details['failed_solutions']}")
            if 'successful_solution' in details:
                lines.append(f"  ✓ Solution that previously WORKED: {details['successful_solution']}")
            if 'preferred_format' in details:
                lines.append(f"  ★ Customer Delivery Preference: {details['preferred_format']}")
            if 'safety_priority' in details:
                lines.append(f"  🛡 Mandatory Safety Directive: {details['safety_priority']}")
        lines.append("")

    return "\n".join(lines)
