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

  // Filtrar clientes
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone && client.phone.includes(searchTerm))
  );

  const handleEditClient = (client) => {
    setSelectedClient(client);
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
      <div className="dashboard-container">
        {/* Header com nova estrutura */}
        <div className="dashboard-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="dashboard-title">Clientes</h1>
              <p className="dashboard-subtitle">
                Gerencie seus clientes e assinaturas
              </p>
            </div>
            <button 
              onClick={() => handleEditClient(null)}
              className="btn-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Novo Cliente
            </button>
          </div>
        </div>

        {/* Search com novo estilo */}
        <div className="mb-8">
          <div className="max-w-md">
            <label htmlFor="search" className="sr-only">Buscar clientes</label>
            <div className="input-group">
              <div className="input-group-text">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input input-group-input"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Mostrando {filteredClients.length} de {clients.length} clientes
            </p>
          </div>
        </div>

        {/* Tabela atualizada */}
        <ClientTable 
          clients={filteredClients}
          subscriptions={subscriptions}
          onEditClient={handleEditClient}
          onDeleteClient={deleteClient}
          onNewSubscription={(client) => {
            setSelectedClient(client);
            setSelectedSubscription(null);
            setIsSubscriptionModalOpen(true);
          }}
          onEditSubscription={(subscription, client) => {
            setSelectedClient(client);
            setSelectedSubscription(subscription);
            setIsSubscriptionModalOpen(true);
          }}
        />

        {/* Modais */}
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={closeModals}
          onSave={handleSaveClient}
          client={selectedClient}
        />

        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={closeModals}
          onSave={async (data) => {
            try {
              if (selectedSubscription) {
                await updateSubscription(selectedSubscription.id, data);
              } else {
                await createSubscription(data);
              }
              closeModals();
            } catch (error) {
              console.error('Erro ao salvar assinatura:', error);
              throw error;
            }
          }}
          client={selectedClient}
          subscription={selectedSubscription}
        />
      </div>
    </div>
  );
};

export default ClientsPage;