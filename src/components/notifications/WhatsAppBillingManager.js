// src/components/notifications/WhatsAppBillingManager.js
import React, { useState, useEffect } from 'react';
import { whatsappService } from '../../services/whatsappService';
import { useFirestore } from '../../hooks/useFirestore';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import WhatsAppTemplateEditor from '../whatsapp/WhatsAppTemplateEditor';
import QuickMessageEditor from '../whatsapp/QuickMessageEditor';

const WhatsAppBillingManager = () => {
  const { invoices, clients, subscriptions } = useFirestore();
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [sendResults, setSendResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showQuickEditor, setShowQuickEditor] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [companySettings, setCompanySettings] = useState({
    name: 'Conexão Delivery',
    phone: '(11) 99999-9999',
    pixKey: '11999999999',
    supportHours: '8h às 18h, Segunda a Sexta'
  });
  const [filter, setFilter] = useState('all');

  // Verificar conexão ao montar componente
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const status = await whatsappService.checkConnection();
      setConnectionStatus(status);
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setConnectionStatus({ connected: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Calcular notificações pendentes
  const getPendingNotifications = () => {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    const overdue = [];
    const reminders = [];
    const newInvoices = [];

    invoices.forEach(invoice => {
      if (['pending', 'overdue'].includes(invoice.status)) {
        const client = clients.find(c => c.id === invoice.clientId);
        const subscription = subscriptions.find(s => s.id === invoice.subscriptionId);
        
        if (client && client.phone) {
          const dueDate = new Date(invoice.dueDate);
          
          if (dueDate < today) {
            overdue.push({ type: 'overdue', invoice, client, subscription });
          } else if (dueDate <= threeDaysFromNow) {
            reminders.push({ type: 'reminder', invoice, client, subscription });
          }
        }
      }
    });

    // Faturas geradas hoje
    const todayStr = today.toISOString().split('T')[0];
    invoices.forEach(invoice => {
      if (invoice.generationDate === todayStr && invoice.status === 'pending') {
        const client = clients.find(c => c.id === invoice.clientId);
        const subscription = subscriptions.find(s => s.id === invoice.subscriptionId);
        
        if (client && client.phone) {
          newInvoices.push({ type: 'new_invoice', invoice, client, subscription });
        }
      }
    });

    return { overdue, reminders, newInvoices };
  };

  const { overdue, reminders, newInvoices } = getPendingNotifications();

  // Filtrar notificações
  const getFilteredNotifications = () => {
    const all = [...overdue, ...reminders, ...newInvoices];
    
    switch (filter) {
      case 'overdue': return overdue;
      case 'reminder': return reminders;
      case 'new_invoice': return newInvoices;
      default: return all;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  // Selecionar/deselecionar notificação
  const toggleNotification = (notification) => {
    const key = `${notification.type}_${notification.invoice.id}`;
    setSelectedNotifications(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  // Selecionar todas as notificações
  const selectAllNotifications = () => {
    const allKeys = filteredNotifications.map(n => `${n.type}_${n.invoice.id}`);
    setSelectedNotifications(allKeys);
  };

  // Limpar seleção
  const clearSelection = () => {
    setSelectedNotifications([]);
  };

  // Preview da mensagem
  const previewMessage = async (notification) => {
    let message = '';
    const { type, invoice, client, subscription } = notification;
    
    try {
      switch (type) {
        case 'overdue':
          message = whatsappService.getOverdueInvoiceTemplate(invoice, client, subscription);
          break;
        case 'reminder':
          message = whatsappService.getReminderTemplate(invoice, client, subscription);
          break;
        case 'new_invoice':
          message = whatsappService.getNewInvoiceTemplate(invoice, client, subscription);
          break;
      }
      
      setPreviewData({ ...notification, message });
      setShowPreview(true);
    } catch (error) {
      alert('Erro ao gerar preview: ' + error.message);
    }
  };

  // Enviar notificação individual
  const sendSingleNotification = async (notification) => {
    setLoading(true);
    try {
      const { type, invoice, client, subscription } = notification;
      let result;

      switch (type) {
        case 'overdue':
          result = await whatsappService.sendOverdueNotification(invoice, client, subscription);
          break;
        case 'reminder':
          result = await whatsappService.sendReminderNotification(invoice, client, subscription);
          break;
        case 'new_invoice':
          result = await whatsappService.sendNewInvoiceNotification(invoice, client, subscription);
          break;
      }

      if (result.success) {
        alert(`✅ Mensagem enviada para ${client.name}!`);
      } else {
        alert(`❌ Erro ao enviar: ${result.error}`);
      }
    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Enviar notificações selecionadas
  const sendSelectedNotifications = async () => {
    if (selectedNotifications.length === 0) {
      alert('Selecione pelo menos uma notificação');
      return;
    }

    const selected = filteredNotifications.filter(n => 
      selectedNotifications.includes(`${n.type}_${n.invoice.id}`)
    );

    setLoading(true);
    try {
      const results = await whatsappService.sendBulkMessages(selected, 3000);
      setSendResults(results);
      setShowResults(true);
      clearSelection();
    } catch (error) {
      alert('Erro no envio em lote: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar configurações da empresa
  const updateCompanySettings = () => {
    whatsappService.updateCompanyInfo(companySettings);
    alert('✅ Configurações atualizadas!');
  };

  // Testar conexão
  const testConnection = async () => {
    setLoading(true);
    try {
      const testResult = await whatsappService.testConnection();
      alert(`Teste de conexão: ${testResult.connection.connected ? '✅ Conectado' : '❌ Desconectado'}`);
      setConnectionStatus(testResult.connection);
    } catch (error) {
      alert('Erro no teste: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // AQUI COMEÇAM AS NOVAS FUNÇÕES QUE VOCÊ PEDIU PARA ADICIONAR
  // ==========================================================

  // Handler para edição rápida
  const handleQuickEdit = (notification) => {
    setEditingNotification(notification);
    
    // Gerar mensagem inicial baseada no template atual
    const initialMessage = generateInitialMessage(notification);
    setCustomMessage(initialMessage);
    
    setShowQuickEditor(true);
  };

  // Handler para editor completo
  const handleTemplateEdit = (notification) => {
    setEditingNotification(notification);
    setShowTemplateEditor(true);
  };

  // Salvar template personalizado
  const handleSaveTemplate = async (templateData) => {
    try {
      // Salvar no localStorage ou backend
      localStorage.setItem(`whatsapp_template_${templateData.type}`, templateData.template);
      
      // Atualizar serviço WhatsApp
      whatsappService.customTemplates = whatsappService.customTemplates || {};
      whatsappService.customTemplates[templateData.type] = templateData.template;
      
      setShowTemplateEditor(false);
      alert('✅ Template atualizado com sucesso!');
    } catch (error) {
      alert('❌ Erro ao salvar template: ' + error.message);
    }
  };

  // Salvar mensagem personalizada e enviar
  const handleQuickSave = async (message, preview) => {
    try {
      if (!editingNotification) return;
      
      // Enviar mensagem personalizada
      const result = await whatsappService.sendCustomMessage(
        editingNotification.client.phone,
        message,
        editingNotification.invoice,
        editingNotification.client
      );
      
      if (result.success) {
        alert('✅ Mensagem personalizada enviada!');
        setShowQuickEditor(false);
        
        // Remover da lista de pendentes
        setSelectedNotifications(prev => 
          prev.filter(id => id !== editingNotification.invoice.id)
        );
      } else {
        alert('❌ Erro ao enviar: ' + result.error);
      }
    } catch (error) {
      alert('❌ Erro: ' + error.message);
    }
  };

  // Gerar mensagem inicial baseada no tipo
  const generateInitialMessage = (notification) => {
    const { type, invoice, client, subscription } = notification;
    
    // Templates simples para início da edição
    const templates = {
      overdue: `🚨 Olá ${client.name}!\n\nSua fatura de ${formatCurrency(invoice.amount)} está vencida desde ${formatDate(invoice.dueDate)}.\n\nPIX: {{company.pix}}\n\nPor favor, regularize para evitar juros.\n\nObrigado!`,
      
      reminder: `🔔 Oi ${client.name}!\n\nLembrando que sua fatura de ${formatCurrency(invoice.amount)} vence em ${formatDate(invoice.dueDate)}.\n\nPIX: {{company.pix}}\n\nObrigado!`,
      
      new_invoice: `📄 Olá ${client.name}!\n\nNova fatura disponível: ${formatCurrency(invoice.amount)}\nVencimento: ${formatDate(invoice.dueDate)}\n\nPIX: {{company.pix}}\n\nObrigado!`
    };
    
    return templates[type] || templates.reminder;
  };

  // ============================================
  // FIM DAS NOVAS FUNÇÕES
  // ============================================

  const getTypeIcon = (type) => {
    switch (type) {
      case 'overdue': return '🚨';
      case 'reminder': return '🔔';
      case 'new_invoice': return '📄';
      default: return '📱';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'reminder': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'new_invoice': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'overdue': return 'Vencida';
      case 'reminder': return 'Lembrete';
      case 'new_invoice': return 'Nova Fatura';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="dashboard-title">📱 Cobranças WhatsApp</h1>
              <p className="dashboard-subtitle">
                Envie cobranças detalhadas via WhatsApp com informações visuais do plano
              </p>
            </div>
            <div className="flex space-x-3">
              <button onClick={testConnection} className="btn-secondary" disabled={loading}>
                🧪 Testar Conexão
              </button>
              <button onClick={checkConnection} className="btn-primary" disabled={loading}>
                🔄 Verificar Status
              </button>
            </div>
          </div>
        </div>

        {/* Status da Conexão */}
        <div className="mb-6">
          <div className={`p-4 rounded-lg border ${
            connectionStatus?.connected 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  connectionStatus?.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
                <div>
                  <h3 className={`font-medium ${
                    connectionStatus?.connected ? 'text-green-800' : 'text-red-800'
                  }`}>
                    WhatsApp {connectionStatus?.connected ? 'Conectado' : 'Desconectado'}
                  </h3>
                  <p className={`text-sm ${
                    connectionStatus?.connected ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Status: {connectionStatus?.state || 'Verificando...'}
                  </p>
                </div>
              </div>
              {connectionStatus?.connected && (
                <span className="text-green-600 text-sm font-medium">
                  ✅ Pronto para enviar
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{overdue.length}</div>
                <div className="text-sm text-gray-600">Vencidas</div>
              </div>
              <div className="text-3xl">🚨</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{reminders.length}</div>
                <div className="text-sm text-gray-600">Lembretes</div>
              </div>
              <div className="text-3xl">🔔</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{newInvoices.length}</div>
                <div className="text-sm text-gray-600">Novas</div>
              </div>
              <div className="text-3xl">📄</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{selectedNotifications.length}</div>
                <div className="text-sm text-gray-600">Selecionadas</div>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="form-select"
              >
                <option value="all">Todas ({filteredNotifications.length})</option>
                <option value="overdue">Vencidas ({overdue.length})</option>
                <option value="reminder">Lembretes ({reminders.length})</option>
                <option value="new_invoice">Novas Faturas ({newInvoices.length})</option>
              </select>

              <button onClick={selectAllNotifications} className="btn-secondary text-sm">
                ✅ Selecionar Todas
              </button>
              <button onClick={clearSelection} className="btn-secondary text-sm">
                ❌ Limpar Seleção
              </button>
            </div>

            {selectedNotifications.length > 0 && (
              <button 
                onClick={sendSelectedNotifications} 
                className="btn-primary"
                disabled={loading || !connectionStatus?.connected}
              >
                {loading ? (
                  <LoadingSpinner size="small" />
                ) : (
                  `📤 Enviar Selecionadas (${selectedNotifications.length})`
                )}
              </button>
            )}
          </div>
        </div>

        {/* Lista de Notificações */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              📱 Notificações Pendentes ({filteredNotifications.length})
            </h3>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma notificação pendente!
              </h3>
              <p className="text-gray-600">
                Todas as cobranças estão em dia ou já foram enviadas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification, index) => {
                const { type, invoice, client, subscription } = notification;
                const isSelected = selectedNotifications.includes(`${type}_${invoice.id}`);
                
                return (
                  <div key={`${type}_${invoice.id}`} className={`p-6 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleNotification(notification)}
                        className="mt-1 h-4 w-4 text-blue-600 rounded"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(type)}`}>
                                {getTypeIcon(type)} {getTypeName(type)}
                              </span>
                              
                              {subscription && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                  🔄 {subscription.name}
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-gray-900">{client.name}</h4>
                                <p className="text-sm text-gray-600">📱 {client.phone}</p>
                                <p className="text-sm text-gray-600">✉️ {client.email}</p>
                              </div>
                              
                              <div>
                                <p className="font-semibold text-gray-900">💰 {formatCurrency(invoice.amount)}</p>
                                <p className="text-sm text-gray-600">📅 Vence: {formatDate(invoice.dueDate)}</p>
                                <p className="text-sm text-gray-600">🆔 #{invoice.id?.substring(0, 8)}</p>
                              </div>
                            </div>

                            {subscription && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm font-medium text-gray-700">📋 Detalhes do Plano:</p>
                                <div className="text-xs text-gray-600 mt-1">
                                  <span>🔄 {subscription.recurrenceType === 'monthly' ? 'Mensal' : 
                                       subscription.recurrenceType === 'weekly' ? 'Semanal' : 
                                       subscription.recurrenceType === 'daily' ? 'Diário' : 'Personalizado'}</span>
                                  <span className="ml-3">📅 Desde {formatDate(subscription.startDate)}</span>
                                  {subscription.dayOfMonth && <span className="ml-3">📆 Dia {subscription.dayOfMonth}</span>}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleQuickEdit(notification)}
                                className="btn-secondary text-xs"
                                title="Edição rápida"
                              >
                                ⚡ Editar
                              </button>
                              <button
                                onClick={() => handleTemplateEdit(notification)}
                                className="btn-secondary text-xs"
                                title="Editor completo"
                              >
                                ✏️ Template
                              </button>
                            </div>
                            
                            <button
                              onClick={() => sendSingleNotification(notification)}
                              disabled={loading || !connectionStatus?.connected}
                              className="btn-primary text-xs"
                            >
                              {loading ? '⏳' : '📤 Enviar'}
                            </button>
                          </div>
                        </div>
                      </div>
_                  </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Configurações da Empresa */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">🏢 Configurações da Empresa</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={companySettings.name}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone de Contato
                </label>
                <input
                  type="text"
                  value={companySettings.phone}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chave PIX Principal
                </label>
                <input
                  type="text"
                  value={companySettings.pixKey}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, pixKey: e.target.value }))}
                  className="form-input"
                  placeholder="Email, telefone, CPF ou chave aleatória"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário de Atendimento
                </label>
                <input
                  type="text"
                  value={companySettings.supportHours}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, supportHours: e.target.value }))}
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <button onClick={updateCompanySettings} className="btn-primary">
                💾 Salvar Configurações
              </button>
            </div>
          </div>
        </div>

        {/* Modal Preview */}
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title={`📱 Preview da Mensagem - ${previewData?.client?.name}`}
        >
          {previewData && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">📱</span>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Para: {previewData.client.name}</p>
                    <p className="text-sm text-green-600">{previewData.client.phone}</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border">
                  <pre className="text-sm whitespace-pre-wrap font-mono text-gray-800">
                    {previewData.message}
                  </pre>
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-green-600">
                    💰 Valor: {formatCurrency(previewData.invoice.amount)}
                  </div>
                  <button
                    onClick={() => {
                      sendSingleNotification(previewData);
                      setShowPreview(false);
                    }}
                    className="btn-primary text-sm"
                    disabled={loading || !connectionStatus?.connected}
                  >
                    📤 Enviar Agora
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal Resultados */}
        <Modal
          isOpen={showResults}
          onClose={() => setShowResults(false)}
          title="📊 Resultados do Envio em Lote"
        >
          <div className="space-y-4">
            {sendResults.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.client}
                    </h4>
                    <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.phone} - {result.amount}
                    </p>
                    {result.hasSubscription && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        🔄 Com plano
                      </span>
                    )}
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
              <h4 className="font-medium text-gray-900 mb-2">📈 Resumo:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-600 font-medium">
                    ✅ Enviados: {sendResults.filter(r => r.success).length}
                  </span>
                </div>
                <div>
                  <span className="text-red-600 font-medium">
                    ❌ Falharam: {sendResults.filter(r => !r.success).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Modal>

      {/* ========================================================== */}
      {/* AQUI COMEÇA O NOVO JSX QUE VOCÊ PEDIU PARA ADICIONAR      */}
      {/* ========================================================== */}
      
      {/* Editores */}
      <WhatsAppTemplateEditor
        isOpen={showTemplateEditor}
        notification={editingNotification}
        onSave={handleSaveTemplate}
        onClose={() => setShowTemplateEditor(false)}
      />

      {/* Editor Rápido Modal */}
      {showQuickEditor && (
        <Modal
          isOpen={showQuickEditor}
          onClose={() => setShowQuickEditor(false)}
          title="Personalizar Mensagem"
        >
          <QuickMessageEditor
            initialMessage={customMessage}
            notification={editingNotification}
            onSave={handleQuickSave}
            onCancel={() => setShowQuickEditor(false)}
          />
        </Modal>
      )}

      </div>
    </div>
  );
};

export default WhatsAppBillingManager;