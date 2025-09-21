
// src/components/dashboard/InvoiceTable.js - VERSÃO CORRIGIDA
import React, { useMemo } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { INVOICE_STATUS, INVOICE_STATUS_LABELS } from '../../utils/constants';

// Função corrigida para calcular diferença de dias
const getDaysDifference = (dateString) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zerar horas para comparação exata
    
    const targetDate = new Date(dateString + 'T12:00:00'); // Meio-dia para evitar problemas de timezone
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    console.log('[DEBUG] Diferença de dias:', {
      dateString,
      today: today.toDateString(),
      targetDate: targetDate.toDateString(),
      diffDays
    });
    
    return diffDays;
  } catch (error) {
    console.error('Erro ao calcular diferença de dias:', error);
    return 0;
  }
};

const InvoiceTable = ({ invoices, clients }) => {
  const { updateInvoice } = useFirestore();

  // Memoizar a busca de nomes dos clientes para evitar recalcular
  const clientsMap = useMemo(() => {
    const map = new Map();
    clients.forEach(client => {
      map.set(client.id, client);
    });
    return map;
  }, [clients]);

  // Memoizar as faturas ordenadas com status automático corrigido
  const sortedInvoices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return [...invoices]
      .map(invoice => {
        // Atualizar status automaticamente baseado na data
        const dueDate = new Date(invoice.dueDate + 'T12:00:00');
        dueDate.setHours(0, 0, 0, 0);
        
        let correctedStatus = invoice.status;
        
        // Se está pendente e já venceu, marcar como vencida
        if (invoice.status === 'pending' && dueDate < today) {
          correctedStatus = 'overdue';
        }
        
        return {
          ...invoice,
          status: correctedStatus
        };
      })
      .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
      .slice(0, 10); // Mostrar apenas as 10 mais recentes
  }, [invoices]);

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

  // Função melhorada para obter dados do cliente
  const getClientData = (clientId) => {
    const client = clientsMap.get(clientId);
    return {
      name: client ? client.name : 'Cliente não encontrado',
      email: client ? client.email : '',
      exists: !!client
    };
  };

  // Função CORRIGIDA para informações de dias
  const getDaysInfo = (invoice) => {
    const diffDays = getDaysDifference(invoice.dueDate);

    if (invoice.status === 'paid') {
      return { text: 'Pago', class: 'text-success-600' };
    }
    
    if (diffDays < 0) {
      const daysOverdue = Math.abs(diffDays);
      return { 
        text: `${daysOverdue} dias em atraso`, 
        class: 'text-error-600 font-medium' 
      };
    }
    
    if (diffDays === 0) {
      return { text: 'Vence hoje', class: 'text-warning-600 font-medium' };
    }
    
    if (diffDays === 1) {
      return { text: 'Vence amanhã', class: 'text-warning-600' };
    }
    
    return { text: `${diffDays} dias restantes`, class: 'text-gray-500' };
  };
  
  if (!invoices || invoices.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma fatura encontrada</h3>
        <p className="text-gray-600 mb-4">As faturas aparecerão aqui quando forem geradas</p>
        <div className="text-sm text-gray-500">
          <p>💡 <strong>Dica:</strong> Use o botão "Gerar Faturas" no Dashboard para criar faturas baseadas nas assinaturas ativas</p>
        </div>
      </div>
    );
  }

    return (
      <div className="card">
        {/* Header da tabela */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Faturas Recentes
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Mostrando {Math.min(sortedInvoices.length, 10)} de {invoices.length} faturas
              </p>
            </div>
          
          {/* Estatísticas rápidas */}
          <div className="flex space-x-6 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {invoices.filter(inv => inv.status === 'paid').length}
              </div>
              <div className="text-gray-500">Pagas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">
                {invoices.filter(inv => inv.status === 'pending').length}
              </div>
              <div className="text-gray-500">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">
                {invoices.filter(inv => inv.status === 'overdue').length}
              </div>
              <div className="text-gray-500">Vencidas</div>
            </div>
          </div>
        </div>
      </div>
      
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
            {sortedInvoices.map(invoice => {
              const daysInfo = getDaysInfo(invoice);
              const clientData = getClientData(invoice.clientId);
              
              return (
                <tr key={invoice.id} className={`${!clientData.exists ? 'bg-yellow-50' : ''}`}>
                  <td>
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                        clientData.exists ? 'bg-primary-100' : 'bg-yellow-100'
                      }`}>
                        <span className={`text-sm font-medium ${
                          clientData.exists ? 'text-primary-700' : 'text-yellow-700'
                        }`}>
                          {clientData.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${
                          clientData.exists ? 'text-gray-900' : 'text-yellow-700'
                        }`}>
                          {clientData.name}
                          {!clientData.exists && (
                            <span className="ml-1 text-xs text-yellow-600">
                              ⚠️
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {clientData.email ? clientData.email : 'Email não disponível'}
                        </div>
                        <div className="text-xs text-gray-400">
                          Gerado em {formatDate(invoice.generationDate)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </span>
                    {invoice.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {invoice.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="text-sm text-gray-900">{formatDate(invoice.dueDate)}</div>
                    <div className={`text-sm font-medium ${daysInfo.class}`}>
                      {daysInfo.text}
                    </div>
                  </td>
                  <td>
                    {invoice.status === INVOICE_STATUS.PENDING ? (
                      <select
                        value={invoice.status}
                        onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                        className="form-select text-sm py-1 px-2 border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value={INVOICE_STATUS.PENDING}>Pendente</option>
                        <option value={INVOICE_STATUS.PAID}>Pago</option>
                      </select>
                    ) : (
                      getStatusBadge(invoice.status)
                    )}
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      {invoice.status === INVOICE_STATUS.PENDING && (
                        <button
                          onClick={() => handleStatusChange(invoice.id, INVOICE_STATUS.PAID)}
                          className="text-green-600 hover:text-green-800 text-xs font-medium"
                          title="Marcar como pago"
                        >
                          ✅ Pago
                        </button>
                      )}
                      {invoice.status === INVOICE_STATUS.PAID && invoice.paidDate && (
                        <span className="text-xs text-gray-500">
                          Pago em {formatDate(invoice.paidDate)}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer com link para ver todas */}
      {invoices.length > 10 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center">
          <button className="text-sm text-primary-600 hover:text-primary-800 font-medium">
            Ver todas as {invoices.length} faturas
          </button>
        </div>
      )}
    </div>
  );
};

export default InvoiceTable;