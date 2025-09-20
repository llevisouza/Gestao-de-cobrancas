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
    const clientCount = clients.length;

    return { totalBilled, pending, overdue, clientCount };
  }, [invoices, clients]);

  const kpiData = [
    { title: 'Total Faturado', value: formatCurrency(stats.totalBilled), color: 'blue' },
    { title: 'Pendente', value: formatCurrency(stats.pending), color: 'yellow' },
    { title: 'Vencido', value: formatCurrency(stats.overdue), color: 'red' },
    { title: 'Clientes Ativos', value: stats.clientCount, color: 'green' }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiData.map(kpi => (
        <div key={kpi.title} className={`bg-white rounded-lg shadow p-6 border-l-4 border-${kpi.color}-500`}>
          <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{kpi.value}</p>
        </div>
      ))}
    </div>
  );
};

export default KPICards;