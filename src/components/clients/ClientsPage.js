// src/components/clients/ClientsPage.js
import React, { useState } from 'react';
import ClientTable from './ClientTable';
import ClientModal from './ClientModal';
import SubscriptionModal from './SubscriptionModal';
import { clientService, subscriptionService } from '../../services/firestore';
import { MESSAGES } from '../../utils/constants';

const ClientsPage = ({ clients, setClients, subscriptions, setSubscriptions }) => {
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const handleOpenClientModal = (client = null) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
  };

  const handleCloseClientModal = () => {
    setSelectedClient(null);
    setIsClientModalOpen(false);
  };

  const handleOpenSubModal = (client) => {
    const existingSub = subscriptions.find(sub => sub.clientId === client.id);
    setSelectedClient(client);
    setSelectedSubscription(existingSub || null);
    setIsSubModalOpen(true);
  };

  const handleCloseSubModal = () => {
    setSelectedClient(null);
    setSelectedSubscription(null);
    setIsSubModalOpen(false);
  };

  const handleSaveClient = async (clientData) => {
    if (selectedClient) { // Update
      const result = await clientService.update(selectedClient.id, clientData);
      if (result.success) {
        setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, ...clientData } : c));
        alert(MESSAGES.SUCCESS.CLIENT_UPDATED);
      }
    } else { // Create
      const result = await clientService.create(clientData);
      if (result.success) {
        setClients(prev => [{ id: result.id, ...clientData }, ...prev]);
        alert(MESSAGES.SUCCESS.CLIENT_CREATED);
      }
    }
    handleCloseClientModal();
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm(MESSAGES.ERROR.DELETE_CONFIRMATION)) {
      const result = await clientService.delete(clientId);
      if (result.success) {
        setClients(prev => prev.filter(c => c.id !== clientId));
        alert(MESSAGES.SUCCESS.CLIENT_DELETED);
      }
    }
  };

  const handleSaveSubscription = async (subData) => {
    if (selectedSubscription) { // Update
      const result = await subscriptionService.update(selectedSubscription.id, subData);
      if (result.success) {
        setSubscriptions(prev => prev.map(s => s.id === selectedSubscription.id ? { ...s, ...subData } : s));
      }
    } else { // Create
      const result = await subscriptionService.create(subData);
      if (result.success) {
        setSubscriptions(prev => [{ id: result.id, ...subData }, ...prev]);
      }
    }
    handleCloseSubModal();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar Clientes</h1>
        <button
          onClick={() => handleOpenClientModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Adicionar Cliente
        </button>
      </div>

      <ClientTable
        clients={clients}
        onEdit={handleOpenClientModal}
        onDelete={handleDeleteClient}
        onManageSubscription={handleOpenSubModal}
      />

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={handleCloseClientModal}
        onSave={handleSaveClient}
        client={selectedClient}
      />

      {selectedClient && (
        <SubscriptionModal
          isOpen={isSubModalOpen}
          onClose={handleCloseSubModal}
          onSave={handleSaveSubscription}
          subscription={selectedSubscription}
          client={selectedClient}
        />
      )}
    </div>
  );
};

export default ClientsPage;