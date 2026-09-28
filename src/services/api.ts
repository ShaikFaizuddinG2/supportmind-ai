import axios from 'axios';
import { Customer, Machine, Ticket, CompareResult, MemoryStats, HindsightMemory } from '../types';

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Health
  getHealth: async () => {
    const res = await client.get('/health');
    return res.data;
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    const res = await client.get('/customers');
    return res.data;
  },
  getCustomer: async (id: string): Promise<Customer> => {
    const res = await client.get(`/customers/${id}`);
    return res.data;
  },

  // Machines
  getMachines: async (): Promise<Machine[]> => {
    const res = await client.get('/machines');
    return res.data;
  },
  getMachine: async (id: string): Promise<Machine> => {
    const res = await client.get(`/machines/${id}`);
    return res.data;
  },

  // Tickets
  getTickets: async (): Promise<Ticket[]> => {
    const res = await client.get('/tickets');
    return res.data;
  },
  getTicket: async (id: string): Promise<Ticket> => {
    const res = await client.get(`/tickets/${id}`);
    return res.data;
  },
  createTicket: async (data: { customer_id: string; machine_id: string; issue: string; severity?: string }): Promise<Ticket> => {
    const res = await client.post('/tickets', data);
    return res.data;
  },

  // Chat
  sendMessage: async (payload: {
    customer_id: string;
    machine_id: string;
    message: string;
    ticket_id?: string;
    with_memory?: boolean;
  }) => {
    const res = await client.post('/chat', payload);
    return res.data;
  },

  // Side-by-side comparison (Without Memory vs With Hindsight)
  compareChat: async (payload: {
    customer_id: string;
    machine_id: string;
    message: string;
  }): Promise<CompareResult> => {
    const res = await client.post('/chat/compare', payload);
    return res.data;
  },

  // Hindsight Memory
  getMachineMemories: async (customer_id: string, machine_id: string, query: string = ''): Promise<{ memories: HindsightMemory[]; reflection?: string }> => {
    const res = await client.get(`/memory/${customer_id}/${machine_id}`, {
      params: { q: query },
    });
    return res.data;
  },
  getMemoryStats: async (): Promise<MemoryStats> => {
    const res = await client.get('/memory-stats');
    return res.data;
  },
  retainMemory: async (data: Partial<HindsightMemory>) => {
    const res = await client.post('/memory/retain', data);
    return res.data;
  },

  // Demo Controls
  seedDemo: async () => {
    const res = await client.post('/demo/seed');
    return res.data;
  },
  resetDemo: async () => {
    const res = await client.post('/demo/reset');
    return res.data;
  },
};
