/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { SupportChat } from './pages/SupportChat';
import { MemoryImpact } from './pages/MemoryImpact';
import { Machines } from './pages/Machines';
import { Tickets } from './pages/Tickets';
import { Customers } from './pages/Customers';
import { HindsightExplorer } from './pages/HindsightExplorer';
import { Customer, Machine, Ticket, MemoryStats } from './types';
import { api } from './services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [memoryStats, setMemoryStats] = useState<MemoryStats | undefined>(undefined);
  const [selectedMachineForChat, setSelectedMachineForChat] = useState<string>('CNC-M102');
  const [selectedMachineForDetail, setSelectedMachineForDetail] = useState<string | null>(null);

  const [isLoadingDemo, setIsLoadingDemo] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const loadAllData = async () => {
    try {
      const [cData, mData, tData, sData] = await Promise.all([
        api.getCustomers(),
        api.getMachines(),
        api.getTickets(),
        api.getMemoryStats(),
      ]);
      setCustomers(cData);
      setMachines(mData);
      setTickets(tData);
      setMemoryStats(sData);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleLoadDemo = async () => {
    setIsLoadingDemo(true);
    try {
      await api.seedDemo();
      await loadAllData();
      showToast('Synthetic industrial demo data & Hindsight memory loaded successfully!');
    } catch (err) {
      console.error('Demo seed error:', err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleResetDemo = async () => {
    setIsLoadingDemo(true);
    try {
      await api.resetDemo();
      await loadAllData();
      showToast('Database & Hindsight store reset to clean baseline state.');
    } catch (err) {
      console.error('Demo reset error:', err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleStartChat = (machineId: string) => {
    setSelectedMachineForChat(machineId);
    setActiveTab('chat');
  };

  const handleNavigate = (tab: string, param?: string) => {
    if (tab === 'machines' && param) {
      setSelectedMachineForDetail(param);
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-cyan-500/80 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-mono animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLoadDemo={handleLoadDemo}
        onResetDemo={handleResetDemo}
        isLoadingDemo={isLoadingDemo}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <Dashboard
            customers={customers}
            machines={machines}
            tickets={tickets}
            memoryStats={memoryStats}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'chat' && (
          <SupportChat
            customers={customers}
            machines={machines}
            initialMachineId={selectedMachineForChat}
          />
        )}

        {activeTab === 'compare' && (
          <MemoryImpact
            customers={customers}
            machines={machines}
            onStartChatWithPrompt={(mId, prompt) => {
              setSelectedMachineForChat(mId);
              setActiveTab('chat');
            }}
          />
        )}

        {activeTab === 'machines' && (
          <Machines
            machines={machines}
            onStartChat={handleStartChat}
            selectedMachineId={selectedMachineForDetail}
            onClearSelectedMachine={() => setSelectedMachineForDetail(null)}
          />
        )}

        {activeTab === 'tickets' && (
          <Tickets
            tickets={tickets}
            customers={customers}
            machines={machines}
            onRefreshTickets={loadAllData}
            onStartChat={handleStartChat}
          />
        )}

        {activeTab === 'customers' && (
          <Customers
            customers={customers}
            machines={machines}
            onSelectMachine={(mId) => {
              setSelectedMachineForDetail(mId);
              setActiveTab('machines');
            }}
            onStartChat={handleStartChat}
          />
        )}

        {activeTab === 'memory' && (
          <HindsightExplorer />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 py-4 px-6 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2 font-mono">
          <span className="font-bold text-white">SupportMind AI</span>
          <span>·</span>
          <span>Hindsight Persistent Memory Layer</span>
          <span>·</span>
          <span className="text-cyan-400">Ollama • Local AI</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Industrial Safety Interlock · OSHA &amp; LOTO Compliant · Built for AI-Agent Hackathon
        </div>
      </footer>
    </div>
  );
}
