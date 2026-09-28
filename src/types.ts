export interface Customer {
  id: number;
  customer_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  location: string;
  created_at: string;
  machines?: Machine[];
  tickets?: Ticket[];
  memories_count?: number;
}

export interface Machine {
  id: number;
  machine_id: string;
  customer_id: string;
  machine_name: string;
  model: string;
  manufacturer: string;
  location: string;
  installation_date: string;
  status: 'Operational' | 'Warning' | 'Critical' | 'Maintenance';
  operating_environment: string;
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  open_tickets_count?: number;
  last_issue?: string;
  tickets?: Ticket[];
  interactions?: Interaction[];
  memories?: HindsightMemory[];
  reflection?: ReflectionInsight | null;
}

export interface Ticket {
  id: number;
  ticket_id: string;
  customer_id: string;
  machine_id: string;
  issue: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved';
  created_at: string;
  resolved_at?: string;
  resolution?: string;
  outcome?: string;
  company_name?: string;
  machine_name?: string;
  model?: string;
  operating_environment?: string;
  interactions?: Interaction[];
  related_memories?: HindsightMemory[];
}

export interface Interaction {
  id: number;
  ticket_id?: string;
  customer_id: string;
  machine_id: string;
  user_message: string;
  agent_response: string;
  created_at: string;
}

export interface HindsightMemory {
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

export interface ReflectionInsight {
  pattern_title: string;
  summary: string;
  evidence_count: number;
  confidence: number;
  recommendation: string;
  category: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  memories_used?: {
    id: string;
    title: string;
    category: string;
    relevance: number;
    how_applied: string;
  }[];
  all_recalled_memories?: HindsightMemory[];
  suggested_actions?: string[];
  is_safety_hazard?: boolean;
  hazard_type?: string;
  reflection?: string;
  source?: string;
}

export interface CompareResult {
  query: string;
  without_memory: {
    response: string;
    suggested_actions: string[];
    memories_count: number;
    duration_ms?: number;
    label: string;
  };
  with_hindsight: {
    response: string;
    memories_used: any[];
    recalled_memories: HindsightMemory[];
    suggested_actions: string[];
    reflection?: string;
    duration_ms?: number;
    label: string;
  };
}

export interface MemoryStats {
  total_memories: number;
  by_type: { memory_type: string; count: number }[];
  by_category: { category: string; count: number }[];
  recent: HindsightMemory[];
}
