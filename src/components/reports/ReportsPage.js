import React, { useState, useEffect } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import DateFilter from './DateFilter';
import ReportTable from './ReportTable';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import { startOfMonth, endOfMonth } from '../../utils/dateUtils';

const ReportsPage = () => {
  const { clients, invoices, subscriptions, loading } = useFirestore();
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()).toISOString().split('T')[0],
    endDate: endOfMonth(new Date()).toISOString().split('T')[0]
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [reportData, setReportData] = useState({
    invoices: [],
    summary: {
      totalInvoices: 0,
      paidInvoices: 0,
      pendingInvoices: 0,
      overdueInvoices: 0,
      totalRevenue: 0,
      pendingAmount: 0
    }
  });

  // Filtrar e calcular dados do relatório
  useEffect(() => {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999);

    // Filtrar faturas por período
    let filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.dueDate);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });

    // Filtrar por status se necessário
    if (statusFilter !== 'all') {
      filteredInvoices = filteredInvoices.filter(invoice => 
        invoice.status === statusFilter
      );
    }

    // Calcular resumo
    const summary = {
      totalInvoices: filteredInvoices.length,
      paidInvoices: filteredInvoices.filter(inv => inv.status === 'paid').length,
      pendingInvoices: filteredInvoices.filter(inv => inv.status === 'pending').length,
      overdueInvoices: filteredInvoices.filter(inv => inv.status === 'overdue').length,
      totalRevenue: filteredInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0),
      pendingAmount: filteredInvoices
        .filter(inv => inv.status !== 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0)
    };

    setReportData({
      invoices: filteredInvoices,
      summary
    });
  }, [invoices, dateRange, statusFilter]);

  const handleExport = () => {
    // Implementar exportação CSV
    const csvContent = generateCSV(reportData.invoices);
    downloadCSV(csvContent, `relatorio-${dateRange.startDate}-${dateRange.endDate}.csv`);
  };

  const generateCSV = (data) => {
    const headers = ['Cliente', 'Serviço', 'Valor', 'Vencimento', 'Status'];
    const rows = data.map(invoice => {
      const client = clients.find(c => c.id === invoice.clientId);
      return [
        client ? client.name : 'Cliente não encontrado',
        invoice.description || 'N/A',
        invoice.amount,
        invoice.dueDate,
        invoice.status
      ];
    });

    const csvArray = [headers, ...rows];
    return csvArray.map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="reports-page">
      <div className="container">
        <div className="reports-header">
          <h1 className="reports-title">Relatórios</h1>
          <div>
            <button 
              onClick={handleExport}
              className="btn btn-secondary"
              disabled={reportData.invoices.length === 0}
            >
              📊 Exportar CSV
            </button>
          </div>
        </div>

        <DateFilter 
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Cards de Resumo */}
        <div className="grid grid-cols-4 mb-6">
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#2563eb' }}>
                {reportData.summary.totalInvoices}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Total de Faturas
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#16a34a' }}>
                {reportData.summary.paidInvoices}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Faturas Pagas
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#16a34a' }}>
                {formatCurrency(reportData.summary.totalRevenue)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Receita Total
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#d97706' }}>
                {formatCurrency(reportData.summary.pendingAmount)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Valor Pendente
              </div>
            </div>
          </div>
        </div>

        <ReportTable 
          invoices={reportData.invoices}
          clients={clients}
        />
      </div>
    </div>
  );
};

export default ReportsPage;