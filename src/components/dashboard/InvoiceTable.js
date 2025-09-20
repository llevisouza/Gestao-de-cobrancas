import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const InvoiceTable = ({ invoices, clients }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Filtrar faturas por status
  const filteredInvoices = invoices.filter(invoice => {
    if (statusFilter === 'all') return true;
    return invoice.status === statusFilter;
  });

  // Ordenar por data de vencimento (mais recentes primeiro)
  const sortedInvoices = filteredInvoices.sort((a, b) => {
    return new Date(b.dueDate) - new Date(a.dueDate);
  });

  // Pegar apenas as 10 mais recentes para o dashboard
  const recentInvoices = sortedInvoices.slice(0, 10);

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

  return (
    <div className="invoice-table-container">
      <div className="invoice-table-header">
        <h3 className="invoice-table-title">Faturas Recentes</h3>
        <div className="invoice-table-actions">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="paid">Pagas</option>
            <option value="overdue">Vencidas</option>
          </select>
        </div>
      </div>

      {recentInvoices.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          {invoices.length === 0 
            ? 'Nenhuma fatura encontrada. Clique em "Gerar Faturas" para começar.'
            : 'Nenhuma fatura encontrada para este filtro.'
          }
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((invoice) => (
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
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {invoice.status === 'pending' && (
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => {
                            // Implementar marcar como paga
                            alert('Funcionalidade em desenvolvimento');
                          }}
                        >
                          Marcar Paga
                        </button>
                      )}
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          // Implementar visualizar fatura
                          alert('Funcionalidade em desenvolvimento');
                        }}
                      >
                        Ver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {recentInvoices.length > 0 && (
        <div style={{ 
          padding: '1rem', 
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          textAlign: 'center'
        }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              // Implementar navegação para página de relatórios
              alert('Navegação para relatórios em desenvolvimento');
            }}
          >
            Ver Todas as Faturas
          </button>
        </div>
      )}
    </div>
  );
};

export default InvoiceTable;