// src/components/reports/ReportsPage.js
import React, { useState, useMemo } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { INVOICE_STATUS_LABELS } from '../../utils/constants';

const ReportsPage = ({ invoices, clients }) => {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'all'
  });

  // Períodos rápidos
  const quickPeriods = [
    {
      label: 'Hoje',
      getValue: () => {
        const today = new Date().toISOString().split('T')[0];
        return { startDate: today, endDate: today };
      }
    },
    {
      label: 'Este Mês',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date().toISOString().split('T')[0];
        return { startDate: start, endDate: end };
      }
    },
    {
      label: 'Mês Anterior',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        return { startDate: start, endDate: end };
      }
    },
    {
      label: 'Este Ano',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        const end = new Date().toISOString().split('T')[0];
        return { startDate: start, endDate: end };
      }
    },
    {
      label: 'Ano Anterior',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
        const end = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
        return { startDate: start, endDate: end };
      }
    }
  ];

  // Filtrar faturas baseado nos filtros
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.dueDate);
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      
      // Ajustar para incluir o dia completo
      endDate.setHours(23, 59, 59, 999);
      
      const dateInRange = invoiceDate >= startDate && invoiceDate <= endDate;
      const statusMatch = filters.status === 'all' || invoice.status === filters.status;
      
      return dateInRange && statusMatch;
    });
  }, [invoices, filters]);

  // Calcular métricas
  const metrics = useMemo(() => {
    const total = filteredInvoices.length;
    const paid = filteredInvoices.filter(inv => inv.status === 'paid').length;
    const pending = filteredInvoices.filter(inv => inv.status === 'pending').length;
    const overdue = filteredInvoices.filter(inv => inv.status === 'overdue').length;
    
    const totalRevenue = filteredInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
      
    const pendingRevenue = filteredInvoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

    return { total, paid, pending, overdue, totalRevenue, pendingRevenue };
  }, [filteredInvoices]);

  // Obter nome do cliente
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };

  // Aplicar período rápido
  const applyQuickPeriod = (period) => {
    const dates = period.getValue();
    setFilters(prev => ({ ...prev, ...dates }));
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      status: 'all'
    });
  };

  // Exportar CSV
  const exportToCSV = () => {
    const headers = ['Cliente', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Data Pagamento'];
    const csvData = filteredInvoices.map(invoice => [
      getClientName(invoice.clientId),
      invoice.description || 'Sem descrição',
      `R$ ${parseFloat(invoice.amount || 0).toFixed(2).replace('.', ',')}`,
      formatDate(invoice.dueDate),
      INVOICE_STATUS_LABELS[invoice.status] || invoice.status,
      invoice.paidDate ? formatDate(invoice.paidDate) : '-'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-${filters.startDate}-${filters.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="dashboard-title">Relatórios</h1>
              <p className="dashboard-subtitle">
                Análise detalhada das suas faturas e receitas
              </p>
            </div>
            <button onClick={exportToCSV} className="btn-success">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="reports-filters">
          <h3 className="reports-filters-title">Filtros</h3>
          
          {/* Períodos Rápidos */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Períodos Rápidos</p>
            <div className="flex flex-wrap gap-2">
              {quickPeriods.map((period, index) => (
                <button
                  key={index}
                  onClick={() => applyQuickPeriod(period)}
                  className="btn-secondary text-xs px-3 py-1"
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros Customizados */}
          <div className="reports-filters-row">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="form-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="form-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="form-select"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="overdue">Vencido</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button onClick={clearFilters} className="btn-secondary">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* KPIs dos Relatórios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="kpi-card kpi-card-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">{metrics.total}</p>
                <p className="text-sm text-gray-600">Total de Faturas</p>
              </div>
              <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="kpi-card kpi-card-success">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">{metrics.paid}</p>
                <p className="text-sm text-gray-600">Faturas Pagas</p>
                <p className="text-xs text-gray-500">{formatCurrency(metrics.totalRevenue)}</p>
              </div>
              <svg className="w-8 h-8 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <div className="kpi-card kpi-card-warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">{metrics.pending}</p>
                <p className="text-sm text-gray-600">Valor Pendente</p>
                <p className="text-xs text-gray-500">{formatCurrency(metrics.pendingRevenue)}</p>
              </div>
              <svg className="w-8 h-8 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <div className="kpi-card kpi-card-error">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">{metrics.overdue}</p>
                <p className="text-sm text-gray-600">Faturas Vencidas</p>
              </div>
              <svg className="w-8 h-8 text-error-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tabela de Faturas */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              Faturas Encontradas ({filteredInvoices.length})
            </h3>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="card-body text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma fatura encontrada</h3>
              <p className="text-gray-600">Ajuste os filtros para ver mais resultados</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                    <th>Data Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(invoice => (
                    <tr key={invoice.id}>
                      <td>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-primary-700">
                              {getClientName(invoice.clientId)?.charAt(0)?.toUpperCase() || 'C'}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {getClientName(invoice.clientId)}
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-gray-900">
                        {invoice.description || 'Sem descrição'}
                      </td>
                      <td className="text-sm font-semibold text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="text-sm text-gray-900">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td>
                        <span className={`status-${invoice.status}`}>
                          {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
                        </span>
                      </td>
                      <td className="text-sm text-gray-500">
                        {invoice.paidDate ? formatDate(invoice.paidDate) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;