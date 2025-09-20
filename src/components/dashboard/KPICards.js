// src/components/dashboard/KPICards.js
import React, { useMemo } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { INVOICE_STATUS } from '../../utils/constants';

const KPICards = ({ invoices, clients }) => {
  const stats = useMemo(() => {
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const pending = invoices
      .filter(inv => inv.status === INVOICE_STATUS.PENDING)
      .reduce((sum, inv) => sum + inv.amount, 0);
    const overdue = invoices
      .filter(inv => inv.status === INVOICE_STATUS.OVERDUE)
      .reduce((sum, inv) => sum + inv.amount, 0);
    const paid = invoices
      .filter(inv => inv.status === INVOICE_STATUS.PAID)
      .reduce((sum, inv) => sum + inv.amount, 0);
    const clientCount = clients.length;

    // Cálculos adicionais
    const pendingCount = invoices.filter(inv => inv.status === INVOICE_STATUS.PENDING).length;
    const overdueCount = invoices.filter(inv => inv.status === INVOICE_STATUS.OVERDUE).length;

    return { 
      totalBilled, 
      pending, 
      overdue, 
      paid,
      clientCount,
      pendingCount,
      overdueCount
    };
  }, [invoices, clients]);

  const kpiData = [
    { 
      title: 'Total Faturado', 
      value: formatCurrency(stats.totalBilled), 
      subtitle: `${invoices.length} faturas`,
      color: 'blue',
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      title: 'Pendente', 
      value: formatCurrency(stats.pending), 
      subtitle: `${stats.pendingCount} faturas`,
      color: 'yellow',
      icon: (
        <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      title: 'Vencido', 
      value: formatCurrency(stats.overdue), 
      subtitle: `${stats.overdueCount} faturas`,
      color: 'red',
      icon: (
        <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      title: 'Recebido', 
      value: formatCurrency(stats.paid), 
      subtitle: 'Confirmado',
      color: 'green',
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'border-blue-500 bg-blue-50',
      yellow: 'border-yellow-500 bg-yellow-50',
      red: 'border-red-500 bg-red-50',
      green: 'border-green-500 bg-green-50'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpiData.map((kpi, index) => (
        <div 
          key={index}
          className={`bg-white rounded-lg shadow-sm border-l-4 p-6 card-hover ${getColorClasses(kpi.color)}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 mb-1">
                {kpi.title}
              </p>
              <p className="text-2xl font-bold text-gray-800 mb-1">
                {kpi.value}
              </p>
              <p className="text-xs text-gray-400">
                {kpi.subtitle}
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              {kpi.icon}
            </div>
          </div>

          {/* Barra de progresso simples para KPIs com valores */}
          {kpi.title !== 'Clientes Ativos' && stats.totalBilled > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>0%</span>
                <span>
                  {((kpi.title === 'Total Faturado' ? stats.totalBilled : 
                     kpi.title === 'Pendente' ? stats.pending :
                     kpi.title === 'Vencido' ? stats.overdue : stats.paid) / 
                    stats.totalBilled * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    kpi.color === 'blue' ? 'bg-blue-500' :
                    kpi.color === 'yellow' ? 'bg-yellow-500' :
                    kpi.color === 'red' ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{
                    width: `${(kpi.title === 'Total Faturado' ? 100 : 
                             (kpi.title === 'Pendente' ? stats.pending :
                              kpi.title === 'Vencido' ? stats.overdue : stats.paid) / 
                             stats.totalBilled * 100)}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Card adicional para clientes */}
      <div className="bg-white rounded-lg shadow-sm border-l-4 border-purple-500 bg-purple-50 p-6 card-hover sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Clientes Ativos
            </p>
            <p className="text-2xl font-bold text-gray-800 mb-1">
              {stats.clientCount}
            </p>
            <p className="text-xs text-gray-400">
              Cadastrados
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPICards;