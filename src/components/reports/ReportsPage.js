// src/components/reports/ReportsPage.js - VERSÃO CORRIGIDA FINAL
import React, { useState, useMemo } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getDaysDifference, getCurrentDate } from '../../utils/dateUtils';
import { INVOICE_STATUS_LABELS } from '../../utils/constants';

const ReportsPage = ({ invoices, clients }) => {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'all',
    client: 'all',
    minAmount: '',
    maxAmount: ''
  });
  
  const [sortConfig, setSortConfig] = useState({
    key: 'dueDate',
    direction: 'desc'
  });
  
  const [viewMode, setViewMode] = useState('table');
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Períodos rápidos
  const quickPeriods = [
    {
      label: 'Hoje',
      icon: '📅',
      getValue: () => {
        const today = getCurrentDate();
        return { startDate: today, endDate: today };
      }
    },
    {
      label: 'Últimos 7 dias',
      icon: '📊',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'Este Mês',
      icon: '📈',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = getCurrentDate();
        return { startDate: start, endDate: end };
      }
    },
    {
      label: 'Mês Anterior',
      icon: '⏮️',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        return { startDate: start, endDate: end };
      }
    }
  ];

  // Filtrar faturas corretamente
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Filtro por data - usar dueDate da fatura
      const invoiceDueDate = new Date(invoice.dueDate + 'T12:00:00');
      const startDate = new Date(filters.startDate + 'T00:00:00');
      const endDate = new Date(filters.endDate + 'T23:59:59');
      
      const dateInRange = invoiceDueDate >= startDate && invoiceDueDate <= endDate;
      
      // Corrigir status se necessário
      let actualStatus = invoice.status;
      if (invoice.status === 'pending' && getDaysDifference(invoice.dueDate) < 0) {
        actualStatus = 'overdue';
      }
      
      const statusMatch = filters.status === 'all' || actualStatus === filters.status;
      const clientMatch = filters.client === 'all' || invoice.clientId === filters.client;
      
      // Filtros de valor
      let amountMatch = true;
      const amount = parseFloat(invoice.amount || 0);
      if (filters.minAmount && amount < parseFloat(filters.minAmount)) amountMatch = false;
      if (filters.maxAmount && amount > parseFloat(filters.maxAmount)) amountMatch = false;
      
      return dateInRange && statusMatch && clientMatch && amountMatch;
    });
  }, [invoices, filters]);

  // Ordenar faturas
  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'clientName':
          const clientA = clients.find(c => c.id === a.clientId)?.name || '';
          const clientB = clients.find(c => c.id === b.clientId)?.name || '';
          aValue = clientA.toLowerCase();
          bValue = clientB.toLowerCase();
          break;
        case 'amount':
          aValue = parseFloat(a.amount || 0);
          bValue = parseFloat(b.amount || 0);
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case 'status':
          // Corrigir status para ordenação
          aValue = a.status === 'pending' && getDaysDifference(a.dueDate) < 0 ? 'overdue' : a.status;
          bValue = b.status === 'pending' && getDaysDifference(b.dueDate) < 0 ? 'overdue' : b.status;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredInvoices, sortConfig, clients]);

  // Calcular métricas
  const metrics = useMemo(() => {
    const total = filteredInvoices.length;
    
    // Corrigir status para cálculos
    const correctedInvoices = filteredInvoices.map(invoice => ({
      ...invoice,
      actualStatus: invoice.status === 'pending' && getDaysDifference(invoice.dueDate) < 0 ? 'overdue' : invoice.status
    }));
    
    const paid = correctedInvoices.filter(inv => inv.actualStatus === 'paid').length;
    const pending = correctedInvoices.filter(inv => inv.actualStatus === 'pending').length;
    const overdue = correctedInvoices.filter(inv => inv.actualStatus === 'overdue').length;
    
    const totalRevenue = correctedInvoices
      .filter(inv => inv.actualStatus === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
      
    const pendingRevenue = correctedInvoices
      .filter(inv => inv.actualStatus === 'pending')
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

    const overdueRevenue = correctedInvoices
      .filter(inv => inv.actualStatus === 'overdue')
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

    const paymentRate = total > 0 ? (paid / total * 100) : 0;
    const averageAmount = total > 0 ? correctedInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0) / total : 0;
    
    // Análise por cliente
    const clientsData = clients
      .map(client => {
        const clientInvoices = correctedInvoices.filter(inv => inv.clientId === client.id);
        return {
          id: client.id,
          name: client.name,
          totalInvoices: clientInvoices.length,
          totalAmount: clientInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0),
          paidAmount: clientInvoices.filter(inv => inv.actualStatus === 'paid').reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0),
          paymentRate: clientInvoices.length > 0 ? (clientInvoices.filter(inv => inv.actualStatus === 'paid').length / clientInvoices.length * 100) : 0
        };
      })
      .filter(client => client.totalInvoices > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return { 
      total, paid, pending, overdue, 
      totalRevenue, pendingRevenue, overdueRevenue,
      paymentRate, averageAmount, clientsData
    };
  }, [filteredInvoices, clients]);

  // Handlers
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

  const applyQuickPeriod = (period) => {
    const dates = period.getValue();
    setFilters(prev => ({ ...prev, ...dates }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: getCurrentDate(),
      status: 'all',
      client: 'all',
      minAmount: '',
      maxAmount: ''
    });
  };

  // Exportar dados
  const exportToCSV = () => {
    const headers = ['Cliente', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Data Pagamento'];
    const csvData = sortedInvoices.map(invoice => {
      // Corrigir status para export
      const actualStatus = invoice.status === 'pending' && getDaysDifference(invoice.dueDate) < 0 ? 'overdue' : invoice.status;
      
      return [
        getClientName(invoice.clientId),
        invoice.description || 'Sem descrição',
        `R$ ${parseFloat(invoice.amount || 0).toFixed(2).replace('.', ',')}`,
        formatDate(invoice.dueDate),
        INVOICE_STATUS_LABELS[actualStatus] || actualStatus,
        invoice.paidDate ? formatDate(invoice.paidDate) : '-'
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-${filters.startDate}-${filters.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    alert('🚀 Em breve: Exportação para PDF com gráficos e layout profissional!');
  };

  const handleInvoiceSelect = (invoiceId) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const selectAllInvoices = () => {
    setSelectedInvoices(
      selectedInvoices.length === sortedInvoices.length && sortedInvoices.length > 0
        ? [] 
        : sortedInvoices.map(inv => inv.id)
    );
  };

  const handleBulkAction = (action) => {
    if (selectedInvoices.length === 0) {
      alert('Selecione pelo menos uma fatura');
      return;
    }

    switch (action) {
      case 'mark_paid':
        if (window.confirm(`Marcar ${selectedInvoices.length} faturas como pagas?`)) {
          alert('🚀 Em breve: Ação em lote - Marcar como pago');
        }
        break;
      case 'send_reminder':
        if (window.confirm(`Enviar lembretes para ${selectedInvoices.length} faturas?`)) {
          alert('🚀 Em breve: Ação em lote - Enviar lembretes');
        }
        break;
      case 'export_selected':
        alert('🚀 Em breve: Exportar faturas selecionadas');
        break;
      case 'delete':
        if (window.confirm(`ATENÇÃO: Excluir ${selectedInvoices.length} faturas permanentemente?`)) {
          alert('🚀 Em breve: Ação em lote - Excluir faturas');
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="dashboard-container">
        
        {/* Header */}
        <div className="dashboard-header">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="flex-1">
              <h1 className="dashboard-title flex items-center gap-3">
                <span className="text-3xl">📊</span>
                Relatórios
              </h1>
              <p className="dashboard-subtitle">
                Análise detalhada das suas faturas e performance financeira
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Seletor de Visualização */}
              <div className="flex bg-white rounded-lg p-1 shadow-sm border">
                {[
                  { key: 'table', icon: '📋', label: 'Tabela' },
                  { key: 'cards', icon: '🃏', label: 'Cards' },
                  { key: 'chart', icon: '📈', label: 'Gráficos' }
                ].map(view => (
                  <button
                    key={view.key}
                    onClick={() => setViewMode(view.key)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                      viewMode === view.key
                        ? 'bg-orange-100 text-orange-700 font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>{view.icon}</span>
                    <span className="hidden sm:inline">{view.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Botões de Export */}
              <button onClick={exportToCSV} className="btn-success px-4 py-2 rounded-lg shadow-sm">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                CSV
              </button>
              
              <button onClick={exportToPDF} className="btn-primary px-4 py-2 rounded-lg shadow-sm">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span>🔍</span>
            Filtros Avançados
          </h3>
          
          <div className="flex items-center justify-between mb-6">
            <div></div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
            >
              <span>{showAdvancedFilters ? 'Menos' : 'Mais'} filtros</span>
              <svg className={`w-4 h-4 transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Períodos Rápidos */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Períodos Rápidos</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {quickPeriods.map((period, index) => (
                <button
                  key={index}
                  onClick={() => applyQuickPeriod(period)}
                  className="flex items-center justify-center gap-2 p-3 text-sm border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
                >
                  <span className="text-lg">{period.icon}</span>
                  <span className="font-medium">{period.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filtros Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Data Início
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="form-input w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Data Fim
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="form-input w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="form-select w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="overdue">Vencido</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👤 Cliente
              </label>
              <select
                value={filters.client}
                onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
                className="form-select w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">Todos os clientes</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtros Avançados */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💰 Valor Mínimo
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  className="form-input w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💰 Valor Máximo
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="9999,99"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  className="form-input w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              
              <div className="flex items-end">
                <button 
                  onClick={clearFilters} 
                  className="btn-secondary w-full py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Limpar
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <p className="text-sm text-gray-600">
              {filteredInvoices.length} de {invoices.length} faturas encontradas
            </p>
          </div>
        </div>

        {/* KPIs dos Relatórios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">📄</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{metrics.total}</div>
            <div className="text-sm text-gray-600">Faturas Encontradas</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">💰</div>
              <div className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                {metrics.paymentRate.toFixed(1)}%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{metrics.paid}</div>
            <div className="text-sm text-gray-600">Faturas Pagas</div>
            <div className="text-xs text-green-600 font-medium mt-1">
              {formatCurrency(metrics.totalRevenue)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">⏳</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{metrics.pending}</div>
            <div className="text-sm text-gray-600">Pendentes</div>
            <div className="text-xs text-yellow-600 font-medium mt-1">
              {formatCurrency(metrics.pendingRevenue)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl">⚠️</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{metrics.overdue}</div>
            <div className="text-sm text-gray-600">Vencidas</div>
            <div className="text-xs text-red-600 font-medium mt-1">
              {formatCurrency(metrics.overdueRevenue)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">📊</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(metrics.averageAmount)}
            </div>
            <div className="text-sm text-gray-600">Ticket Médio</div>
          </div>
        </div>

        {/* Ranking de Clientes */}
        {metrics.clientsData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <span>🏆</span>
              Top Clientes do Período
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {metrics.clientsData.slice(0, 3).map((client, index) => (
                <div key={client.id} className="relative bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                  {/* Badge de posição */}
                  <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center font-semibold text-orange-700">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{client.name}</h4>
                      <p className="text-sm text-gray-600">{client.totalInvoices} faturas</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Faturamento</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(client.totalAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Recebido</span>
                      <span className="font-semibold text-green-600">{formatCurrency(client.paidAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Taxa Pgto</span>
                      <span className={`font-semibold ${client.paymentRate >= 80 ? 'text-green-600' : client.paymentRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {client.paymentRate.toFixed(1)}%
                      </span>
                    </div>
                    
                    {/* Barra de progresso */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          client.paymentRate >= 80 ? 'bg-green-500' : client.paymentRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${client.paymentRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabelas/Cards por modo de visualização */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Faturas Encontradas ({sortedInvoices.length})
                </h3>
                
                {selectedInvoices.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      {selectedInvoices.length} selecionadas
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleBulkAction('mark_paid')}
                        className="btn-success text-sm py-1 px-3 rounded-lg"
                      >
                        ✅ Marcar Pagas
                      </button>
                      <button 
                        onClick={() => handleBulkAction('send_reminder')}
                        className="btn-primary text-sm py-1 px-3 rounded-lg"
                      >
                        📧 Enviar Lembretes
                      </button>
                      <button 
                        onClick={() => handleBulkAction('export_selected')}
                        className="btn-secondary text-sm py-1 px-3 rounded-lg"
                      >
                        📄 Exportar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {sortedInvoices.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma fatura encontrada</h3>
                <p className="text-gray-600 mb-6">Ajuste os filtros para ver mais resultados</p>
                <button onClick={clearFilters} className="btn-primary">
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-12 text-center">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.length === sortedInvoices.length && sortedInvoices.length > 0}
                          onChange={selectAllInvoices}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      </th>
                      <th 
                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('clientName')}
                      >
                        Cliente {getSortIcon('clientName')}
                      </th>
                      <th>Descrição</th>
                      <th 
                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('amount')}
                      >
                        Valor {getSortIcon('amount')}
                      </th>
                      <th 
                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('dueDate')}
                      >
                        Vencimento {getSortIcon('dueDate')}
                      </th>
                      <th 
                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        Status {getSortIcon('status')}
                      </th>
                      <th>Data Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedInvoices.map(invoice => {
                      // Corrigir status para exibição
                      const actualStatus = invoice.status === 'pending' && getDaysDifference(invoice.dueDate) < 0 ? 'overdue' : invoice.status;
                      
                      return (
                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={selectedInvoices.includes(invoice.id)}
                              onChange={() => handleInvoiceSelect(invoice.id)}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-semibold text-orange-700">
                                {getClientName(invoice.clientId)?.charAt(0)?.toUpperCase() || 'C'}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {getClientName(invoice.clientId)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  #{invoice.id?.slice(0, 8)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="max-w-xs">
                              <div className="font-medium text-gray-900 truncate">
                                {invoice.description || 'Sem descrição'}
                              </div>
                              {invoice.subscriptionId && (
                                <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full inline-block mt-1">
                                  Recorrente
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="font-semibold text-gray-900">
                              {formatCurrency(invoice.amount)}
                            </div>
                          </td>
                          <td>
                            <div className="font-medium text-gray-900">
                              {formatDate(invoice.dueDate)}
                            </div>
                          </td>
                          <td>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              actualStatus === 'paid' 
                                ? 'bg-green-100 text-green-800'
                                : actualStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {INVOICE_STATUS_LABELS[actualStatus] || actualStatus}
                            </span>
                          </td>
                          <td className="text-gray-500">
                            {invoice.paidDate ? formatDate(invoice.paidDate) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Visualização em Cards */}
        {viewMode === 'cards' && (
          <div className="space-y-6">
            {sortedInvoices.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 text-center py-16">
                <div className="text-6xl mb-4">🃏</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma fatura encontrada</h3>
                <p className="text-gray-600 mb-6">Ajuste os filtros para ver mais resultados</p>
                <button onClick={clearFilters} className="btn-primary">
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedInvoices.map(invoice => {
                  const actualStatus = invoice.status === 'pending' && getDaysDifference(invoice.dueDate) < 0 ? 'overdue' : invoice.status;
                  
                  return (
                    <div key={invoice.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center font-semibold text-orange-700">
                            {getClientName(invoice.clientId)?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{getClientName(invoice.clientId)}</h4>
                            <p className="text-xs text-gray-500">#{invoice.id?.slice(0, 8)}</p>
                          </div>
                        </div>
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          actualStatus === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : actualStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {INVOICE_STATUS_LABELS[actualStatus] || actualStatus}
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Valor:</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(invoice.amount)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Vencimento:</span>
                          <span className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</span>
                        </div>
                        
                        {invoice.paidDate && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Pagamento:</span>
                            <span className="text-green-600 font-medium">{formatDate(invoice.paidDate)}</span>
                          </div>
                        )}
                      </div>
                      
                      {invoice.description && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {invoice.description}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        {invoice.subscriptionId && (
                          <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            🔄 Recorrente
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={() => handleInvoiceSelect(invoice.id)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Visualização em Gráficos */}
        {viewMode === 'chart' && (
          <div className="space-y-8">
            {/* Gráfico de Status */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <span>📈</span>
                Distribuição por Status
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gráfico de Pizza Visual */}
                <div className="flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Círculo de fundo */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                      
                      {/* Segmento de pagas (verde) */}
                      {metrics.paid > 0 && (
                        <circle 
                          cx="50" cy="50" r="40" fill="none" 
                          stroke="#22c55e" strokeWidth="8"
                          strokeDasharray={`${(metrics.paid / metrics.total) * 251.2} 251.2`}
                          strokeDashoffset="0"
                        />
                      )}
                      
                      {/* Segmento de pendentes (amarelo) */}
                      {metrics.pending > 0 && (
                        <circle 
                          cx="50" cy="50" r="40" fill="none" 
                          stroke="#f59e0b" strokeWidth="8"
                          strokeDasharray={`${(metrics.pending / metrics.total) * 251.2} 251.2`}
                          strokeDashoffset={`-${(metrics.paid / metrics.total) * 251.2}`}
                        />
                      )}
                      
                      {/* Segmento de vencidas (vermelho) */}
                      {metrics.overdue > 0 && (
                        <circle 
                          cx="50" cy="50" r="40" fill="none" 
                          stroke="#ef4444" strokeWidth="8"
                          strokeDasharray={`${(metrics.overdue / metrics.total) * 251.2} 251.2`}
                          strokeDashoffset={`-${((metrics.paid + metrics.pending) / metrics.total) * 251.2}`}
                        />
                      )}
                    </svg>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{metrics.total}</div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Legenda */}
                <div className="flex flex-col justify-center space-y-4">
                  {[
                    { label: 'Pagas', count: metrics.paid, color: 'bg-green-500', percentage: (metrics.paid / metrics.total * 100).toFixed(1) },
                    { label: 'Pendentes', count: metrics.pending, color: 'bg-yellow-500', percentage: (metrics.pending / metrics.total * 100).toFixed(1) },
                    { label: 'Vencidas', count: metrics.overdue, color: 'bg-red-500', percentage: (metrics.overdue / metrics.total * 100).toFixed(1) }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                        <span className="font-medium text-gray-900">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{item.count}</div>
                        <div className="text-xs text-gray-500">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Métricas de Performance */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <span>🎯</span>
                Métricas de Performance
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {metrics.paymentRate.toFixed(1)}%
                  </div>
                  <div className="text-sm font-medium text-green-800">Taxa de Pagamento</div>
                  <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                    <div className="bg-green-600 h-2 rounded-full transition-all duration-1000" 
                         style={{ width: `${metrics.paymentRate}%` }}></div>
                  </div>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {formatCurrency(metrics.averageAmount)}
                  </div>
                  <div className="text-sm font-medium text-blue-800">Ticket Médio</div>
                  <div className="text-xs text-blue-600 mt-2">Por fatura gerada</div>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {formatCurrency(metrics.totalRevenue + metrics.pendingRevenue + metrics.overdueRevenue)}
                  </div>
                  <div className="text-sm font-medium text-orange-800">Faturamento Total</div>
                  <div className="text-xs text-orange-600 mt-2">Período selecionado</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer com Resumo */}
        <div className="mt-8 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl border border-orange-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Resumo do Relatório</h4>
              <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                <span>📅 Período: {formatDate(filters.startDate)} até {formatDate(filters.endDate)}</span>
                <span>📊 {sortedInvoices.length} faturas encontradas</span>
                <span>💰 {formatCurrency(metrics.totalRevenue + metrics.pendingRevenue + metrics.overdueRevenue)} em volume</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={exportToCSV} className="btn-success px-4 py-2 rounded-lg">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Exportar Dados
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;