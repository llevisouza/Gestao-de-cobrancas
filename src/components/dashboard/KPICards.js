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
        <svg style={{ width: '2rem', height: '2rem', color: '#2563eb' }} fill="currentColor" viewBox="0 0 20 20">
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
        <svg style={{ width: '2rem', height: '2rem', color: '#d97706' }} fill="currentColor" viewBox="0 0 20 20">
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
        <svg style={{ width: '2rem', height: '2rem', color: '#dc2626' }} fill="currentColor" viewBox="0 0 20 20">
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
        <svg style={{ width: '2rem', height: '2rem', color: '#16a34a' }} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  const getCardStyle = (color) => {
    const colorMap = {
      blue: { 
        borderLeft: '4px solid #3b82f6', 
        backgroundColor: '#eff6ff' 
      },
      yellow: { 
        borderLeft: '4px solid #f59e0b', 
        backgroundColor: '#fffbeb' 
      },
      red: { 
        borderLeft: '4px solid #ef4444', 
        backgroundColor: '#fef2f2' 
      },
      green: { 
        borderLeft: '4px solid #10b981', 
        backgroundColor: '#f0fdf4' 
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  const getProgressColor = (color) => {
    const colorMap = {
      blue: '#3b82f6',
      yellow: '#f59e0b',
      red: '#ef4444',
      green: '#10b981'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
      gap: '1.5rem', 
      marginBottom: '2rem' 
    }}>
      {kpiData.map((kpi, index) => (
        <div 
          key={index}
          style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            transition: 'all 0.2s ease-in-out',
            cursor: 'pointer',
            ...getCardStyle(kpi.color)
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <p style={{ 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#6b7280', 
                marginBottom: '0.25rem',
                margin: '0 0 0.25rem 0'
              }}>
                {kpi.title}
              </p>
              <p style={{ 
                fontSize: '1.875rem', 
                fontWeight: '700', 
                color: '#111827', 
                marginBottom: '0.25rem',
                margin: '0 0 0.25rem 0'
              }}>
                {kpi.value}
              </p>
              <p style={{ 
                fontSize: '0.75rem', 
                color: '#9ca3af',
                margin: '0'
              }}>
                {kpi.subtitle}
              </p>
            </div>
            <div style={{ flexShrink: 0, marginLeft: '1rem' }}>
              {kpi.icon}
            </div>
          </div>

          {/* Barra de progresso simples para KPIs com valores */}
          {kpi.title !== 'Clientes Ativos' && stats.totalBilled > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                marginBottom: '0.25rem' 
              }}>
                <span>0%</span>
                <span>
                  {((kpi.title === 'Total Faturado' ? stats.totalBilled : 
                     kpi.title === 'Pendente' ? stats.pending :
                     kpi.title === 'Vencido' ? stats.overdue : stats.paid) / 
                    stats.totalBilled * 100).toFixed(0)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                backgroundColor: '#e5e7eb',
                borderRadius: '9999px',
                height: '0.5rem'
              }}>
                <div 
                  style={{
                    height: '0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: getProgressColor(kpi.color),
                    transition: 'all 0.5s ease-in-out',
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
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          borderLeft: '4px solid #8b5cf6',
          backgroundColor: '#f5f3ff',
          padding: '1.5rem',
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <p style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#6b7280', 
              margin: '0 0 0.25rem 0'
            }}>
              Clientes Ativos
            </p>
            <p style={{ 
              fontSize: '1.875rem', 
              fontWeight: '700', 
              color: '#111827', 
              margin: '0 0 0.25rem 0'
            }}>
              {stats.clientCount}
            </p>
            <p style={{ 
              fontSize: '0.75rem', 
              color: '#9ca3af',
              margin: '0'
            }}>
              Cadastrados
            </p>
          </div>
          <div style={{ flexShrink: 0, marginLeft: '1rem' }}>
            <svg style={{ width: '2rem', height: '2rem', color: '#8b5cf6' }} fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPICards;