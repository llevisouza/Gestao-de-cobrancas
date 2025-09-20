// src/components/clients/ClientTable.js
import React from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ClientTable = ({ 
  clients, 
  subscriptions, 
  onEditClient,
  onDeleteClient,
  onNewSubscription, 
  onEditSubscription 
}) => {
  
  const getClientSubscriptions = (clientId) => {
    return subscriptions.filter(sub => sub.clientId === clientId);
  };

  const getActiveSubscriptionsCount = (clientId) => {
    return getClientSubscriptions(clientId).filter(sub => sub.status === 'active').length;
  };

  const getMonthlyRevenue = (clientId) => {
    return getClientSubscriptions(clientId)
      .filter(sub => sub.status === 'active')
      .reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'active':
        return { text: 'Ativo', class: 'bg-green-100 text-green-800' };
      case 'inactive':
        return { text: 'Inativo', class: 'bg-gray-100 text-gray-800' };
      default:
        return { text: 'Ativo', class: 'bg-green-100 text-green-800' };
    }
  };

  if (clients.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum cliente cadastrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comece cadastrando seu primeiro cliente para gerenciar cobranças.
          </p>
          <div className="mt-6">
            <button 
              onClick={() => onEditClient(null)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Cadastrar Primeiro Cliente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assinaturas
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receita Mensal
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => {
              const clientSubs = getClientSubscriptions(client.id);
              const activeSubs = getActiveSubscriptionsCount(client.id);
              const monthlyRev = getMonthlyRevenue(client.id);
              const status = formatStatus(client.status || 'active');

              return (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {client.name?.charAt(0)?.toUpperCase() || 'C'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {client.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="text-xs text-gray-400">
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {activeSubs} ativas / {clientSubs.length} total
                    </div>
                    {clientSubs.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1 space-y-1">
                        {clientSubs.map((sub, index) => (
                          <div key={sub.id}>
                            <button
                              onClick={() => onEditSubscription(sub, client)}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Assinatura #{index + 1} - {formatCurrency(sub.amount)}
                            </button>
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {sub.status === 'active' ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(monthlyRev)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.class}`}>
                      {status.text}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => onEditClient(client)}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors"
                        title="Editar cliente"
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        onClick={() => onNewSubscription(client)}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-xs font-medium hover:bg-green-200 transition-colors"
                        title="Nova assinatura"
                      >
                        ➕ Assinatura
                      </button>
                      <button 
                        onClick={() => onDeleteClient(client.id)}
                        className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-xs font-medium hover:bg-red-200 transition-colors"
                        title="Excluir Cliente"
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientTable;