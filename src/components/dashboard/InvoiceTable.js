// src/components/dashboard/InvoiceTable.js
import React from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { INVOICE_STATUS, INVOICE_STATUS_LABELS } from '../../utils/constants';

const InvoiceTable = ({ invoices, clients }) => {
  const { updateInvoice } = useFirestore();

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      await updateInvoice(invoiceId, { status: newStatus });
    } catch (error) {
      console.error('Erro ao atualizar fatura:', error);
      alert('Erro ao atualizar status da fatura');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      [INVOICE_STATUS.PENDING]: 'badge badge-warning',
      [INVOICE_STATUS.PAID]: 'badge badge-success',
      [INVOICE_STATUS.OVERDUE]: 'badge badge-danger'
    };
    return (
      <span className={colors[status] || 'badge badge-info'}>
        {INVOICE_STATUS_LABELS[status] || status}
      </span>
    );
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };
  
  if (!invoices || invoices.length === 0) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <svg style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', color: '#d1d5db' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>Nenhuma fatura encontrada</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>As faturas aparecerão aqui quando forem geradas</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0' }}>
          Faturas Recentes ({invoices.length})
        </h3>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Cliente
              </th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Vencimento
              </th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Valor
              </th>
              <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.75rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#2563eb' }}>
                        {getClientName(invoice.clientId)?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                        {getClientName(invoice.clientId)}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Gerado em {formatDate(invoice.generationDate)}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: '0.875rem', color: '#111827' }}>{formatDate(invoice.dueDate)}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const dueDate = new Date(invoice.dueDate);
                      dueDate.setHours(0, 0, 0, 0);
                      
                      const diffTime = dueDate.getTime() - today.getTime();
                      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                      if (invoice.status === 'paid') return 'Pago';
                      if (diffDays < 0) return `${Math.abs(diffDays)} dias em atraso`;
                      if (diffDays === 0) return 'Vence hoje';
                      if (diffDays === 1) return 'Vence amanhã';
                      return `${diffDays} dias restantes`;
                    })()}
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                    {formatCurrency(invoice.amount)}
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                  {invoice.status === INVOICE_STATUS.PENDING ? (
                    <select
                      value={invoice.status}
                      onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value={INVOICE_STATUS.PENDING}>Pendente</option>
                      <option value={INVOICE_STATUS.PAID}>Pago</option>
                    </select>
                  ) : (
                    getStatusBadge(invoice.status)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceTable;