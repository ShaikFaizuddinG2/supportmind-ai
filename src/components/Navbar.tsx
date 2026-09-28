import React from 'react';
import { 
  Cpu, 
  Brain, 
  Layers, 
  Wrench, 
  TicketCheck, 
  Building2, 
  Sparkles, 
  RotateCcw, 
  Database,
  ShieldAlert,
  Activity
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLoadDemo: () => void;
  onResetDemo: () => void;
  isLoadingDemo: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onLoadDemo,
  onResetDemo,
  isLoadingDemo
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'chat', label: 'Support Agent', icon: Cpu },
    { id: 'compare', label: 'Memory Impact', icon: Sparkles, highlight: true },
    { id: 'machines', label: 'Machines', icon: Wrench },
    { id: 'tickets', label: 'Tickets', icon: TicketCheck },
    { id: 'customers', label: 'Customers', icon: Building2 },
    { id: 'memory', label: 'Hindsight Memory', icon: Brain },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      {/* Top Banner with System Status and Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Subtitle */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Brain className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white font-sans">
                  SupportMind <span className="text-cyan-400">AI</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 font-mono">
                  Hindsight Inside
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans hidden sm:block">
                Memory-Powered Industrial Customer Support Agent
              </p>
            </div>
          </div>

          {/* Engine Status Indicators */}
          <div className="hidden lg:flex items-center space-x-4 text-xs font-mono text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-400">Hindsight:</span>
              <span className="text-emerald-400 font-medium">Persistent Active</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center space-x-1.5">
              <Activity className="h-3 w-3 text-cyan-400" />
              <span className="text-slate-400">Model:</span>
              <span className="text-cyan-300 font-medium">Ollama • Local AI</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center space-x-1.5">
              <ShieldAlert className="h-3 w-3 text-amber-400" />
              <span className="text-slate-400">Safety:</span>
              <span className="text-amber-300 font-medium">LOTO Active</span>
            </div>
          </div>

          {/* Demo Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onLoadDemo}
              disabled={isLoadingDemo}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              title="Preloads realistic customers, CNC-M102 overheating history, tickets & Hindsight memory"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Load Demo Data</span>
            </button>

            <button
              onClick={onResetDemo}
              disabled={isLoadingDemo}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors border border-slate-700 cursor-pointer disabled:opacity-50"
              title="Reset memory and tickets to baseline"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-slate-800/80 py-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                } ${item.highlight && !isActive ? 'text-cyan-400' : ''}`}
              >
                <Icon className={`h-4 w-4 ${isActive ? (item.highlight ? 'text-cyan-400' : 'text-cyan-400') : (item.highlight ? 'text-cyan-400' : 'text-slate-400')}`} />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
