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
    const badgeMap = {
      [INVOICE_STATUS.PENDING]: 'badge badge-warning',
      [INVOICE_STATUS.PAID]: 'badge badge-success',
      [INVOICE_STATUS.OVERDUE]: 'badge badge-danger'
    };
    
    return (
      <span className={badgeMap[status] || 'badge badge-primary'}>
        {INVOICE_STATUS_LABELS[status] || status}
      </span>
    );
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };

  const getDaysInfo = (invoice) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(invoice.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (invoice.status === 'paid') return { text: 'Pago', class: 'text-success-600' };
    if (diffDays < 0) return { text: `${Math.abs(diffDays)} dias em atraso`, class: 'text-error-600' };
    if (diffDays === 0) return { text: 'Vence hoje', class: 'text-warning-600' };
    if (diffDays === 1) return { text: 'Vence amanhã', class: 'text-warning-600' };
    return { text: `${diffDays} dias restantes`, class: 'text-gray-500' };
  };
  
  if (!invoices || invoices.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma fatura encontrada</h3>
        <p className="text-gray-600">As faturas aparecerão aqui quando forem geradas</p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header da tabela */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">
          Faturas Recentes ({invoices.length})
        </h3>
      </div>
      
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => {
              const daysInfo = getDaysInfo(invoice);
              
              return (
                <tr key={invoice.id}>
                  <td>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-primary-700">
                          {getClientName(invoice.clientId)?.charAt(0)?.toUpperCase() || 'C'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getClientName(invoice.clientId)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Gerado em {formatDate(invoice.generationDate)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm text-gray-900">{formatDate(invoice.dueDate)}</div>
                    <div className={`text-sm font-medium ${daysInfo.class}`}>
                      {daysInfo.text}
                    </div>
                  </td>
                  <td>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </span>
                  </td>
                  <td>
                    {invoice.status === INVOICE_STATUS.PENDING ? (
                      <select
                        value={invoice.status}
                        onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                        className="form-select text-sm py-1 px-2"
                      >
                        <option value={INVOICE_STATUS.PENDING}>Pendente</option>
                        <option value={INVOICE_STATUS.PAID}>Pago</option>
                      </select>
                    ) : (
                      getStatusBadge(invoice.status)
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceTable;