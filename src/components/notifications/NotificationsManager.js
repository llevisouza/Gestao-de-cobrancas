// src/components/notifications/NotificationsManager.js
import React, { useState, useEffect } from 'react';
import { emailService } from '../../services/emailService';
import { useFirestore } from '../../hooks/useFirestore';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

const NotificationsManager = () => {
  const { invoices, clients } = useFirestore();
  const [loading, setLoading] = useState(false);
  const [emailHistory, setEmailHistory] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [bulkResults, setBulkResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('send');

  // Calcular notificações pendentes
  const calculatePendingNotifications = () => {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    const overdue = [];
    const reminders = [];
    
    invoices.forEach(invoice => {
      if (invoice.status === 'pending' || invoice.status === 'overdue') {
        const client = clients.find(c => c.id === invoice.clientId);
        if (client && client.email) {
          const dueDate = new Date(invoice.dueDate);
          
          if (dueDate < today) {
            overdue.push({ type: 'overdue', invoice, client });
          } else if (dueDate <= threeDaysFromNow) {
            reminders.push({ type: 'reminder', invoice, client });
          }
        }
      }
    });
    
    return { overdue, reminders };
  };

  const { overdue, reminders } = calculatePendingNotifications();

  // Enviar notificações em lote
  const sendBulkNotifications = async (notifications, type) => {
    setLoading(true);
    try {
      console.log(`Enviando ${notifications.length} notificações do tipo ${type}...`);
      const results = await emailService.sendBulkEmails(notifications);
      setBulkResults(results);
      setShowResults(true);
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      alert(`✅ Envio concluído!\n${successful} emails enviados com sucesso\n${failed} falharam`);
    } catch (error) {
      console.error('Erro no envio em lote:', error);
      alert('Erro ao enviar notificações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Enviar notificação individual
  const sendIndividualNotification = async (notification) => {
    setLoading(true);
    try {
      let result;
      
      switch (notification.type) {
        case 'overdue':
          result = await emailService.sendOverdueNotification(notification.invoice, notification.client);
          break;
        case 'reminder':
          result = await emailService.sendReminderNotification(notification.invoice, notification.client);
          break;
        default:
          throw new Error('Tipo de notificação inválido');
      }
      
      if (result.success) {
        alert(`✅ Email enviado para ${notification.client.name}!`);
      } else {
        alert(`❌ Erro ao enviar email: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Ver histórico de emails de um cliente
  const viewEmailHistory = async (client) => {
    setLoading(true);
    setSelectedClient(client);
    try {
      const history = await emailService.getEmailHistory(client.id);
      setEmailHistory(history);
      setShowHistory(true);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      alert('Erro ao carregar histórico de emails');
    } finally {
      setLoading(false);
    }
  };

  const NotificationCard = ({ notifications, title, type, color, icon }) => (
    <div className={`kpi-card kpi-card-${color}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
        </div>
        <div className={`text-${color}-600`}>
          {icon}
        </div>
      </div>
      
      {notifications.length > 0 && (
        <>
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {notifications.slice(0, 5).map((notification, index) => (
              <div key={index} className="flex items-center justify-between bg-white bg-opacity-50 rounded p-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{notification.client.name}</p>
                  <p className="text-xs text-gray-600">
                    R$ {parseFloat(notification.invoice.amount).toFixed(2)} - 
                    Venc: {new Date(notification.invoice.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={() => sendIndividualNotification(notification)}
                  disabled={loading}
                  className="btn-secondary text-xs px-2 py-1"
                >
                  Enviar
                </button>
              </div>
            ))}
            {notifications.length > 5 && (
              <p className="text-xs text-gray-500 text-center">
                +{notifications.length - 5} mais...
              </p>
            )}
          </div>
          
          <button
            onClick={() => sendBulkNotifications(notifications, type)}
            disabled={loading}
            className={`btn-${color === 'error' ? 'danger' : 'primary'} w-full`}
          >
            {loading ? (
              <LoadingSpinner size="small" />
            ) : (
              `Enviar Todas (${notifications.length})`
            )}
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="dashboard-title">Central de Notificações</h1>
              <p className="dashboard-subtitle">
                Gerencie e envie notificações automáticas por email
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('send')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'send'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Enviar Notificações
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Histórico
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'config'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Configurações
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'send' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <NotificationCard
              notifications={overdue}
              title="Faturas Vencidas"
              type="overdue"
              color="error"
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              }
            />

            <NotificationCard
              notifications={reminders}
              title="Lembretes (3 dias)"
              type="reminder"
              color="warning"
              icon={
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              }
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Clientes com Email</h3>
              <p className="text-sm text-gray-600">Clique para ver o histórico de emails</p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.filter(client => client.email).map(client => (
                  <div key={client.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{client.name}</h4>
                        <p className="text-sm text-gray-600">{client.email}</p>
                      </div>
                      <button
                        onClick={() => viewEmailHistory(client)}
                        disabled={loading}
                        className="btn-secondary text-xs"
                      >
                        Ver Histórico
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Configurações de Email</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="alert alert-info">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-medium">Como configurar as notificações por email:</h4>
                    <ol className="mt-2 text-sm list-decimal list-inside space-y-1">
                      <li>Crie uma conta no <a href="https://emailjs.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">EmailJS</a></li>
                      <li>Configure seu serviço de email (Gmail, Outlook, etc.)</li>
                      <li>Crie os templates de email</li>
                      <li>Adicione as chaves de API nas variáveis de ambiente</li>
                    </ol>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Variáveis de Ambiente Necessárias:</h4>
                  <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded">
{`REACT_APP_EMAILJS_SERVICE_ID=your_service_id
REACT_APP_EMAILJS_TEMPLATE_OVERDUE=template_overdue_id
REACT_APP_EMAILJS_TEMPLATE_REMINDER=template_reminder_id
REACT_APP_EMAILJS_TEMPLATE_PAYMENT=template_payment_id
REACT_APP_EMAILJS_TEMPLATE_NEW_INVOICE=template_new_invoice_id
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key`}
                  </pre>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Status da Configuração:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${process.env.REACT_APP_EMAILJS_SERVICE_ID ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm">Service ID: {process.env.REACT_APP_EMAILJS_SERVICE_ID ? '✅ Configurado' : '❌ Não configurado'}</span>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${process.env.REACT_APP_EMAILJS_PUBLIC_KEY ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm">Public Key: {process.env.REACT_APP_EMAILJS_PUBLIC_KEY ? '✅ Configurado' : '❌ Não configurado'}</span>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${process.env.REACT_APP_EMAILJS_TEMPLATE_OVERDUE ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm">Template Vencidas: {process.env.REACT_APP_EMAILJS_TEMPLATE_OVERDUE ? '✅ Configurado' : '❌ Não configurado'}</span>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${process.env.REACT_APP_EMAILJS_TEMPLATE_REMINDER ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm">Template Lembrete: {process.env.REACT_APP_EMAILJS_TEMPLATE_REMINDER ? '✅ Configurado' : '❌ Não configurado'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Histórico */}
        <Modal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          title={`Histórico de Emails - ${selectedClient?.name}`}
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="medium" message="Carregando histórico..." />
            </div>
          ) : (
            <div className="space-y-4">
              {emailHistory.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum email encontrado</h3>
                  <p className="text-gray-600">Este cliente ainda não recebeu emails do sistema</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emailHistory.map((email, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              email.status === 'sent' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {email.status === 'sent' ? 'Enviado' : 'Erro'}
                            </span>
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {email.type === 'overdue' && '⚠️ Fatura Vencida'}
                              {email.type === 'reminder' && '🔔 Lembrete'}
                              {email.type === 'payment_confirmation' && '✅ Pagamento'}
                              {email.type === 'new_invoice' && '📄 Nova Fatura'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{email.subject}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {email.sentAt?.toDate().toLocaleString('pt-BR')}
                          </p>
                          {email.error && (
                            <p className="text-xs text-red-600 mt-1">Erro: {email.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Modal de Resultados */}
        <Modal
          isOpen={showResults}
          onClose={() => setShowResults(false)}
          title="Resultados do Envio em Lote"
        >
          <div className="space-y-4">
            {bulkResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{result.client}</h4>
                    <p className="text-sm text-gray-600">{result.email}</p>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      result.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? '✅ Enviado' : '❌ Falhou'}
                    </span>
                  </div>
                </div>
                {result.error && (
                  <p className="text-xs text-red-600 mt-2">Erro: {result.error}</p>
                )}
              </div>
            ))}
            
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Resumo:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-600 font-medium">
                    ✅ Enviados: {bulkResults.filter(r => r.success).length}
                  </span>
                </div>
                <div>
                  <span className="text-red-600 font-medium">
                    ❌ Falharam: {bulkResults.filter(r => !r.success).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default NotificationsManager;