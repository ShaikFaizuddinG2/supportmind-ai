import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Wrench, 
  TicketCheck, 
  Brain, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Customer, Machine } from '../types';

interface CustomersProps {
  customers: Customer[];
  machines: Machine[];
  onSelectMachine: (machineId: string) => void;
  onStartChat: (machineId: string) => void;
}

export const Customers: React.FC<CustomersProps> = ({
  customers,
  machines,
  onSelectMachine,
  onStartChat
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.customer_id || 'CUST-001');

  const activeCustomer = customers.find(c => c.customer_id === selectedCustomerId) || customers[0];
  const customerMachines = machines.filter(m => m.customer_id === activeCustomer?.customer_id);

  // Customer-specific preferences stored in Hindsight
  const customerPreferences: Record<string, { preference: string; protocol: string; safety: string }> = {
    'CUST-001': {
      preference: 'Concise numbered diagnostic checklists formatted for shift lead Marcus Vance.',
      protocol: 'Strict Lockout/Tagout (LOTO) verification mandatory before top enclosure cowling removal.',
      safety: 'Spindle thermal interlock bypass prohibited under all conditions.'
    },
    'CUST-002': {
      preference: 'Preventative hydraulic fluid differential pressure monitoring and visual particulate analysis.',
      protocol: 'Hydraulic accumulator depressurization verification prior to valve block inspection.',
      safety: 'High pressure fluid jetting precautions enforced.'
    },
    'CUST-003': {
      preference: 'Robotic joint harmonic backlash check and teach-pendant coordinate backup.',
      protocol: 'Safety light curtain and interlocked perimeter gate validation.',
      safety: 'Dual-channel safety circuit reset required after e-stop.'
    }
  };

  const activePref = customerPreferences[activeCustomer?.customer_id] || {
    preference: 'Standard industrial operating procedures.',
    protocol: 'Standard facility maintenance protocol.',
    safety: 'Basic PPE and OSHA compliance.'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-sans flex items-center gap-2.5">
          <Building2 className="h-6 w-6 text-cyan-400" />
          <span>Industrial Client Profiles</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          MSME manufacturing facilities with persistent organization-level operating profiles and maintenance preferences.
        </p>
      </div>

      {/* Customer Tab Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {customers.map((c) => {
          const isSelected = c.customer_id === activeCustomer?.customer_id;
          const assignedCount = machines.filter(m => m.customer_id === c.customer_id).length;
          return (
            <div
              key={c.customer_id}
              onClick={() => setSelectedCustomerId(c.customer_id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-xl shadow-cyan-950/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
                  {c.customer_id}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {assignedCount} Machines
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white font-sans">{c.company_name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                  {c.location}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Contact: {c.contact_name}</span>
                <ArrowRight className={`h-3.5 w-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Customer Detailed Workspace */}
      {activeCustomer && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Customer Profile & Machines */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Primary Profile Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white font-sans">
                    {activeCustomer.company_name}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Client ID: {activeCustomer.customer_id} · Partner since {new Date(activeCustomer.created_at).getFullYear()}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 text-xs font-mono font-semibold border border-emerald-800">
                  Active SLA Support
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-500 font-mono uppercase text-[10px]">Operations Lead:</span>
                  <p className="text-slate-200 font-medium">{activeCustomer.contact_name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-mono uppercase text-[10px]">Direct Phone:</span>
                  <p className="text-slate-200 font-mono">{activeCustomer.phone}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-mono uppercase text-[10px]">Email Dispatch:</span>
                  <p className="text-cyan-400 font-mono">{activeCustomer.email}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-mono uppercase text-[10px]">Facility Location:</span>
                  <p className="text-slate-200">{activeCustomer.location}</p>
                </div>
              </div>
            </div>

            {/* Deployed Machinery List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-cyan-400" />
                  <span>Monitored Assets at this Plant ({customerMachines.length})</span>
                </h3>
              </div>

              <div className="space-y-3">
                {customerMachines.map((m) => (
                  <div
                    key={m.machine_id}
                    className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">{m.machine_id}</span>
                        <span className="text-slate-300 font-bold text-xs">{m.machine_name}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        Model: {m.model} · Commissioned {m.installation_date}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{m.operating_environment}</p>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => onSelectMachine(m.machine_id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono border border-slate-700 cursor-pointer"
                      >
                        History
                      </button>
                      <button
                        onClick={() => onStartChat(m.machine_id)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Diagnose
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Hindsight Customer Preferences & Protocol Context */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                <div className="h-7 w-7 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-sans">
                    Hindsight Customer Preferences
                  </h3>
                  <p className="text-xs text-slate-400">
                    Procedural memories applied during AI troubleshooting
                  </p>
                </div>
              </div>

              {/* Preference Items */}
              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center space-x-2 text-cyan-400 font-mono font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Response Delivery Preference:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed pl-5">
                    {activePref.preference}
                  </p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center space-x-2 text-amber-400 font-mono font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Mandatory Facility Protocol:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed pl-5">
                    {activePref.protocol}
                  </p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center space-x-2 text-rose-400 font-mono font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Strict Safety Prohibition:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed pl-5">
                    {activePref.safety}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl text-[11px] text-cyan-200/90 leading-relaxed">
                💡 <strong>Persistent Learning Effect:</strong> Whenever a technician from {activeCustomer.company_name} initiates a chat, SupportMind AI automatically loads these procedural guidelines into the local AI context.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
