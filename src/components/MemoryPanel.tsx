import React, { useState } from 'react';
import { Brain, CheckCircle2, ChevronDown, ChevronRight, Sparkles, Clock, AlertTriangle, Cpu } from 'lucide-react';
import { HindsightMemory, ReflectionInsight } from '../types';

interface MemoryPanelProps {
  memories: HindsightMemory[];
  reflection?: ReflectionInsight | string | null;
  machineId?: string;
  source?: string;
  isLoading?: boolean;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  memories,
  reflection,
  machineId,
  source = 'hindsight_persistent_store',
  isLoading = false
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5 font-sans">
              Hindsight Persistent Memory
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-1.5 py-0.2 rounded border border-cyan-800/40">
                {memories.length} recalled
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Target Asset: <span className="font-mono text-slate-300">{machineId || 'All Machines'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          <span>{source === 'hindsight_api' ? 'Hindsight API' : 'LTM Active'}</span>
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1 max-h-[calc(100vh-280px)]">
        {/* Reflection / Higher-Level Pattern Synthesis (Section 20) */}
        {reflection && (
          <div className="p-3.5 rounded-lg bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-800/50 text-slate-200">
            <div className="flex items-start space-x-2.5">
              <Sparkles className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider font-mono">
                  Hindsight Higher-Level Reflection
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {typeof reflection === 'string' ? reflection : reflection.summary}
                </p>
                {typeof reflection !== 'string' && reflection.recommendation && (
                  <p className="text-[11px] text-cyan-200/90 font-medium pt-1">
                    Recommendation: {reflection.recommendation}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-6 text-center text-slate-400 space-y-2">
            <div className="h-5 w-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-mono">Recalling Hindsight memories...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && memories.length === 0 && (
          <div className="p-6 text-center text-slate-500 rounded-lg border border-dashed border-slate-800 space-y-2">
            <Cpu className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-xs font-medium text-slate-400">No historical memories recalled for this query.</p>
            <p className="text-[11px] text-slate-500">
              The agent will treat this as an initial unrecorded incident and retain newly observed facts.
            </p>
          </div>
        )}

        {/* Recalled Memory Items */}
        {!isLoading && memories.length > 0 && (
          <div className="space-y-2.5">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Recalled Memory Records:</span>
              <span>Relevance / Confidence</span>
            </div>

            {memories.map((mem) => {
              const isExpanded = expandedId === mem.memory_id;
              const relevancePercent = mem.relevance ? Math.round(mem.relevance * 100) : Math.round((mem.confidence || 0.9) * 100);

              return (
                <div
                  key={mem.memory_id || mem.title}
                  className="rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors overflow-hidden"
                >
                  <div
                    onClick={() => toggleExpand(mem.memory_id)}
                    className="p-3 cursor-pointer flex items-start justify-between space-x-2"
                  >
                    <div className="flex items-start space-x-2 flex-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                          <span className="font-mono text-cyan-400 uppercase">{mem.category}</span>
                          <span>·</span>
                          <span className="capitalize">{mem.memory_type}</span>
                          {mem.event_date && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {mem.event_date}
                              </span>
                            </>
                          )}
                        </div>
                        <h4 className="text-xs font-medium text-slate-200 leading-snug">
                          {mem.title}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {mem.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/40">
                        {relevancePercent}%
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Technical Details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-900 bg-slate-900/40 space-y-2 text-xs font-mono">
                      {mem.details && Object.keys(mem.details).length > 0 && (
                        <div className="space-y-1 bg-slate-950 p-2.5 rounded border border-slate-800/80 text-[11px]">
                          {mem.details.successful_solution && (
                            <div className="text-emerald-300">
                              <span className="text-slate-400">Solution that WORKED:</span> {mem.details.successful_solution}
                            </div>
                          )}
                          {mem.details.failed_solutions && mem.details.failed_solutions.length > 0 && (
                            <div className="text-rose-300">
                              <span className="text-slate-400">Attempted that FAILED:</span> {JSON.stringify(mem.details.failed_solutions)}
                            </div>
                          )}
                          {mem.details.preferred_format && (
                            <div className="text-cyan-300">
                              <span className="text-slate-400">Customer Preference:</span> {mem.details.preferred_format}
                            </div>
                          )}
                          {mem.details.safety_priority && (
                            <div className="text-amber-300">
                              <span className="text-slate-400">Safety Directive:</span> {mem.details.safety_priority}
                            </div>
                          )}
                        </div>
                      )}

                      {mem.tags && mem.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {mem.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-mono"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="font-mono">SupportMind Memory Core</span>
        <span className="text-slate-500">Persistent across sessions</span>
      </div>
    </div>
  );
};
