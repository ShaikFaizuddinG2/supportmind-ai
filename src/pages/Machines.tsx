import React, { useState } from 'react';
import { 
  Wrench, 
  Search, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Clock, 
  Brain,
  MessageSquarePlus
} from 'lucide-react';
import { Machine } from '../types';
import { MachineDetail } from './MachineDetail';

interface MachinesProps {
  machines: Machine[];
  onStartChat: (machineId: string) => void;
  selectedMachineId?: string | null;
  onClearSelectedMachine?: () => void;
}

export const Machines: React.FC<MachinesProps> = ({
  machines,
  onStartChat,
  selectedMachineId,
  onClearSelectedMachine
}) => {
  const [activeMachineId, setActiveMachineId] = useState<string | null>(selectedMachineId || null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  if (activeMachineId) {
    return (
      <MachineDetail
        machineId={activeMachineId}
        onBack={() => {
          setActiveMachineId(null);
          if (onClearSelectedMachine) onClearSelectedMachine();
        }}
        onStartChat={onStartChat}
      />
    );
  }

  const filtered = machines.filter(m => {
    const matchesSearch = 
      m.machine_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.machine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-sans flex items-center gap-2.5">
            <Wrench className="h-6 w-6 text-cyan-400" />
            <span>Industrial Machinery Registry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitored shop floor assets with persistent Hindsight incident tracking and root cause histories.
          </p>
        </div>

        {/* Search & Status Filters */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, model, or customer..."
              className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-56 sm:w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="Operational">Operational</option>
            <option value="Warning">Warning</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Machines Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((machine) => (
          <div
            key={machine.machine_id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                    {machine.machine_id}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5 font-sans leading-snug">
                    {machine.machine_name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Model: {machine.model} · {machine.manufacturer}
                  </p>
                </div>

                <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold flex-shrink-0 ${
                  machine.status === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                  machine.status === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {machine.status}
                </span>
              </div>

              {/* Plant / Customer */}
              <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="font-medium text-white truncate">{machine.company_name}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400 truncate text-[11px]">{machine.location}</span>
              </div>

              {/* Operating Environment context */}
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                <strong className="text-slate-300">Environment:</strong> {machine.operating_environment}
              </p>

              {/* Last Issue / Tickets Badge */}
              {machine.last_issue && (
                <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                  <span className="text-amber-400 font-semibold">Last Incident:</span>{' '}
                  <span className="text-slate-300">{machine.last_issue}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => setActiveMachineId(machine.machine_id)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>Machine History &amp; Timeline</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => onStartChat(machine.machine_id)}
                className="py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                title="Start Diagnostic Chat for this machine"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                <span>Diagnose</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
