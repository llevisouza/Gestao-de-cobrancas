// src/components/dashboard/Dashboard.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
// import KPICards from './KPICards';
import InvoiceTable from './InvoiceTable';
import WhatsAppQuickActions from './WhatsAppQuickActions';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import { getDaysDifference } from '../../utils/dateUtils';

const Dashboard = ({ onNavigate }) => {
  const { 
    clients, 
    subscriptions, 
    invoices, 
    loading: firestoreLoading, 
    createExampleData,
    generateInvoices 
  } = useFirestore();

  // Estados locais
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [quickActions, setQuickActions] = useState({
    generateInvoices: false,
    createExample: false,
    exportData: false
  });
  const [notifications, setNotifications] = useState([]);
  const [showAnimations] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Função de notificação (definida primeiro para evitar problemas de ordem)
  const showNotification = useCallback((type, title, message) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    alert(`${icons[type]} ${title}\n${message}`);
  }, []);

  // Atualizar relógio a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Função para determinar status real da fatura
  const getActualInvoiceStatus = (invoice) => {
    if (invoice.status === 'pago') {
      return 'pago';
    }
    const daysDiff = getDaysDifference(invoice.dueDate);
    return daysDiff < 0 ? 'vencida' : 'pendente';
  };

  // Calcular métricas com useMemo
  const dashboardMetrics = useMemo(() => {
    console.log('🔄 Recalculando métricas do dashboard...');
    const today = new Date().toISOString().split('T')[0];

    const correctedInvoices = invoices.map(invoice => ({
      ...invoice,
      actualStatus: getActualInvoiceStatus(invoice)
    }));

    const todayInvoices = correctedInvoices.filter(inv => 
      inv.generationDate?.includes && inv.generationDate.includes(today)
    ).length;

    const pendingAmount = correctedInvoices
      .filter(inv => inv.actualStatus === 'pendente')
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

    const overdueCount = correctedInvoices.filter(inv => inv.actualStatus === 'vencida').length;
    const overdueAmount = correctedInvoices
      .filter(inv => inv.actualStatus === 'vencida')
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

    const totalRevenue = correctedInvoices
      .filter(inv => inv.actualStatus === 'pago')
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

    const paymentRate = correctedInvoices.length > 0 
      ? (correctedInvoices.filter(inv => inv.actualStatus === 'pago').length / correctedInvoices.length * 100)
      : 0;

    const recentActivity = [
      ...correctedInvoices.slice(0, 3).map(inv => ({
        id: inv.id,
        type: 'invoice',
        message: `Fatura de ${formatCurrency(inv.amount)} - ${inv.actualStatus}`,
        time: inv.generationDate || inv.createdAt,
        status: inv.actualStatus,
        client: clients.find(c => c.id === inv.clientId)?.name || 'Cliente não encontrado'
      })),
      ...clients.slice(0, 2).map(client => ({
        id: client.id,
        type: 'client',
        message: `Cliente ${client.name} cadastrado`,
        time: client.createdAt,
        status: 'active',
        client: client.name
      }))
    ].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)).slice(0, 5);

    return {
      todayInvoices,
      pendingAmount,
      overdueCount,
      overdueAmount,
      totalRevenue,
      paymentRate,
      totalClients: clients.length,
      activeSubscriptions: subscriptions.filter(sub => sub.status === 'active').length,
      correctedInvoices,
      recentActivity
    };
  }, [invoices, clients, subscriptions]);

  // Estatísticas de recorrência
  const recurrenceStats = useMemo(() => {
    const stats = {
      daily: { count: 0, revenue: 0, color: 'bg-blue-500' },
      weekly: { count: 0, revenue: 0, color: 'bg-green-500' },
      monthly: { count: 0, revenue: 0, color: 'bg-orange-500' },
      custom: { count: 0, revenue: 0, color: 'bg-purple-500' }
    };

    subscriptions.forEach(sub => {
      if (sub.status === 'active' && stats[sub.recurrenceType]) {
        stats[sub.recurrenceType].count++;
        stats[sub.recurrenceType].revenue += parseFloat(sub.amount || 0);
      }
    });

    return stats;
  }, [subscriptions]);

  // Sistema de notificações
  useEffect(() => {
    const newNotifications = [];
    if (dashboardMetrics.overdueCount > 0) {
      newNotifications.push({
        id: 'overdue',
        type: 'error',
        title: 'Faturas Vencidas',
        message: `${dashboardMetrics.overdueCount} faturas precisam de atenção urgente`,
        action: 'view_overdue',
        priority: 'high'
      });
    }
    if (dashboardMetrics.pendingAmount > 1000) {
      newNotifications.push({
        id: 'pending',
        type: 'warning',
        title: 'Alto Valor Pendente',
        message: `${formatCurrency(dashboardMetrics.pendingAmount)} em faturas pendentes`,
        action: 'send_reminders',
        priority: 'medium'
      });
    }
    if (dashboardMetrics.paymentRate < 70 && dashboardMetrics.correctedInvoices.length > 5) {
      newNotifications.push({
        id: 'low_payment_rate',
        type: 'warning',
        title: 'Taxa de Pagamento Baixa',
        message: `Apenas ${dashboardMetrics.paymentRate.toFixed(1)}% das faturas foram pagas`,
        action: 'review_strategy',
        priority: 'medium'
      });
    }
    setNotifications(newNotifications);
  }, [dashboardMetrics]);

  // Handlers otimizados
  const handleCreateExampleData = useCallback(async () => {
    try {
      setQuickActions(prev => ({ ...prev, createExample: true }));
      await createExampleData();
      showNotification('success', 'Dados Criados', 'Exemplos com diferentes recorrências foram adicionados');
    } catch (error) {
      console.error('Erro ao criar dados de exemplo:', error);
      showNotification('error', 'Erro', error.message);
    } finally {
      setQuickActions(prev => ({ ...prev, createExample: false }));
    }
  }, [createExampleData, showNotification]);

  const handleGenerateInvoices = useCallback(async () => {
    try {
      setQuickActions(prev => ({ ...prev, generateInvoices: true }));
      const count = await generateInvoices();
      if (count > 0) {
        showNotification('success', 'Faturas Geradas', `${count} novas faturas baseadas nas recorrências`);
      } else {
        showNotification('info', 'Nenhuma Fatura', 'Todas as faturas estão em dia ou não é o momento da próxima cobrança');
      }
    } catch (error) {
      console.error('Erro ao gerar faturas:', error);
      showNotification('error', 'Erro', error.message);
    } finally {
      setQuickActions(prev => ({ ...prev, generateInvoices: false }));
    }
  }, [generateInvoices, showNotification]);

  const getGreeting = useCallback(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return '🌅 Bom dia';
    if (hour < 18) return '☀️ Boa tarde';
    return '🌙 Boa noite';
  }, [currentTime]);

  if (firestoreLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="dashboard-container">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-lg border">
                  <div className="h-12 bg-gray-200 rounded-full w-12 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl shadow-lg border p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-600 animate-pulse">Carregando dashboard otimizado...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header mb-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex flex-col">
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    {getGreeting()}
                    <span className={showAnimations ? "animate-pulse" : ""}>👋</span>
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Sistema de Cobranças
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Sistema Online
                </div>
                <div className="text-gray-500">
                  Última atualização: {currentTime.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleCreateExampleData}
                disabled={quickActions.createExample || clients.length > 0}
                className="btn-success px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Criar dados de exemplo com diferentes tipos de recorrência"
              >
                {quickActions.createExample ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-2 hidden sm:inline">Criando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 sm:mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">
                      {clients.length > 0 ? 'Dados Existem' : 'Dados Exemplo'}
                    </span>
                  </>
                )}
              </button>
              <button 
                onClick={handleGenerateInvoices}
                disabled={quickActions.generateInvoices}
                className="btn-primary px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Gerar faturas baseadas nas configurações de recorrência"
              >
                {quickActions.generateInvoices ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-2 hidden sm:inline">Gerando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 sm:mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">Gerar Faturas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notificações */}
        {notifications.length > 0 && (
          <div className="mb-8 space-y-3">
            {notifications.slice(0, 3).map(notification => (
              <div key={notification.id} className={`p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-shadow duration-200 ${
                notification.type === 'error'
                  ? 'bg-red-50 border-red-400 text-red-800' 
                  : notification.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                  : 'bg-blue-50 border-blue-400 text-blue-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      notification.type === 'error' ? 'bg-red-400' : 
                      notification.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                    }`}></div>
                    <div>
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="text-sm opacity-90">{notification.message}</p>
                    </div>
                  </div>
                  <div className="text-xs font-medium px-3 py-1 rounded-lg bg-white/50 hover:bg-white/80 transition-colors cursor-pointer">
                    Ver Detalhes
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Métricas em Tempo Real */}
        {dashboardMetrics.totalClients > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Métricas em Tempo Real
              </h3>
              <div className="flex bg-white rounded-lg p-1 shadow-sm border">
                {[
                  { key: 'today', label: 'Hoje' },
                  { key: 'week', label: 'Semana' },
                  { key: 'month', label: 'Mês' }
                ].map(period => (
                  <button
                    key={period.key}
                    onClick={() => setSelectedPeriod(period.key)}
                    className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                      selectedPeriod === period.key
                        ? 'bg-orange-100 text-orange-700 font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Faturas Hoje',
                  value: dashboardMetrics.todayInvoices,
                  icon: '📄',
                  color: 'blue',
                  trend: '+12%'
                },
                {
                  title: 'Valor Pendente',
                  value: formatCurrency(dashboardMetrics.pendingAmount),
                  icon: '⏳',
                  color: 'yellow',
                  trend: dashboardMetrics.pendingAmount > 0 ? '+' : '='
                },
                {
                  title: 'Vencidas',
                  value: dashboardMetrics.overdueCount,
                  icon: '⚠️',
                  color: 'red',
                  trend: dashboardMetrics.overdueCount > 0 ? `+${dashboardMetrics.overdueCount}` : '0'
                },
                {
                  title: 'Taxa Pagamento',
                  value: `${dashboardMetrics.paymentRate.toFixed(1)}%`,
                  icon: '📈',
                  color: 'green',
                  trend: dashboardMetrics.paymentRate >= 80 ? '↗' : dashboardMetrics.paymentRate >= 50 ? '→' : '↘'
                }
              ].map((stat, index) => (
                <div key={index} className={`bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${showAnimations ? 'animate-fade-in-up' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center text-2xl`}>
                      {stat.icon}
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stat.trend.includes('↗') || stat.trend.includes('+') 
                        ? 'bg-green-100 text-green-700' 
                        : stat.trend.includes('↘')
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {stat.trend}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.title}
                  </div>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                    <div className={`bg-${stat.color}-500 h-1.5 rounded-full transition-all duration-1000`} 
                         style={{ width: `${Math.min(Math.random() * 100, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cards de Recorrência */}
        {dashboardMetrics.activeSubscriptions > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🔄</span>
                Assinaturas por Tipo de Recorrência
              </h3>
              <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-lg border">
                Total: {dashboardMetrics.activeSubscriptions} ativas
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(recurrenceStats).map(([type, data]) => {
                const typeLabels = {
                  daily: { label: 'Diárias', icon: '🔄', desc: 'Todo dia' },
                  weekly: { label: 'Semanais', icon: '📅', desc: 'Por semana' },
                  monthly: { label: 'Mensais', icon: '📆', desc: 'Por mês' },
                  custom: { label: 'Personalizadas', icon: '⏱️', desc: 'Customizadas' }
                };
                const typeInfo = typeLabels[type];
                return (
                  <div key={type} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl ${data.color} bg-opacity-10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                        {typeInfo.icon}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {data.count}
                        </div>
                        <div className="text-xs text-gray-500">
                          {typeInfo.desc}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{typeInfo.label}</span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(data.revenue)}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${data.color}`}
                          style={{ width: `${dashboardMetrics.activeSubscriptions > 0 ? (data.count / dashboardMetrics.activeSubscriptions) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Widget WhatsApp */}
        {(clients.length > 0 && invoices.length > 0) && (
          <div className="mb-8">
            <WhatsAppQuickActions 
              invoices={dashboardMetrics.correctedInvoices}
              clients={clients}
              subscriptions={subscriptions}
              onNavigate={onNavigate} 
            />
          </div>
        )}

        {/* Atividade Recente */}
        {dashboardMetrics.recentActivity.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">🕐</span>
              Atividade Recente
            </h3>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {dashboardMetrics.recentActivity.map((activity, index) => (
                  <div key={`${activity.id}-${index}`} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${
                        activity.type === 'invoice' 
                          ? activity.status === 'pago'
                            ? 'bg-green-100 text-green-600' 
                            : activity.status === 'vencida'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {activity.type === 'invoice' ? '📄' : '👤'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.time ? new Date(activity.time).toLocaleString('pt-BR') : 'Data não disponível'}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'pago' 
                          ? 'bg-green-100 text-green-700'
                          : activity.status === 'vencida'
                          ? 'bg-red-100 text-red-700'
                          : activity.status === 'pendente'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {activity.status === 'pago' ? 'Pago' : 
                         activity.status === 'vencida' ? 'Vencida' : 
                         activity.status === 'pendente' ? 'Pendente' : 
                         'Ativo'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabela de Faturas */}
        <InvoiceTable invoices={dashboardMetrics.correctedInvoices} clients={clients} />

        {/* Estado Vazio */}
        {clients.length === 0 && subscriptions.length === 0 && invoices.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="max-w-md mx-auto">
              <div className="mb-8 relative">
                <div className="text-8xl mb-4 animate-bounce">📊</div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse animation-delay-200"></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse animation-delay-400"></div>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Bem-vindo ao Sistema de Cobranças
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Para começar, clique no botão abaixo para criar clientes, assinaturas 
                e faturas de exemplo com diferentes tipos de recorrência.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span>
                  Recorrências automáticas
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span>
                  WhatsApp integrado
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span>
                  Dashboard em tempo real
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span>
                  Relatórios avançados
                </div>
              </div>
              <button 
                onClick={handleCreateExampleData}
                disabled={quickActions.createExample}
                className="btn-primary px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {quickActions.createExample ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Criando dados...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Começar com Dados de Exemplo
                  </div>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-4">
                🚀 Explore todas as funcionalidades sem compromisso
              </p>
            </div>
          </div>
        )}

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
          }
          .animation-delay-200 {
            animation-delay: 0.2s;
          }
          .animation-delay-400 {
            animation-delay: 0.4s;
          }
          .btn-success {
            background-color: #22c55e;
            color: white;
          }
          .btn-success:hover:not(:disabled) {
            background-color: #16a34a;
          }
          .btn-primary {
            background-color: #3b82f6;
            color: white;
          }
          .btn-primary:hover:not(:disabled) {
            background-color: #2563eb;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Dashboard;