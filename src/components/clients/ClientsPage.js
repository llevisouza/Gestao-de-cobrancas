import React, { useState } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import ClientTable from './ClientTable';
import ClientModal from './ClientModal';
import SubscriptionModal from './SubscriptionModal';
import LoadingSpinner from '../common/LoadingSpinner';

const ClientsPage = () => {
  const { clients, subscriptions, loading } = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  // Filtrar clientes por termo de busca
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
  };

  const handleNewClient = () => {
    setSelectedClient(null);
    setIsClientModalOpen(true);
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

  const closeModals = () => {
    setIsClientModalOpen(false);
    setIsSubscriptionModalOpen(false);
    setSelectedClient(null);
    setSelectedSubscription(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="clients-page">
      <div className="container">
        <div className="clients-header">
          <h1 className="clients-title">Clientes</h1>
          <div className="clients-actions">
            <button 
              onClick={handleNewClient}
              className="btn btn-primary"
            >
              👤 Novo Cliente
            </button>
          </div>
        </div>

        <div className="clients-search">
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {filteredClients.length} de {clients.length} clientes
          </div>
        </div>

        <ClientTable 
          clients={filteredClients}
          subscriptions={subscriptions}
          onEditClient={handleEditClient}
          onNewSubscription={handleNewSubscription}
          onEditSubscription={handleEditSubscription}
        />

        {isClientModalOpen && (
          <ClientModal
            client={selectedClient}
            onClose={closeModals}
          />
        )}

        {isSubscriptionModalOpen && (
          <SubscriptionModal
            client={selectedClient}
            subscription={selectedSubscription}
            onClose={closeModals}
          />
        )}
      </div>
    </div>
  );
};

export default ClientsPage;