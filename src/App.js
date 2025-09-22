// src/App.js - VERSÃO LIMPA E CORRIGIDA
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

// Estilos
import './styles/globals.css';
import './styles/components.css';

function App() {
  // Hooks
  const { user, loading: authLoading, signIn, signInDemo, logout } = useFirebaseAuth();
  const { 
    clients, 
    subscriptions, 
    invoices, 
    loading: dataLoading, 
    error: dataError,
    createExampleData,
    clearAllData 
  } = useFirestore();

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

  // Mostrar erros do Firestore
  useEffect(() => {
    if (dataError) {
      console.error('🔥 Erro do Firestore:', dataError);
      setAppError(dataError);
    } else {
      setAppError(null);
    }
  }, [dataError]);

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

  // Handler para criar dados de exemplo
  const handleCreateSampleData = async () => {
    if (!user) {
      setAppError('Você precisa estar logado para criar dados de exemplo');
      return;
    }

    try {
      setAppError(null);
      console.log('🔄 Iniciando criação de dados de exemplo...');
      
      const result = await createExampleData();
      
      if (result && result.success) {
        alert('🎉 Dados de exemplo criados com sucesso!\n\n' +
              '✅ 5 clientes foram criados\n' +
              '✅ Assinaturas com diferentes recorrências\n' +
              '✅ Faturas de exemplo geradas\n\n' +
              'Explore todas as funcionalidades do sistema!');
      }
      
    } catch (error) {
      console.error('❌ Erro ao criar dados:', error);
      setAppError(error.message);
      
      if (error.message.includes('Já existem')) {
        const confirmClear = window.confirm(
          'Já existem dados no sistema.\n\n' +
          'Deseja limpar todos os dados existentes e criar novos dados de exemplo?\n\n' +
          '⚠️ ATENÇÃO: Esta ação não pode ser desfeita!'
        );
        
        if (confirmClear) {
          await handleClearAllData();
          // Tentar criar novamente após limpar
          setTimeout(() => handleCreateSampleData(), 3000);
        }
      } else {
        alert(`❌ Erro ao criar dados de exemplo:\n\n${error.message}`);
      }
    }
  };

  // Handler para limpar todos os dados
  const handleClearAllData = async () => {
    if (!user) {
      setAppError('Você precisa estar logado');
      return;
    }

    const confirmClear = window.confirm(
      '⚠️ ATENÇÃO: AÇÃO PERIGOSA!\n\n' +
      'Você está prestes a DELETAR TODOS OS DADOS:\n' +
      '• Todos os clientes\n' +
      '• Todas as assinaturas\n' +
      '• Todas as faturas\n\n' +
      'Esta ação NÃO PODE ser desfeita!\n\n' +
      'Tem CERTEZA que deseja continuar?'
    );

    if (!confirmClear) return;

    // Confirmar novamente
    const doubleConfirm = window.confirm(
      '🚨 ÚLTIMA CONFIRMAÇÃO!\n\n' +
      'Você confirmou que quer DELETAR TUDO.\n\n' +
      'Digite "CONFIRMAR" na próxima tela para prosseguir.'
    );

    if (!doubleConfirm) return;

    const finalConfirm = prompt(
      'Digite "CONFIRMAR" (em maiúsculas) para deletar todos os dados:'
    );

    if (finalConfirm !== 'CONFIRMAR') {
      alert('Operação cancelada - texto não confere');
      return;
    }

    try {
      setAppError(null);
      console.log('🗑️ Limpando todos os dados...');
      
      const result = await clearAllData();
      
      if (result && result.success) {
        alert('✅ Todos os dados foram removidos com sucesso!\n\n' +
              'O sistema agora está limpo e pronto para novos dados.');
      }
      
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
      setAppError(error.message);
      alert(`❌ Erro ao limpar dados:\n\n${error.message}`);
    }
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
        onClearAllData={handleClearAllData}
        dataLoading={dataLoading}
      />

      {/* Conteúdo principal */}
      <main>
        {dataLoading ? (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="large" />
              <p className="mt-4 text-gray-600 animate-pulse">Carregando dados...</p>
              <div className="mt-2 text-sm text-gray-500">
                📊 Clientes: {clients.length} | 🔄 Assinaturas: {subscriptions.length} | 📄 Faturas: {invoices.length}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Dashboard */}
            {currentView === ROUTES.DASHBOARD && (
              <Dashboard
                invoices={invoices}
                clients={clients}
                subscriptions={subscriptions}
                onNavigate={setCurrentView}
                onCreateSampleData={handleCreateSampleData}
              />
            )}
            
            {/* Gerenciar Clientes */}
            {currentView === ROUTES.CLIENTS && (
              <ClientsPage
                clients={clients}
                subscriptions={subscriptions}
              />
            )}
            
            {/* Relatórios */}
            {currentView === ROUTES.REPORTS && (
              <ReportsPage
                invoices={invoices}
                clients={clients}
              />
            )}
            
            {/* Placeholder para WhatsApp - será implementado */}
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
          </>
        )}
      </main>

      {/* Debug Info (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg text-xs max-w-xs opacity-90">
          <div className="font-bold mb-2">🐛 Debug Info</div>
          <div>👤 Usuário: {user?.email}</div>
          <div>👥 Clientes: {clients.length}</div>
          <div>🔄 Assinaturas: {subscriptions.length}</div>
          <div>📄 Faturas: {invoices.length}</div>
          <div>⏳ Loading: {dataLoading ? 'Sim' : 'Não'}</div>
          <div>❌ Erro: {appError ? 'Sim' : 'Não'}</div>
          <div className="text-xs text-gray-300 mt-1">v2.0.0</div>
        </div>
      )}
    </div>
  );
}

export default App;