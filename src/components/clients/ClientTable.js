// src/components/clients/ClientTable.js

import React from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ClientTable = ({ 
  clients, 
  subscriptions, 
  onEditClient, 
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
    // CORREÇÃO: Alterado de 'sub.value' para 'sub.amount'
    return getClientSubscriptions(clientId)
      .filter(sub => sub.status === 'active')
      .reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'active':
        return { text: 'Ativo', class: 'badge-success' };
      case 'inactive':
        return { text: 'Inativo', class: 'badge-danger' };
      default:
        return { text: status, class: 'badge-info' };
    }
  };

  if (clients.length === 0) {
    return (
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
          <h3>Nenhum cliente cadastrado</h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Comece cadastrando seu primeiro cliente para gerenciar cobranças.
          </p>
          <button 
            onClick={() => onEditClient(null)}
            className="btn btn-primary"
          >
            Cadastrar Primeiro Cliente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Assinaturas</th>
            <th>Receita Mensal</th>
            <th>Última Atualização</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => {
            const clientSubs = getClientSubscriptions(client.id);
            const activeSubs = getActiveSubscriptionsCount(client.id);
            const monthlyRev = getMonthlyRevenue(client.id);
            const status = formatStatus(client.status || 'active');

            return (
              <tr key={client.id}>
                <td>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      {client.name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {client.email}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {client.phone}
                    </div>
                  </div>
                </td>
                <td>
                  <div>
                    <div style={{ fontWeight: '500' }}>
                      {activeSubs} ativas / {clientSubs.length} total
                    </div>
                    {clientSubs.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {clientSubs.map((sub, index) => (
                          <span 
                            key={sub.id}
                            onClick={() => onEditSubscription(sub, client)}
                            style={{ 
                              cursor: 'pointer', 
                              textDecoration: 'underline',
                              marginRight: '0.5rem'
                            }}
                          >
                            {sub.service}
                            {index < clientSubs.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ fontWeight: '600' }}>
                  {formatCurrency(monthlyRev)}
                </td>
                <td>
                  {client.updatedAt ? formatDate(client.updatedAt) : formatDate(client.createdAt)}
                </td>
                <td>
                  <span className={`badge ${status.class}`}>
                    {status.text}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => onEditClient(client)}
                      className="btn btn-secondary btn-sm"
                      title="Editar cliente"
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      onClick={() => onNewSubscription(client)}
                      className="btn btn-primary btn-sm"
                      title="Nova assinatura"
                    >
                      ➕ Assinatura
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ClientTable;