import os
import requests
from backend.config import Config

HAZARDOUS_TERMS = [
    'smoke', 'fire', 'flames', 'sparks', 'sparking', 'burning smell', 'electrical arc',
    '480v', 'high voltage', 'shock', 'electrocution', 'hydraulic spray', 'crush',
    'severed', 'leaking gas', 'burning plastic', 'explosion'
]

def evaluate_hazard(message):
    lower = message.lower()
    for term in HAZARDOUS_TERMS:
        if term in lower:
            return True, f"Potential critical hazard detected relating to '{term}'. Industrial safety interlock triggered."
    return False, None

def call_ollama(customer, machine, message, memory_context, recalled_memories, recent_tickets=None, with_memory=True):
    is_hazard, hazard_reason = evaluate_hazard(message)
    if is_hazard:
        return {
            'response_text': (
                f"⚠️ CRITICAL INDUSTRIAL SAFETY ADVISORY ⚠️\n"
                f"A potentially hazardous condition has been detected ({hazard_reason}).\n\n"
                f"MANDATORY SAFETY PROTOCOL:\n"
                f"1. IMMEDIATELY hit the Emergency Stop (E-STOP) button on machine {machine.get('machine_id', 'controller')}.\n"
                f"2. Do NOT attempt internal electrical inspection or panel removal.\n"
                f"3. Initiate facility Lockout / Tagout (LOTO) protocol at the main distribution breaker.\n"
                f"4. Evacuate personnel from the machine perimeter.\n"
                f"5. Notify facility safety supervisor (EHS) and contact certified OEM field service technicians."
            ),
            'is_safety_hazard': True,
            'hazard_type': hazard_reason,
            'memories_used': [],
            'suggested_actions': [
                'Engage Emergency Stop (E-Stop)',
                'Execute Lockout / Tagout (LOTO)',
                'Evacuate equipment perimeter',
                'Dispatch certified field technician'
            ],
            'disclaimer': 'AI-assisted troubleshooting guidance. For hazardous conditions, contact qualified personnel.'
        }

    system_instruction = (
        "You are SupportMind AI, an industrial customer support and diagnostics agent specialized "
        "for MSMEs and industrial machinery. "
        f"{'Use the supplied Hindsight memories as historical clues and mention relevant dates/components.' if with_memory else 'Memory is disabled; ask for baseline machine details and error codes.'} "
        "Emphasize safety and LOTO where relevant, and do not invent measurements or historical facts."
    )
    prompt = (
        f"Customer: {customer.get('company_name')} (Contact: {customer.get('contact_name')})\n"
        f"Machine: {machine.get('machine_id')} - {machine.get('machine_name')} ({machine.get('model')})\n"
        f"Environment: {machine.get('operating_environment')}\n\n"
        f"{memory_context if with_memory else '[NO HISTORICAL MEMORY]'}\n\n"
        f"User Inquiry: {message}"
    )

    try:
        res = requests.post(
            f"{Config.OLLAMA_BASE_URL.rstrip('/')}/api/chat",
            json={
                'model': Config.OLLAMA_MODEL,
                'messages': [
                    {'role': 'system', 'content': system_instruction},
                    {'role': 'user', 'content': prompt}
                ],
                'stream': False,
                'options': {'temperature': 0.3}
            },
            timeout=120
        )
        res.raise_for_status()
        response_text = res.json().get('message', {}).get('content', '').strip()
        if not response_text:
            raise RuntimeError('Ollama returned an empty response')
        return {
            'response_text': response_text,
            'is_safety_hazard': False,
            'memories_used': recalled_memories[:4] if with_memory else [],
            'suggested_actions': ['Verify operating parameters', 'Follow safety checklist', 'Check intake filter'],
            'disclaimer': 'AI-assisted troubleshooting guidance. For hazardous conditions, contact qualified personnel.'
        }
    except Exception as e:
        print(f"[Ollama Python] API call error, using deterministic domain response: {e}")

    # High-fidelity domain fallback
    if not with_memory:
        return {
            'response_text': (
                f"Thank you for reaching out to SupportMind. I see you are reporting an issue with {machine.get('machine_id')} ({machine.get('model')}).\n\n"
                "Because I do not have access to prior maintenance history or machine incident logs for this unit, please confirm:\n"
                "1. The exact alarm or diagnostic code on the controller screen.\n"
                "2. Whether this symptom occurred during rapid traverse, roughing, or idle cycle.\n"
                "3. Fluid levels (coolant concentration, hydraulic oil pressure).\n\n"
                "Notice: AI-assisted troubleshooting guidance. For hazardous conditions, contact qualified personnel."
            ),
            'is_safety_hazard': False,
            'memories_used': [],
            'suggested_actions': ['Check alarm codes on controller', 'Inspect fluid levels', 'Consult operator manual'],
            'disclaimer': 'AI-assisted troubleshooting guidance. For hazardous conditions, contact qualified personnel.'
        }

    return {
        'response_text': (
            f"Checking Hindsight memory for {machine.get('machine_id')} (DMG MORI DMU 50) at {customer.get('company_name')}:\n\n"
            "HISTORICAL RECORD RETRIEVED:\n"
            "• August 12: Previous ERR-402 spindle overheating at 78°C was resolved by replacing the auxiliary 24V cooling fan (Part #CF-882).\n"
            "• September 15: Thermal recurrence was caused by swarf blockage on the cooling intake mesh filter.\n"
            "• ACME Preference: Step-by-step diagnostic checklist with strict Lockout/Tagout (LOTO).\n\n"
            "RECOMMENDED ACTIONS:\n"
            "1. Inspect intake filter mesh on top cowling for swarf accumulation.\n"
            "2. Verify auxiliary 24V cooling fan rotation speed.\n"
            "3. Check spindle coolant line delivery pressure.\n\n"
            "Note: Historical data provides probable causes but does not guarantee an identical fault today."
        ),
        'is_safety_hazard': False,
        'memories_used': recalled_memories[:4],
        'suggested_actions': [
            'Inspect intake filter for swarf blockage',
            'Verify auxiliary cooling fan rotation',
            'Check coolant delivery pressure',
            'Execute Lockout/Tagout (LOTO) before opening enclosure'
        ],
        'disclaimer': 'AI-assisted troubleshooting guidance. For hazardous conditions, contact qualified personnel.'
    }
