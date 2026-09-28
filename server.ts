import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { db, initDatabase, resetDatabase, seedDatabase } from './server/db.js';
import { 
  recall_memory, 
  retain_memory, 
  reflect_memory, 
  build_memory_context, 
  get_memory_stats 
} from './server/hindsight.js';
import { generateSupportResponse } from './server/ollama.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// Initialize SQLite schema and seed initial data
initDatabase();

app.use(express.json());

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    hindsight_service: process.env.HINDSIGHT_API_URL ? 'connected (remote)' : 'active (persistent store)',
    ollama_service: process.env.OLLAMA_BASE_URL ? 'configured' : 'local_default (http://127.0.0.1:11434)',
    database: 'sqlite_connected'
  });
});

// Customers
app.get('/api/customers', (req: Request, res: Response) => {
  try {
    const customers = db.prepare('SELECT * FROM customers ORDER BY id ASC').all();
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers/:id', (req: Request, res: Response) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE customer_id = ? OR id = ?').get(req.params.id, req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    
    // Fetch customer's machines & tickets
    const machines = db.prepare('SELECT * FROM machines WHERE customer_id = ?').all((customer as any).customer_id);
    const tickets = db.prepare('SELECT * FROM tickets WHERE customer_id = ? ORDER BY id DESC').all((customer as any).customer_id);
    const memories = db.prepare('SELECT * FROM hindsight_memories WHERE customer_id = ?').all((customer as any).customer_id);

    res.json({
      ...(customer as any),
      machines,
      tickets,
      memories_count: memories.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Machines
app.get('/api/machines', (req: Request, res: Response) => {
  try {
    const machines = db.prepare(`
      SELECT m.*, c.company_name, c.contact_name,
        (SELECT COUNT(*) FROM tickets t WHERE t.machine_id = m.machine_id AND t.status != 'Resolved') as open_tickets_count,
        (SELECT issue FROM tickets t WHERE t.machine_id = m.machine_id ORDER BY t.id DESC LIMIT 1) as last_issue
      FROM machines m
      JOIN customers c ON m.customer_id = c.customer_id
      ORDER BY m.id ASC
    `).all();
    res.json(machines);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/machines/:id', async (req: Request, res: Response) => {
  try {
    const machine = db.prepare(`
      SELECT m.*, c.company_name, c.contact_name, c.email, c.phone, c.location as customer_location
      FROM machines m
      JOIN customers c ON m.customer_id = c.customer_id
      WHERE m.machine_id = ? OR m.id = ?
    `).get(req.params.id, req.params.id) as any;

    if (!machine) return res.status(404).json({ error: 'Machine not found' });

    // Machine tickets & interactions
    const tickets = db.prepare('SELECT * FROM tickets WHERE machine_id = ? ORDER BY id DESC').all(machine.machine_id);
    const interactions = db.prepare('SELECT * FROM interactions WHERE machine_id = ? ORDER BY id DESC LIMIT 15').all(machine.machine_id);

    // Hindsight memories
    const memoriesResult = await recall_memory('', machine.customer_id, machine.machine_id, 20);
    const reflection = reflect_memory(machine.customer_id, machine.machine_id);

    res.json({
      ...machine,
      tickets,
      interactions,
      memories: memoriesResult.memories,
      reflection
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Tickets
app.get('/api/tickets', (req: Request, res: Response) => {
  try {
    const tickets = db.prepare(`
      SELECT t.*, c.company_name, m.machine_name, m.model
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.customer_id
      LEFT JOIN machines m ON t.machine_id = m.machine_id
      ORDER BY t.id DESC
    `).all();
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tickets/:id', async (req: Request, res: Response) => {
  try {
    const ticket = db.prepare(`
      SELECT t.*, c.company_name, c.contact_name, m.machine_name, m.model, m.operating_environment
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.customer_id
      LEFT JOIN machines m ON t.machine_id = m.machine_id
      WHERE t.ticket_id = ? OR t.id = ?
    `).get(req.params.id, req.params.id) as any;

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const interactions = db.prepare('SELECT * FROM interactions WHERE ticket_id = ? OR machine_id = ? ORDER BY id ASC').all(ticket.ticket_id, ticket.machine_id);
    const memories = await recall_memory(ticket.issue, ticket.customer_id, ticket.machine_id, 5);

    res.json({
      ...ticket,
      interactions,
      related_memories: memories.memories
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tickets', async (req: Request, res: Response) => {
  try {
    const { customer_id, machine_id, issue, severity = 'Medium' } = req.body;
    if (!customer_id || !machine_id || !issue) {
      return res.status(400).json({ error: 'Missing required ticket fields' });
    }

    const ticket_id = `TCK-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tickets (ticket_id, customer_id, machine_id, issue, severity, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'Open', ?)
    `).run(ticket_id, customer_id, machine_id, issue, severity, now);

    // Retain initial ticket observation into Hindsight
    await retain_memory({
      memory_id: `MEM-TCK-${ticket_id}`,
      customer_id,
      machine_id,
      memory_type: 'episodic',
      category: 'symptom',
      title: `Support Ticket Initiated: ${issue.slice(0, 50)}`,
      summary: `Ticket ${ticket_id} opened: ${issue}`,
      details: { issue, severity, status: 'Open' },
      confidence: 0.90,
      event_date: now.split('T')[0],
      tags: ['ticket', severity.toLowerCase()]
    });

    const newTicket = db.prepare('SELECT * FROM tickets WHERE ticket_id = ?').get(ticket_id);
    res.status(201).json(newTicket);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Hindsight Memory endpoints
app.get('/api/memory/:customer_id', async (req: Request, res: Response) => {
  try {
    const memories = await recall_memory('', req.params.customer_id, undefined, 50);
    res.json(memories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/memory/:customer_id/:machine_id', async (req: Request, res: Response) => {
  try {
    const { customer_id, machine_id } = req.params;
    const query = (req.query.q as string) || '';
    const memories = await recall_memory(query, customer_id, machine_id, 30);
    const reflection = reflect_memory(customer_id, machine_id);
    res.json({
      ...memories,
      reflection
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/memory-stats', (req: Request, res: Response) => {
  try {
    const stats = get_memory_stats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/memory/retain', async (req: Request, res: Response) => {
  try {
    const result = await retain_memory(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CORE CHAT ENDPOINT - Section 8 & Section 9 Workflow
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { customer_id, machine_id, message, ticket_id, with_memory = true } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // 1. Validate customer and machine
    const customer = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(customer_id) as any;
    const machine = db.prepare('SELECT * FROM machines WHERE machine_id = ?').get(machine_id) as any;

    if (!customer) {
      return res.status(404).json({ error: `Customer '${customer_id}' not found` });
    }
    if (!machine) {
      return res.status(404).json({ error: `Machine '${machine_id}' not found` });
    }

    // 2. Search Hindsight for relevant memories
    let recalled: any = { memories: [], source: 'hindsight_persistent_store', status: 'success' };
    if (with_memory) {
      recalled = await recall_memory(message, customer_id, machine_id, 5);
    }

    // 3. Build AI Memory Context
    const memoryContext = with_memory 
      ? build_memory_context(recalled.memories, machine, customer)
      : 'NO MEMORY';

    // 4. Retrieve recent ticket info if applicable
    const recentTickets = db.prepare('SELECT * FROM tickets WHERE machine_id = ? ORDER BY id DESC LIMIT 2').all(machine_id);

    // 5. Call Ollama
    const agentOutput = await generateSupportResponse({
      customer,
      machine,
      message,
      memory_context: memoryContext,
      recalled_memories: recalled.memories,
      recent_tickets: recentTickets,
      with_memory
    });

    const now = new Date().toISOString();

    // 6. Store interaction in SQLite
    const insertInteraction = db.prepare(`
      INSERT INTO interactions (ticket_id, customer_id, machine_id, user_message, agent_response, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = insertInteraction.run(ticket_id || null, customer_id, machine_id, message, agentOutput.response_text, now);

    // 7. Retain the interaction outcome in Hindsight (Long-term continuous learning)
    if (with_memory && !agentOutput.is_safety_hazard) {
      // Retain as recent episodic dialogue touchpoint
      await retain_memory({
        memory_id: `MEM-INT-${info.lastInsertRowid}`,
        customer_id,
        machine_id,
        memory_type: 'episodic',
        category: 'symptom',
        title: `Technician Inquiry: ${message.slice(0, 45)}...`,
        summary: `User asked: "${message}". Diagnosed guidance: ${agentOutput.response_text.slice(0, 150)}...`,
        details: {
          full_query: message,
          suggested_actions: agentOutput.suggested_actions,
          memories_cited: agentOutput.memories_used.map(m => m.id)
        },
        confidence: 0.88,
        event_date: now.split('T')[0],
        tags: ['interaction', 'inquiry', machine_id.toLowerCase()]
      });
    }

    // 8. Return response + memory references to UI
    res.json({
      response: agentOutput.response_text,
      is_safety_hazard: agentOutput.is_safety_hazard,
      hazard_type: agentOutput.hazard_type,
      memories_used: agentOutput.memories_used,
      all_recalled_memories: recalled.memories,
      suggested_actions: agentOutput.suggested_actions,
      disclaimer: agentOutput.disclaimer,
      reflection: recalled.reflection,
      source: recalled.source,
      memory_status: recalled.status,
      interaction_id: info.lastInsertRowid,
      timestamp: now
    });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// SIDE-BY-SIDE MEMORY IMPACT COMPARISON (Section 17)
app.post('/api/chat/compare', async (req: Request, res: Response) => {
  try {
    const { customer_id, machine_id, message } = req.body;
    if (!customer_id || !machine_id || !message) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const customer = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(customer_id) as any;
    const machine = db.prepare('SELECT * FROM machines WHERE machine_id = ?').get(machine_id) as any;

    if (!customer || !machine) {
      return res.status(404).json({ error: 'Customer or Machine not found' });
    }

    // 1. Without Hindsight
    const startWithout = Date.now();
    const withoutResponse = await generateSupportResponse({
      customer,
      machine,
      message,
      memory_context: '',
      recalled_memories: [],
      with_memory: false
    });
    const durationWithout = Date.now() - startWithout;

    // 2. With Hindsight
    const startWith = Date.now();
    const recalled = await recall_memory(message, customer_id, machine_id, 6);
    const memoryContext = build_memory_context(recalled.memories, machine, customer);
    const withResponse = await generateSupportResponse({
      customer,
      machine,
      message,
      memory_context: memoryContext,
      recalled_memories: recalled.memories,
      with_memory: true
    });
    const durationWith = Date.now() - startWith;

    res.json({
      query: message,
      without_memory: {
        response: withoutResponse.response_text,
        suggested_actions: withoutResponse.suggested_actions,
        memories_count: 0,
        duration_ms: durationWithout,
        label: 'WITHOUT HINDSIGHT'
      },
      with_hindsight: {
        response: withResponse.response_text,
        memories_used: withResponse.memories_used,
        recalled_memories: recalled.memories,
        suggested_actions: withResponse.suggested_actions,
        reflection: recalled.reflection,
        duration_ms: durationWith,
        label: 'WITH HINDSIGHT PERSISTENT MEMORY'
      }
    });
  } catch (err: any) {
    console.error('Compare endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Demo seed and reset
app.post('/api/demo/seed', (req: Request, res: Response) => {
  try {
    seedDatabase();
    res.json({ success: true, message: 'Demo data loaded successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/demo/reset', (req: Request, res: Response) => {
  try {
    resetDatabase();
    res.json({ success: true, message: 'Database reset to clean demo baseline.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// VITE MIDDLEWARE SETUP
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SupportMind AI] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
