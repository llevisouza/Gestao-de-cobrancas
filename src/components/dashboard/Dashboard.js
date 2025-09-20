
// 1. DASHBOARD.JS - ATUALIZADO
// =================================================
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
    generateMonthlyInvoices
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
      const currentMonth = new Date().getMonth(); 
      const currentYear = new Date().getFullYear();
      const count = await generateMonthlyInvoices(currentMonth, currentYear);
      alert(`${count} faturas foram geradas com sucesso!`);
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
    <div className="min-h-screen bg-gray-50">
      <div className="dashboard-container">
        {/* Header Atualizado */}
        <div className="dashboard-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="dashboard-title">Dashboard</h1>
              <p className="dashboard-subtitle">
                Visão geral do sistema de cobranças
              </p>
            </div>
            
            {/* Botões com nova paleta */}
            <div className="dashboard-actions">
              <button 
                onClick={handleCreateExampleData}
                className="btn-success"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4z" clipRule="evenodd" />
                </svg>
                Dados Exemplo
              </button>
              <button 
                onClick={handleGenerateInvoices}
                className="btn-primary"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Gerar Faturas
              </button>
            </div>
          </div>
        </div>

        {/* Componentes com estilos atualizados */}
        <KPICards invoices={invoices} clients={clients} />
        <InvoiceTable invoices={invoices} clients={clients} />
      </div>
    </div>
  );
};

export default Dashboard;