import React, { useMemo, useState } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { getCurrentDate } from '../../utils/dateUtils';
import { INVOICE_STATUS, INVOICE_STATUS_LABELS } from '../../utils/constants';
import { 
  processInvoicesStandardized,
  getStandardizedDaysInfo,
  getCorrectedInvoiceStatus 
} from '../../utils/invoiceStatusUtils';

const InvoiceTable = ({ invoices, clients }) => {
  const { updateInvoice } = useFirestore();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [updatingInvoices, setUpdatingInvoices] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Limite de itens por página

  const clientsMap = useMemo(() => {
    const map = new Map();
    clients.forEach(client => {
      map.set(client.id, client);
    });
    return map;
  }, [clients]);

  const processedInvoices = useMemo(() => {
    // Usa o utilitário padronizado para processar faturas
    const standardizedInvoices = processInvoicesStandardized(invoices);
    
    return standardizedInvoices
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
      });
  }, [invoices, filter, sortBy]);

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedInvoices.slice(startIndex, startIndex + itemsPerPage);
  }, [processedInvoices, currentPage]);

  const totalPages = Math.ceil(processedInvoices.length / itemsPerPage);

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

  const handleMarkAsPaid = async (invoice) => {
    if (updatingInvoices.has(invoice.id)) return;
    
    const confirmMessage = `Marcar fatura de ${formatCurrency(invoice.amount)} como paga?\n\nCliente: ${getClientData(invoice.clientId).name}`;
    
    if (!window.confirm(confirmMessage)) return;

    setUpdatingInvoices(prev => new Set([...prev, invoice.id]));
    
    try {
      const updateData = {
        status: 'paid',
        paidDate: getCurrentDate(),
        paidAt: new Date().toISOString()
      };
      
      await updateInvoice(invoice.id, updateData);
      
      // Feedback visual temporário
      const rowElement = document.getElementById(`invoice-row-${invoice.id}`);
      if (rowElement) {
        rowElement.style.backgroundColor = '#f0fdf4';
        rowElement.style.borderColor = '#22c55e';
        setTimeout(() => {
          rowElement.style.backgroundColor = '';
          rowElement.style.borderColor = '';
        }, 2000);
      }
      
      console.log(`Fatura ${invoice.id} marcada como paga`);
    } catch (error) {
      console.error('Erro ao atualizar fatura:', error);
      alert(`Erro ao marcar fatura como paga: ${error.message}`);
    } finally {
      setUpdatingInvoices(prev => {
        const newSet = new Set(prev);
        newSet.delete(invoice.id);
        return newSet;
      });
    }
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    if (updatingInvoices.has(invoiceId)) return;
    
    setUpdatingInvoices(prev => new Set([...prev, invoiceId]));
    
    try {
      const updateData = { status: newStatus };
      
      if (newStatus === 'paid') {
        updateData.paidDate = getCurrentDate();
        updateData.paidAt = new Date().toISOString();
      }
      
      await updateInvoice(invoiceId, updateData);
      
      if (newStatus === 'paid') {
        alert('Fatura marcada como paga!');
      }
    } catch (error) {
      console.error('Erro ao atualizar fatura:', error);
      alert('Erro ao atualizar status da fatura');
    } finally {
      setUpdatingInvoices(prev => {
        const newSet = new Set(prev);
        newSet.delete(invoiceId);
        return newSet;
      });
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

  const getActions = (invoice) => {
    const correctedStatus = getCorrectedInvoiceStatus(invoice);
    let actions = [];

    if (correctedStatus === 'pending') {
      actions.push({
        label: 'Marcar como Pago',
        onClick: () => handleMarkAsPaid(invoice),
        color: 'green'
      });
    }

    if (correctedStatus === 'overdue') {
      actions.push({
        label: 'Regularizar',
        onClick: () => handleRegularize(invoice.id),
        color: 'red'
      });
    }

    return actions;
  };

  const handleRegularize = async (invoiceId) => {
    if (updatingInvoices.has(invoiceId)) return;

    setUpdatingInvoices(prev => new Set([...prev, invoiceId]));

    try {
      const updateData = {
        status: 'paid',
        paidDate: getCurrentDate(),
        paidAt: new Date().toISOString()
      };

      await updateInvoice(invoiceId, updateData);

      // Feedback visual temporário
      const rowElement = document.getElementById(`invoice-row-${invoiceId}`);
      if (rowElement) {
        rowElement.style.backgroundColor = '#f0fdf4';
        rowElement.style.borderColor = '#22c55e';
        setTimeout(() => {
          rowElement.style.backgroundColor = '';
          rowElement.style.borderColor = '';
        }, 2000);
      }

      alert('Fatura regularizada e marcada como paga!');
      console.log(`Fatura ${invoiceId} regularizada e marcada como paga`);
    } catch (error) {
      console.error('Erro ao regularizar fatura:', error);
      alert(`Erro ao regularizar fatura: ${error.message}`);
    } finally {
      setUpdatingInvoices(prev => {
        const newSet = new Set(prev);
        newSet.delete(invoiceId);
        return newSet;
      });
    }
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
          <p>Dica: Use o botão "Gerar Faturas" no Dashboard para criar faturas baseadas nas assinaturas ativas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header da tabela */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Faturas Recentes
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Mostrando {paginatedInvoices.length} de {invoices.length} faturas
            </p>
          </div>
          
          {/* Filtros */}
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1); // Reseta para a primeira página ao mudar o filtro
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Todas</option>
              <option value="pending">Pendentes</option>
              <option value="paid">Pagas</option>
              <option value="overdue">Vencidas</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1); // Reseta para a primeira página ao mudar a ordenação
              }}
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
            {paginatedInvoices.map(invoice => {
              // Usa o utilitário padronizado para informações de dias
              const daysInfo = getStandardizedDaysInfo(invoice);
              const clientData = getClientData(invoice.clientId);
              const isUpdating = updatingInvoices.has(invoice.id);
              const actions = getActions(invoice);
              
              return (
                <tr 
                  key={invoice.id}
                  id={`invoice-row-${invoice.id}`}
                  className={`hover:bg-gray-50 transition-all duration-200 ${!clientData.exists ? 'bg-yellow-50' : ''} ${isUpdating ? 'opacity-75' : ''}`}
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
                    {invoice.status === INVOICE_STATUS.PENDING || invoice.status === INVOICE_STATUS.OVERDUE ? (
                      getStatusBadge(invoice.status)
                    ) : (
                      <span className="text-sm text-gray-600">
                        {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      {actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={action.onClick}
                          disabled={isUpdating}
                          className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                            action.color === 'red'
                              ? 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'
                              : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                          }`}
                          title={action.label}
                        >
                          {isUpdating ? (
                            <div className="flex items-center">
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1"></div>
                              Salvando...
                            </div>
                          ) : (
                            action.label
                          )}
                        </button>
                      ))}
                      {invoice.status === INVOICE_STATUS.OVERDUE && (
                        <button
                          onClick={() => alert('Em breve: Função de reenvio de cobrança!')}
                          className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                          title="Reenviar cobrança"
                        >
                          Cobrar
                        </button>
                      )}
                      {invoice.status === INVOICE_STATUS.PAID && invoice.paidDate && (
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                          Pago: {formatDate(invoice.paidDate)}
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
      
      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
          </button>
        </div>
      )}
      
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
        <div className="flex flex-wrap items-center justify-between space-y-2 lg:space-y-0">
          <div className="text-sm text-gray-700">
            <strong>Resumo Financeiro:</strong>
          </div>
          <div className="flex flex-wrap space-x-4 text-sm">
            <span className="text-green-700">
              Total Pago: <strong>{formatCurrency(invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0))}</strong>
            </span>
            <span className="text-yellow-700">
              Pendente: <strong>{formatCurrency(invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0))}</strong>
            </span>
            <span className="text-red-700">
              Vencido: <strong>{formatCurrency(invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0))}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTable;