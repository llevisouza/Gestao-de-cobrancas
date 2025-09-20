import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const KPICards = ({ kpis }) => {
  const kpiData = [
    {
      title: 'Total de Clientes',
      value: kpis.totalClients,
      icon: '👥',
      iconClass: 'info',
      change: null
    },
    {
      title: 'Assinaturas Ativas',
      value: kpis.activeSubscriptions,
      icon: '✅',
      iconClass: 'success',
      change: null
    },
    {
      title: 'Receita Mensal',
      value: formatCurrency(kpis.monthlyRevenue),
      icon: '💰',
      iconClass: 'success',
      change: null
    },
    {
      title: 'Faturas Pendentes',
      value: kpis.pendingInvoices,
      icon: '⏰',
      iconClass: kpis.pendingInvoices > 0 ? 'warning' : 'success',
      change: null
    }
  ];

  return (
    <div className="kpi-grid">
      {kpiData.map((kpi, index) => (
        <div key={index} className="kpi-card fade-in">
          <div className="kpi-card-header">
            <div className="kpi-card-title">{kpi.title}</div>
            <div className={`kpi-card-icon ${kpi.iconClass}`}>
              <span>{kpi.icon}</span>
            </div>
          </div>
          <div className="kpi-card-value">{kpi.value}</div>
          {kpi.change && (
            <div className={`kpi-card-change ${kpi.change.type}`}>
              <span>{kpi.change.type === 'positive' ? '↗️' : '↘️'}</span>
              {kpi.change.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KPICards;