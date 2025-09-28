// src/components/dashboard/KPICards.js
import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const KPICards = ({ invoices, clients }) => {
  // Calcular KPIs
  const getKPIData = () => {
    const totalClients = clients.length;
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;
    
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    
    const pendingRevenue = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

    const overdueRevenue = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

    return {
      totalClients,
      pendingInvoices,
      overdueInvoices,
      totalRevenue,
      pendingRevenue,
      overdueRevenue
    };
  };

  const kpiData = getKPIData();

  const kpiCards = [
    {
      id: 'clients',
      title: 'Total de Clientes',
      value: kpiData.totalClients,
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
      ),
      color: 'primary',
      change: '+12%',
      changeType: 'positive'
    },
    {
      id: 'revenue',
      title: 'Receita Total',
      value: formatCurrency(kpiData.totalRevenue),
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
        </svg>
      ),
      color: 'success',
      change: '+8.2%',
      changeType: 'positive'
    },
    {
      id: 'pending',
      title: 'Faturas Pendentes',
      value: kpiData.pendingInvoices,
      subtitle: formatCurrency(kpiData.pendingRevenue),
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
      color: 'warning',
      change: '-2.1%',
      changeType: 'negative'
    },
    {
      id: 'overdue',
      title: 'Faturas em Atraso',
      value: kpiData.overdueInvoices,
      subtitle: formatCurrency(kpiData.overdueRevenue),
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      color: 'error',
      change: '+5.4%',
      changeType: 'negative'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpiCards.map((card) => (
        <div
          key={card.id}
          className={`kpi-card kpi-card-${card.color} fade-in`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {card.value}
              </p>
              {card.subtitle && (
                <p className="text-sm text-gray-500">
                  {card.subtitle}
                </p>
              )}
            </div>
            <div className={`text-${card.color}-600 opacity-80`}>
              {card.icon}
            </div>
          </div>

          {/* Progress bar para receita */}
          {card.id === 'revenue' && (
            <div className="mt-4">
              <div className="progress-bar">
                <div 
                  className="progress-fill-success"
                  style={{ width: '75%' }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Meta mensal: {formatCurrency(kpiData.totalRevenue * 1.33)}
              </p>
            </div>
          )}

          {/* Progress bar para faturas pendentes */}
          {card.id === 'pending' && kpiData.pendingInvoices > 0 && (
            <div className="mt-4">
              <div className="progress-bar">
                <div 
                  className="progress-fill-warning"
                  style={{ 
                    width: `${Math.min((kpiData.pendingInvoices / (kpiData.pendingInvoices + invoices.filter(i => i.status === 'paid').length)) * 100, 100)}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((kpiData.pendingInvoices / invoices.length) * 100).toFixed(1)}% do total
              </p>
            </div>
          )}

          {/* Progress bar para faturas em atraso */}
          {card.id === 'overdue' && kpiData.overdueInvoices > 0 && (
            <div className="mt-4">
              <div className="progress-bar">
                <div 
                  className="progress-fill-error"
                  style={{ 
                    width: `${Math.min((kpiData.overdueInvoices / invoices.length) * 100, 100)}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((kpiData.overdueInvoices / invoices.length) * 100).toFixed(1)}% do total
              </p>
            </div>
          )}

          {/* Indicador de mudança */}
          {card.change && (
            <div className="mt-3 flex items-center">
              <span className={`inline-flex items-center text-xs font-medium ${
                card.changeType === 'positive' 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {card.changeType === 'positive' ? (
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {card.change}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                vs. mês anterior
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KPICards;