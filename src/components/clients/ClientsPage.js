// src/components/clients/ClientsPage.js - VERSÃO CORRIGIDA
import React, { useState, useMemo } from 'react'; // <-- CORREÇÃO AQUI
import { useFirestore } from '../../hooks/useFirestore';
import ClientModal from './ClientModal';
import SubscriptionModal from './SubscriptionModal';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatCurrency, formatDate, formatPhone, formatCPF } from '../../utils/formatters';

const ClientsPage = ({ clients, setClients, subscriptions, setSubscriptions }) => {
  // Estados do componente
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('table'); // table, cards, list
  const [selectedClients, setSelectedClients] = useState([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  // Estados dos modais
  const [clientModal, setClientModal] = useState({ isOpen: false, client: null });
  const [subscriptionModal, setSubscriptionModal] = useState({ isOpen: false, clientId: null, subscription: null });

  // Estados de filtros avançados
  const [advancedFilters, setAdvancedFilters] = useState({
    hasSubscriptions: 'all',
    hasOverdueInvoices: 'all',
    registrationPeriod: 'all',
    minRevenue: '',
    maxRevenue: ''
  });

  // Filtrar e ordenar clientes
  const filteredClients = useMemo(() => {
    let filtered = clients.filter(client => {
      // Filtro por busca
      const searchMatch = !searchTerm || 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone && client.phone.includes(searchTerm)) ||
        (client.cpf && client.cpf.includes(searchTerm));

      // Filtro por status
      const statusMatch = filterStatus === 'all' || 
        (filterStatus === 'active' && client.status !== 'inactive') ||
        (filterStatus === 'inactive' && client.status === 'inactive');

      // Filtros avançados
      const clientSubscriptions = subscriptions.filter(sub => sub.clientId === client.id);
      
      const hasSubscriptionsMatch = advancedFilters.hasSubscriptions === 'all' ||
        (advancedFilters.hasSubscriptions === 'yes' && clientSubscriptions.length > 0) ||
        (advancedFilters.hasSubscriptions === 'no' && clientSubscriptions.length === 0);

      // Calcular receita total do cliente
      const clientRevenue = clientSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
      
      const revenueMatch = 
        (!advancedFilters.minRevenue || clientRevenue >= parseFloat(advancedFilters.minRevenue)) &&
        (!advancedFilters.maxRevenue || clientRevenue <= parseFloat(advancedFilters.maxRevenue));

      return searchMatch && statusMatch && hasSubscriptionsMatch && revenueMatch;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt);
          bValue = new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt);
          break;
        case 'subscriptions':
          aValue = subscriptions.filter(sub => sub.clientId === a.id).length;
          bValue = subscriptions.filter(sub => sub.clientId === b.id).length;
          break;
        case 'revenue':
          aValue = subscriptions.filter(sub => sub.clientId === a.id).reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
          bValue = subscriptions.filter(sub => sub.clientId === b.id).reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [clients, subscriptions, searchTerm, filterStatus, sortBy, sortOrder, advancedFilters]);

  // Estatísticas dos clientes
  const clientStats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(c => c.status !== 'inactive').length;
    const withSubscriptions = clients.filter(c => 
      subscriptions.some(sub => sub.clientId === c.id && sub.status === 'active')
    ).length;
    
    const totalRevenue = subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
    
    const averageRevenue = withSubscriptions > 0 ? totalRevenue / withSubscriptions : 0;

    return { total, active, withSubscriptions, totalRevenue, averageRevenue };
  }, [clients, subscriptions]);

  // Handlers
  const handleCreateClient = () => {
    setClientModal({ isOpen: true, client: null });
  };

  const handleEditClient = (client) => {
    setClientModal({ isOpen: true, client });
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Tem certeza que deseja deletar este cliente? Todas as assinaturas e faturas relacionadas também serão removidas.')) {
      return;
    }

    setLoading(true);
    try {
      // Simulação de serviço - substitua pela sua lógica real (ex: clientService.delete)
      // const result = await clientService.delete(clientId);
      // if (result.success) {
        setClients(prev => prev.filter(c => c.id !== clientId));
        setSubscriptions(prev => prev.filter(s => s.clientId !== clientId));
        alert('✅ Cliente deletado com sucesso!');
      // } else {
      //   alert('❌ Erro ao deletar cliente: ' + result.error);
      // }
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      alert('❌ Erro inesperado ao deletar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClient = async (clientData) => {
    setLoading(true);
    try {
      if (clientModal.client) {
        // Editar cliente existente
        // const result = await clientService.update(clientModal.client.id, clientData);
        // if (result.success) {
          setClients(prev => prev.map(c => 
            c.id === clientModal.client.id 
              ? { ...c, ...clientData, updatedAt: new Date() }
              : c
          ));
          setClientModal({ isOpen: false, client: null });
          alert('✅ Cliente atualizado com sucesso!');
        // } else {
        //   alert('❌ Erro ao atualizar cliente: ' + result.error);
        // }
      } else {
        // Criar novo cliente
        // const result = await clientService.create(clientData);
        // if (result.success) {
          const newClient = {
            id: new Date().getTime().toString(), // ID simulado
            ...clientData,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          setClients(prev => [newClient, ...prev]);
          setClientModal({ isOpen: false, client: null });
          alert('✅ Cliente criado com sucesso!');
        // } else {
        //   alert('❌ Erro ao criar cliente: ' + result.error);
        // }
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('❌ Erro inesperado ao salvar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = (clientId) => {
    setSubscriptionModal({ isOpen: true, clientId, subscription: null });
  };

  const handleEditSubscription = (subscription) => {
    setSubscriptionModal({ isOpen: true, clientId: subscription.clientId, subscription });
  };

  const handleSaveSubscription = async (subscriptionData) => {
    setLoading(true);
    try {
      if (subscriptionModal.subscription) {
        // Editar assinatura existente
        // const result = await subscriptionService.update(subscriptionModal.subscription.id, subscriptionData);
        // if (result.success) {
          setSubscriptions(prev => prev.map(s => 
            s.id === subscriptionModal.subscription.id 
              ? { ...s, ...subscriptionData, updatedAt: new Date() }
              : s
          ));
          setSubscriptionModal({ isOpen: false, clientId: null, subscription: null });
          alert('✅ Assinatura atualizada com sucesso!');
        // } else {
        //   alert('❌ Erro ao atualizar assinatura: ' + result.error);
        // }
      } else {
        // Criar nova assinatura
        const client = clients.find(c => c.id === subscriptionModal.clientId);
        const fullSubscriptionData = {
          ...subscriptionData,
          clientId: subscriptionModal.clientId,
          clientName: client.name,
          status: 'active'
        };

        // const result = await subscriptionService.create(fullSubscriptionData);
        // if (result.success) {
          const newSubscription = {
            id: new Date().getTime().toString(), // ID simulado
            ...fullSubscriptionData,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          setSubscriptions(prev => [newSubscription, ...prev]);
          setSubscriptionModal({ isOpen: false, clientId: null, subscription: null });
          alert('✅ Assinatura criada com sucesso!');
        // } else {
        //   alert('❌ Erro ao criar assinatura: ' + result.error);
        // }
      }
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
      alert('❌ Erro inesperado ao salvar assinatura');
    } finally {
      setLoading(false);
    }
  };


  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleSelectClient = (clientId) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    setSelectedClients(
      selectedClients.length === filteredClients.length 
        ? [] 
        : filteredClients.map(client => client.id)
    );
  };

  const exportClientsToCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'CPF', 'PIX', 'Status', 'Assinaturas', 'Receita Mensal', 'Data Cadastro'];
    const csvData = filteredClients.map(client => {
      const clientSubscriptions = subscriptions.filter(sub => sub.clientId === client.id);
      const revenue = clientSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
      
      return [
        client.name,
        client.email,
        client.phone || '',
        client.cpf || '',
        client.pix || '',
        client.status || 'active',
        clientSubscriptions.length,
        `R$ ${revenue.toFixed(2).replace('.', ',')}`,
        formatDate(client.createdAt)
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setAdvancedFilters({
      hasSubscriptions: 'all',
      hasOverdueInvoices: 'all',
      registrationPeriod: 'all',
      minRevenue: '',
      maxRevenue: ''
    });
  };

  // O restante do seu código JSX continua o mesmo...
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Header Premium */}
        <div className="mb-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-3xl">👥</span>
                Gestão de Clientes
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Gerencie clientes, assinaturas e relacionamentos
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Seletor de Visualização */}
              <div className="flex bg-white rounded-lg p-1 shadow-sm border">
                {[
                  { key: 'table', icon: '📋', label: 'Tabela' },
                  { key: 'cards', icon: '🃏', label: 'Cards' },
                  { key: 'list', icon: '📝', label: 'Lista' }
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
              
              {/* Botões de Ação */}
              <button
                onClick={exportClientsToCSV}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center px-4 py-2 rounded-lg shadow-sm transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Exportar
              </button>
              
              <button
                onClick={handleCreateClient}
                disabled={loading}
                className="bg-orange-600 text-white hover:bg-orange-700 flex items-center px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Salvando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Novo Cliente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas dos Clientes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                👥
              </div>
              <div className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                Total
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{clientStats.total}</div>
            <div className="text-sm text-gray-600">Total de Clientes</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                ✅
              </div>
              <div className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                {((clientStats.active / clientStats.total) * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{clientStats.active}</div>
            <div className="text-sm text-gray-600">Clientes Ativos</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
                🔄
              </div>
              <div className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                {((clientStats.withSubscriptions / clientStats.total) * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{clientStats.withSubscriptions}</div>
            <div className="text-sm text-gray-600">Com Assinaturas</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
                💰
              </div>
              <div className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                MRR
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(clientStats.totalRevenue)}
            </div>
            <div className="text-sm text-gray-600">Receita Recorrente</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">
                📊
              </div>
              <div className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                Média
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(clientStats.averageRevenue)}
            </div>
            <div className="text-sm text-gray-600">Ticket Médio</div>
          </div>
        </div>

        {/* Filtros e Busca Premium */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>🔍</span>
              Busca e Filtros
            </h3>
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
            >
              <span>{showAdvancedSearch ? 'Menos' : 'Mais'} filtros</span>
              <svg className={`w-4 h-4 transform transition-transform ${showAdvancedSearch ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Busca Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nome, email, telefone ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
          </div>

          {/* Filtros Avançados */}
          {showAdvancedSearch && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tem Assinaturas?
                </label>
                <select
                  value={advancedFilters.hasSubscriptions}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasSubscriptions: e.target.value }))}
                  className="form-select w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">Todos</option>
                  <option value="yes">Sim</option>
                  <option value="no">Não</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receita Mínima
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={advancedFilters.minRevenue}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minRevenue: e.target.value }))}
                  className="form-input w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receita Máxima
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="9999,99"
                  value={advancedFilters.maxRevenue}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxRevenue: e.target.value }))}
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

          {/* Resultados da Busca */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
            <p className="text-sm text-gray-600">
              {filteredClients.length} de {clients.length} clientes encontrados
            </p>
            {selectedClients.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {selectedClients.length} selecionados
                </span>
                <button className="btn-danger text-sm py-1 px-3 rounded-lg">
                  Ações em Lote
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Clientes */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Lista de Clientes ({filteredClients.length})
              </h3>
            </div>

            {filteredClients.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {clients.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum cliente encontrado'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {clients.length === 0 
                    ? 'Comece criando seu primeiro cliente'
                    : 'Ajuste os filtros para ver mais resultados'
                  }
                </p>
                {clients.length === 0 ? (
                  <button onClick={handleCreateClient} className="btn-primary">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Criar Primeiro Cliente
                  </button>
                ) : (
                  <button onClick={clearFilters} className="btn-secondary">
                    Limpar Filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-12 text-center">
                        <input
                          type="checkbox"
                          checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      </th>
                      <th 
                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        Cliente {getSortIcon('name')}
                      </th>
                      <th>Contato</th>
                      <th 
                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('subscriptions')}
                      >
                        Assinaturas {getSortIcon('subscriptions')}
                      </th>
                      <th 
                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('revenue')}
                      >
                        Receita Mensal {getSortIcon('revenue')}
                      </th>
                      <th 
                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('createdAt')}
                      >
                        Cadastrado em {getSortIcon('createdAt')}
                      </th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map(client => {
                      const clientSubscriptions = subscriptions.filter(sub => sub.clientId === client.id);
                      const clientRevenue = clientSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
                      
                      return (
                        <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={selectedClients.includes(client.id)}
                              onChange={() => handleSelectClient(client.id)}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center font-semibold text-orange-700">
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{client.name}</div>
                                <div className="text-sm text-gray-500">
                                  {client.cpf && formatCPF(client.cpf)}
                                </div>
                                {client.status === 'inactive' && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                                    Inativo
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900">{client.email}</div>
                              {client.phone && (
                                <div className="text-sm text-gray-500">{formatPhone(client.phone)}</div>
                              )}
                              {client.pix && (
                                <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full inline-block">
                                  PIX: {client.pix}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-gray-900">
                                {clientSubscriptions.filter(sub => sub.status === 'active').length}
                              </span>
                              <span className="text-sm text-gray-500">
                                / {clientSubscriptions.length} total
                              </span>
                              {clientSubscriptions.length > 0 && (
                                <button
                                  onClick={() => handleCreateSubscription(client.id)}
                                  className="text-orange-600 hover:text-orange-700 p-1"
                                  title="Adicionar nova assinatura"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            {clientSubscriptions.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {clientSubscriptions.slice(0, 2).map(sub => (
                                  <div key={sub.id} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {sub.name} - {formatCurrency(sub.amount)}
                                  </div>
                                ))}
                                {clientSubscriptions.length > 2 && (
                                  <div className="text-xs text-gray-400">
                                    +{clientSubscriptions.length - 2} mais...
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="font-semibold text-gray-900">
                              {formatCurrency(clientRevenue)}
                            </div>
                            {clientRevenue > 0 && (
                              <div className="text-xs text-gray-500">
                                {clientSubscriptions.filter(sub => sub.status === 'active').length} assinatura(s)
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="font-medium text-gray-900">
                              {formatDate(client.createdAt)}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCreateSubscription(client.id)}
                                className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded-lg transition-colors"
                                title="Nova assinatura"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                              
                              <button
                                onClick={() => handleEditClient(client)}
                                className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar cliente"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                              
                              <button
                                onClick={() => handleDeleteClient(client.id)}
                                className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Deletar cliente"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L7.586 12l-1.293 1.293a1 1 0 101.414 1.414L9 13.414l1.293 1.293a1 1 0 001.414-1.414L10.414 12l1.293-1.293z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
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
            {filteredClients.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 text-center py-16">
                <div className="text-6xl mb-4">🃏</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum cliente encontrado</h3>
                <p className="text-gray-600 mb-6">Ajuste os filtros para ver mais resultados</p>
                <button onClick={clearFilters} className="btn-secondary">
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map(client => {
                  const clientSubscriptions = subscriptions.filter(sub => sub.clientId === client.id);
                  const clientRevenue = clientSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
                  
                  return (
                    <div key={client.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      {/* Header do Card */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">{client.name}</h4>
                            <p className="text-sm text-gray-500">{client.email}</p>
                            {client.phone && (
                              <p className="text-sm text-gray-500">{formatPhone(client.phone)}</p>
                            )}
                          </div>
                        </div>
                        
                        {client.status === 'inactive' && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            Inativo
                          </span>
                        )}
                      </div>
                      
                      {/* Informações do Cliente */}
                      <div className="space-y-3 mb-6">
                        {client.cpf && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">CPF:</span>
                            <span className="font-medium text-gray-900">{formatCPF(client.cpf)}</span>
                          </div>
                        )}
                        
                        {client.pix && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">PIX:</span>
                            <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {client.pix}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Cadastrado:</span>
                          <span className="font-medium text-gray-900">{formatDate(client.createdAt)}</span>
                        </div>
                      </div>
                      
                      {/* Assinaturas */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900 flex items-center gap-2">
                            <span>🔄</span>
                            Assinaturas ({clientSubscriptions.length})
                          </h5>
                          <button
                            onClick={() => handleCreateSubscription(client.id)}
                            className="text-orange-600 hover:text-orange-700 p-1 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Nova assinatura"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        
                        {clientSubscriptions.length === 0 ? (
                          <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <p className="text-gray-500 text-sm">Nenhuma assinatura</p>
                            <button
                              onClick={() => handleCreateSubscription(client.id)}
                              className="text-orange-600 hover:text-orange-700 text-sm font-medium mt-1"
                            >
                              Criar primeira assinatura
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {clientSubscriptions.slice(0, 3).map(sub => (
                              <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 text-sm">{sub.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {sub.recurrenceType === 'monthly' && '📅 Mensal'}
                                    {sub.recurrenceType === 'weekly' && '📅 Semanal'}
                                    {sub.recurrenceType === 'daily' && '🔄 Diário'}
                                    {sub.recurrenceType === 'custom' && '⏱️ Personalizada'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-gray-900 text-sm">
                                    {formatCurrency(sub.amount)}
                                  </div>
                                  <div className={`text-xs font-medium ${
                                    sub.status === 'active' 
                                      ? 'text-green-600' 
                                      : 'text-gray-500'
                                  }`}>
                                    {sub.status === 'active' ? '✅ Ativa' : '⏸️ Inativa'}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleEditSubscription(sub)}
                                  className="ml-2 text-blue-600 hover:text-blue-700 p-1"
                                  title="Editar assinatura"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                            {clientSubscriptions.length > 3 && (
                              <div className="text-center text-sm text-gray-500 bg-gray-50 py-2 rounded">
                                +{clientSubscriptions.length - 3} assinaturas...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Receita Total */}
                      <div className="border-t border-gray-200 pt-4 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Receita Mensal:</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(clientRevenue)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Ações */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClient(client)}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Editar
                          </button>
                          
                          <button
                            onClick={() => handleDeleteClient(client.id)}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L7.586 12l-1.293 1.293a1 1 0 101.414 1.414L9 13.414l1.293 1.293a1 1 0 001.414-1.414L10.414 12l1.293-1.293z" clipRule="evenodd" />
                            </svg>
                            Excluir
                          </button>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          ID: {client.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Visualização em Lista Compacta */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Lista Compacta ({filteredClients.length})
              </h3>
            </div>
            
            {filteredClients.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum cliente encontrado</h3>
                <p className="text-gray-600 mb-6">Ajuste os filtros para ver mais resultados</p>
                <button onClick={clearFilters} className="btn-secondary">
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredClients.map(client => {
                  const clientSubscriptions = subscriptions.filter(sub => sub.clientId === client.id);
                  const clientRevenue = clientSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
                  
                  return (
                    <div key={client.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-semibold text-orange-700">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 truncate">{client.name}</h4>
                              {client.status === 'inactive' && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  Inativo
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <span>📧 {client.email}</span>
                              {client.phone && <span>📞 {formatPhone(client.phone)}</span>}
                              <span>📅 {formatDate(client.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">
                              {clientSubscriptions.filter(sub => sub.status === 'active').length}
                            </div>
                            <div className="text-xs text-gray-500">Assinaturas</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">
                              {formatCurrency(clientRevenue)}
                            </div>
                            <div className="text-xs text-gray-500">Receita/mês</div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCreateSubscription(client.id)}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                              title="Nova assinatura"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                            
                            <button
                              onClick={() => handleEditClient(client)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar cliente"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            
                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir cliente"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L7.586 12l-1.293 1.293a1 1 0 101.414 1.414L9 13.414l1.293 1.293a1 1 0 001.414-1.414L10.414 12l1.293-1.293z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modais */}
      <ClientModal
        isOpen={clientModal.isOpen}
        onClose={() => setClientModal({ isOpen: false, client: null })}
        onSave={handleSaveClient}
        client={clientModal.client}
        loading={loading}
      />

      <SubscriptionModal
        isOpen={subscriptionModal.isOpen}
        onClose={() => setSubscriptionModal({ isOpen: false, clientId: null, subscription: null })}
        onSave={handleSaveSubscription}
        clientId={subscriptionModal.clientId}
        subscription={subscriptionModal.subscription}
        clients={clients}
        loading={loading}
      />
    </div>
  );
};
export default ClientsPage;