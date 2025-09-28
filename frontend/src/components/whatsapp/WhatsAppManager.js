// src/components/whatsapp/WhatsAppManager.js - PÁGINA COMPLETA DE GERENCIAMENTO
import React, { useState, useEffect } from 'react';
import { useWhatsAppNotifications } from '../../hooks/useWhatsAppNotifications';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters'; // Adicionado import

const WhatsAppManager = ({ invoices = [], clients = [], subscriptions = [] }) => {
  const {
    connectionStatus,
    isConnected,
    loading,
    messagingStats,
    checkConnection,
    testConnection,
    sendBulkNotifications,
    calculatePendingNotifications,
    generateMessagePreview,
    updateCompanySettings,
    getConnectionStatusText
  } = useWhatsAppNotifications();

  // Estados locais
  const [activeTab, setActiveTab] = useState('pending'); // Mudado para 'pending' como padrão
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [previewMessage, setPreviewMessage] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Configurações da empresa
  const [companySettings, setCompanySettings] = useState({
    name: 'Conexão Delivery',
    phone: '(11) 99999-9999',
    email: 'contato@conexaodelivery.com',
    website: 'www.conexaodelivery.com',
    pixKey: '11999999999',
    supportHours: '8h às 18h, Segunda a Sexta'
  });

  const [settingsChanged, setSettingsChanged] = useState(false);

  // Calcular notificações pendentes
  const pendingNotifications = calculatePendingNotifications(invoices, clients, subscriptions);

  // Atualizar conexão ao carregar
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Testar conexão
  const handleTestConnection = async () => {
    try {
      setTestResult(null);
      const result = await testConnection(testPhone || null);
      setTestResult(result);
    } catch (error) {
      setTestResult({ connection: { connected: false, error: error.message } });
    }
  };

  // Salvar configurações da empresa
  const handleSaveSettings = async () => {
    try {
      const result = updateCompanySettings(companySettings);
      if (result.success) {
        setSettingsChanged(false);
        alert('✅ Configurações salvas com sucesso!');
      } else {
        alert('❌ Erro ao salvar configurações: ' + result.error);
      }
    } catch (error) {
      alert('❌ Erro ao salvar configurações: ' + error.message);
    }
  };

  // Selecionar/deselecionar notificação
  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  // Selecionar todas as notificações
  const selectAllNotifications = () => {
    const allNotifications = [
      ...pendingNotifications.overdue,
      ...pendingNotifications.reminders,
      ...pendingNotifications.newInvoices
    ];
    
    const allIds = allNotifications.map(n => n.invoice.id);
    setSelectedNotifications(allIds);
  };

  // Limpar seleção
  const clearSelection = () => {
    setSelectedNotifications([]);
  };

  // Enviar notificações selecionadas em lote
  const handleBulkSend = async () => {
    if (selectedNotifications.length === 0) {
      alert('Selecione pelo menos uma notificação');
      return;
    }

    if (!isConnected) {
      alert('WhatsApp não está conectado');
      return;
    }

    setBulkSending(true);
    try {
      const allNotifications = [
        ...pendingNotifications.overdue,
        ...pendingNotifications.reminders,
        ...pendingNotifications.newInvoices
      ];

      const notificationsToSend = allNotifications.filter(n => 
        selectedNotifications.includes(n.invoice.id)
      );

      const results = await sendBulkNotifications(notificationsToSend, 3000);
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      alert(`📊 Envio concluído!\n✅ Sucessos: ${successful}\n❌ Falhas: ${failed}`);
      
      // Limpar seleção após envio
      clearSelection();
      
    } catch (error) {
      alert('❌ Erro no envio em lote: ' + error.message);
    } finally {
      setBulkSending(false);
    }
  };

  // Visualizar preview da mensagem
  const handlePreviewMessage = (notification) => {
    try {
      const { type, invoice, client, subscription } = notification;
      const message = generateMessagePreview(type, invoice, client, subscription);
      setPreviewMessage(message);
      setIsPreviewModalOpen(true);
    } catch (error) {
      alert('Erro ao gerar preview: ' + error.message);
    }
  };

  // Funções de renderização das abas (Tabs)

  const renderConnectionStatus = () => {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📱 Status da Conexão WhatsApp
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">{getConnectionStatusText()}</span>
              </div>
              <div className="text-sm text-gray-600">
                {connectionStatus?.state && (
                  <span>Estado: {connectionStatus.state}</span>
                )}
              </div>
            </div>
            
            <button
              onClick={checkConnection}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                'Verificar'
              )}
            </button>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              🧪 Teste de Envio
            </h4>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="11999999999 (opcional)"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="form-input flex-1"
              />
              <button
                onClick={handleTestConnection}
                disabled={loading || !isConnected}
                className="btn-success"
              >
                Testar
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Deixe vazio para testar apenas a conexão, ou informe um número para enviar mensagem de teste
            </p>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg border ${
              testResult.connection?.connected 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <h5 className="font-medium mb-2">Resultado do Teste:</h5>
              <div className="text-sm">
                <div>Status: {testResult.connection?.connected ? '✅ Conectado' : '❌ Falha'}</div>
                {testResult.testResult && (
                  <div>Envio: {testResult.testResult.success ? '✅ Enviado' : '❌ Falhou'}</div>
                )}
                {testResult.connection?.error && (
                  <div className="text-red-600">Erro: {testResult.connection.error}</div>
                )}
              </div>
            </div>
          )}

          {messagingStats && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                📊 Estatísticas (últimos 30 dias)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-blue-600">{messagingStats.total}</div>
                  <div className="text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{messagingStats.successful}</div>
                  <div className="text-gray-600">Enviadas</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-red-600">{messagingStats.failed}</div>
                  <div className="text-gray-600">Falharam</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-orange-600">{messagingStats.successRate}%</div>
                  <div className="text-gray-600">Sucesso</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⚙️ Configurações da Empresa
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Empresa
              </label>
              <input
                type="text"
                value={companySettings.name}
                onChange={(e) => {
                  setCompanySettings(prev => ({ ...prev, name: e.target.value }));
                  setSettingsChanged(true);
                }}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={companySettings.phone}
                onChange={(e) => {
                  setCompanySettings(prev => ({ ...prev, phone: e.target.value }));
                  setSettingsChanged(true);
                }}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={companySettings.email}
                onChange={(e) => {
                  setCompanySettings(prev => ({ ...prev, email: e.target.value }));
                  setSettingsChanged(true);
                }}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="text"
                value={companySettings.website}
                onChange={(e) => {
                  setCompanySettings(prev => ({ ...prev, website: e.target.value }));
                  setSettingsChanged(true);
                }}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chave PIX
              </label>
              <input
                type="text"
                value={companySettings.pixKey}
                onChange={(e) => {
                  setCompanySettings(prev => ({ ...prev, pixKey: e.target.value }));
                  setSettingsChanged(true);
                }}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horário de Atendimento
              </label>
              <input
                type="text"
                value={companySettings.supportHours}
                onChange={(e) => {
                  setCompanySettings(prev => ({ ...prev, supportHours: e.target.value }));
                  setSettingsChanged(true);
                }}
                className="form-input"
              />
            </div>
          </div>

          {settingsChanged && (
            <div className="flex space-x-3">
              <button
                onClick={handleSaveSettings}
                className="btn-primary"
              >
                💾 Salvar Configurações
              </button>
              <button
                onClick={() => {
                  setCompanySettings({
                    name: 'Conexão Delivery',
                    phone: '(11) 99999-9999',
                    email: 'contato@conexaodelivery.com',
                    website: 'www.conexaodelivery.com',
                    pixKey: '11999999999',
                    supportHours: '8h às 18h, Segunda a Sexta'
                  });
                  setSettingsChanged(false);
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const renderPendingNotifications = () => {
    const allNotifications = [
      ...pendingNotifications.overdue,
      ...pendingNotifications.reminders,
      ...pendingNotifications.newInvoices
    ];

    const getTypeInfo = (type) => {
      switch (type) {
        case 'overdue': return { text: '🚨 Vencida', color: 'bg-red-100 text-red-800' };
        case 'reminder': return { text: '🔔 Lembrete', color: 'bg-yellow-100 text-yellow-800' };
        case 'new_invoice': return { text: '📄 Nova Fatura', color: 'bg-blue-100 text-blue-800' };
        default: return { text: type, color: 'bg-gray-100 text-gray-800' };
      }
    };

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              📋 Notificações Pendentes ({pendingNotifications.total})
            </h3>
            
            {allNotifications.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={selectAllNotifications}
                  className="btn-secondary text-sm"
                >
                  Selecionar Todas
                </button>
                <button
                  onClick={clearSelection}
                  className="btn-secondary text-sm"
                >
                  Limpar Seleção
                </button>
                {selectedNotifications.length > 0 && (
                  <button
                    onClick={handleBulkSend}
                    disabled={!isConnected || bulkSending}
                    className="btn-primary text-sm"
                  >
                    {bulkSending ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      `Enviar ${selectedNotifications.length}`
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {allNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Todas as cobranças em dia!
            </h4>
            <p className="text-gray-600">
              Nenhuma notificação WhatsApp pendente no momento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {allNotifications.map((notification) => {
              const { type, invoice, client } = notification;
              const isSelected = selectedNotifications.includes(invoice.id);
              const typeInfo = getTypeInfo(type);
              
              return (
                <div key={invoice.id} className={`p-4 flex items-start space-x-4 ${isSelected ? 'bg-blue-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleNotificationSelection(invoice.id)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.text}
                        </span>
                        <h4 className="font-medium text-gray-900 mt-1">{client.name}</h4>
                        <p className="text-sm text-gray-500">{client.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(invoice.amount)}</p>
                        <p className="text-sm text-gray-500">Vence: {formatDate(invoice.dueDate)}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePreviewMessage(notification)}
                    className="btn-secondary text-xs"
                  >
                    👁️ Preview
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };
  
  // Estrutura principal do componente
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Gerenciador de Notificações WhatsApp</h1>
          <p className="dashboard-subtitle">
            Monitore a conexão, envie cobranças e personalize suas mensagens
          </p>
        </div>

        {/* Abas de Navegação (Tabs) */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pendentes ({pendingNotifications.total})
            </button>
            <button
              onClick={() => setActiveTab('connection')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'connection'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Conexão e Status
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Configurações
            </button>
          </nav>
        </div>

        {/* Conteúdo das Abas */}
        <div>
          {activeTab === 'pending' && renderPendingNotifications()}
          {activeTab === 'connection' && renderConnectionStatus()}
          {activeTab === 'settings' && renderSettings()}
        </div>

        {/* Modal de Preview */}
        <Modal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title="👁️ Preview da Mensagem"
        >
          {previewMessage && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <pre className="text-sm whitespace-pre-wrap font-sans text-gray-800">
                {previewMessage}
              </pre>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default WhatsAppManager;