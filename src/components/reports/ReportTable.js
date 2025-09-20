import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ReportTable = ({ invoices, clients }) => {
  const [sortConfig, setSortConfig] = useState({
    key: 'dueDate',
    direction: 'desc'
  });

  // Ordenar faturas
  const sortedInvoices = [...invoices].sort((a, b) => {
    if (sortConfig.key === 'clientName') {
      const clientA = clients.find(c => c.id === a.clientId)?.name || '';
      const clientB = clients.find(c => c.id === b.clientId)?.name || '';
      return sortConfig.direction === 'asc' 
        ? clientA.localeCompare(clientB)
        : clientB.localeCompare(clientA);
    }

    if (sortConfig.key === 'amount') {
      const valueA = parseFloat(a.amount || 0);
      const valueB = parseFloat(b.amount || 0);
      return sortConfig.direction === 'asc' ? valueA - valueB : valueB - valueA;
    }

    if (sortConfig.key === 'dueDate') {
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    }

    return 0;
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'overdue':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Paga';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Vencida';
      default:
        return status;
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <h3>Nenhuma fatura encontrada</h3>
          <p style={{ color: '#6b7280' }}>
            Não há faturas para o período e filtros selecionados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          Faturas Encontradas ({invoices.length})
        </h3>
      </div>
      
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSort('clientName')}
              >
                Cliente {getSortIcon('clientName')}
              </th>
              <th>Descrição</th>
              <th 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSort('amount')}
              >
                Valor {getSortIcon('amount')}
              </th>
              <th 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSort('dueDate')}
              >
                Vencimento {getSortIcon('dueDate')}
              </th>
              <th>Status</th>
              <th>Data Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {sortedInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  <div>
                    <div style={{ fontWeight: '500' }}>
                      {getClientName(invoice.clientId)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      #{invoice.id?.slice(0, 8)}
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ maxWidth: '200px' }}>
                    {invoice.description || 'Sem descrição'}
                  </div>
                </td>
                <td style={{ fontWeight: '600' }}>
                  {formatCurrency(invoice.amount)}
                </td>
                <td>
                  {formatDate(invoice.dueDate)}
                </td>
                <td>
                  <span className={`badge ${getStatusBadgeClass(invoice.status)}`}>
                    {getStatusText(invoice.status)}
                  </span>
                </td>
                <td>
                  {invoice.paidDate ? formatDate(invoice.paidDate) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportTable;