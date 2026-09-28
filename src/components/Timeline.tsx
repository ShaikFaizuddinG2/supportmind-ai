import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, Wrench, ShieldAlert } from 'lucide-react';
import { Ticket } from '../types';

interface TimelineProps {
  machineId: string;
  tickets?: Ticket[];
  onSelectIncident?: (incident: any) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  machineId,
  tickets = [],
  onSelectIncident
}) => {
  // Pre-configured incidents for CNC-M102 as requested in Section 11
  const m102Incidents = [
    {
      date: 'Aug 12, 2024',
      type: 'critical',
      title: 'Spindle Overheating Alarm ERR-402',
      symptom: 'Thermal runaway at 78°C during 3rd shift titanium cut',
      rootCause: 'Brushless auxiliary 24V cooling fan motor seized',
      solutionAttempted: 'Coolant line delivery test (normal)',
      solutionWorked: 'Replaced auxiliary fan assembly (Part #CF-882)',
      outcome: 'Resolved · Stabilized at 42°C under full 18,000 RPM load',
      status: 'Resolved',
      memoryRetained: 'Retained in Hindsight (Episodic Failure & Resolution)'
    },
    {
      date: 'Aug 29, 2024',
      type: 'warning',
      title: 'Excessive Spindle Vibration Alarm ERR-118',
      symptom: 'Harmonic resonance detected at 12,000 RPM (velocity 3.8 mm/s)',
      rootCause: 'Ceramic bearing lubricant starvation in high-speed spindle',
      solutionAttempted: 'Toolholder rebalancing (insufficient)',
      solutionWorked: 'Flushed lubrication channels & replenished ISO VG 32 synthetic oil',
      outcome: 'Resolved · Vibration velocity reduced to 0.72 mm/s',
      status: 'Resolved',
      memoryRetained: 'Retained in Hindsight (Maintenance & Bearing Profile)'
    },
    {
      date: 'Sep 15, 2024',
      type: 'critical',
      title: 'Recurrent Thermal Rise on Heavy Roughing',
      symptom: 'ERR-402 re-emerged on titanium face milling pass',
      rootCause: 'Air intake cowling mesh choked with aluminum & titanium swarf',
      solutionAttempted: 'Hindsight cross-referenced Aug 12 fan issue',
      solutionWorked: 'Cleaned intake filter mesh, cleared blockage & realigned swarf baffle',
      outcome: 'Resolved · Airflow fully restored, thermals stable at 44°C',
      status: 'Resolved',
      memoryRetained: 'Retained in Hindsight (Pattern Clustering)'
    }
  ];

  // If machine is not CNC-M102, generate from tickets or default
  const incidents = machineId === 'CNC-M102' ? m102Incidents : tickets.map(t => ({
    date: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    type: t.severity === 'Critical' || t.severity === 'High' ? 'critical' : 'warning',
    title: t.issue,
    symptom: `Severity: ${t.severity} · Status: ${t.status}`,
    rootCause: t.resolution ? 'Diagnosed through incident investigation' : 'Awaiting root cause determination',
    solutionAttempted: 'Diagnostic checklists',
    solutionWorked: t.resolution || 'Resolution in progress',
    outcome: t.outcome || 'Logged in maintenance records',
    status: t.status,
    memoryRetained: 'Indexed in Hindsight Memory'
  }));

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-lg">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>{machineId} Operational Memory Timeline</span>
          </h3>
          <p className="text-xs text-slate-400">
            Chronological progression of machine events, root causes, and resolutions retained by Hindsight.
          </p>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800/40">
          {incidents.length} Recorded Milestones
        </span>
      </div>

      <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {incidents.map((inc, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline node */}
            <div
              className={`absolute -left-6 top-1 h-5 w-5 rounded-full border-2 flex items-center justify-center bg-slate-950 ${
                inc.type === 'critical'
                  ? 'border-rose-500 text-rose-500'
                  : 'border-amber-400 text-amber-400'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  inc.type === 'critical' ? 'bg-rose-500' : 'bg-amber-400'
                }`}
              />
            </div>

            {/* Timeline card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-semibold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {inc.date}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                      inc.type === 'critical'
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                        : 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                    }`}
                  >
                    {inc.type === 'critical' ? '🔴 Overheating Incident' : '🟡 Vibration Warning'}
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {inc.status}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-white">
                {inc.title}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono bg-slate-900/60 p-2.5 rounded border border-slate-800/70">
                <div className="space-y-1">
                  <p className="text-slate-400">
                    <span className="text-slate-500">Symptom:</span> {inc.symptom}
                  </p>
                  <p className="text-slate-400">
                    <span className="text-slate-500">Root Cause:</span> {inc.rootCause}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-emerald-300">
                    <span className="text-slate-500">Resolution:</span> {inc.solutionWorked}
                  </p>
                  <p className="text-cyan-300">
                    <span className="text-slate-500">Outcome:</span> {inc.outcome}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="font-mono text-slate-500 flex items-center gap-1">
                  <Wrench className="h-3 w-3" />
                  {inc.memoryRetained}
                </span>
                {onSelectIncident && (
                  <button
                    onClick={() => onSelectIncident(inc)}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer font-medium"
                  >
                    <span>Test Recall in Chat</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
