import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  Layers, 
  Search, 
  Plus, 
  Clock, 
  Tag, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown,
  Database,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { HindsightMemory, MemoryStats } from '../types';
import { api } from '../services/api';

export const HindsightExplorer: React.FC = () => {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [memories, setMemories] = useState<HindsightMemory[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New Memory Modal State
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newCustId, setNewCustId] = useState<string>('CUST-001');
  const [newMachId, setNewMachId] = useState<string>('CNC-M102');
  const [newType, setNewType] = useState<'episodic' | 'semantic' | 'procedural'>('episodic');
  const [newCategory, setNewCategory] = useState<'failure' | 'resolution' | 'preference' | 'environment'>('failure');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSummary, setNewSummary] = useState<string>('');
  const [newTags, setNewTags] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const statsData = await api.getMemoryStats();
      setStats(statsData);
      setMemories(statsData.recent || []);
    } catch (err) {
      console.error('Error loading memory stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;

    try {
      await api.retainMemory({
        customer_id: newCustId,
        machine_id: newMachId,
        memory_type: newType,
        category: newCategory,
        title: newTitle,
        summary: newSummary,
        confidence: 0.96,
        event_date: new Date().toISOString().split('T')[0],
        tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
      });
      setIsAdding(false);
      setNewTitle('');
      setNewSummary('');
      setNewTags('');
      loadData();
    } catch (err) {
      console.error('Error retaining memory:', err);
    }
  };

  const filtered = memories.filter(m => {
    const matchesSearch = 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.machine_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'ALL' || m.memory_type === filterType;
    const matchesCat = filterCategory === 'ALL' || m.category === filterCategory;

    return matchesSearch && matchesType && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-800/60 mb-2">
            <Brain className="h-3.5 w-3.5" />
            <span>Persistent Memory Layer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            Hindsight Memory Explorer &amp; Learning Core
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Inspect the underlying episodic, semantic, and procedural memories retained across industrial sessions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Retain New Memory</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-slate-700 cursor-pointer"
            title="Refresh memory store"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Learning Curve Demonstration (Section 19) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white font-sans">
            Agent Learning Curve: Knowledge Accumulation Over Sessions
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          The agent becomes progressively more useful because relevant observations, components, and failed solutions are retained and recalled.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="font-bold">Interaction 1</span>
              <span>0 Memories</span>
            </div>
            <h4 className="text-xs font-bold text-slate-200">Generic Response</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              "Please check the manual, verify power, and tell me if this happened before."
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-cyan-900/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
              <span className="font-bold">Interaction 5</span>
              <span>2 Memories</span>
            </div>
            <h4 className="text-xs font-bold text-cyan-200">Personalized Component</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              "Recalling Aug 12: cooling fan was replaced. Check if the 24V brushless fan is spinning."
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
              <span className="font-bold">Interaction 10</span>
              <span>5 Memories</span>
            </div>
            <h4 className="text-xs font-bold text-emerald-200">Environment Aware</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              "Aluminum swarf in 3-shift duty cycles clogs intake mesh. Clean filter before part replacement."
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-purple-900/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-purple-400">
              <span className="font-bold">Interaction 20</span>
              <span>Deep Memory</span>
            </div>
            <h4 className="text-xs font-bold text-purple-200">Reflective Mastery</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              "Recurring thermal pattern detected. Preemptively checks fan RPM and enforces Marcus Vance checklist."
            </p>
          </div>
        </div>
      </div>

      {/* Memory Classification KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs font-mono text-slate-400">Episodic Memories</div>
          <div className="text-2xl font-bold text-cyan-400 font-sans">
            {memories.filter(m => m.memory_type === 'episodic').length}
          </div>
          <div className="text-[10px] text-slate-500">Incident &amp; resolution events</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs font-mono text-slate-400">Semantic Memories</div>
          <div className="text-2xl font-bold text-emerald-400 font-sans">
            {memories.filter(m => m.memory_type === 'semantic').length}
          </div>
          <div className="text-[10px] text-slate-500">Operating environment facts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs font-mono text-slate-400">Procedural Memories</div>
          <div className="text-2xl font-bold text-purple-400 font-sans">
            {memories.filter(m => m.memory_type === 'procedural').length}
          </div>
          <div className="text-[10px] text-slate-500">Checklists &amp; shop preferences</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="text-xs font-mono text-slate-400">Total Memories Stored</div>
          <div className="text-2xl font-bold text-white font-sans">
            {memories.length}
          </div>
          <div className="text-[10px] text-cyan-400">Persistent SQLite Store</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memory graph (e.g. 'fan', 'overheating', 'vibration')..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Memory Types</option>
            <option value="episodic">Episodic (Incidents)</option>
            <option value="semantic">Semantic (Facts)</option>
            <option value="procedural">Procedural (Preferences)</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="failure">Failure</option>
            <option value="resolution">Resolution</option>
            <option value="preference">Preference</option>
            <option value="environment">Environment</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Memories List */}
      <div className="space-y-3">
        {filtered.map((mem) => {
          const isExpanded = expandedId === mem.memory_id;
          return (
            <div
              key={mem.memory_id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : mem.memory_id)}
                className="p-4 cursor-pointer flex items-start justify-between gap-4"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/40 text-cyan-400 mt-0.5 flex-shrink-0">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                      <span className="text-cyan-400 font-bold">{mem.memory_id}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-300 font-bold uppercase">{mem.machine_id}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-emerald-400 uppercase">{mem.category}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-purple-400 capitalize">{mem.memory_type}</span>
                      {mem.event_date && (
                        <>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {mem.event_date}
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white font-sans">{mem.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{mem.summary}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    {Math.round((mem.confidence || 0.95) * 100)}% Confidence
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Technical View */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-800/60 bg-slate-950 space-y-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 uppercase text-[10px] block mb-1">Stored Technical Payload:</span>
                    <pre className="p-3 bg-slate-900 rounded-lg text-slate-300 overflow-x-auto text-[11px]">
                      {JSON.stringify(mem.details, null, 2)}
                    </pre>
                  </div>

                  {mem.tags && mem.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Tag className="h-3.5 w-3.5 text-slate-500" />
                      {mem.tags.map((t) => (
                        <span key={t} className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          #{t}
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

      {/* Retain New Memory Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <Brain className="h-5 w-5 text-cyan-400" />
                <span>Retain Knowledge into Hindsight</span>
              </h3>
              <button
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMemory} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono uppercase">Memory Type</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200"
                  >
                    <option value="episodic">Episodic (Incident)</option>
                    <option value="semantic">Semantic (Fact)</option>
                    <option value="procedural">Procedural (Preference)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-mono uppercase">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200"
                  >
                    <option value="failure">Failure</option>
                    <option value="resolution">Resolution</option>
                    <option value="preference">Preference</option>
                    <option value="environment">Environment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono uppercase">Customer ID</label>
                  <input
                    type="text"
                    value={newCustId}
                    onChange={(e) => setNewCustId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-mono uppercase">Machine ID</label>
                  <input
                    type="text"
                    value={newMachId}
                    onChange={(e) => setNewMachId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono uppercase">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Spindle Fan Part Replacement (Part #CF-882)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono uppercase">Summary &amp; Outcome</label>
                <textarea
                  rows={3}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Detail the failure symptom, attempted fix, and successful outcome..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono uppercase">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="overheating, cooling_fan, err-402"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Retain in Hindsight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
