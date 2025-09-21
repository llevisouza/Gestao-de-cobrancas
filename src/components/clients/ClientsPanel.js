// src/components/clients/ClientsPanel.js - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { clientService, subscriptionService } from '../../services/firestore';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ClientsPanel = () => {
  const [clients, setClients] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add', 'edit', 'delete', 'subscription'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: ''
  });
  const [subscriptionData, setSubscriptionData] = useState({
    name: '',
    amount: '',
    recurrenceType: 'monthly',
    dayOfMonth: 1,
    dayOfWeek: 'monday',
    recurrenceDays: 30,
    startDate: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState({});

  // Carregar dados iniciais
  useEffect(() => {
    let unsubscribeClients = null;
    let unsubscribeSubscriptions = null;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Setup listeners em tempo real
        unsubscribeClients = clientService.subscribe((clientsData) => {
          console.log('Clientes recebidos:', clientsData.length);
          setClients(clientsData);
        });

        unsubscribeSubscriptions = subscriptionService.subscribe((subscriptionsData) => {
          console.log('Assinaturas recebidas:', subscriptionsData.length);
          setSubscriptions(subscriptionsData);
        });

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados. Verifique a conexão.');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Cleanup listeners
    return () => {
      if (unsubscribeClients) unsubscribeClients();
      if (unsubscribeSubscriptions) unsubscribeSubscriptions();
    };
  }, []);

  // Validação do formulário
  const validateForm = (data, type = 'client') => {
    const newErrors = {};

    if (type === 'client') {
      if (!data.name?.trim()) newErrors.name = 'Nome é obrigatório';
      if (!data.email?.trim()) {
        newErrors.email = 'Email é obrigatório';
      } else if (!/\S+@\S+\.\S+/.test(data.email)) {
        newErrors.email = 'Email inválido';
      }
      if (!data.phone?.trim()) newErrors.phone = 'Telefone é obrigatório';
    } else if (type === 'subscription') {
      if (!data.name?.trim()) newErrors.name = 'Nome da assinatura é obrigatório';
      if (!data.amount || parseFloat(data.amount) <= 0) {
        newErrors.amount = 'Valor deve ser maior que zero';
      }
      if (!data.startDate) newErrors.startDate = 'Data de início é obrigatória';
    }

    return newErrors;
  };

  // Handlers do formulário
  const handleInputChange = (e, isSubscription = false) => {
    const { name, value } = e.target;
    
    if (isSubscription) {
      setSubscriptionData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Resetar formulários
  const resetForms = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      cpf: ''
    });
    setSubscriptionData({
      name: '',
      amount: '',
      recurrenceType: 'monthly',
      dayOfMonth: 1,
      dayOfWeek: 'monday',
      recurrenceDays: 30,
      startDate: new Date().toISOString().split('T')[0]
    });
    setErrors({});
  };

  // Abrir modal
  const openModal = (type, client = null) => {
    setModalType(type);
    setSelectedClient(client);
    resetForms();

    if (type === 'edit' && client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        cpf: client.cpf || ''
      });
    } else if (type === 'subscription' && client) {
      setSubscriptionData(prev => ({
        ...prev,
        clientId: client.id,
        clientName: client.name
      }));
    }

    setShowModal(true);
  };

  // Fechar modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedClient(null);
    resetForms();
  };

  // Adicionar cliente
  const handleAddClient = async () => {
    const validationErrors = validateForm(formData, 'client');
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      console.log('Adicionando cliente:', formData);
      const result = await clientService.create(formData);
      
      if (result.success) {
        console.log('Cliente criado com sucesso');
        closeModal();
        alert('Cliente adicionado com sucesso!');
      } else {
        throw new Error(result.error || 'Erro ao criar cliente');
      }
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      alert(`Erro ao adicionar cliente: ${error.message}`);
    }
  };

  // Editar cliente
  const handleEditClient = async () => {
    if (!selectedClient) return;

    const validationErrors = validateForm(formData, 'client');
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      console.log('Editando cliente:', selectedClient.id, formData);
      const result = await clientService.update(selectedClient.id, formData);
      
      if (result.success) {
        console.log('Cliente editado com sucesso');
        closeModal();
        alert('Cliente atualizado com sucesso!');
      } else {
        throw new Error(result.error || 'Erro ao editar cliente');
      }
    } catch (error) {
      console.error('Erro ao editar cliente:', error);
      alert(`Erro ao editar cliente: ${error.message}`);
    }
  };

  // Deletar cliente
  const handleDeleteClient = async () => {
    if (!selectedClient) return;

    if (!window.confirm(`Tem certeza que deseja excluir o cliente "${selectedClient.name}"? Esta ação também excluirá todas as assinaturas e faturas relacionadas e não pode ser desfeita.`)) {
      return;
    }

    try {
      console.log('Deletando cliente:', selectedClient.id);
      const result = await clientService.delete(selectedClient.id);
      
      if (result.success) {
        console.log('Cliente deletado com sucesso');
        closeModal();
        alert('Cliente e dados relacionados excluídos com sucesso!');
      } else {
        throw new Error(result.error || 'Erro ao deletar cliente');
      }
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      alert(`Erro ao deletar cliente: ${error.message}`);
    }
  };

  // Adicionar assinatura
  const handleAddSubscription = async () => {
    const validationErrors = validateForm(subscriptionData, 'subscription');
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      console.log('Adicionando assinatura:', subscriptionData);
      const result = await subscriptionService.create({
        ...subscriptionData,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        amount: parseFloat(subscriptionData.amount)
      });
      
      if (result.success) {
        console.log('Assinatura criada com sucesso');
        closeModal();
        alert('Assinatura adicionada com sucesso!');
      } else {
        throw new Error(result.error || 'Erro ao criar assinatura');
      }
    } catch (error) {
      console.error('Erro ao adicionar assinatura:', error);
      alert(`Erro ao adicionar assinatura: ${error.message}`);
    }
  };

  // Obter assinaturas do cliente
  const getClientSubscriptions = (clientId) => {
    return subscriptions.filter(sub => sub.clientId === clientId);
  };

  // Calcular total de receita do cliente
  const getClientRevenue = (clientId) => {
    return getClientSubscriptions(clientId).reduce((total, sub) => total + parseFloat(sub.amount || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="dashboard-title flex items-center gap-3">
                <span className="text-3xl">👥</span>
                Gerenciar Clientes
              </h1>
              <p className="dashboard-subtitle">
                Adicione, edite e gerencie seus clientes e assinaturas
              </p>
            </div>
            
            <button
              onClick={() => openModal('add')}
              className="btn-primary px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Adicionar Cliente
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{clients.length}</div>
            <div className="text-sm text-gray-600">Clientes Cadastrados</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔄</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{subscriptions.filter(s => s.status === 'active').length}</div>
            <div className="text-sm text-gray-600">Assinaturas Ativas</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(subscriptions.reduce((total, sub) => total + parseFloat(sub.amount || 0), 0))}
            </div>
            <div className="text-sm text-gray-600">Receita Mensal Recorrente</div>
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Lista de Clientes ({clients.length})
            </h3>
          </div>

          {clients.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum cliente cadastrado</h3>
              <p className="text-gray-600 mb-6">Comece adicionando seu primeiro cliente</p>
              <button
                onClick={() => openModal('add')}
                className="btn-primary px-6 py-2 rounded-lg"
              >
                Adicionar Primeiro Cliente
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {clients.map(client => {
                const clientSubscriptions = getClientSubscriptions(client.id);
                const clientRevenue = getClientRevenue(client.id);
                
                return (
                  <div key={client.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center font-semibold text-orange-700">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* Info do Cliente */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-gray-900 text-lg">{client.name}</h4>
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Ativo
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                              {client.email}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                              </svg>
                              {client.phone}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              {client.cpf || 'CPF não informado'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Stats do Cliente */}
                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-1">
                            {clientSubscriptions.length} assinatura{clientSubscriptions.length !== 1 ? 's' : ''}
                          </div>
                          <div className="font-semibold text-lg text-gray-900">
                            {formatCurrency(clientRevenue)}/mês
                          </div>
                        </div>
                      </div>
                      
                      {/* Ações */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => openModal('subscription', client)}
                          className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Adicionar Assinatura"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => openModal('edit', client)}
                          className="text-orange-600 hover:text-orange-700 p-2 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                          title="Editar Cliente"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => openModal('delete', client)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Excluir Cliente"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zM12 7a1 1 0 112 0v4a1 1 0 11-2 0V7z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Assinaturas do Cliente */}
                    {clientSubscriptions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Assinaturas:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {clientSubscriptions.map(subscription => (
                            <div key={subscription.id} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">{subscription.name}</div>
                                  <div className="text-xs text-gray-600">
                                    {subscription.recurrenceType === 'monthly' ? 'Mensal' : 
                                     subscription.recurrenceType === 'weekly' ? 'Semanal' : 
                                     subscription.recurrenceType === 'daily' ? 'Diário' : 'Personalizado'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-sm text-gray-900">
                                    {formatCurrency(subscription.amount)}
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    subscription.status === 'active' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {subscription.status === 'active' ? 'Ativa' : 'Inativa'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalType === 'add' && 'Adicionar Novo Cliente'}
                  {modalType === 'edit' && 'Editar Cliente'}
                  {modalType === 'delete' && 'Confirmar Exclusão'}
                  {modalType === 'subscription' && 'Nova Assinatura'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="px-6 py-4">
              {/* Formulário Cliente */}
              {(modalType === 'add' || modalType === 'edit') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`form-input w-full rounded-lg ${errors.name ? 'border-red-300' : 'border-gray-300'} focus:ring-orange-500 focus:border-orange-500`}
                      placeholder="Nome completo do cliente"
                    />
                    {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`form-input w-full rounded-lg ${errors.email ? 'border-red-300' : 'border-gray-300'} focus:ring-orange-500 focus:border-orange-500`}
                      placeholder="email@exemplo.com"
                    />
                    {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`form-input w-full rounded-lg ${errors.phone ? 'border-red-300' : 'border-gray-300'} focus:ring-orange-500 focus:border-orange-500`}
                      placeholder="(11) 99999-9999"
                    />
                    {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CPF
                    </label>
                    <input
                      type="text"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleInputChange}
                      className="form-input w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              )}

              {/* Formulário Assinatura */}
              {modalType === 'subscription' && (
                <div className="space-y-4">
                  <div className="bg-orange-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-orange-700">
                      <strong>Cliente:</strong> {selectedClient?.name}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Assinatura *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={subscriptionData.name}
                      onChange={(e) => handleInputChange(e, true)}
                      className={`form-input w-full rounded-lg ${errors.name ? 'border-red-300' : 'border-gray-300'} focus:ring-orange-500 focus:border-orange-500`}
                      placeholder="Ex: Plano Premium"
                    />
                    {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      value={subscriptionData.amount}
                      onChange={(e) => handleInputChange(e, true)}
                      className={`form-input w-full rounded-lg ${errors.amount ? 'border-red-300' : 'border-gray-300'} focus:ring-orange-500 focus:border-orange-500`}
                      placeholder="0,00"
                    />
                    {errors.amount && <p className="text-red-600 text-xs mt-1">{errors.amount}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Recorrência
                    </label>
                    <select
                      name="recurrenceType"
                      value={subscriptionData.recurrenceType}
                      onChange={(e) => handleInputChange(e, true)}
                      className="form-select w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="daily">Diário</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>

                  {subscriptionData.recurrenceType === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dia da Semana
                      </label>
                      <select
                        name="dayOfWeek"
                        value={subscriptionData.dayOfWeek}
                        onChange={(e) => handleInputChange(e, true)}
                        className="form-select w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="monday">Segunda-feira</option>
                        <option value="tuesday">Terça-feira</option>
                        <option value="wednesday">Quarta-feira</option>
                        <option value="thursday">Quinta-feira</option>
                        <option value="friday">Sexta-feira</option>
                        <option value="saturday">Sábado</option>
                        <option value="sunday">Domingo</option>
                      </select>
                    </div>
                  )}

                  {subscriptionData.recurrenceType === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dia do Mês
                      </label>
                      <select
                        name="dayOfMonth"
                        value={subscriptionData.dayOfMonth}
                        onChange={(e) => handleInputChange(e, true)}
                        className="form-select w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                      >
                        {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>Dia {day}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {subscriptionData.recurrenceType === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Intervalo (dias)
                      </label>
                      <input
                        type="number"
                        name="recurrenceDays"
                        value={subscriptionData.recurrenceDays}
                        onChange={(e) => handleInputChange(e, true)}
                        className="form-input w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="30"
                        min="1"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Início *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={subscriptionData.startDate}
                      onChange={(e) => handleInputChange(e, true)}
                      className={`form-input w-full rounded-lg ${errors.startDate ? 'border-red-300' : 'border-gray-300'} focus:ring-orange-500 focus:border-orange-500`}
                    />
                    {errors.startDate && <p className="text-red-600 text-xs mt-1">{errors.startDate}</p>}
                  </div>
                </div>
              )}

              {/* Confirmação de Exclusão */}
              {modalType === 'delete' && (
                <div className="text-center">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Excluir Cliente</h4>
                  <p className="text-gray-600 mb-4">
                    Tem certeza que deseja excluir <strong>{selectedClient?.name}</strong>?
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-700 text-sm">
                      <strong>Atenção:</strong> Esta ação também excluirá todas as assinaturas e faturas relacionadas a este cliente. Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              
              {modalType === 'add' && (
                <button
                  onClick={handleAddClient}
                  className="btn-primary px-6 py-2 rounded-lg"
                >
                  Adicionar Cliente
                </button>
              )}
              
              {modalType === 'edit' && (
                <button
                  onClick={handleEditClient}
                  className="btn-primary px-6 py-2 rounded-lg"
                >
                  Salvar Alterações
                </button>
              )}
              
              {modalType === 'subscription' && (
                <button
                  onClick={handleAddSubscription}
                  className="btn-primary px-6 py-2 rounded-lg"
                >
                  Criar Assinatura
                </button>
              )}
              
              {modalType === 'delete' && (
                <button
                  onClick={handleDeleteClient}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sim, Excluir
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPanel;