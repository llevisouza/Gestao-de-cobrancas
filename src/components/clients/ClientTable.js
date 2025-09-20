// src/components/clients/ClientTable.js
import React from 'react';
import { PencilIcon, TrashIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { formatCPF, formatPhone } from '../../utils/formatters';

const ClientTable = ({ clients, onEdit, onDelete, onManageSubscription }) => {
  if (clients.length === 0) {
    return <p className="text-center text-gray-500 py-8">Nenhum cliente cadastrado.</p>;
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clients.map(client => (
            <tr key={client.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{client.name}</div>
                <div className="text-sm text-gray-500">{client.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPhone(client.phone)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCPF(client.cpf)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-3">
                  <button onClick={() => onManageSubscription(client)} className="text-blue-600 hover:text-blue-900" title="Gerenciar Assinatura">
                    <CreditCardIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => onEdit(client)} className="text-indigo-600 hover:text-indigo-900" title="Editar Cliente">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => onDelete(client.id)} className="text-red-600 hover:text-red-900" title="Excluir Cliente">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientTable;