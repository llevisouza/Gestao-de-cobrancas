// src/components/dashboard/Dashboard.js
import React from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import KPICards from './KPICards';
import InvoiceTable from './InvoiceTable';
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard = () => {
  const { 
    clients, 
    subscriptions, 
    invoices, 
    loading, 
    createExampleData,
    generateInvoicesForMonth 
  } = useFirestore();

  const handleCreateExampleData = async () => {
    try {
      await createExampleData();
      alert('Dados de exemplo criados com sucesso!');
    } catch (error) {
      console.error('Erro ao criar dados de exemplo:', error);
      alert('Erro ao criar dados de exemplo: ' + error.message);
    }
  };

  const handleGenerateInvoices = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      await generateInvoicesForMonth(currentMonth, currentYear);
      alert('Faturas geradas com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar faturas:', error);
      alert('Erro ao gerar faturas: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" message="Carregando dashboard..." />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Visão geral do sistema de cobranças
          </p>
          
          <div className="dashboard-actions">
            <button 
              onClick={handleCreateExampleData}
              className="btn-secondary"
            >
              📊 Dados Exemplo
            </button>
            <button 
              onClick={handleGenerateInvoices}
              className="btn-primary"
            >
              🧾 Gerar Faturas
            </button>
          </div>
        </div>

        <KPICards invoices={invoices} clients={clients} />
        <InvoiceTable invoices={invoices} clients={clients} />
      </div>
    </div>
  );
};

export default Dashboard;