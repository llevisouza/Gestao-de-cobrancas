// src/components/dashboard/InvoiceTable.js
import React from 'react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { INVOICE_STATUS, INVOICE_STATUS_LABELS } from '../../utils/constants';
import { invoiceService } from '../../services/firestore';

const InvoiceTable = ({ invoices, setInvoices }) => {
  const handleStatusChange = async (invoiceId, newStatus) => {
    // Atualização otimista
    const originalStatus = invoices.find(i => i.id === invoiceId)?.status;
    setInvoices(prev => prev.map(inv =>
      inv.id === invoiceId ? { ...inv, status: newStatus } : inv
    ));

    try {
      const result = await invoiceService.update(invoiceId, { status: newStatus });
      if (!result.success) {
        // Reverter se falhou
        setInvoices(prev => prev.map(inv =>
          inv.id === invoiceId ? { ...inv, status: originalStatus } : inv
        ));
        alert('Erro ao atualizar status da fatura');
      }
    } catch (error) {
      console.error('Erro ao atualizar fatura:', error);
      // Reverter em caso de erro
      setInvoices(prev => prev.map(inv =>
        inv.id === invoiceId ? { ...inv, status: originalStatus } : inv
      ));
      alert('Erro ao atualizar status da fatura');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      [INVOICE_STATUS.PENDING]: 'badge-warning',
      [INVOICE_STATUS.PAID]: 'badge-success',
      [INVOICE_STATUS.OVERDUE]: 'badge-danger'
    };
    return (
        <span className={`badge ${colors[status] || 'badge-info'}`}>
            {INVOICE_STATUS_LABELS[status] || status}
        </span>
    );
  };
  
  if (!invoices || invoices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">Nenhuma fatura encontrada</p>
          <p className="text-sm mt-1">As faturas aparecerão aqui quando forem geradas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vencimento
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
               Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map(invoice => (
            <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {invoice.clientName?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.clientName}
                    </div>
                    <div className="text-sm text-gray-500">
                      Gerado em {formatDate(invoice.generationDate)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{formatDate(invoice.dueDate)}</div>
                 <div className="text-sm text-gray-500">
                  {(() => {
                    // CORREÇÃO: Lógica de cálculo de dias
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
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                   {formatCurrency(invoice.amount)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {/* CORREÇÃO: Lógica de exibição do status */}
                {invoice.status === INVOICE_STATUS.PENDING ? (
                  <select
                    value={invoice.status}
                    onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                    className="form-select"
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
  );
};

export default InvoiceTable;