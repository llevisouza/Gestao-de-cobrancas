// src/App.js - VERSÃO CORRIGIDA PARA USAR CLIENTSPAGE DIRETO
import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { ROUTES } from './utils/constants';

// Componentes
import Header from './components/common/Header';
import LoadingSpinner from './components/common/LoadingSpinner';
import LoginPage from './components/auth/LoginPage';
import FirebaseSetup from './components/auth/FirebaseSetup';
import Dashboard from './components/dashboard/Dashboard';
import ClientsPage from './components/clients/ClientsPage'; // Importação corrigida
import ReportsPage from './components/reports/ReportsPage';

// Estilos
import './styles/globals.css';
import './styles/components.css';

function App() {
  // Hooks
  const { user, loading: authLoading, signIn, signInDemo, logout } = useFirebaseAuth();
  
  // Estados locais
  const [currentView, setCurrentView] = useState(ROUTES.DASHBOARD);
  const [appError, setAppError] = useState(null);

  // Verificar se Firebase está configurado
  const isFirebaseConfigured = () => {
    const requiredVars = [
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_PROJECT_ID'
    ];
    return requiredVars.every(envVar => process.env[envVar]);
  };

  // Handler para login melhorado
  const handleLogin = async (email, password) => {
    try {
      setAppError(null);
      
      // Se for email demo, usar função especial
      if (email === 'demo@conexaodelivery.com') {
        return await signInDemo();
      }
      
      return await signIn(email, password);
    } catch (error) {
      console.error('❌ Erro no login:', error);
      setAppError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Handler para criar dados de exemplo (será chamado do Dashboard)
  const handleCreateSampleData = () => {
    // Navegar para clientes onde a função está disponível
    setCurrentView(ROUTES.CLIENTS);
  };

  // Loading inicial da autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 animate-pulse">Verificando autenticação...</p>
          <div className="mt-2 text-sm text-gray-500">
            🔐 Conectando ao Firebase...
          </div>
        </div>
      </div>
    );
  }

  // Firebase não configurado
  if (!isFirebaseConfigured()) {
    return <FirebaseSetup />;
  }

  // Usuário não autenticado
  if (!user) {
    return (
      <div>
        <LoginPage onLogin={handleLogin} />
        {appError && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-md z-50">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Erro de Login</p>
                <p className="text-sm">{appError}</p>
              </div>
              <button 
                onClick={() => setAppError(null)}
                className="ml-3 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Aplicação principal
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notificação de erro geral */}
      {appError && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">Erro do Sistema</p>
              <p className="text-sm">{appError}</p>
            </div>
            <button 
              onClick={() => setAppError(null)}
              className="ml-3 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header principal */}
      <Header
        user={user}
        onLogout={logout}
        currentView={currentView}
        onViewChange={setCurrentView}
        onCreateSampleData={handleCreateSampleData}
        onClearAllData={() => {
          // Navegar para clientes onde a função está disponível
          setCurrentView(ROUTES.CLIENTS);
        }}
      />

      {/* Conteúdo principal */}
      <main>
        {/* Dashboard */}
        {currentView === ROUTES.DASHBOARD && (
          <Dashboard
            onNavigate={setCurrentView}
            onCreateSampleData={handleCreateSampleData}
          />
        )}
        
        {/* Gerenciar Clientes - Usando o componente corrigido */}
        {currentView === ROUTES.CLIENTS && (
          <ClientsPage />
        )}
        
        {/* Relatórios */}
        {currentView === ROUTES.REPORTS && (
          <ReportsPage />
        )}
        
        {/* Placeholder para WhatsApp */}
        {currentView === ROUTES.WHATSAPP && (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">📱</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">WhatsApp Manager</h2>
              <p className="text-gray-600 mb-6">
                Funcionalidade em desenvolvimento. Em breve você poderá gerenciar suas 
                cobranças via WhatsApp diretamente pelo sistema.
              </p>
              <button 
                onClick={() => setCurrentView(ROUTES.DASHBOARD)}
                className="btn-primary px-6 py-3 rounded-lg"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;