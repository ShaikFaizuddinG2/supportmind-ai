import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Wrench, 
  Building2, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  Brain, 
  Clock, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Machine, Ticket, HindsightMemory } from '../types';
import { api } from '../services/api';
import { Timeline } from '../components/Timeline';
import { MemoryPanel } from '../components/MemoryPanel';

interface MachineDetailProps {
  machineId: string;
  onBack: () => void;
  onStartChat: (machineId: string) => void;
}

export const MachineDetail: React.FC<MachineDetailProps> = ({
  machineId,
  onBack,
  onStartChat
}) => {
  const [machine, setMachine] = useState<Machine | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    api.getMachine(machineId)
      .then((data) => {
        setMachine(data);
      })
      .catch((err) => console.error('Error fetching machine details:', err))
      .finally(() => setIsLoading(false));
  }, [machineId]);

  if (isLoading || !machine) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
        <div className="h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="font-mono text-xs">Retrieving machine profile and Hindsight memory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Bar with Back Button & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Machines</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onStartChat(machine.machine_id)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Launch Support Chat</span>
          </button>
        </div>
      </div>

      {/* Main Machine Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800/40">
              {machine.machine_id}
            </span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold uppercase ${
              machine.status === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
              machine.status === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
              'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {machine.status}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans">
            {machine.machine_name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
            <span>Model: <strong className="text-white">{machine.model}</strong></span>
            <span>·</span>
            <span>OEM: <strong className="text-white">{machine.manufacturer}</strong></span>
            <span>·</span>
            <span>Commissioned: <strong className="text-white">{machine.installation_date}</strong></span>
          </div>
        </div>

        {/* Customer Facility Card */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-sans space-y-2 min-w-[260px]">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Assigned Plant:</div>
          <div className="font-bold text-white flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-cyan-400" />
            {machine.company_name}
          </div>
          <div className="text-slate-400 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-500" />
            {machine.location}
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            Contact: {machine.contact_name} ({machine.phone})
          </div>
        </div>
      </div>

      {/* Operating Environment Warning / Context */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 flex items-start space-x-3">
        <ShieldCheck className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-0.5">
          <span className="font-semibold text-white">Documented Shop Floor Environment:</span>
          <p className="text-slate-400 leading-relaxed">
            {machine.operating_environment}
          </p>
        </div>
      </div>

      {/* Grid: Visual Timeline (Section 11) + Hindsight Memory Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Timeline (Left 7 cols) */}
        <div className="lg:col-span-7">
          <Timeline
            machineId={machine.machine_id}
            tickets={machine.tickets}
            onSelectIncident={() => onStartChat(machine.machine_id)}
          />
        </div>

        {/* Hindsight Persistent Memory (Right 5 cols) */}
        <div className="lg:col-span-5">
          <MemoryPanel
            memories={machine.memories || []}
            reflection={machine.reflection}
            machineId={machine.machine_id}
          />
        </div>
      </div>

      {/* Historical Tickets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>Support Incident Logs for {machine.machine_id}</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {machine.tickets?.length || 0} Tickets on Record
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <th className="pb-3">Ticket</th>
                <th className="pb-3">Issue</th>
                <th className="pb-3">Severity</th>
                <th className="pb-3">Resolution Summary</th>
                <th className="pb-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {(machine.tickets || []).map((t) => (
                <tr key={t.ticket_id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-mono font-semibold text-cyan-400">{t.ticket_id}</td>
                  <td className="py-3 text-white font-medium max-w-xs">{t.issue}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                      t.severity === 'Critical' || t.severity === 'High' ? 'bg-rose-950 text-rose-300' :
                      t.severity === 'Medium' ? 'bg-amber-950 text-amber-300' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {t.severity}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300 max-w-sm text-xs leading-relaxed">
                    {t.resolution || 'In investigation'}
                  </td>
                  <td className="py-3 text-emerald-300 font-medium text-xs">
                    {t.outcome || 'Pending'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
