// src/components/dashboard/InvoiceTable.js
import React from 'react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '../../utils/constants';
import { invoiceService } from '../../services/firestore';

const InvoiceTable = ({ invoices, setInvoices }) => {

  const handleStatusChange = async (invoiceId, newStatus) => {
    const result = await invoiceService.update(invoiceId, { status: newStatus });
    if (result.success) {
      setInvoices(prev => prev.map(inv =>
        inv.id === invoiceId ? { ...inv, status: newStatus } : inv
      ));
    }
  };
  
  if (invoices.length === 0) {
    return <p className="text-center text-gray-500 py-8">Nenhuma fatura encontrada.</p>;
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map(invoice => (
            <tr key={invoice.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.clientName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.dueDate)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(invoice.amount)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                 <select
                  value={invoice.status}
                  onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                  className={`p-1 rounded text-xs ${INVOICE_STATUS_COLORS[invoice.status]}`}
                >
                  {Object.entries(INVOICE_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
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