// src/components/dashboard/Dashboard.js - INTEGRADO COM WHATSAPP
import React, { useState, useEffect } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import KPICards from './KPICards';
import InvoiceTable from './InvoiceTable';
import WhatsAppQuickActions from './WhatsAppQuickActions'; // NOVO IMPORT
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard = ({ onNavigate }) => {
  const { 
    clients, 
    subscriptions, 
    invoices, 
    loading, 
    createExampleData,
    generateInvoices 
  } = useFirestore();

  // Estados para animações e tempo real
  const [currentTime, setCurrentTime] = useState(new Date());
  const [realtimeStats, setRealtimeStats] = useState({
    todayInvoices: 0,
    pendingAmount: 0,
    overdueCount: 0
  });

  // Atualizar relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calcular estatísticas em tempo real
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const todayInvoices = invoices.filter(inv => 
      inv.generationDate?.includes(today)
    ).length;

    const pendingAmount = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

    const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;

    setRealtimeStats({ todayInvoices, pendingAmount, overdueCount });
  }, [invoices]);

  // Obter estatísticas de recorrência
  const getRecurrenceStats = () => {
    const stats = {
      daily: { count: 0, revenue: 0 },
      weekly: { count: 0, revenue: 0 },
      monthly: { count: 0, revenue: 0 },
      custom: { count: 0, revenue: 0 }
    };

    subscriptions.forEach(sub => {
      if (sub.status === 'active') {
        const type = sub.recurrenceType || 'monthly';
        stats[type].count++;
        stats[type].revenue += parseFloat(sub.amount || 0);
      }
    });

    return stats;
  };

  const handleCreateExampleData = async () => {
    try {
      await createExampleData();
      showNotification('success', '🎉 Dados criados!', 'Exemplos com diferentes recorrências foram adicionados');
    } catch (error) {
      console.error('Erro ao criar dados de exemplo:', error);
      showNotification('error', '❌ Erro', error.message);
    }
  };

  const handleGenerateInvoices = async () => {
    try {
      const count = await generateInvoices();
      if (count > 0) {
        showNotification('success', '🚀 Faturas geradas!', `${count} novas faturas baseadas nas recorrências`);
      } else {
        showNotification('info', 'ℹ️ Nenhuma fatura', 'Todas as faturas estão em dia ou não é o momento da próxima cobrança');
      }
    } catch (error) {
      console.error('Erro ao gerar faturas:', error);
      showNotification('error', '❌ Erro', error.message);
    }
  };

  // Sistema de notificações visuais (simples)
  const showNotification = (type, title, message) => {
    // Por enquanto usando alert, depois podemos implementar toast
    alert(`${title}\n${message}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" message="Carregando dashboard..." />
      </div>
    );
  }

  const recurrenceStats = getRecurrenceStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="dashboard-container">
        {/* Header melhorado com relógio */}
        <div className="dashboard-header">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex flex-col">
                  <h1 className="dashboard-title">Dashboard Executivo</h1>
                  <p className="dashboard-subtitle">
                    Sistema de Cobranças com Recorrências Inteligentes
                  </p>
                </div>
                
                {/* Relógio em tempo real */}
                <div className="hidden lg:block bg-white rounded-lg p-4 shadow-sm border">
                  <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-primary-600">
                      {currentTime.toLocaleTimeString('pt-BR')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {currentTime.toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="dashboard-actions">
              <button 
                onClick={handleCreateExampleData}
                className="btn-success"
                title="Criar dados de exemplo com diferentes tipos de recorrência"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4z" clipRule="evenodd" />
                </svg>
                Dados Exemplo
              </button>
              <button 
                onClick={handleGenerateInvoices}
                className="btn-primary"
                title="Gerar faturas baseadas nas configurações de recorrência"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Gerar Faturas
              </button>
            </div>
          </div>
        </div>

        {/* Cards de estatísticas em tempo real */}
        {(clients.length > 0 || subscriptions.length > 0) && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Estatísticas em Tempo Real
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {realtimeStats.todayInvoices}
                    </div>
                    <div className="text-sm text-gray-600">Faturas Hoje</div>
                  </div>
                  <div className="text-3xl">📄</div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      R$ {realtimeStats.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-600">Pendentes</div>
                  </div>
                  <div className="text-3xl">⏳</div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {realtimeStats.overdueCount}
                    </div>
                    <div className="text-sm text-gray-600">Vencidas</div>
                  </div>
                  <div className="text-3xl">⚠️</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cards de recorrência melhorados */}
        {subscriptions.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🔄</span>
                Assinaturas por Tipo de Recorrência
              </h3>
              <div className="text-sm text-gray-600">
                Total: {subscriptions.filter(sub => sub.status === 'active').length} ativas
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-blue-600">
                      {recurrenceStats.daily.count}
                    </div>
                    <div className="text-sm text-gray-600">Diárias</div>
                    <div className="text-xs text-blue-500">
                      R$ {recurrenceStats.daily.revenue.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-2xl">🔄</div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-green-600">
                      {recurrenceStats.weekly.count}
                    </div>
                    <div className="text-sm text-gray-600">Semanais</div>
                    <div className="text-xs text-green-500">
                      R$ {recurrenceStats.weekly.revenue.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-2xl">📅</div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-orange-600">
                      {recurrenceStats.monthly.count}
                    </div>
                    <div className="text-sm text-gray-600">Mensais</div>
                    <div className="text-xs text-orange-500">
                      R$ {recurrenceStats.monthly.revenue.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-2xl">📆</div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-purple-600">
                      {recurrenceStats.custom.count}
                    </div>
                    <div className="text-sm text-gray-600">Personalizadas</div>
                    <div className="text-xs text-purple-500">
                      R$ {recurrenceStats.custom.revenue.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-2xl">⏱️</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NOVO: Widget WhatsApp - Aparece se tem dados */}
        {(clients.length > 0 && invoices.length > 0) && (
          <div className="mb-8">
            <WhatsAppQuickActions 
              invoices={invoices}
              clients={clients}
              subscriptions={subscriptions}
              onNavigate={onNavigate} 
            />
          </div>
        )}

        {/* KPI Cards existentes (mantidos) */}
        <KPICards invoices={invoices} clients={clients} />
        
        {/* Tabela de faturas existente (mantida) */}
        <InvoiceTable invoices={invoices} clients={clients} />

        {/* Informações sobre o sistema funcionando */}
        {subscriptions.length > 0 && (
          <div className="mt-8">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🤖 Sistema de Automação</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">⚙️</span>
                      Funcionalidades Ativas
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Geração automática de faturas recorrentes
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Cálculo inteligente de próximas cobranças
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Integração com WhatsApp para notificações
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Controle de status e vencimentos
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">📈</span>
                      Próximas Ações
                    </h4>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        • Clique em "Gerar Faturas" para processar recorrências
                      </div>
                      <div className="text-sm text-gray-600">
                        • Use o WhatsApp Widget para enviar cobranças
                      </div>
                      <div className="text-sm text-gray-600">
                        • Acompanhe o status das faturas na tabela abaixo
                      </div>
                      <div className="text-sm text-gray-600">
                        • Monitore KPIs em tempo real no dashboard
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Status do sistema */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Sistema operacional
                    </div>
                    <div className="text-gray-500">
                      Última atualização: {currentTime.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado vazio - quando não há dados */}
        {clients.length === 0 && subscriptions.length === 0 && invoices.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-8">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Bem-vindo ao Sistema de Cobranças
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Para começar, clique no botão "Dados Exemplo" para criar 
                clientes, assinaturas e faturas de exemplo com diferentes 
                tipos de recorrência.
              </p>
            </div>
            
            <button 
              onClick={handleCreateExampleData}
              className="btn-primary btn-large"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Começar com Dados de Exemplo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;