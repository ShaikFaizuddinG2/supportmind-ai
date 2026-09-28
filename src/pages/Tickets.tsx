import React, { useState, useEffect } from 'react';
import { 
  TicketCheck, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  X, 
  Brain, 
  Building2, 
  Wrench, 
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { Ticket, Customer, Machine } from '../types';
import { api } from '../services/api';

interface TicketsProps {
  tickets: Ticket[];
  customers: Customer[];
  machines: Machine[];
  onRefreshTickets: () => void;
  onStartChat: (machineId: string) => void;
}

export const Tickets: React.FC<TicketsProps> = ({
  tickets,
  customers,
  machines,
  onRefreshTickets,
  onStartChat
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailedTicket, setDetailedTicket] = useState<Ticket | null>(null);

  // New Ticket State
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newCustId, setNewCustId] = useState<string>('CUST-001');
  const [newMachId, setNewMachId] = useState<string>('CNC-M102');
  const [newIssue, setNewIssue] = useState<string>('');
  const [newSeverity, setNewSeverity] = useState<string>('Medium');

  const filtered = tickets.filter(t => {
    const matchesSearch = 
      t.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.machine_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.company_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'ALL' || t.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const openTicketDetail = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
    setIsLoadingDetail(true);
    try {
      const data = await api.getTicket(ticket.ticket_id);
      setDetailedTicket(data);
    } catch (err) {
      console.error('Error fetching ticket detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssue.trim()) return;

    try {
      await api.createTicket({
        customer_id: newCustId,
        machine_id: newMachId,
        issue: newIssue,
        severity: newSeverity
      });
      setNewIssue('');
      setIsCreating(false);
      onRefreshTickets();
    } catch (err) {
      console.error('Error creating ticket:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-sans flex items-center gap-2.5">
            <TicketCheck className="h-6 w-6 text-cyan-400" />
            <span>Industrial Support Tickets</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track reported equipment issues, resolutions, and synchronized Hindsight memories.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Open New Ticket</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tickets by ID, machine, or issue..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-3.5 px-4 font-semibold">Ticket ID</th>
                <th className="py-3.5 px-4 font-semibold">Customer / Plant</th>
                <th className="py-3.5 px-4 font-semibold">Machine</th>
                <th className="py-3.5 px-4 font-semibold">Issue Summary</th>
                <th className="py-3.5 px-4 font-semibold">Severity</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Created</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {filtered.map((t) => (
                <tr key={t.ticket_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{t.ticket_id}</td>
                  <td className="py-3.5 px-4 text-white font-medium">{t.company_name || t.customer_id}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">{t.machine_id}</td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate font-medium">{t.issue}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                      t.severity === 'Critical' || t.severity === 'High' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      t.severity === 'Medium' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {t.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                      t.status === 'Resolved' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-medium'
                    }`}>
                      {t.status === 'Resolved' && <CheckCircle2 className="h-3 w-3" />}
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openTicketDetail(t)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800/40">
                  {selectedTicket.ticket_id}
                </span>
                <h3 className="text-base font-bold text-white font-sans">
                  Ticket Incident Profile
                </h3>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Basic Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[11px] font-mono text-slate-500 uppercase">Customer &amp; Equipment</div>
                <div className="font-bold text-white text-sm">{detailedTicket?.company_name || selectedTicket.company_name}</div>
                <div className="text-cyan-400 font-mono">Asset ID: {selectedTicket.machine_id}</div>
                <div className="text-slate-400">Environment: {detailedTicket?.operating_environment || 'Factory Floor'}</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[11px] font-mono text-slate-500 uppercase">Status &amp; Severity</div>
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-400 font-mono font-bold">{selectedTicket.status}</span>
                  <span>·</span>
                  <span className="text-rose-400 font-mono font-bold">{selectedTicket.severity} Severity</span>
                </div>
                <div className="text-slate-400 text-[11px]">Logged: {new Date(selectedTicket.created_at).toLocaleString()}</div>
                {selectedTicket.resolved_at && (
                  <div className="text-emerald-400 text-[11px]">Resolved: {new Date(selectedTicket.resolved_at).toLocaleString()}</div>
                )}
              </div>
            </div>

            {/* Issue Description */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <span className="font-mono text-slate-400 uppercase font-semibold">Reported Issue:</span>
              <p className="text-slate-200 text-sm leading-relaxed">{selectedTicket.issue}</p>
            </div>

            {/* Applied Resolution & Outcome */}
            {selectedTicket.resolution && (
              <div className="bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-xl space-y-2 text-xs">
                <span className="font-mono text-emerald-400 uppercase font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Verified Resolution Applied:
                </span>
                <p className="text-slate-200 leading-relaxed font-sans">{selectedTicket.resolution}</p>
                {selectedTicket.outcome && (
                  <p className="text-cyan-300 font-mono text-[11px] pt-1">
                    Outcome Verified: {selectedTicket.outcome}
                  </p>
                )}
              </div>
            )}

            {/* Related Hindsight Memories Recalled for this ticket */}
            {detailedTicket?.related_memories && detailedTicket.related_memories.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-mono text-cyan-400 uppercase font-semibold flex items-center gap-1.5">
                  <Brain className="h-4 w-4" />
                  Hindsight Long-Term Memories Related to this Incident:
                </span>
                <div className="space-y-2">
                  {detailedTicket.related_memories.map((mem) => (
                    <div key={mem.memory_id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                        <span className="text-cyan-400 uppercase">{mem.category}</span>
                        <span>{mem.event_date}</span>
                      </div>
                      <div className="font-semibold text-white">{mem.title}</div>
                      <p className="text-slate-400 text-xs mt-0.5">{mem.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  onStartChat(selectedTicket.machine_id);
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Open Diagnostic Chat for {selectedTicket.machine_id}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <Plus className="h-5 w-5 text-cyan-400" />
                <span>Log New Industrial Support Ticket</span>
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-slate-400 font-mono uppercase">Customer Plant</label>
                <select
                  value={newCustId}
                  onChange={(e) => {
                    setNewCustId(e.target.value);
                    const matching = machines.filter(m => m.customer_id === e.target.value);
                    if (matching.length > 0) setNewMachId(matching[0].machine_id);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {customers.map(c => (
                    <option key={c.customer_id} value={c.customer_id}>{c.company_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono uppercase">Target Machine</label>
                <select
                  value={newMachId}
                  onChange={(e) => setNewMachId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                >
                  {machines.filter(m => m.customer_id === newCustId).map(m => (
                    <option key={m.machine_id} value={m.machine_id}>{m.machine_id} - {m.machine_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono uppercase">Severity Level</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                >
                  <option value="Low">Low - Advisory / Cosmetic</option>
                  <option value="Medium">Medium - Reduced Speed / Tolerances</option>
                  <option value="High">High - Production Stalled / Intermittent Trip</option>
                  <option value="Critical">Critical - Hard Spindle / Hydraulic Stop</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono uppercase">Problem Description / Alarm Codes</label>
                <textarea
                  rows={4}
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  placeholder="Describe observed symptoms, error codes (e.g. ERR-402), or abnormal sounds..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Create &amp; Index into Hindsight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
