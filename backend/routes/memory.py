from flask import Blueprint, jsonify, request
from backend.services.hindsight_service import recall_memory, retain_memory, reflect_memory
from backend.database.db import get_db_connection
import json

memory_bp = Blueprint('memory', __name__, url_prefix='/api')

@memory_bp.route('/memory/<customer_id>', methods=['GET'])
def get_customer_memories(customer_id):
    res = recall_memory('', customer_id=customer_id, machine_id=None, limit=50)
    return jsonify(res)

@memory_bp.route('/memory/<customer_id>/<machine_id>', methods=['GET'])
def get_machine_memories(customer_id, machine_id):
    query = request.args.get('q', '')
    res = recall_memory(query, customer_id=customer_id, machine_id=machine_id, limit=30)
    res['reflection'] = reflect_memory(customer_id, machine_id)
    return jsonify(res)

@memory_bp.route('/memory/retain', methods=['POST'])
def retain():
    data = request.json or {}
    res = retain_memory(data)
    return jsonify(res)

@memory_bp.route('/memory-stats', methods=['GET'])
def memory_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM hindsight_memories")
    total = cursor.fetchone()[0]

    cursor.execute("SELECT memory_type, COUNT(*) as count FROM hindsight_memories GROUP BY memory_type")
    by_type = [{'memory_type': r['memory_type'], 'count': r['count']} for r in cursor.fetchall()]

    cursor.execute("SELECT category, COUNT(*) as count FROM hindsight_memories GROUP BY category")
    by_category = [{'category': r['category'], 'count': r['count']} for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM hindsight_memories ORDER BY id DESC LIMIT 10")
    recent = []
    for r in cursor.fetchall():
        recent.append({
            'id': r['id'],
            'memory_id': r['memory_id'],
            'customer_id': r['customer_id'],
            'machine_id': r['machine_id'],
            'memory_type': r['memory_type'],
            'category': r['category'],
            'title': r['title'],
            'summary': r['summary'],
            'details': json.loads(r['details'] or '{}'),
            'confidence': r['confidence'],
            'event_date': r['event_date'],
            'tags': json.loads(r['tags'] or '[]')
        })

    conn.close()
    return jsonify({
        'total_memories': total,
        'by_type': by_type,
        'by_category': by_category,
        'recent': recent
    })
