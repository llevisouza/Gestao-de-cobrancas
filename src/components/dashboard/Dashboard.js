// src/components/dashboard/Dashboard.js - VERSÃO MELHORADA DO SEU PROJETO
import React, { useState, useEffect } from 'react';
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
    generateInvoices 
  } = useFirestore();

  // NOVO: Estado para animações e tempo real
  const [currentTime, setCurrentTime] = useState(new Date());
  const [realtimeStats, setRealtimeStats] = useState({
    todayInvoices: 0,
    pendingAmount: 0,
    overdueCount: 0
  });

  // NOVO: Atualizar relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // NOVO: Calcular estatísticas em tempo real
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

  // NOVO: Obter estatísticas de recorrência
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
      // NOVO: Notificação visual melhorada
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

  // NOVO: Sistema de notificações visuais (simples)
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
        {/* NOVO: Header melhorado com relógio */}
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
                
                {/* NOVO: Relógio em tempo real */}
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

        {/* NOVO: Cards de estatísticas em tempo real */}
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

        {/* NOVO: Cards de recorrência melhorados */}
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

        {/* KPI Cards existentes (mantidos) */}
        <KPICards invoices={invoices} clients={clients} />
        
        {/* Tabela de faturas existente (mantida) */}
        <InvoiceTable invoices={invoices} clients={clients} />

        {/* NOVO: Informações sobre o sistema funcionando */}
        {subscriptions.length > 0 && (
          <div className="mt-8">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🤖 Sistema de Automação</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Como Funciona:</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2"></span>
                        <span>Sistema verifica automaticamente quando gerar cada tipo de fatura</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2"></span>
                        <span>Previne duplicação - só gera quando necessário</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-3 mt-2"></span>
                        <span>Respeita datas de início e configurações de cada assinatura</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2"></span>
                        <span>Calcula próximas datas automaticamente</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Status Atual:</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium text-green-800">Sistema Ativo</span>
                        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-blue-800">Última atualização:</span>
                        <span className="text-sm font-medium text-blue-600">
                          {currentTime.toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mensagem para primeiros passos (mantida) */}
        {clients.length === 0 && (
          <div className="card text-center py-12">
            <div className="max-w-md mx-auto">
              <svg className="mx-auto h-16 w-16 text-orange-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sistema de Cobranças com Recorrências
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Gerencie cobranças com flexibilidade total! Crie assinaturas diárias, semanais, 
                mensais ou com intervalos personalizados. O sistema gera faturas automaticamente 
                no momento certo.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={handleCreateExampleData}
                  className="btn-success block w-full"
                >
                  🚀 Começar com Dados de Exemplo
                </button>
                <p className="text-sm text-gray-500">
                  Inclui exemplos de todos os tipos de recorrência
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;