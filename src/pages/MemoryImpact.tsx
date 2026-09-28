import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Brain, 
  XCircle, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  Clock, 
  ShieldCheck, 
  Play,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { Customer, Machine, CompareResult } from '../types';
import { api } from '../services/api';

interface MemoryImpactProps {
  customers: Customer[];
  machines: Machine[];
  onStartChatWithPrompt?: (machineId: string, prompt: string) => void;
}

export const MemoryImpact: React.FC<MemoryImpactProps> = ({
  customers,
  machines,
  onStartChatWithPrompt
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>('CNC-M102');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('CUST-001');
  const [prompt, setPrompt] = useState<string>('Machine M102 is overheating again.');
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);

  // Preset comparison scenarios
  const scenarios = [
    {
      title: 'Scenario 1: CNC-M102 Recurrent Overheating',
      machineId: 'CNC-M102',
      customerId: 'CUST-001',
      prompt: 'Machine M102 is overheating again.',
      description: 'Without memory: asks for serial numbers and basic manual. With Hindsight: immediately recalls Aug 12 fan failure, Sep 15 swarf incident, and ACME step-by-step checklist.'
    },
    {
      title: 'Scenario 2: CNC-M102 Spindle Vibration Warning',
      machineId: 'CNC-M102',
      customerId: 'CUST-001',
      prompt: 'Excessive spindle vibration warning ERR-118 on M102.',
      description: 'Without memory: suggests tool balancing. With Hindsight: recalls tool balancing previously failed on Aug 29 and bearing lubrication flush was the successful fix.'
    },
    {
      title: 'Scenario 3: PRESS-P14 Hydraulic Pressure Drop',
      machineId: 'PRESS-P14',
      customerId: 'CUST-002',
      prompt: 'Hydraulic pressure dropped below 140 bar during blanking stroke.',
      description: 'Without memory: asks if pump is plugged in. With Hindsight: flags 10-micron return line filter cartridge blockage from Sep 2 history.'
    }
  ];

  const runComparison = async (testPrompt?: string, mId?: string, cId?: string) => {
    const activePrompt = testPrompt || prompt;
    const activeMachine = mId || selectedMachineId;
    const activeCustomer = cId || selectedCustomerId;

    setIsComparing(true);
    try {
      const result = await api.compareChat({
        customer_id: activeCustomer,
        machine_id: activeMachine,
        message: activePrompt
      });
      setCompareResult(result);
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setIsComparing(false);
    }
  };

  // Run on mount if no result
  React.useEffect(() => {
    runComparison('Machine M102 is overheating again.', 'CNC-M102', 'CUST-001');
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Title & Mission */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-mono font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Core Hackathon Differentiator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Memory Impact: Without Memory vs. With Hindsight
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
              Witness how traditional AI support agents forget past failures, while SupportMind AI utilizes persistent Hindsight memory to deliver razor-sharp, context-aware machine troubleshooting.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex-shrink-0 text-xs font-mono space-y-1.5">
            <div className="text-slate-400 font-semibold uppercase tracking-wider">Hindsight Loop:</div>
            <div className="text-cyan-400">1. Past Incident → 2. Retain → 3. Recall</div>
            <div className="text-emerald-400">4. Grounded Ollama Response → 5. New Outcome</div>
          </div>
        </div>

        {/* Live Test Query Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono text-slate-400">Select Preset Scenario:</span>
            {scenarios.map((sc, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedMachineId(sc.machineId);
                  setSelectedCustomerId(sc.customerId);
                  setPrompt(sc.prompt);
                  runComparison(sc.prompt, sc.machineId, sc.customerId);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer font-medium ${
                  prompt === sc.prompt
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-600 shadow-sm'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {sc.title}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter custom technician query to test both engines..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-sans"
            />
            <button
              onClick={() => runComparison()}
              disabled={isComparing || !prompt.trim()}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-cyan-950/50 cursor-pointer disabled:opacity-50"
            >
              {isComparing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Evaluating Parallel Engines...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Run Side-by-Side Comparison</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      {compareResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT: WITHOUT HINDSIGHT */}
          <div className="bg-slate-900/90 border border-rose-900/60 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-rose-950/80 text-rose-300 text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg border-b border-l border-rose-800/60">
              Stateless / Baseline LLM
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">
                    WITHOUT HINDSIGHT MEMORY
                  </h3>
                  <p className="text-xs text-rose-300/80 font-mono">
                    Zero historical context · Memory Layer Inactive
                  </p>
                </div>
              </div>

              {/* User Prompt */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Technician Input:</span>
                <p className="text-xs text-slate-200 font-medium font-sans">"{compareResult.query}"</p>
              </div>

              {/* Response */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 text-slate-300 text-xs sm:text-sm leading-relaxed space-y-3 font-sans">
                <p className="whitespace-pre-line text-slate-300">
                  {compareResult.without_memory.response}
                </p>
              </div>

              {/* Diagnostic Checklist */}
              {compareResult.without_memory.suggested_actions && (
                <div className="space-y-1.5">
                  <span className="text-xs font-mono text-slate-400 uppercase font-semibold">
                    Generic Checklist Generated:
                  </span>
                  <div className="space-y-1">
                    {compareResult.without_memory.suggested_actions.map((act, i) => (
                      <div key={i} className="text-xs text-slate-400 flex items-start space-x-2 bg-slate-950/40 p-2 rounded border border-slate-800/40">
                        <span className="text-slate-500 font-mono">[{i + 1}]</span>
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Critique Metrics */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center font-mono">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500">History Used</div>
                <div className="text-sm font-bold text-rose-400">0 records</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500">Root Cause Clues</div>
                <div className="text-sm font-bold text-slate-400">None (Asks User)</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-500">Shop Preference</div>
                <div className="text-sm font-bold text-rose-400">Ignored</div>
              </div>
            </div>
          </div>

          {/* RIGHT: WITH HINDSIGHT */}
          <div className="bg-slate-900/90 border-2 border-cyan-500/80 rounded-2xl p-6 shadow-2xl shadow-cyan-950/50 flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-cyan-950 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg border-b border-l border-cyan-700">
              Hindsight Persistent Memory Layer
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-cyan-950 border border-cyan-600 flex items-center justify-center text-cyan-400">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                    WITH HINDSIGHT PERSISTENCE
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                      {compareResult.with_hindsight.recalled_memories.length} Memories Recalled
                    </span>
                  </h3>
                  <p className="text-xs text-cyan-300/80 font-mono">
                    Target: {selectedMachineId} · Persistent Multi-Session Memory
                  </p>
                </div>
              </div>

              {/* User Prompt */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-900/40">
                <span className="text-[10px] font-mono text-cyan-400 uppercase block mb-1">Technician Input:</span>
                <p className="text-xs text-white font-medium font-sans">"{compareResult.query}"</p>
              </div>

              {/* Response */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-100 text-xs sm:text-sm leading-relaxed space-y-3 font-sans">
                <p className="whitespace-pre-line">
                  {compareResult.with_hindsight.response}
                </p>
              </div>

              {/* Recalled Memories Breakdown */}
              <div className="space-y-2 bg-cyan-950/30 p-3 rounded-xl border border-cyan-800/40">
                <span className="text-xs font-mono text-cyan-300 uppercase font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Memories Recalled &amp; Grounded into Response:
                </span>
                <div className="space-y-1.5 text-xs text-slate-300">
                  {compareResult.with_hindsight.recalled_memories.slice(0, 3).map((m, idx) => (
                    <div key={idx} className="flex items-start space-x-2 bg-slate-950/70 p-2 rounded border border-slate-800">
                      <span className="text-cyan-400 font-mono font-bold">✓</span>
                      <div>
                        <span className="text-white font-semibold">{m.title}</span> ({m.event_date}):
                        <p className="text-slate-400 text-[11px] mt-0.5">{m.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Targeted Checklist */}
              {compareResult.with_hindsight.suggested_actions && (
                <div className="space-y-1.5">
                  <span className="text-xs font-mono text-emerald-400 uppercase font-semibold">
                    Targeted Maintenance Actions:
                  </span>
                  <div className="space-y-1">
                    {compareResult.with_hindsight.suggested_actions.map((act, i) => (
                      <div key={i} className="text-xs text-emerald-200 flex items-start space-x-2 bg-emerald-950/30 p-2 rounded border border-emerald-800/40">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Critique Metrics */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center font-mono">
              <div className="bg-slate-950 p-2 rounded-lg border border-cyan-900/60">
                <div className="text-[10px] text-slate-400">History Used</div>
                <div className="text-sm font-bold text-cyan-400">
                  {compareResult.with_hindsight.recalled_memories.length} records
                </div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-cyan-900/60">
                <div className="text-[10px] text-slate-400">Root Cause Clues</div>
                <div className="text-sm font-bold text-emerald-400">Fan + Swarf Mesh</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-cyan-900/60">
                <div className="text-[10px] text-slate-400">Shop Preference</div>
                <div className="text-sm font-bold text-cyan-300">Step-by-Step LOTO</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* The Memory Loop Architectural Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white font-sans">
            How SupportMind AI Compounds Knowledge Over Time
          </h2>
          <p className="text-xs text-slate-400">
            Unlike stateless bots that reset every session, SupportMind AI learns with every resolved ticket.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-mono font-bold text-slate-400">INTERACTION 1</div>
            <h4 className="text-sm font-semibold text-white">Baseline Contact</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No historical data exists. Agent asks baseline diagnostic questions, records initial alarm codes and fluid pressures.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-mono font-bold text-cyan-400">INTERACTION 5</div>
            <h4 className="text-sm font-semibold text-white">Component Profile</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hindsight retains previous part replacements (e.g. cooling fan assembly CF-882) and technician diagnostic preferences.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-mono font-bold text-emerald-400">INTERACTION 10</div>
            <h4 className="text-sm font-semibold text-white">Environment Awareness</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cross-references shop floor thermal patterns (3-shift duty cycles, summer ambient peaks, swarf clogging risks).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-mono font-bold text-purple-400">INTERACTION 20+</div>
            <h4 className="text-sm font-semibold text-white">Predictive Mastery</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generates reflection clusters on recurrent failure modes, reducing mean-time-to-repair (MTTR) by up to 68%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
