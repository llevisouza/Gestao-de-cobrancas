// src/components/dashboard/InvoiceTable.js
import React from 'react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { INVOICE_STATUS_LABELS } from '../../utils/constants';
import { invoiceService } from '../../services/firestore';

const InvoiceTable = ({ invoices, setInvoices }) => {
  const handleStatusChange = async (invoiceId, newStatus) => {
    // Atualização otimista
    setInvoices(prev => prev.map(inv =>
      inv.id === invoiceId ? { ...inv, status: newStatus } : inv
    ));

    try {
      const result = await invoiceService.update(invoiceId, { status: newStatus });
      if (!result.success) {
        // Reverter se falhou
        setInvoices(prev => prev.map(inv =>
          inv.id === invoiceId ? { ...inv, status: invoices.find(i => i.id === invoiceId)?.status } : inv
        ));
        alert('Erro ao atualizar status da fatura');
      }
    } catch (error) {
      console.error('Erro ao atualizar fatura:', error);
      // Reverter em caso de erro
      setInvoices(prev => prev.map(inv =>
        inv.id === invoiceId ? { ...inv, status: invoices.find(i => i.id === invoiceId)?.status } : inv
      ));
      alert('Erro ao atualizar status da fatura');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'paid': 'bg-green-100 text-green-800 border-green-300',
      'overdue': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return (
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'overdue':
        return (
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'pending':
      default:
        return (
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };
  
  if (invoices.length === 0) {
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
                    const today = new Date();
                    const dueDate = new Date(invoice.dueDate);
                    const diffTime = dueDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays < 0) {
                      return `${Math.abs(diffDays)} dias em atraso`;
                    } else if (diffDays === 0) {
                      return 'Vence hoje';
                    } else if (diffDays === 1) {
                      return 'Vence amanhã';
                    } else {
                      return `${diffDays} dias restantes`;
                    }
                  })()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(invoice.amount)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={invoice.status}
                  onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${getStatusColor(invoice.status)}`}
                >
                  {Object.entries(INVOICE_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTable;