import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ToastContainer, ToastMessage } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { NewIncidentPage } from './pages/NewIncidentPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { MemoryExplorerPage } from './pages/MemoryExplorerPage';
import { MemoryDemoPage } from './pages/MemoryDemoPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './api/client';
import { ISystemHealth } from './types';

export function AppContent() {
  const [health, setHealth] = useState<ISystemHealth | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const location = useLocation();

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchHealth = async () => {
    try {
      const res = await api.getHealth();
      setHealth(res);
    } catch (err) {
      // Backend not yet reached
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-[#0B0F17] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar health={health} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onRefresh={fetchHealth} onToast={addToast} />

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardPage onToast={addToast} />} />
            <Route path="/incidents" element={<IncidentsPage onToast={addToast} />} />
            <Route path="/incidents/new" element={<NewIncidentPage onToast={addToast} />} />
            <Route path="/incidents/:id" element={<IncidentDetailPage onToast={addToast} />} />
            <Route path="/memory" element={<MemoryExplorerPage onToast={addToast} />} />
            <Route path="/demo" element={<MemoryDemoPage onToast={addToast} />} />
            <Route path="/settings" element={<SettingsPage onToast={addToast} />} />
          </Routes>
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
