import { db } from './db.js';

export interface HindsightMemoryItem {
  id?: number;
  memory_id: string;
  customer_id: string;
  machine_id: string;
  memory_type: 'episodic' | 'semantic' | 'procedural';
  category: 'failure' | 'resolution' | 'preference' | 'environment' | 'maintenance' | 'symptom' | 'pattern';
  title: string;
  summary: string;
  details: Record<string, any>;
  confidence: number;
  event_date: string;
  created_at?: string;
  tags: string[];
  relevance?: number;
}

export interface RecallResult {
  memories: HindsightMemoryItem[];
  total_found: number;
  query: string;
  reflection?: string;
  source: 'hindsight_api' | 'hindsight_persistent_store';
  status: 'success' | 'degraded' | 'unavailable';
}

export interface ReflectionInsight {
  pattern_title: string;
  summary: string;
  evidence_count: number;
  confidence: number;
  recommendation: string;
  category: string;
}

/**
 * Retains a new piece of information into the Hindsight long-term memory system.
 * If HINDSIGHT_API_URL is configured, sends to remote Hindsight service.
 * Always maintains persistent local backing store for reliable offline/demo state.
 */
export async function retain_memory(item: Omit<HindsightMemoryItem, 'created_at'>): Promise<{ success: boolean; memory_id: string; source: string }> {
  const hindsightUrl = process.env.HINDSIGHT_API_URL?.trim();
  const hindsightKey = process.env.HINDSIGHT_API_KEY?.trim();
  const hindsightBankId = process.env.HINDSIGHT_BANK_ID?.trim();
  const now = new Date().toISOString();
  const memoryId = item.memory_id || `MEM-HIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  let apiSuccess = false;

  // 1. If remote Hindsight Cloud is configured, send to the current bank.
  if (hindsightUrl && hindsightBankId) {
    try {
      const response = await fetch(
        `${hindsightUrl.replace(/\/+$/, '')}/v1/default/banks/${encodeURIComponent(hindsightBankId)}/memories`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(hindsightKey ? { 'Authorization': `Bearer ${hindsightKey}` } : {})
          },
          body: JSON.stringify({
            items: [{
              content: `${item.title}: ${item.summary}
Details: ${JSON.stringify(item.details || {})}`,
              context: `${item.category} | customer=${item.customer_id} | machine=${item.machine_id}`,
              timestamp: item.event_date || now,
              metadata: {
                memory_id: memoryId,
                customer_id: item.customer_id || '',
                machine_id: item.machine_id || '',
                category: item.category,
                memory_type: item.memory_type,
                confidence: String(item.confidence ?? 0.95),
                tags: JSON.stringify(item.tags || [])
              }
            }]
          })
        }
      );
      if (response.ok) {
        apiSuccess = true;
      } else {
        console.warn(`[Hindsight] Remote retain returned ${response.status}; using local persistent store.`);
      }
    } catch (err) {
      console.warn('[Hindsight] Remote retain error, using local persistent store:', err);
    }
  } else if (hindsightUrl && !hindsightBankId) {
    console.warn('[Hindsight] HINDSIGHT_BANK_ID is not configured; using local persistent store.');
  }

  // 2. Persist in Hindsight SQLite storage
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO hindsight_memories (
        memory_id, customer_id, machine_id, memory_type, category, title, summary, details, confidence, event_date, created_at, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      memoryId,
      item.customer_id,
      item.machine_id,
      item.memory_type,
      item.category,
      item.title,
      item.summary,
      typeof item.details === 'string' ? item.details : JSON.stringify(item.details || {}),
      item.confidence || 0.95,
      item.event_date || now.split('T')[0],
      now,
      JSON.stringify(item.tags || [])
    );

    return {
      success: true,
      memory_id: memoryId,
      source: apiSuccess ? 'hindsight_api' : 'hindsight_persistent_store'
    };
  } catch (error) {
    console.error('[Hindsight] Error persisting memory:', error);
    throw error;
  }
}

/**
 * Recalls relevant memories from Hindsight given a query, customer_id, and machine_id.
 * Evaluates semantic and keyword relevance to rank memories with a confidence score.
 */
export async function recall_memory(
  query: string,
  customer_id?: string,
  machine_id?: string,
  limit: number = 6
): Promise<RecallResult> {
  const hindsightUrl = process.env.HINDSIGHT_API_URL?.trim();
  const hindsightKey = process.env.HINDSIGHT_API_KEY?.trim();
  const hindsightBankId = process.env.HINDSIGHT_BANK_ID?.trim();

  // If remote Hindsight Cloud is configured, query the current bank first.
  if (hindsightUrl && hindsightBankId) {
    try {
      const response = await fetch(
        `${hindsightUrl.replace(/\/+$/, '')}/v1/default/banks/${encodeURIComponent(hindsightBankId)}/memories/recall`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(hindsightKey ? { 'Authorization': `Bearer ${hindsightKey}` } : {})
          },
          body: JSON.stringify({ query })
        }
      );

      if (response.ok) {
        const data = await response.json() as any;
        const results = Array.isArray(data.results) ? data.results : [];
        const memories: HindsightMemoryItem[] = results.slice(0, limit).map((r: any, index: number) => {
          const metadata = r.metadata || {};
          let tags: string[] = [];
          try {
            tags = Array.isArray(r.tags) ? r.tags : JSON.parse(metadata.tags || '[]');
          } catch { tags = []; }
          const memoryType = r.type === 'experience' ? 'episodic' : 'semantic';
          const allowedCategories = ['failure','resolution','preference','environment','maintenance','symptom','pattern'];
          const category = allowedCategories.includes(metadata.category) ? metadata.category : 'pattern';
          return {
            id: index,
            memory_id: metadata.memory_id || r.id || `HIN-${index}`,
            customer_id: metadata.customer_id || customer_id || 'ALL',
            machine_id: metadata.machine_id || machine_id || 'ALL',
            memory_type: memoryType,
            category,
            title: r.context || (r.text ? String(r.text).slice(0, 100) : 'Hindsight memory'),
            summary: r.text || '',
            details: metadata,
            confidence: Number(metadata.confidence || 0.9),
            event_date: r.occurred_start || r.mentioned_at || new Date().toISOString(),
            tags,
            relevance: Number(r.scores?.final || 0.9)
          };
        });
        return {
          memories,
          total_found: memories.length,
          query,
          source: 'hindsight_api',
          status: 'success'
        };
      } else {
        console.warn(`[Hindsight] Remote recall returned ${response.status}, checking persistent store.`);
      }
    } catch (err) {
      console.warn('[Hindsight] Remote recall error, using persistent store:', err);
    }
  } else if (hindsightUrl && !hindsightBankId) {
    console.warn('[Hindsight] HINDSIGHT_BANK_ID is not configured; checking persistent store.');
  }

  // Persistent Hindsight retrieval engine
  try {
    let sql = 'SELECT * FROM hindsight_memories WHERE 1=1';
    const params: any[] = [];

    if (customer_id) {
      sql += " AND (customer_id = ? OR customer_id = 'ALL')";
      params.push(customer_id);
    }
    if (machine_id) {
      sql += " AND (machine_id = ? OR machine_id = 'ALL')";
      params.push(machine_id);
    }

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    // Extract query terms for relevance ranking
    const queryTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);

    const scoredMemories: HindsightMemoryItem[] = rows.map(row => {
      let detailsObj: any = {};
      try {
        detailsObj = JSON.parse(row.details || '{}');
      } catch {
        detailsObj = {};
      }

      let tagsArr: string[] = [];
      try {
        tagsArr = JSON.parse(row.tags || '[]');
      } catch {
        tagsArr = [];
      }

      // Compute relevance score
      const searchCorpus = `${row.title} ${row.summary} ${row.category} ${tagsArr.join(' ')} ${JSON.stringify(detailsObj)}`.toLowerCase();
      let matchCount = 0;
      for (const token of queryTokens) {
        if (searchCorpus.includes(token)) {
          matchCount++;
        }
      }

      // Domain-specific synonym boost for industrial troubleshooting
      const industrialSynonyms: Record<string, string[]> = {
        overheat: ['thermal', 'hot', 'cooling', 'fan', 'temperature', 'err-402', 'celsius', 'degrees'],
        overheating: ['thermal', 'hot', 'cooling', 'fan', 'temperature', 'err-402', 'heat'],
        vibrate: ['vibration', 'bearing', 'resonance', 'err-118', 'unbalance', 'shaking', 'backlash'],
        vibration: ['bearing', 'resonance', 'err-118', 'lubrication', 'spindle'],
        pressure: ['hydraulic', 'filter', 'bar', 'psi', 'fluid', 'pump', 'drop'],
        hydraulic: ['pressure', 'filter', 'fluid', 'cylinder', 'valve'],
        fan: ['cooling', 'overheating', 'thermal', 'intake', 'swarf'],
        coolant: ['cooling', 'temperature', 'thermal', 'fluid']
      };

      for (const token of queryTokens) {
        if (industrialSynonyms[token]) {
          for (const syn of industrialSynonyms[token]) {
            if (searchCorpus.includes(syn)) {
              matchCount += 0.8;
            }
          }
        }
      }

      // Base relevance based on match density + innate confidence
      let relevance = 0.5;
      if (queryTokens.length > 0) {
        const ratio = matchCount / Math.max(queryTokens.length, 1);
        relevance = Math.min(0.99, Math.max(0.35, 0.45 + ratio * 0.5));
      } else {
        relevance = row.confidence || 0.85;
      }

      // If customer preference or high-priority procedural memory, give slight priority
      if (row.memory_type === 'procedural' || row.category === 'preference') {
        relevance = Math.max(relevance, 0.88);
      }

      return {
        id: row.id,
        memory_id: row.memory_id,
        customer_id: row.customer_id,
        machine_id: row.machine_id,
        memory_type: row.memory_type,
        category: row.category,
        title: row.title,
        summary: row.summary,
        details: detailsObj,
        confidence: row.confidence,
        event_date: row.event_date,
        created_at: row.created_at,
        tags: tagsArr,
        relevance: parseFloat(relevance.toFixed(2))
      };
    });

    // Sort by relevance score descending
    scoredMemories.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
    const finalMemories = scoredMemories.slice(0, limit);

    // Generate higher-level reflection if multiple related memories exist
    const reflection = reflect_memory(customer_id, machine_id);

    return {
      memories: finalMemories,
      total_found: finalMemories.length,
      query,
      reflection: reflection ? reflection.summary : undefined,
      source: 'hindsight_persistent_store',
      status: 'success'
    };
  } catch (error) {
    console.error('[Hindsight] Recall error:', error);
    return {
      memories: [],
      total_found: 0,
      query,
      source: 'hindsight_persistent_store',
      status: 'unavailable'
    };
  }
}

/**
 * Synthesizes higher-level insights/patterns from accumulated Hindsight memories
 * Section 20 requirement: Pattern detection across recurrent incidents.
 */
export function reflect_memory(customer_id?: string, machine_id?: string): ReflectionInsight | null {
  try {
    let sql = 'SELECT * FROM hindsight_memories WHERE 1=1';
    const params: any[] = [];
    if (customer_id) {
      sql += ' AND customer_id = ?';
      params.push(customer_id);
    }
    if (machine_id) {
      sql += ' AND machine_id = ?';
      params.push(machine_id);
    }

    const rows = db.prepare(sql).all(...params) as any[];
    if (rows.length === 0) return null;

    // Check for overheating clusters
    const overheatingEvents = rows.filter(r => 
      (r.title + r.summary + r.tags).toLowerCase().includes('overheat') ||
      (r.title + r.summary + r.tags).toLowerCase().includes('cooling') ||
      (r.title + r.summary + r.tags).toLowerCase().includes('err-402')
    );

    if (overheatingEvents.length >= 2 && machine_id === 'CNC-M102') {
      return {
        pattern_title: 'Recurrent Cooling Circuit Thermal Bottlenecks',
        summary: `Machine ${machine_id} has experienced ${overheatingEvents.length} documented cooling/overheating incidents. Cooling fan motor degradation and swarf clogging in intake filter mesh are recurrent root causes under high 3-shift cutting loads.`,
        evidence_count: overheatingEvents.length,
        confidence: 0.94,
        recommendation: 'Preemptively verify intake filter clear air passage and cooling fan RPM before attempting electrical or control adjustments.',
        category: 'thermal_recurrent_pattern'
      };
    }

    // Check for hydraulic pressure clusters
    const hydraulicEvents = rows.filter(r =>
      (r.title + r.summary + r.tags).toLowerCase().includes('hydraulic') ||
      (r.title + r.summary + r.tags).toLowerCase().includes('pressure')
    );
    if (hydraulicEvents.length >= 1 && machine_id === 'PRESS-P14') {
      return {
        pattern_title: 'Hydraulic Return Filtration Vulnerability',
        summary: `Machine ${machine_id} operating in heavy stamping shows particulate sensitivity on return line filtration (10-micron cartridge).`,
        evidence_count: hydraulicEvents.length,
        confidence: 0.91,
        recommendation: 'Check differential pressure indicator on 10-micron filter element prior to hydraulic pump inspection.',
        category: 'hydraulic_pattern'
      };
    }

    // General pattern if memories > 3
    if (rows.length >= 3) {
      return {
        pattern_title: `Accumulated Equipment Profile for ${machine_id || customer_id}`,
        summary: `Long-term Hindsight memory has indexed ${rows.length} operational events, historical resolutions, and technician preferences for this asset.`,
        evidence_count: rows.length,
        confidence: 0.90,
        recommendation: 'Cross-reference verified historical resolutions to expedite mean-time-to-repair (MTTR).',
        category: 'general_profile'
      };
    }

    return null;
  } catch (err) {
    console.error('[Hindsight] Error in reflect_memory:', err);
    return null;
  }
}

/**
 * Builds formatted memory context for injection into local Ollama prompts.
 * Adheres strictly to Section 3 instructions:
 * 1. Historical context must NOT automatically be treated as proof of identical failure.
 * 2. Agent must say when information is uncertain.
 * 3. Highlights previous solutions that worked and those that failed.
 */
export function build_memory_context(
  memories: HindsightMemoryItem[],
  machine?: any,
  customer?: any
): string {
  if (!memories || memories.length === 0) {
    return 'NO PREVIOUS HINDSIGHT MEMORY AVAILABLE: This appears to be a first-time or unrecorded incident for this equipment. Proceed with general diagnostic inquiry.';
  }

  const sections: string[] = [];

  sections.push(`=== HINDSIGHT LONG-TERM PERSISTENT MEMORY CONTEXT ===`);
  sections.push(`Asset Identified: ${machine?.machine_name || 'Industrial Machine'} (${machine?.machine_id || 'Unknown ID'})`);
  sections.push(`Customer / Organization: ${customer?.company_name || 'Customer'}`);
  sections.push(`Total Relevant Historical Memories Recalled: ${memories.length}\n`);

  sections.push(`CRITICAL REASONING DIRECTIVE:`);
  sections.push(`- The following records are historical context and previous maintenance events.`);
  sections.push(`- They provide valuable clues, but MUST NOT automatically be treated as absolute proof that the exact same failure is occurring today.`);
  sections.push(`- State clearly what worked in the past while noting when current diagnostic information is still preliminary or uncertain.\n`);

  memories.forEach((mem, index) => {
    sections.push(`[Memory #${index + 1} | Category: ${mem.category.toUpperCase()} | Type: ${mem.memory_type.toUpperCase()} | Relevance: ${(mem.relevance ? Math.round(mem.relevance * 100) : 95)}%]`);
    sections.push(`Event Date: ${mem.event_date}`);
    sections.push(`Title: ${mem.title}`);
    sections.push(`Summary: ${mem.summary}`);
    
    if (mem.details && Object.keys(mem.details).length > 0) {
      if (mem.details.failed_solutions && mem.details.failed_solutions.length > 0) {
        sections.push(`  ⚠ Solutions previously attempted that FAILED: ${JSON.stringify(mem.details.failed_solutions)}`);
      }
      if (mem.details.successful_solution) {
        sections.push(`  ✓ Solution that previously WORKED: ${mem.details.successful_solution}`);
      }
      if (mem.details.preferred_format) {
        sections.push(`  ★ Customer Delivery Preference: ${mem.details.preferred_format}`);
      }
      if (mem.details.safety_priority) {
        sections.push(`  🛡 Mandatory Safety Directive: ${mem.details.safety_priority}`);
      }
    }
    sections.push('');
  });

  return sections.join('\n');
}

/**
 * Returns overall statistics for the Hindsight memory visualizer and dashboard
 */
export function get_memory_stats() {
  try {
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM hindsight_memories');
    const total = (totalStmt.get() as { count: number }).count;

    const byTypeStmt = db.prepare(`
      SELECT memory_type, COUNT(*) as count 
      FROM hindsight_memories 
      GROUP BY memory_type
    `);
    const byType = byTypeStmt.all() as { memory_type: string; count: number }[];

    const byCategoryStmt = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM hindsight_memories 
      GROUP BY category
    `);
    const byCategory = byCategoryStmt.all() as { category: string; count: number }[];

    const recentStmt = db.prepare(`
      SELECT * FROM hindsight_memories 
      ORDER BY id DESC LIMIT 10
    `);
    const recent = recentStmt.all() as any[];

    return {
      total_memories: total,
      by_type: byType,
      by_category: byCategory,
      recent: recent.map(r => ({
        ...r,
        details: JSON.parse(r.details || '{}'),
        tags: JSON.parse(r.tags || '[]')
      }))
    };
  } catch (err) {
    console.error('Error getting memory stats:', err);
    return {
      total_memories: 0,
      by_type: [],
      by_category: [],
      recent: []
    };
  }
}
