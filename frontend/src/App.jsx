import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CitizenPortal } from './pages/CitizenPortal';
import { AdminDashboard } from './pages/AdminDashboard';
import { WorkerDashboard } from './pages/WorkerDashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('landing');
  const [prefillRole, setPrefillRole] = useState(null);

  // Auto-route logged in users to their designated interface if on landing
  useEffect(() => {
    if (user && currentView === 'landing') {
      if (user.role === 'admin') setCurrentView('admin');
      else if (user.role === 'worker') setCurrentView('worker');
      else setCurrentView('citizen');
    }
  }, [user]);

  const handleSelectRole = (role, action = 'login') => {
    setPrefillRole(role);
    setCurrentView(action);
  };

  const navigateTo = (view) => {
    setCurrentView(view);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span>Initializing VoxCivis Secure Environment...</span>
        </div>
      </div>
    );
  }

  // Role Protection
  let ActiveComponent;
  if (currentView === 'landing') {
    ActiveComponent = <Landing onSelectRole={handleSelectRole} />;
  } else if (currentView === 'login') {
    ActiveComponent = <Login onNavigate={navigateTo} prefillRole={prefillRole} />;
  } else if (currentView === 'register') {
    ActiveComponent = <Register onNavigate={navigateTo} />;
  } else if (currentView === 'citizen') {
    if (!user) ActiveComponent = <Login onNavigate={navigateTo} />;
    else ActiveComponent = <CitizenPortal />;
  } else if (currentView === 'admin') {
    if (!user || user.role !== 'admin') {
      ActiveComponent = <Login onNavigate={navigateTo} />;
    } else {
      ActiveComponent = <AdminDashboard />;
    }
  } else if (currentView === 'worker') {
    if (!user || user.role !== 'worker') {
      ActiveComponent = <Login onNavigate={navigateTo} />;
    } else {
      ActiveComponent = <WorkerDashboard />;
    }
  } else {
    ActiveComponent = <Landing onSelectRole={handleSelectRole} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar onNavigate={navigateTo} currentView={currentView} />
      <main className="flex-1">
        {ActiveComponent}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <AppContent />
      </WebSocketProvider>
    </AuthProvider>
  );
}
