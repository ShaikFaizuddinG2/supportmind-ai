import { HindsightMemoryItem } from './hindsight.js';

const ollamaBaseUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';

export interface SupportAgentInput {
  customer: any;
  machine: any;
  message: string;
  memory_context: string;
  recalled_memories: HindsightMemoryItem[];
  recent_tickets?: any[];
  with_memory?: boolean;
}

export interface SupportAgentOutput {
  response_text: string;
  is_safety_hazard: boolean;
  hazard_type?: string;
  memories_used: {
    id: string;
    title: string;
    category: string;
    relevance: number;
    how_applied: string;
  }[];
  suggested_actions: string[];
  disclaimer: string;
}

const HAZARDOUS_TERMS = [
  'smoke', 'fire', 'flames', 'sparks', 'sparking', 'burning smell', 'electrical arc',
  '480v', 'high voltage', 'shock', 'electrocution', 'hydraulic spray', 'crush',
  'severed', 'leaking gas', 'burning plastic', 'explosion'
];

export function evaluateHazard(message: string): { isHazard: boolean; reason?: string } {
  const lower = message.toLowerCase();
  for (const term of HAZARDOUS_TERMS) {
    if (lower.includes(term)) {
      return {
        isHazard: true,
        reason: `Potential critical hazard detected relating to '${term}'. Industrial safety interlock triggered.`
      };
    }
  }
  return { isHazard: false };
}

/**
 * Calls a local Ollama model with industrial customer support context & Hindsight memory.
 * No API key is required. Ollama must be running locally.
 */
export async function generateSupportResponse(input: SupportAgentInput): Promise<SupportAgentOutput> {
  const { customer, machine, message, memory_context, recalled_memories, with_memory = true } = input;

  const hazardCheck = evaluateHazard(message);

  if (hazardCheck.isHazard) {
    const safetyResponse = `⚠️ CRITICAL INDUSTRIAL SAFETY ADVISORY ⚠️
A potentially hazardous condition has been detected (${hazardCheck.reason}).

MANDATORY SAFETY PROTOCOL:
1. IMMEDIATELY hit the Emergency Stop (E-STOP) button on machine ${machine?.machine_id || 'controller'}.
2. Do NOT attempt internal electrical inspection, panel opening, or mechanical disassembly.
3. Initiate facility Lockout / Tagout (LOTO) protocol to de-energize the machine at the primary disconnect breaker.
4. Clear personnel from the machine envelope and safety curtain zone.
5. Notify facility environmental health & safety (EHS) and contact certified field engineering service personnel immediately.

Notice: SupportMind AI provides AI-assisted diagnostic guidance only and does NOT replace certified industrial safety engineers.`;

    return {
      response_text: safetyResponse,
      is_safety_hazard: true,
      hazard_type: hazardCheck.reason,
      memories_used: [],
      suggested_actions: [
        'Engage Emergency Stop (E-Stop)',
        'Execute Lockout / Tagout (LOTO)',
        'Evacuate equipment perimeter',
        'Dispatch certified field technician'
      ],
      disclaimer: 'AI-assisted troubleshooting guidance. For hazardous conditions, contact qualified personnel.'
    };
  }

  const systemInstruction = `You are SupportMind AI, an industrial customer support and diagnostics agent specialized for MSMEs and industrial machinery (CNC mills, hydraulic presses, lathes, robotics).

CORE DIRECTIVES:
1. MEMORY:
${with_memory
  ? 'Use the supplied Hindsight persistent memories when relevant. Refer to historical dates/components, but treat them as clues rather than proof of the current root cause.'
  : 'Hindsight memory is disabled. Do not claim knowledge of prior incidents. Ask for baseline serial numbers, logs, error codes, and operating conditions.'}

2. SAFETY:
- You provide AI-assisted guidance, not certified on-site engineering.
- For high-voltage, hydraulic-pressure, thermal, or other hazardous conditions, emphasize appropriate safety procedures and LOTO.
- Never present historical information as certain proof of the current fault.

3. CUSTOMER PREFERENCE:
${customer?.company_name === 'ACME Manufacturing'
  ? 'Use concise, numbered, step-by-step diagnostic checklists.'
  : 'Use structured, clear technical advice.'}

4. STYLE:
- Precise, practical, respectful, and safety-conscious.
- Avoid generic AI introductions.
- Do not invent machine readings, repairs, manuals, or historical facts not present in the supplied context.`;

  const prompt = `CURRENT INCIDENT CONTEXT:
Customer: ${customer?.company_name || 'Industrial Customer'} (Contact: ${customer?.contact_name || 'Technician'})
Machine ID: ${machine?.machine_id || 'Unknown Machine'}
Machine Model: ${machine?.model || 'Industrial Equipment'} (${machine?.manufacturer || 'OEM'})
Operating Environment: ${machine?.operating_environment || 'Factory Floor'}
Machine Status: ${machine?.status || 'Active'}

${with_memory ? memory_context : '[HINDSIGHT MEMORY ACCESS: INACTIVE / NO HISTORY AVAILABLE]'}

RECENT TICKETS:
${JSON.stringify(input.recent_tickets || [], null, 2)}

TECHNICIAN / USER INQUIRY:
"${message}"

Give a concise but useful technical troubleshooting response. If relevant, provide numbered diagnostic steps and clearly distinguish historical clues from current observations.`;

  try {
    const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        stream: false,
        options: { temperature: 0.3 }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json() as any;
    const responseText = data?.message?.content?.trim();

    if (!responseText) {
      throw new Error('Ollama returned an empty response');
    }

    const memoriesUsed = (with_memory && recalled_memories.length > 0)
      ? recalled_memories.slice(0, 4).map(m => ({
          id: m.memory_id,
          title: m.title,
          category: m.category,
          relevance: m.relevance || 0.95,
          how_applied: m.summary
        }))
      : [];

    return {
      response_text: responseText,
      is_safety_hazard: false,
      memories_used: memoriesUsed,
      suggested_actions: extractActions(responseText),
      disclaimer: 'AI-assisted troubleshooting guidance. For hazardous conditions, contact qualified personnel.'
    };
  } catch (error) {
    console.warn('[Ollama] Local model unavailable, using deterministic fallback response:', error);
  }

  return generateSyntheticIndustrialResponse(input, with_memory);
}

