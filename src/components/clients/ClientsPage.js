// src/components/clients/ClientsPage.js
import React, { useState } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import ClientTable from './ClientTable';
import ClientModal from './ClientModal';
import SubscriptionModal from './SubscriptionModal';
import LoadingSpinner from '../common/LoadingSpinner';

const ClientsPage = () => {
  const { 
    clients, 
    subscriptions, 
    loading,
    createClient,
    updateClient,
    deleteClient,
    createSubscription,
    updateSubscription
  } = useFirestore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  // Filtrar clientes por termo de busca
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone && client.phone.includes(searchTerm))
  );

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
  };

  const handleNewClient = () => {
    setSelectedClient(null);
    setIsClientModalOpen(true);
  };

  const handleSaveClient = async (clientData) => {
    try {
      if (selectedClient) {
        await updateClient(selectedClient.id, clientData);
      } else {
        await createClient(clientData);
      }
      closeModals();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      throw error;
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      try {
        await deleteClient(clientId);
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        alert('Erro ao excluir cliente: ' + error.message);
      }
    }
  };

  const handleNewSubscription = (client) => {
    setSelectedClient(client);
    setSelectedSubscription(null);
    setIsSubscriptionModalOpen(true);
  };

  const handleEditSubscription = (subscription, client) => {
    setSelectedClient(client);
    setSelectedSubscription(subscription);
    setIsSubscriptionModalOpen(true);
  };

  const handleSaveSubscription = async (subscriptionData) => {
    try {
      if (selectedSubscription) {
        await updateSubscription(selectedSubscription.id, subscriptionData);
      } else {
        await createSubscription(subscriptionData);
      }
      closeModals();
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
      throw error;
    }
  };

  const closeModals = () => {
    setIsClientModalOpen(false);
    setIsSubscriptionModalOpen(false);
    setSelectedClient(null);
    setSelectedSubscription(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" message="Carregando clientes..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
              <p className="mt-2 text-sm text-gray-700">
                Gerencie seus clientes e assinaturas
              </p>
            </div>
            <button 
              onClick={handleNewClient}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Novo Cliente
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="max-w-lg">
            <label htmlFor="search" className="sr-only">Buscar clientes</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Mostrando {filteredClients.length} de {clients.length} clientes
            </p>
          </div>
        </div>

        {/* Clients Table */}
        <ClientTable 
          clients={filteredClients}
          subscriptions={subscriptions}
          onEditClient={handleEditClient}
          onDeleteClient={handleDeleteClient}
          onNewSubscription={handleNewSubscription}
          onEditSubscription={handleEditSubscription}
        />

        {/* Modals */}
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={closeModals}
          onSave={handleSaveClient}
          client={selectedClient}
        />

        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={closeModals}
          onSave={handleSaveSubscription}
          client={selectedClient}
          subscription={selectedSubscription}
        />
      </div>
    </div>
  );
};

export default ClientsPage;