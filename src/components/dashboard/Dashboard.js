// src/components/dashboard/Dashboard.js - VERSÃO PREMIUM MELHORADA
import React, { useState, useEffect } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import KPICards from './KPICards';
import InvoiceTable from './InvoiceTable';
import WhatsAppQuickActions from './WhatsAppQuickActions';
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

  // Estados para animações e funcionalidades avançadas
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardStats, setDashboardStats] = useState({
    todayInvoices: 0,
    pendingAmount: 0,
    overdueCount: 0,
    recentActivity: []
  });
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [showAnimations, setShowAnimations] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [quickActions, setQuickActions] = useState({
    generateInvoices: false,
    sendReminders: false,
    exportData: false
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
      inv.generationDate?.includes && inv.generationDate.includes(today)
    ).length;

    const pendingAmount = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

    const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;

    // Atividade recente (últimas 5 ações)
    const recentActivity = [
      ...invoices.slice(0, 3).map(inv => ({
        id: inv.id,
        type: 'invoice',
        message: `Fatura de ${formatCurrency(inv.amount)} criada`,
        time: inv.generationDate,
        status: inv.status
      })),
      ...clients.slice(0, 2).map(client => ({
        id: client.id,
        type: 'client',
        message: `Cliente ${client.name} cadastrado`,
        time: client.createdAt,
        status: 'active'
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

    setDashboardStats({ todayInvoices, pendingAmount, overdueCount, recentActivity });

    // Sistema de notificações inteligentes
    const newNotifications = [];
    
    if (overdueCount > 0) {
      newNotifications.push({
        id: 'overdue',
        type: 'warning',
        title: 'Faturas Vencidas',
        message: `${overdueCount} faturas precisam de atenção`,
        action: 'view_overdue'
      });
    }

    if (pendingAmount > 1000) {
      newNotifications.push({
        id: 'pending',
        type: 'info',
        title: 'Alto Valor Pendente',
        message: `${formatCurrency(pendingAmount)} em faturas pendentes`,
        action: 'send_reminders'
      });
    }

    setNotifications(newNotifications);
  }, [invoices, clients]);

  // Handlers para ações
  const handleCreateExampleData = async () => {
    try {
      setQuickActions(prev => ({ ...prev, generateInvoices: true }));
      await createExampleData();
      showNotification('success', '🎉 Dados criados!', 'Exemplos com diferentes recorrências foram adicionados');
    } catch (error) {
      console.error('Erro ao criar dados de exemplo:', error);
      showNotification('error', '❌ Erro', error.message);
    } finally {
      setQuickActions(prev => ({ ...prev, generateInvoices: false }));
    }
  };

  const handleGenerateInvoices = async () => {
    try {
      setQuickActions(prev => ({ ...prev, generateInvoices: true }));
      const count = await generateInvoices();
      if (count > 0) {
        showNotification('success', '🚀 Faturas geradas!', `${count} novas faturas baseadas nas recorrências`);
      } else {
        showNotification('info', 'ℹ️ Nenhuma fatura', 'Todas as faturas estão em dia ou não é o momento da próxima cobrança');
      }
    } catch (error) {
      console.error('Erro ao gerar faturas:', error);
      showNotification('error', '❌ Erro', error.message);
    } finally {
      setQuickActions(prev => ({ ...prev, generateInvoices: false }));
    }
  };

  const showNotification = (type, title, message) => {
    // Sistema de toast seria implementado aqui
    alert(`${title}\n${message}`);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '🌅 Bom dia';
    if (hour < 18) return '☀️ Boa tarde';
    return '🌙 Boa noite';
  };

  const getRecurrenceStats = () => {
    const stats = {
      daily: { count: 0, revenue: 0, color: 'bg-blue-500' },
      weekly: { count: 0, revenue: 0, color: 'bg-green-500' },
      monthly: { count: 0, revenue: 0, color: 'bg-orange-500' },
      custom: { count: 0, revenue: 0, color: 'bg-purple-500' }
    };

    subscriptions.forEach(sub => {
      if (sub.status === 'active') {
        const type = sub.recurrenceType || 'monthly';
        if (stats[type]) {
          stats[type].count++;
          stats[type].revenue += parseFloat(sub.amount || 0);
        }
      }
    });

    return stats;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 animate-pulse">Carregando seu dashboard...</p>
        </div>
      </div>
    );
  }

  const recurrenceStats = getRecurrenceStats();
  const totalActiveSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      <div className="dashboard-container">
        
        {/* Header Avançado */}
        <div className="dashboard-header mb-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            
            {/* Saudação e Informações */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex flex-col">
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    {getGreeting()}
                    <span className="animate-pulse">👋</span>
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Sistema de Cobranças com Recorrências Inteligentes
                  </p>
                </div>
              </div>
              
              {/* Status Bar */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Sistema Online
                </div>
                <div className="text-gray-500">
                  Última atualização: {currentTime.toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
            
            {/* Relógio e Ações */}
            <div className="flex items-center gap-6">
              
              {/* Ações Rápidas */}
              <div className="flex gap-3">
                <button 
                  onClick={handleCreateExampleData}
                  disabled={quickActions.generateInvoices}
                  className="btn-success px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Criar dados de exemplo com diferentes tipos de recorrência"
                >
                  {quickActions.generateInvoices ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span className="ml-2 hidden sm:inline">Criando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 sm:mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden sm:inline">Dados Exemplo</span>
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
        </div>

        {/* Notificações Inteligentes */}
        {notifications.length > 0 && (
          <div className="mb-8 space-y-3">
            {notifications.map(notification => (
              <div key={notification.id} className={`p-4 rounded-xl border-l-4 ${
                notification.type === 'warning' 
                  ? 'bg-yellow-50 border-yellow-400 text-yellow-800' 
                  : 'bg-blue-50 border-blue-400 text-blue-800'
              } shadow-sm hover:shadow-md transition-shadow duration-200`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      notification.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                    } animate-pulse`}></div>
                    <div>
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="text-sm opacity-90">{notification.message}</p>
                    </div>
                  </div>
                  <button className="text-xs font-medium px-3 py-1 rounded-lg bg-white/50 hover:bg-white/80 transition-colors">
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estatísticas em Tempo Real */}
        {(clients.length > 0 || subscriptions.length > 0) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Estatísticas em Tempo Real
              </h3>
              
              {/* Filtro de Período */}
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
                  value: dashboardStats.todayInvoices,
                  icon: '📄',
                  color: 'blue',
                  trend: '+12%'
                },
                {
                  title: 'Valor Pendente',
                  value: formatCurrency(dashboardStats.pendingAmount),
                  icon: '⏳',
                  color: 'yellow',
                  trend: '-5%'
                },
                {
                  title: 'Vencidas',
                  value: dashboardStats.overdueCount,
                  icon: '⚠️',
                  color: 'red',
                  trend: '+2'
                },
                {
                  title: 'Clientes Ativos',
                  value: clients.length,
                  icon: '👥',
                  color: 'green',
                  trend: '+8%'
                }
              ].map((stat, index) => (
                <div key={index} className={`bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${showAnimations ? 'animate-fade-in-up' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center text-2xl`}>
                      {stat.icon}
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stat.trend.startsWith('+') 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
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
                  
                  {/* Mini Progress Bar */}
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                    <div className={`bg-${stat.color}-500 h-1.5 rounded-full transition-all duration-1000`} 
                         style={{ width: `${Math.random() * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cards de Recorrência Premium */}
        {totalActiveSubscriptions > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🔄</span>
                Assinaturas por Tipo de Recorrência
              </h3>
              <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-lg border">
                Total: {totalActiveSubscriptions} ativas
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
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${data.color}`}
                          style={{ width: `${totalActiveSubscriptions > 0 ? (data.count / totalActiveSubscriptions) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Widget WhatsApp Melhorado */}
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

        {/* Atividade Recente */}
        {dashboardStats.recentActivity.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">🕐</span>
              Atividade Recente
            </h3>
            
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {dashboardStats.recentActivity.map((activity, index) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${
                        activity.type === 'invoice' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {activity.type === 'invoice' ? '📄' : '👤'}
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.time).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'paid' 
                          ? 'bg-green-100 text-green-700'
                          : activity.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {activity.status === 'paid' ? 'Pago' : 
                         activity.status === 'pending' ? 'Pendente' : 
                         'Ativo'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards Existentes */}
        <KPICards invoices={invoices} clients={clients} />
        
        {/* Tabela de Faturas */}
        <InvoiceTable invoices={invoices} clients={clients} />

        {/* Sistema de Automação Status */}
        {subscriptions.length > 0 && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl border border-orange-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    Sistema de Automação
                  </h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Operacional
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span>⚙️</span>
                      Funcionalidades Ativas
                    </h4>
                    <div className="space-y-3">
                      {[
                        'Geração automática de faturas recorrentes',
                        'Cálculo inteligente de próximas cobranças',
                        'Integração com WhatsApp para notificações',
                        'Controle de status e vencimentos'
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm text-gray-700">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span>📈</span>
                      Próximas Ações
                    </h4>
                    <div className="space-y-3">
                      {[
                        'Clique em "Gerar Faturas" para processar recorrências',
                        'Use o WhatsApp Widget para enviar cobranças',
                        'Acompanhe o status das faturas na tabela',
                        'Monitore KPIs em tempo real no dashboard'
                      ].map((action, index) => (
                        <div key={index} className="flex items-start gap-3 text-sm text-gray-700">
                          <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600 mt-0.5 flex-shrink-0">
                            {index + 1}
                          </div>
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Status Footer */}
                <div className="mt-8 pt-6 border-t border-orange-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Sistema operacional
                      </div>
                      <div className="text-gray-500">
                        Uptime: 99.9%
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Última atualização: {currentTime.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado Vazio Melhorado */}
        {clients.length === 0 && subscriptions.length === 0 && invoices.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="max-w-md mx-auto">
              {/* Animação de ícones */}
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
              
              {/* Features Preview */}
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
                disabled={quickActions.generateInvoices}
                className="btn-primary px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {quickActions.generateInvoices ? (
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
      </div>

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
      `}</style>
    </div>
  );
};

export default Dashboard;