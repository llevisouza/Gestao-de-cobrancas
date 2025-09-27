// src/App.js - VERSÃO OTIMIZADA COM COMPONENTE WHATSAPP UNIFICADO
import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { useFirestore } from './hooks/useFirestore';
import { ROUTES } from './utils/constants';

// Componentes
import Header from './components/common/Header';
import LoadingSpinner from './components/common/LoadingSpinner';
import LoginPage from './components/auth/LoginPage';
import FirebaseSetup from './components/auth/FirebaseSetup';
import Dashboard from './components/dashboard/Dashboard';
import ClientsPage from './components/clients/ClientsPage';
import ReportsPage from './components/reports/ReportsPage';
import UnifiedWhatsAppManager from './components/whatsapp/UnifiedWhatsAppManager'; // ✅ Novo componente unificado
import WhatsAppAutomationConfig from './components/whatsapp/WhatsAppAutomationConfig';

// Estilos
import './styles/globals.css';
import './styles/components.css';

function App() {
  // Hooks
  const { user, loading: authLoading, signIn, signInDemo, logout } = useFirebaseAuth();
  // Centralizando o carregamento de dados do Firestore aqui
  const { clients, subscriptions, invoices, loading: firestoreLoading, createExampleData } = useFirestore();

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

  // Handler para criar dados de exemplo
  const handleCreateSampleData = async () => {
    try {
      await createExampleData();
      alert('Dados de exemplo criados com sucesso!');
    } catch (error) {
      alert(`Erro ao criar dados de exemplo: ${error.message}`);
    }
  };

  // Loading inicial (autenticação + dados do firestore)
  if (authLoading || (user && firestoreLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 animate-pulse">
            {authLoading ? 'Verificando autenticação...' : 'Carregando dados...'}
          </p>
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
      <Header
        user={user}
        onLogout={logout}
        currentView={currentView}
        onViewChange={setCurrentView}
        onCreateSampleData={handleCreateSampleData}
      />

      <main>
        {currentView === ROUTES.DASHBOARD && (
          <Dashboard
            onNavigate={setCurrentView}
            // Passando os dados como props
            clients={clients}
            subscriptions={subscriptions}
            invoices={invoices}
          />
        )}

        {currentView === ROUTES.CLIENTS && (
          // O componente ClientsPage já usa o hook internamente, então não precisa de props.
          // Para consistência, o ideal seria ele também receber props.
          <ClientsPage />
        )}

        {currentView === ROUTES.REPORTS && (
          <ReportsPage
            // Passando os dados como props
            clients={clients}
            invoices={invoices}
          />
        )}

        {/* ✅ NOVO: Componente WhatsApp unificado */}
        {currentView === ROUTES.WHATSAPP && (
          <UnifiedWhatsAppManager
            invoices={invoices}
            clients={clients}
            subscriptions={subscriptions}
            onNavigate={setCurrentView}
          />
        )}

        {/* Configuração avançada da automação (opcional) */}
        {currentView === ROUTES.WHATSAPP_AUTOMATION && (
          <WhatsAppAutomationConfig />
        )}
      </main>
    </div>
  );
}

export default App;