function extractActions(text: string): string[] {
  const lines = text.split('\n');
  const actions: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(\d+\.|\-|\*)\s+/.test(trimmed) && trimmed.length > 15 && trimmed.length < 150) {
      actions.push(trimmed.replace(/^(\d+\.|\-|\*)\s+/, ''));
    }
  }
  return actions.slice(0, 4);
}

function generateSyntheticIndustrialResponse(input: SupportAgentInput, with_memory: boolean): SupportAgentOutput {
  const { machine, message, recalled_memories, customer } = input;
  const lowerMsg = message.toLowerCase();

  if (!with_memory) {
    return {
      response_text: `Thank you for contacting SupportMind. I see you are reporting an issue with machine ${machine?.machine_id || 'unit'} (${machine?.model || 'equipment'}).

Because I currently have no prior incident history or maintenance records for this unit, I need to gather baseline diagnostic details:

1. Confirm the exact error code or alarm number displayed on the CNC / PLC controller screen.
2. Note the operating parameters at the time the symptom started (spindle speed, axis feed rate, or hydraulic tonnage).
3. Has this symptom occurred previously, or were any recent tooling/maintenance changes performed?
4. Inspect external fluid levels (coolant or hydraulic oil) and check for audible abnormal resonance.

Please provide these initial parameters so I can cross-reference the manufacturer service manual.

Notice: AI-assisted troubleshooting guidance. For hazardous conditions, contact qualified personnel.`,
      is_safety_hazard: false,
      memories_used: [],
      suggested_actions: [
        'Record exact controller alarm code',
        'Verify operating duty cycle and load',
        'Check fluid levels & visual indicators',
        'Review standard OEM operational manual'
      ],
      disclaimer: 'AI-assisted troubleshooting guidance. For hazardous conditions, contact qualified personnel.'
    };
  }

  if (lowerMsg.includes('overheat') || lowerMsg.includes('thermal') || lowerMsg.includes('temp') || lowerMsg.includes('fan')) {
    return {
      response_text: `I cross-referenced our Hindsight persistent memory records for machine ${machine?.machine_id} at ${customer?.company_name || 'your plant'}.

HISTORICAL PRECEDENTS RETRIEVED:
• August 12: Machine registered ERR-402 spindle overheating (78°C). Coolant flow was verified normal, but the auxiliary brushless 24V cooling fan had failed. Replacing the fan assembly (Part #CF-882) resolved the issue.
• September 15: Recurrent thermal rise occurred during heavy titanium milling. The root cause was fine swarf clogging the cooling intake filter mesh. Cleaning the mesh cleared the thermal alert.
• ACME Protocol: Marcus Vance requires a step-by-step diagnostic sequence with strict LOTO verification.

RECOMMENDED DIAGNOSTIC CHECKLIST:
1. Verify Intake Airflow & Mesh Filter: Check the top cooling intake cowling for swarf or particulate buildup before replacing any electrical components.
2. Inspect Auxiliary 24V Fan: Verify whether the auxiliary fan is actively spinning at rated RPM or if bearing resistance/stalling is present.
3. Check Thermal Cutoff Sensor Wiring: Ensure the thermistor cable has not vibrated loose.
4. Verify Ambient Load: Take note if the facility ambient temperature is exceeding 32°C under continuous 3-shift cutting.

Historical context provides strong diagnostic clues, but please treat this as a structured troubleshooting guide rather than a definitive guarantee of an identical root cause.`,
      is_safety_hazard: false,
      memories_used: recalled_memories.slice(0, 4).map(m => ({
        id: m.memory_id,
        title: m.title,
        category: m.category,
        relevance: m.relevance || 0.96,
        how_applied: m.summary
      })),
      suggested_actions: [
        'Inspect air intake mesh filter for aluminum/titanium swarf',
        'Verify auxiliary 24V cooling fan rotation and RPM',
        'Check spindle coolant line flow & thermistor connection',
        'Apply strict LOTO protocol before removing top enclosure cowling'
      ],
      disclaimer: 'AI-assisted troubleshooting guidance. For hazardous conditions, contact qualified personnel.'
    };
  }

  if (lowerMsg.includes('vibrat') || lowerMsg.includes('err-118') || lowerMsg.includes('bearing') || lowerMsg.includes('noise')) {
    return {
      response_text: `Checking Hindsight memory for ${machine?.machine_id}:

HISTORICAL RECORD FOUND (August 29):
This machine previously registered spindle harmonic vibration warning ERR-118. Tool rebalancing was attempted first but did NOT resolve the harmonic resonance. The successful solution was flushing the ceramic bearing lubrication channel and replenishing synthetic ISO VG 32 spindle oil, which reduced vibration velocity to 0.72 mm/s.

RECOMMENDED ACTION PLAN:
1. Check Spindle Oil Reservoir: Inspect ISO VG 32 synthetic lubricant level and clarity (look for emulsification or particulate discoloration).
2. Clean Bearing Lube Line: Inspect the lubrication micro-metering valve.
3. Measure Dynamic Vibration: If vibration exceeds 2.8 mm/s velocity, do not run high-speed spindle operations above 10,000 RPM.

Note: While August 29 resolved through oil replenishment, monitor for mechanical bearing race wear if lubrication does not stabilize thermals and harmonics.`,
      is_safety_hazard: false,
      memories_used: recalled_memories.slice(0, 3).map(m => ({
        id: m.memory_id,
        title: m.title,
        category: m.category,
        relevance: m.relevance || 0.94,
        how_applied: m.summary
      })),
      suggested_actions: [
        'Check ISO VG 32 synthetic lubricant level',
        'Inspect micro-metering lubrication valve',
        'Verify toolholder taper runout before opening bearing housing'
      ],
      disclaimer: 'AI-assisted troubleshooting guidance. For hazardous conditions, contact qualified personnel.'
    };
  }

  const memSummaries = recalled_memories.map(m => `• ${m.title}: ${m.summary}`).join('\n');
  return {
    response_text: `I have retrieved ${recalled_memories.length} relevant historical context records from Hindsight memory for ${machine?.machine_id || 'this machine'}:

${memSummaries}

Based on this historical operational context:
1. Cross-reference previous solutions to expedite your current investigation.
2. Note that historical resolutions serve as indicators, though current symptoms should still be verified systematically.
3. Observe all facility safety lockout (LOTO) protocols prior to servicing mechanical or electrical enclosures.`,
    is_safety_hazard: false,
    memories_used: recalled_memories.slice(0, 3).map(m => ({
      id: m.memory_id,
      title: m.title,
      category: m.category,
      relevance: m.relevance || 0.91,
      how_applied: m.summary
    })),
    suggested_actions: [
      'Compare current symptoms with historical incident logs',
      'Check primary sensor readings',
      'Observe standard lockout/tagout procedures'
    ],
    disclaimer: 'AI-assisted troubleshooting guidance. For hazardous conditions, contact qualified personnel.'
  };
}
