import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Brain, 
  Cpu, 
  CheckSquare, 
  Square, 
  Sparkles, 
  ShieldAlert, 
  RotateCcw, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle,
  Building,
  Wrench,
  Info
} from 'lucide-react';
import { Customer, Machine, ChatMessage, HindsightMemory } from '../types';
import { api } from '../services/api';
import { MemoryPanel } from '../components/MemoryPanel';
import { SafetyBanner } from '../components/SafetyBanner';

interface SupportChatProps {
  customers: Customer[];
  machines: Machine[];
  initialMachineId?: string;
}

export const SupportChat: React.FC<SupportChatProps> = ({
  customers,
  machines,
  initialMachineId
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('CUST-001');
  const [selectedMachineId, setSelectedMachineId] = useState<string>(initialMachineId || 'CNC-M102');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeMemories, setActiveMemories] = useState<HindsightMemory[]>([]);
  const [activeReflection, setActiveReflection] = useState<string | null>(null);
  const [criticalHazard, setCriticalHazard] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync selected machine with initialMachineId if provided
  useEffect(() => {
    if (initialMachineId) {
      setSelectedMachineId(initialMachineId);
      const machine = machines.find(m => m.machine_id === initialMachineId);
      if (machine) {
        setSelectedCustomerId(machine.customer_id);
      }
    }
  }, [initialMachineId, machines]);

  // Load initial machine memories for the memory panel
  useEffect(() => {
    if (selectedCustomerId && selectedMachineId) {
      api.getMachineMemories(selectedCustomerId, selectedMachineId)
        .then(res => {
          setActiveMemories(res.memories || []);
          setActiveReflection(res.reflection || null);
        })
        .catch(err => console.error('Failed to load machine memories:', err));
    }
  }, [selectedCustomerId, selectedMachineId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Set welcome message on mount or machine change if empty
  useEffect(() => {
    if (messages.length === 0) {
      const selectedMachine = machines.find(m => m.machine_id === selectedMachineId);
      setMessages([
        {
          id: 'msg-welcome',
          role: 'assistant',
          content: `Welcome to SupportMind AI. I am your specialized Industrial Diagnostics Assistant backed by Hindsight persistent memory.

I have synchronized operational history for ${selectedMachine?.machine_name || 'DMG MORI 5-Axis Mill'} (${selectedMachineId}).
I have 4 historical incidents, component solutions, and technician protocols indexed in long-term memory.

How can I assist your shop floor maintenance team today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  }, [selectedMachineId, machines]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputMessage;
    if (!message.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);
    setCriticalHazard(null);

    try {
      const response = await api.sendMessage({
        customer_id: selectedCustomerId,
        machine_id: selectedMachineId,
        message: message,
        with_memory: true
      });

      if (response.is_safety_hazard) {
        setCriticalHazard(response.hazard_type || 'Critical industrial hazard');
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        memories_used: response.memories_used,
        all_recalled_memories: response.all_recalled_memories,
        suggested_actions: response.suggested_actions,
        is_safety_hazard: response.is_safety_hazard,
        hazard_type: response.hazard_type,
        reflection: response.reflection,
        source: response.source
      };

      setMessages(prev => [...prev, aiMsg]);

      if (response.all_recalled_memories && response.all_recalled_memories.length > 0) {
        setActiveMemories(response.all_recalled_memories);
      }
      if (response.reflection) {
        setActiveReflection(response.reflection);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error communicating with SupportMind agent: ${err.message || 'Network error'}. Please verify backend status.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionToggle = (actionKey: string) => {
    setCompletedActions(prev => ({
      ...prev,
      [actionKey]: !prev[actionKey]
    }));
  };

  // Filter machines for selected customer
  const filteredMachines = machines.filter(m => m.customer_id === selectedCustomerId);
  const currentMachine = machines.find(m => m.machine_id === selectedMachineId);
  const currentCustomer = customers.find(c => c.customer_id === selectedCustomerId);

  // Quick preset queries for demonstration
  const demoPrompts = [
    {
      label: 'M102 Overheating (Hindsight Loop)',
      query: 'Machine M102 is overheating again.',
      highlight: true,
      tag: 'Section 9 Workflow'
    },
    {
      label: 'M102 Spindle Vibration ERR-118',
      query: 'Excessive spindle vibration warning ERR-118 on M102 during high speed pass.',
      highlight: false,
      tag: 'Aug 29 Bearing Memory'
    },
    {
      label: 'P14 Hydraulic Pressure Drop',
      query: 'Hydraulic pressure dropped below 140 bar on PRESS-P14.',
      highlight: false,
      machineTarget: 'PRESS-P14',
      customerTarget: 'CUST-002',
      tag: 'Return Filter Cartridge'
    },
    {
      label: 'Hazard Test: Smoke & Sparks',
      query: 'There is smoke and burning smell coming from the main 480V control panel!',
      highlight: false,
      hazard: true,
      tag: 'Safety Interlock'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Safety Alert if critical condition triggered */}
      {criticalHazard && (
        <SafetyBanner
          isCritical={true}
          reason={criticalHazard}
          onAcknowledge={() => setCriticalHazard(null)}
        />
      )}

      {/* Target Asset Selector Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Customer Selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
              <Building className="h-3 w-3 text-cyan-400" />
              Customer Facility
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                const newCustId = e.target.value;
                setSelectedCustomerId(newCustId);
                const matchingMachines = machines.filter(m => m.customer_id === newCustId);
                if (matchingMachines.length > 0) {
                  setSelectedMachineId(matchingMachines[0].machine_id);
                }
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {customers.map(c => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.company_name} ({c.customer_id})
                </option>
              ))}
            </select>
          </div>

          {/* Machine Selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
              <Wrench className="h-3 w-3 text-cyan-400" />
              Machine Asset
            </label>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-500 cursor-pointer font-mono"
            >
              {filteredMachines.map(m => (
                <option key={m.machine_id} value={m.machine_id}>
                  {m.machine_id} - {m.machine_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Machine Status Glance */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="text-right">
            <p className="text-slate-400">{currentMachine?.model || 'DMU 50'}</p>
            <p className="text-slate-500 text-[11px]">{currentCustomer?.location}</p>
          </div>
          <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase ${
            currentMachine?.status === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
            currentMachine?.status === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
            'bg-emerald-950 text-emerald-300 border border-emerald-800'
          }`}>
            {currentMachine?.status || 'Operational'}
          </span>
        </div>
      </div>

      {/* Main Grid: Chat Column (Left) + Memory Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Chat Window */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden min-h-[640px]">
          
          {/* Chat Header */}
          <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <div>
                <h2 className="text-sm font-semibold text-white font-sans">
                  SupportMind Diagnostics Agent
                </h2>
                <p className="text-[11px] text-slate-400">
                  Target: <span className="font-mono text-cyan-300">{selectedMachineId}</span> · Continuous Memory Feed Active
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setMessages([]);
                setCompletedActions({});
              }}
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 cursor-pointer font-mono"
              title="Clear conversation"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Clear</span>
            </button>
          </div>

          {/* Quick Demo Scenarios Bar */}
          <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-mono text-slate-500 uppercase flex-shrink-0">
              Demo Scenarios:
            </span>
            {demoPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (p.customerTarget && p.machineTarget) {
                    setSelectedCustomerId(p.customerTarget);
                    setSelectedMachineId(p.machineTarget);
                  }
                  handleSendMessage(p.query);
                }}
                className={`text-xs px-2.5 py-1 rounded-md whitespace-nowrap transition-colors border cursor-pointer font-medium ${
                  p.hazard
                    ? 'bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/40'
                    : p.highlight
                    ? 'bg-cyan-950/60 border-cyan-700 text-cyan-300 hover:bg-cyan-900/60'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-5 space-y-5 overflow-y-auto max-h-[520px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Bubble Meta */}
                <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 mb-1 px-1">
                  <span>{msg.role === 'user' ? 'Plant Technician' : 'SupportMind Agent'}</span>
                  <span>·</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message Body */}
                <div
                  className={`rounded-xl px-4 py-3.5 max-w-[92%] leading-relaxed text-sm ${
                    msg.role === 'user'
                      ? 'bg-cyan-600 text-white font-medium shadow-md shadow-cyan-950/30'
                      : 'bg-slate-950 border border-slate-800 text-slate-100 shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  {/* Memory Used Indicator Tag (Section 10 & 13) */}
                  {msg.memories_used && msg.memories_used.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-800/40 inline-flex">
                        <Brain className="h-3.5 w-3.5 text-cyan-400" />
                        <span>🧠 {msg.memories_used.length} relevant Hindsight memories recalled &amp; applied</span>
                      </div>

                      {/* Recalled Memory Highlights */}
                      <div className="mt-2 space-y-1 text-xs text-slate-300 font-sans">
                        {msg.memories_used.map((mem) => (
                          <div key={mem.id} className="flex items-start space-x-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span>
                              <strong className="text-white">{mem.title}</strong>: {mem.how_applied}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Actionable Checklist */}
                  {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                      <p className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
                        Diagnostic Action Checklist:
                      </p>
                      <div className="space-y-1">
                        {msg.suggested_actions.map((action, aIdx) => {
                          const actionKey = `${msg.id}-${aIdx}`;
                          const isDone = !!completedActions[actionKey];
                          return (
                            <button
                              key={aIdx}
                              onClick={() => handleActionToggle(actionKey)}
                              className={`flex items-start space-x-2 text-xs text-left p-1.5 rounded transition-colors w-full cursor-pointer ${
                                isDone ? 'bg-emerald-950/30 text-emerald-300 line-through' : 'hover:bg-slate-900 text-slate-200'
                              }`}
                            >
                              {isDone ? (
                                <CheckSquare className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                              ) : (
                                <Square className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                              )}
                              <span>{action}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center space-x-3 text-slate-400 text-xs font-mono p-3 bg-slate-950/60 rounded-lg border border-slate-800 max-w-sm">
                <div className="h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Recalling Hindsight memories &amp; querying local AI...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Safety Disclaimer Footer */}
          <div className="px-4 py-1.5 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-amber-400" />
              AI-assisted troubleshooting. For hazardous conditions, contact qualified personnel.
            </span>
            <span className="font-mono text-slate-500">SupportMind v1.0</span>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder={`Describe symptom or error code on ${selectedMachineId} (e.g., 'Overheating again', 'ERR-402', 'Vibration')...`}
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-cyan-950/40"
            >
              <span>Send</span>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Persistent Memory Panel Column (Right) */}
        <div className="lg:col-span-5 xl:col-span-4 h-full">
          <MemoryPanel
            memories={activeMemories}
            reflection={activeReflection}
            machineId={selectedMachineId}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};
