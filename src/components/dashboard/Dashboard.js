// src/components/dashboard/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import KPICards from './KPICards';
import InvoiceTable from './InvoiceTable';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';

const Dashboard = () => {
  const { 
    clients, 
    subscriptions, 
    invoices, 
    loading, 
    createExampleData,
    generateInvoicesForMonth 
  } = useFirestore();

  const [kpis, setKpis] = useState({
    totalClients: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    pendingInvoices: 0
  });

  // Calcular KPIs
  useEffect(() => {
    const activeSubsCount = subscriptions.filter(sub => sub.status === 'active').length;
    
    // CORREÇÃO: Alterado de 'sub.value' para 'sub.amount'
    const monthlyRev = subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
    
    const pendingInvs = invoices.filter(inv => inv.status === 'pending').length;
    
    setKpis({
      totalClients: clients.length,
      activeSubscriptions: activeSubsCount,
      monthlyRevenue: monthlyRev,
      pendingInvoices: pendingInvs
    });
  }, [clients, subscriptions, invoices]);

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
    return <LoadingSpinner />;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Visão geral do sistema de cobranças
          </p>
          
          <div className="dashboard-actions">
            <button 
              onClick={handleCreateExampleData}
              className="btn btn-secondary"
            >
              📊 Dados Exemplo
            </button>
            <button 
              onClick={handleGenerateInvoices}
              className="btn btn-primary"
            >
              🧾 Gerar Faturas
            </button>
          </div>
        </div>

        <KPICards kpis={kpis} />
        
        <InvoiceTable invoices={invoices} clients={clients} />
      </div>
    </div>
  );
};

export default Dashboard;