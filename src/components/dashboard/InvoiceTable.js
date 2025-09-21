// src/components/dashboard/InvoiceTable.js - VERSÃO CORRIGIDA
import React, { useMemo, useState } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { getDaysDifference, getCurrentDate } from '../../utils/dateUtils';
import { INVOICE_STATUS, INVOICE_STATUS_LABELS } from '../../utils/constants';

const InvoiceTable = ({ invoices, clients }) => {
  const { updateInvoice } = useFirestore();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');

  // Memoizar a busca de nomes dos clientes
  const clientsMap = useMemo(() => {
    const map = new Map();
    clients.forEach(client => {
      map.set(client.id, client);
    });
    return map;
  }, [clients]);

  // CORREÇÃO: Processar faturas com status correto
  const processedInvoices = useMemo(() => {
    const today = getCurrentDate();
    
    return [...invoices]
      .map(invoice => {
        // Verificar se a fatura está realmente vencida
        let correctedStatus = invoice.status;
        const diffDays = getDaysDifference(invoice.dueDate, today);
        
        // Se está marcada como pending mas a data já passou, marcar como overdue
        if (invoice.status === 'pending' && diffDays < 0) {
          correctedStatus = 'overdue';
        }
        
        return { ...invoice, status: correctedStatus };
      })
      .filter(invoice => {
        if (filter === 'all') return true;
        return invoice.status === filter;
      })
      .sort((a, b) => {
        if (sortBy === 'dueDate') {
          return new Date(b.dueDate) - new Date(a.dueDate);
        } else if (sortBy === 'amount') {
          return parseFloat(b.amount || 0) - parseFloat(a.amount || 0);
        } else if (sortBy === 'status') {
          return a.status.localeCompare(b.status);
        }
        return 0;
      })
      .slice(0, 20);
  }, [invoices, filter, sortBy]);

  // Estatísticas das faturas
  const stats = useMemo(() => {
    const filtered = processedInvoices;
    return {
      total: filtered.length,
      paid: filtered.filter(inv => inv.status === 'paid').length,
      pending: filtered.filter(inv => inv.status === 'pending').length,
      overdue: filtered.filter(inv => inv.status === 'overdue').length,
      totalAmount: filtered.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0)
    };
  }, [processedInvoices]);

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      await updateInvoice(invoiceId, { status: newStatus });
      if (newStatus === 'paid') {
        alert('✅ Fatura marcada como paga!');
      }
    } catch (error) {
      console.error('Erro ao atualizar fatura:', error);
      alert('❌ Erro ao atualizar status da fatura');
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

  const getClientData = (clientId) => {
    const client = clientsMap.get(clientId);
    return {
      name: client ? client.name : 'Cliente não encontrado',
      email: client ? client.email : '',
      exists: !!client
    };
  };

  // CORREÇÃO: Função de dias corrigida
  const getDaysInfo = (invoice) => {
    const diffDays = getDaysDifference(invoice.dueDate);

    if (invoice.status === 'paid') {
      return { 
        text: '✅ Pago', 
        class: 'text-green-600 font-medium',
        bgClass: 'bg-green-50'
      };
    }
    
    if (diffDays < 0) {
      const daysOverdue = Math.abs(diffDays);
      return { 
        text: `⚠️ ${daysOverdue} dias em atraso`, 
        class: 'text-red-600 font-medium',
        bgClass: 'bg-red-50'
      };
    }
    
    if (diffDays === 0) {
      return { 
        text: '🔥 Vence hoje', 
        class: 'text-orange-600 font-medium',
        bgClass: 'bg-orange-50'
      };
    }
    
    if (diffDays <= 3) {
      return { 
        text: `⏰ ${diffDays} dia${diffDays > 1 ? 's' : ''} restante${diffDays > 1 ? 's' : ''}`, 
        class: 'text-yellow-600 font-medium',
        bgClass: 'bg-yellow-50'
      };
    }
    
    return { 
      text: `📅 ${diffDays} dia${diffDays > 1 ? 's' : ''} restante${diffDays > 1 ? 's' : ''}`, 
      class: 'text-gray-600',
      bgClass: 'bg-gray-50'
    };
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
      {/* Header com filtros e estatísticas */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              📋 Faturas Recentes
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Mostrando {processedInvoices.length} de {invoices.length} faturas
            </p>
          </div>

          {/* Filtros */}
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Todas</option>
              <option value="pending">Pendentes</option>
              <option value="paid">Pagas</option>
              <option value="overdue">Vencidas</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="dueDate">Por Data</option>
              <option value="amount">Por Valor</option>
              <option value="status">Por Status</option>
            </select>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-lg font-semibold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-lg font-semibold text-green-600">{stats.paid}</div>
            <div className="text-xs text-gray-500">Pagas</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-lg font-semibold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-500">Pendentes</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-lg font-semibold text-red-600">{stats.overdue}</div>
            <div className="text-xs text-gray-500">Vencidas</div>
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
            {processedInvoices.map(invoice => {
              const daysInfo = getDaysInfo(invoice);
              const clientData = getClientData(invoice.clientId);
              
              return (
                <tr 
                  key={invoice.id} 
                  className={`hover:bg-gray-50 transition-colors ${!clientData.exists ? 'bg-yellow-50' : ''}`}
                >
                  <td>
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                        clientData.exists ? 'bg-primary-100' : 'bg-yellow-100'
                      }`}>
                        <span className={`text-sm font-medium ${
                          clientData.exists ? 'text-primary-700' : 'text-yellow-700'
                        }`}>
                          {clientData.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${
                          clientData.exists ? 'text-gray-900' : 'text-yellow-700'
                        }`}>
                          {clientData.name}
                          {!clientData.exists && (
                            <span className="ml-1 text-xs text-yellow-600">⚠️</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {clientData.email || 'Email não disponível'}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="text-xs text-gray-400">
                            Gerado: {formatDate(invoice.generationDate)}
                          </div>
                          {invoice.subscriptionId && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Recorrente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </span>
                      {invoice.description && (
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                          {invoice.description}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <div className="text-sm">
                      <div className="text-gray-900 font-medium">
                        {formatDate(invoice.dueDate)}
                      </div>
                      <div className={`text-xs mt-1 px-2 py-1 rounded-full ${daysInfo.bgClass} ${daysInfo.class}`}>
                        {daysInfo.text}
                      </div>
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
                          className="text-green-600 hover:text-green-800 text-xs font-medium px-2 py-1 rounded bg-green-50 hover:bg-green-100 transition-colors"
                          title="Marcar como pago"
                        >
                          ✅ Marcar Pago
                        </button>
                      )}
                      
                      {invoice.status === INVOICE_STATUS.OVERDUE && (
                        <button
                          onClick={() => alert('🚀 Em breve: Função de reenvio de cobrança!')}
                          className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                          title="Reenviar cobrança"
                        >
                          📧 Cobrar
                        </button>
                      )}
                      
                      {invoice.status === INVOICE_STATUS.PAID && invoice.paidDate && (
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                          💚 Pago: {formatDate(invoice.paidDate)}
                        </span>
                      )}
                      
                      <button
                        onClick={() => alert('🚀 Em breve: Geração de PDF da fatura!')}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                        title="Gerar PDF"
                      >
                        📄 PDF
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer com informações */}
      {invoices.length > 20 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Mostrando as 20 faturas mais recentes de {invoices.length} total.
          </p>
        </div>
      )}

      {/* Resumo financeiro */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
        <div className="flex flex-wrap items-center justify-between space-y-2 lg:space-y-0">
          <div className="text-sm text-gray-700">
            <strong>Resumo Financeiro:</strong>
          </div>
          <div className="flex flex-wrap space-x-4 text-sm">
            <span className="text-green-700">
              💰 Total Pago: <strong>{formatCurrency(invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0))}</strong>
            </span>
            <span className="text-yellow-700">
              ⏳ Pendente: <strong>{formatCurrency(invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0))}</strong>
            </span>
            <span className="text-red-700">
              ⚠️ Vencido: <strong>{formatCurrency(invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0))}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTable;