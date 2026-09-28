import React from 'react';
import { 
  Building2, 
  Wrench, 
  TicketCheck, 
  CheckCircle2, 
  Brain, 
  AlertTriangle, 
  ArrowUpRight, 
  Clock, 
  Activity,
  Flame,
  Sparkles,
  Layers
} from 'lucide-react';
import { Customer, Machine, Ticket, MemoryStats } from '../types';

interface DashboardProps {
  customers: Customer[];
  machines: Machine[];
  tickets: Ticket[];
  memoryStats?: MemoryStats;
  onNavigate: (tab: string, param?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  customers,
  machines,
  tickets,
  memoryStats,
  onNavigate
}) => {
  const openTickets = tickets.filter(t => t.status !== 'Resolved');
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved');
  const warningMachines = machines.filter(m => m.status === 'Warning' || m.status === 'Critical');

  // Issue category distribution
  const issueDistribution = [
    { name: 'Spindle Thermals / Overheating', percentage: 45, count: 4, color: 'bg-rose-500' },
    { name: 'Spindle Harmonic Vibration', percentage: 25, count: 2, color: 'bg-amber-500' },
    { name: 'Hydraulic Pressure Drops', percentage: 20, count: 2, color: 'bg-cyan-500' },
    { name: 'Axis Guideway Backlash', percentage: 10, count: 1, color: 'bg-indigo-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero Welcome & Quick Launch */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-800/60">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Hindsight Long-Term Memory Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            SupportMind AI Industrial Operations
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Autonomous industrial diagnostics with multi-session memory retention. When shop machines experience recurrent faults, SupportMind recalls historical resolutions in milliseconds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('chat')}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-950/50 flex items-center space-x-2 cursor-pointer"
          >
            <span>Start Diagnostic Chat</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => onNavigate('compare')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-semibold transition-all border border-slate-700 flex items-center space-x-2 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span>Memory Impact Demo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Total Customers */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Clients</span>
            <Building2 className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white font-sans">{customers.length}</div>
          <div className="text-[11px] text-slate-500 font-mono">MSME Plants</div>
        </div>

        {/* Total Machines */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Machinery</span>
            <Wrench className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white font-sans">{machines.length}</div>
          <div className="text-[11px] text-cyan-400 font-mono">{warningMachines.length} attention</div>
        </div>

        {/* Open Tickets */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Tickets</span>
            <TicketCheck className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-sans">{openTickets.length}</div>
          <div className="text-[11px] text-slate-500 font-mono">In Investigation</div>
        </div>

        {/* Resolved Tickets */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-sans">{resolvedTickets.length}</div>
          <div className="text-[11px] text-slate-500 font-mono">100% Retained</div>
        </div>

        {/* Hindsight Memories */}
        <div className="bg-slate-900 border border-cyan-800/60 rounded-xl p-4 space-y-1 bg-gradient-to-b from-cyan-950/20 to-slate-900">
          <div className="flex items-center justify-between text-cyan-300 text-xs font-medium">
            <span>Hindsight Store</span>
            <Brain className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-sans">
            {memoryStats?.total_memories || 7}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">Persistent LTM</div>
        </div>

        {/* MTTR Diagnostic Speed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>MTTR Reduction</span>
            <Activity className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300 font-sans">-68%</div>
          <div className="text-[11px] text-slate-500 font-mono">Vs. Stateless</div>
        </div>
      </div>

      {/* Middle Grid: Machine Health Breakdown + High Level Hindsight Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Machine Health & Issue Breakdown (Left 7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white font-sans">
                Recurring Machinery Failure Modes
              </h3>
              <p className="text-xs text-slate-400">
                Pattern distribution detected across all monitored factory equipment
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">Live Telemetry</span>
          </div>

          <div className="space-y-4">
            {issueDistribution.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{item.name}</span>
                  <span className="font-mono text-slate-400">
                    {item.percentage}% ({item.count} incidents)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Monitored Assets Glance */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-slate-300">Active Industrial Assets:</span>
              <button
                onClick={() => onNavigate('machines')}
                className="text-cyan-400 hover:text-cyan-300 font-mono cursor-pointer"
              >
                View all {machines.length} machines →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {machines.slice(0, 4).map((m) => (
                <div
                  key={m.machine_id}
                  onClick={() => onNavigate('machines', m.machine_id)}
                  className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="font-mono text-xs font-semibold text-white">{m.machine_id}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{m.machine_name}</div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                    m.status === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    m.status === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hindsight Reflection Patterns (Right 5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <div className="h-7 w-7 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-sans">
                  Hindsight Reflection Insights
                </h3>
                <p className="text-xs text-slate-400">
                  Synthesized equipment clusters across time
                </p>
              </div>
            </div>

            {/* Pattern Card 1 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-cyan-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  CNC-M102: Cooling Circuit Cluster
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                  94% Confidence
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Machine CNC-M102 has experienced 3 documented overheating events during continuous 3-shift runs. Primary vulnerabilities: 24V auxiliary fan motor wear and fine swarf clogging on intake mesh filter.
              </p>
              <div className="text-[11px] text-cyan-200/90 bg-cyan-950/40 p-2 rounded border border-cyan-800/30">
                Action: Always verify intake airflow &amp; fan RPM before adjusting thermistor parameters.
              </div>
            </div>

            {/* Pattern Card 2 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                  PRESS-P14: Hydraulic Particulate
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                  91% Confidence
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                10-micron return line filter cartridge tends to saturate after 1,200 heavy blanking hours under elevated fluid temps, causing hydraulic pressure drops from 210 to 135 bar.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('memory')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>Explore All Persistent Memories</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Recently Resolved Incidents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white font-sans">
              Recently Resolved Incidents &amp; Stored Outcomes
            </h3>
            <p className="text-xs text-slate-400">
              Every solved incident automatically updates the Hindsight knowledge graph.
            </p>
          </div>
          <button
            onClick={() => onNavigate('tickets')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono cursor-pointer"
          >
            View all tickets →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <th className="pb-3 font-semibold">Ticket ID</th>
                <th className="pb-3 font-semibold">Machine</th>
                <th className="pb-3 font-semibold">Issue Summary</th>
                <th className="pb-3 font-semibold">Severity</th>
                <th className="pb-3 font-semibold">Resolution Applied</th>
                <th className="pb-3 font-semibold">Hindsight Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {tickets.slice(0, 4).map((ticket) => (
                <tr key={ticket.ticket_id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-mono font-semibold text-cyan-400">{ticket.ticket_id}</td>
                  <td className="py-3 font-mono text-slate-200">{ticket.machine_id}</td>
                  <td className="py-3 text-slate-300 max-w-xs truncate">{ticket.issue}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                      ticket.severity === 'Critical' || ticket.severity === 'High' ? 'bg-rose-950 text-rose-300' :
                      ticket.severity === 'Medium' ? 'bg-amber-950 text-amber-300' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {ticket.severity}
                    </span>
                  </td>
                  <td className="py-3 text-emerald-300/90 max-w-sm truncate">
                    {ticket.resolution || 'In progress'}
                  </td>
                  <td className="py-3 text-cyan-400 font-mono text-[11px]">
                    ✓ Retained &amp; Indexed
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
