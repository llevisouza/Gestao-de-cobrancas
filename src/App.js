// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { clientService, subscriptionService, invoiceService, seedService } from './services/firestore';
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
import './styles/components.css'; // <-- ADICIONE ESTA LINH

function App() {
  const { user, loading: authLoading, signIn, logout } = useFirebaseAuth();
  const [currentView, setCurrentView] = useState(ROUTES.DASHBOARD);
  const [dataLoading, setDataLoading] = useState(false);

  // Estados dos dados
  const [clients, setClients] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Verificar se Firebase está configurado
  const isFirebaseConfigured = () => {
    const requiredVars = [
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_PROJECT_ID'
    ];
    return requiredVars.every(envVar => process.env[envVar]);
  };

  // Carregar dados do usuário
  const loadUserData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [clientsData, subscriptionsData, invoicesData] = await Promise.all([
        clientService.getAll(),
        subscriptionService.getAll(),
        invoiceService.getAll()
      ]);
      setClients(clientsData);
      setSubscriptions(subscriptionsData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  // Criar dados de exemplo
  const handleCreateSampleData = async () => {
    if (!user) return;
    try {
      // Verificar se já existem clientes
      if (clients.length > 0) {
        alert('Dados de exemplo já existem!');
        return;
      }

      setDataLoading(true);
      const result = await seedService.createSampleData();
      if (result.success) {
        await loadUserData();
        alert('Dados de exemplo criados com sucesso!');
      } else {
        alert('Erro ao criar dados de exemplo: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao criar dados de exemplo:', error);
      alert('Erro ao criar dados de exemplo');
    } finally {
      setDataLoading(false);
    }
  };

  // Carregar dados quando usuário faz login
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      // Limpar dados quando usuário faz logout
      setClients([]);
      setSubscriptions([]);
      setInvoices([]);
    }
  }, [user, loadUserData]);

  // Loading inicial da autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" message="Carregando..." />
      </div>
    );
  }

  // Firebase não configurado
  if (!isFirebaseConfigured()) {
    return <FirebaseSetup />;
  }

  // Usuário não autenticado
  if (!user) {
    return <LoginPage onLogin={signIn} />;
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

      <main className="container mx-auto px-4 py-8">
        {dataLoading ? (
          <div className="text-center py-12">
            <LoadingSpinner size="medium" message="Carregando dados..." />
          </div>
        ) : (
          <>
            {currentView === ROUTES.DASHBOARD && (
              <Dashboard
                invoices={invoices}
                setInvoices={setInvoices}
                clients={clients}
              />
            )}
            {currentView === ROUTES.CLIENTS && (
              <ClientsPage
                clients={clients}
                setClients={setClients}
                subscriptions={subscriptions}
                setSubscriptions={setSubscriptions}
              />
            )}
            {currentView === ROUTES.REPORTS && (
              <ReportsPage
                invoices={invoices}
                clients={clients}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;