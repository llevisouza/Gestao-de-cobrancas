// src/components/dashboard/WhatsAppQuickActions.js
import React, { useState } from 'react';
import { useWhatsAppNotifications } from '../../hooks/useWhatsAppNotifications';
import { formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';

const WhatsAppQuickActions = ({ invoices, clients, subscriptions }) => {
  const {
    isConnected,
    loading,
    connectionStatus,
    sendOverdueNotification,
    sendReminderNotification,
    calculatePendingNotifications,
    getConnectionStatusText
  } = useWhatsAppNotifications();

  const [sendingId, setSendingId] = useState(null);
  const [showAll, setShowAll] = useState(false);

  // Calcular notificações pendentes
  const pendingNotifications = calculatePendingNotifications(invoices, clients, subscriptions);
  const totalPending = pendingNotifications.total;

  // Pegar as 3 mais urgentes
  const urgentNotifications = [
    ...pendingNotifications.overdue.slice(0, 2),
    ...pendingNotifications.reminders.slice(0, 1)
  ].slice(0, 3);

  const allNotifications = [
    ...pendingNotifications.overdue,
    ...pendingNotifications.reminders,
    ...pendingNotifications.newInvoices
  ];

  const notificationsToShow = showAll ? allNotifications : urgentNotifications;

  // Enviar notificação individual
  const handleSendNotification = async (notification) => {
    const { type, invoice, client, subscription } = notification;
    setSendingId(invoice.id);
    
    try {
      let result;
      
      switch (type) {
        case 'overdue':
          result = await sendOverdueNotification(invoice, client, subscription);
          break;
        case 'reminder':
          result = await sendReminderNotification(invoice, client, subscription);
          break;
        default:
          throw new Error('Tipo não suportado nas ações rápidas');
      }

      if (result.success) {
        // Mostrar feedback visual
        const element = document.getElementById(`notification-${invoice.id}`);
        if (element) {
          element.style.backgroundColor = '#f0fdf4';
          element.style.border = '1px solid #22c55e';
          setTimeout(() => {
            element.style.backgroundColor = '';
            element.style.border = '';
          }, 3000);
        }
        
        // Feedback via toast (pode implementar sistema de toast)
        console.log(`✅ WhatsApp enviado para ${client.name}`);
      } else {
        alert(`Erro ao enviar WhatsApp: ${result.error}`);
      }
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      setSendingId(null);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'overdue': return '🚨';
      case 'reminder': return '🔔';
      case 'new_invoice': return '📄';
      default: return '📱';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'overdue': return 'Vencida';
      case 'reminder': return 'Lembrete';
      case 'new_invoice': return 'Nova';
      default: return type;
    }
  };

  const getDaysInfo = (notification) => {
    const { type, invoice } = notification;
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    
    if (type === 'overdue') {
      const daysPast = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      return {
        text: `${daysPast} dias em atraso`,
        color: 'text-red-600',
        urgent: daysPast > 7
      };
    } else if (type === 'reminder') {
      const daysLeft = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
      return {
        text: `Vence em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`,
        color: 'text-yellow-600',
        urgent: daysLeft <= 1
      };
    }
    
    return { text: '', color: '', urgent: false };
  };

  if (totalPending === 0) {
    return (
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🎉</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Todas as cobranças em dia!
          </h3>
          <p className="text-gray-600">
            Nenhuma notificação WhatsApp pendente no momento.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-500">WhatsApp: {getConnectionStatusText()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">📱</span>
              <h3 className="text-lg font-semibold text-gray-900">
                Cobranças WhatsApp
              </h3>
            </div>
            
            {totalPending > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {totalPending} pendente{totalPending > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">{getConnectionStatusText()}</span>
          </div>
        </div>
      </div>

      {/* Lista de Notificações */}
      <div className="divide-y divide-gray-200">
        {notificationsToShow.map((notification) => {
          const { invoice, client, subscription } = notification;
          const daysInfo = getDaysInfo(notification);
          const isSending = sendingId === invoice.id;
          
          return (
            <div
              key={invoice.id}
              id={`notification-${invoice.id}`}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-lg">{getTypeIcon(notification.type)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{client.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>📱 {client.phone}</span>
                        <span>•</span>
                        <span className="font-medium">{formatCurrency(invoice.amount)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className={`font-medium ${daysInfo.color}`}>
                      {daysInfo.text}
                    </span>
                    
                    {subscription && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        🔄 {subscription.name}
                      </span>
                    )}
                    
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      {getTypeText(notification.type)}
                    </span>
                  </div>
                </div>
                
                <div className="ml-4">
                  <button
                    onClick={() => handleSendNotification(notification)}
                    disabled={!isConnected || loading || isSending}
                    className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      !isConnected 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : daysInfo.urgent
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isSending ? (
                      <>
                        <LoadingSpinner size="small" />
                        <span className="ml-1">Enviando...</span>
                      </>
                    ) : !isConnected ? (
                      'Desconectado'
                    ) : (
                      <>
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                        Enviar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer com ações */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {showAll ? (
              <>Mostrando todas as {totalPending} notificações</>
            ) : (
              <>Mostrando {Math.min(3, totalPending)} de {totalPending} notificações</>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {totalPending > 3 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {showAll ? 'Ver menos' : `Ver todas (${totalPending})`}
              </button>
            )}
            
            <button
              onClick={() => {
                // Navegar para página completa de WhatsApp
                console.log('Navegando para WhatsApp Manager...');
              }}
              className="btn-primary text-sm"
            >
              📱 Gerenciar WhatsApp
            </button>
          </div>
        </div>
        
        {/* Informações de status */}
        {!isConnected && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">
                  WhatsApp Desconectado
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Para enviar cobranças, conecte seu WhatsApp primeiro.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppQuickActions;