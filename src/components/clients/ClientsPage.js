// src/components/clients/ClientsPage.js - VERSÃO CORRIGIDA
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
    updateSubscription,
    deleteSubscription // NOVA FUNÇÃO IMPORTADA
  } = useFirestore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  // Filtrar clientes com melhor busca
  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      (client.phone && client.phone.includes(searchTerm)) ||
      (client.cpf && client.cpf.includes(searchTerm))
    );
  });

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

  // NOVA FUNÇÃO: Confirmar e excluir cliente
  const handleDeleteClient = async (clientId) => {
    try {
      // Verificar se cliente tem assinaturas ativas
      const clientSubscriptions = subscriptions.filter(
        sub => sub.clientId === clientId && sub.status === 'active'
      );
      
      if (clientSubscriptions.length > 0) {
        alert('Não é possível excluir cliente com assinaturas ativas. Desative as assinaturas primeiro.');
        return;
      }

      await deleteClient(clientId);
      alert('Cliente excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      alert('Erro ao excluir cliente: ' + error.message);
    }
  };

  // NOVA FUNÇÃO: Manipular exclusão de assinatura
  const handleDeleteSubscription = async (subscriptionId) => {
    try {
      await deleteSubscription(subscriptionId);
      // Não precisa de alert aqui pois já tem na ClientTable
    } catch (error) {
      console.error('Erro ao excluir assinatura:', error);
      throw error; // Propaga o erro para ser tratado na ClientTable
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

        {/* Search com novo estilo e estatísticas */}
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
                placeholder="Buscar por nome, email, telefone ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input input-group-input"
              />
            </div>
            <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
              <span>
                Mostrando {filteredClients.length} de {clients.length} clientes
              </span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Limpar busca
                </button>
              )}
            </div>
          </div>

          {/* Estatísticas rápidas */}
          {clients.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total de Clientes
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {clients.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Assinaturas Ativas
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {subscriptions.filter(sub => sub.status === 'active').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Receita Mensal
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        R$ {subscriptions
                          .filter(sub => sub.status === 'active')
                          .reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0)
                          .toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                        }
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabela atualizada com nova função */}
        <ClientTable 
          clients={filteredClients}
          subscriptions={subscriptions}
          onEditClient={handleEditClient}
          onDeleteClient={handleDeleteClient}
          onDeleteSubscription={handleDeleteSubscription} // NOVA PROP
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