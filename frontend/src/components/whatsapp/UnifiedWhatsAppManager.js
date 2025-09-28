// src/components/whatsapp/UnifiedWhatsAppManager.js - COMPONENTE UNIFICADO
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { whatsappService } from '../../services/whatsappService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';

// Componente de Configurações
const WhatsAppSettings = ({ onClose }) => {
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Conexão Delivery',
    phone: '(11) 99999-9999',
    email: 'contato@conexaodelivery.com',
    pixKey: '11999999999',
    website: 'www.conexaodelivery.com',
    supportHours: '8h às 18h, Segunda a Sexta',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(() => {
    try {
      const savedCompanyInfo = localStorage.getItem('whatsapp_company_info');
      if (savedCompanyInfo) {
        setCompanyInfo(JSON.parse(savedCompanyInfo));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      alert('Não foi possível carregar as configurações. Tente novamente.');
    }
  }, []);

  const saveCompanyInfo = useCallback(async () => {
    setLoading(true);
    try {
      localStorage.setItem('whatsapp_company_info', JSON.stringify(companyInfo));
      await whatsappService.updateCompanyInfo(companyInfo);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert(`Erro ao salvar configurações: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [companyInfo]);

  const handleCompanyChange = useCallback((field, value) => {
    setCompanyInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Configurações da Empresa</h3>
          <p className="text-gray-600">Configure as informações que aparecerão nas mensagens</p>
        </div>
        {saved && (
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm">
            ✅ Salvo!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'Nome da Empresa', field: 'name', placeholder: 'Nome da sua empresa', type: 'text' },
          { label: 'Telefone', field: 'phone', placeholder: '(11) 99999-9999', type: 'text' },
          { label: 'Email', field: 'email', placeholder: 'contato@empresa.com', type: 'email' },
          { label: 'Chave PIX', field: 'pixKey', placeholder: 'Chave PIX para pagamentos', type: 'text' },
          { label: 'Website', field: 'website', placeholder: 'www.empresa.com', type: 'text' },
          { label: 'Horário de Atendimento', field: 'supportHours', placeholder: '8h às 18h, Segunda a Sexta', type: 'text' },
        ].map(({ label, field, placeholder, type }) => (
          <div key={field}>
            <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-2">
              {label}
            </label>
            <input
              id={field}
              type={type}
              value={companyInfo[field]}
              onChange={(e) => handleCompanyChange(field, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={placeholder}
              aria-label={label}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={saveCompanyInfo}
          disabled={loading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          aria-label="Salvar configurações da empresa"
        >
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
};

WhatsAppSettings.propTypes = {
  onClose: PropTypes.func.isRequired,
};

// Componente de Template Editor
const TemplateEditor = ({ type, template, onSave, onCancel, isOpen }) => {
  const [editedTemplate, setEditedTemplate] = useState(template || '');
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    setEditedTemplate(template || getDefaultTemplate(type));
  }, [template, type]);

  const getDefaultTemplate = useCallback((templateType) => {
    const defaults = {
      overdue: `🚨 *FATURA VENCIDA* 🚨\n\nOlá *{{client.name}}*! 👋\n\nSua fatura está em atraso e precisa ser regularizada.\n\n💰 *RESUMO DA COBRANÇA*\n💵 Valor: *{{invoice.amount}}*\n📅 Vencimento: {{invoice.dueDate}}\n🆔 Código: {{invoice.id}}\n\n💳 *PAGUE AGORA VIA PIX*\n🔑 Chave PIX: {{company.pix}}\n\n📞 {{company.name}} - {{company.phone}}`,
      reminder: `🔔 *LEMBRETE DE PAGAMENTO* 🔔\n\nOi *{{client.name}}*! 😊\n\nSua fatura vence em breve. Que tal já garantir o pagamento?\n\n💰 *DETALHES DO PAGAMENTO*\n💵 Valor: *{{invoice.amount}}*\n📅 Vencimento: {{invoice.dueDate}}\n🆔 Código: {{invoice.id}}\n\n💳 *PIX PARA PAGAMENTO*\n🔑 Chave PIX: {{company.pix}}\n\n📞 {{company.name}} - {{company.phone}}`,
      new_invoice: `📄 *NOVA FATURA DISPONÍVEL* 📄\n\nOlá *{{client.name}}*! 👋\n\nUma nova fatura foi gerada para você!\n\n💰 *INFORMAÇÕES DA FATURA*\n💵 Valor: *{{invoice.amount}}*\n📅 Vencimento: {{invoice.dueDate}}\n🆔 Código: {{invoice.id}}\n\n💳 *PAGAMENTO VIA PIX*\n🔑 Chave PIX: {{company.pix}}\n\n📞 {{company.name}} - {{company.phone}}`,
      payment_confirmed: `✅ *PAGAMENTO CONFIRMADO* ✅\n\n*{{client.name}}*, seu pagamento foi confirmado! 🎉\n\n💰 *COMPROVANTE DE PAGAMENTO*\n✅ Status: *PAGO*\n💵 Valor: {{invoice.amount}}\n📅 Pago em: {{invoice.paidDate}}\n🆔 Código: {{invoice.id}}\n\n📞 {{company.name}} - {{company.phone}}`,
    };
    return defaults[templateType] || '';
  }, []);

  const generatePreview = useCallback(() => {
    let preview = editedTemplate;
    const mockData = {
      '{{client.name}}': 'João Silva',
      '{{invoice.amount}}': 'R$ 150,00',
      '{{invoice.dueDate}}': '25/12/2024',
      '{{invoice.id}}': '#12345678',
      '{{company.name}}': 'Conexão Delivery',
      '{{company.phone}}': '(11) 99999-9999',
      '{{company.pix}}': '11999999999',
    };
    return Object.entries(mockData).reduce(
      (acc, [key, value]) => acc.replace(new RegExp(key.replace(/[{}]/g, '\\'), 'g'), value),
      preview
    );
  }, [editedTemplate]);

  const typeLabels = useMemo(
    () => ({
      overdue: 'Fatura Vencida',
      reminder: 'Lembrete de Vencimento',
      new_invoice: 'Nova Fatura',
      payment_confirmed: 'Pagamento Confirmado',
    }),
    []
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            Editor de Template: {typeLabels[type]}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Fechar editor de template"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col p-6 border-r">
            <h3 className="text-lg font-semibold mb-4">Editor</h3>
            <textarea
              value={editedTemplate}
              onChange={(e) => setEditedTemplate(e.target.value)}
              className="flex-1 p-4 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite seu template aqui..."
              aria-label="Editor de template"
            />
          </div>

          <div className="w-1/2 flex flex-col p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Preview</h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm px-3 py-1 rounded bg-green-100 text-green-700"
                aria-label={showPreview ? 'Ocultar preview' : 'Mostrar preview'}
              >
                {showPreview ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            {showPreview && (
              <div className="flex-1 bg-gradient-to-br from-green-400 to-green-600 p-4 rounded-lg">
                <div className="bg-white rounded-lg p-4 shadow-lg h-full overflow-y-auto">
                  <div className="text-sm text-gray-600 mb-2">Simulação WhatsApp</div>
                  <div className="bg-green-100 rounded-lg p-3">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                      {generatePreview()}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 p-6 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            aria-label="Cancelar edição do template"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(editedTemplate)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            aria-label="Salvar template"
          >
            Salvar Template
          </button>
        </div>
      </div>
    </div>
  );
};

TemplateEditor.propTypes = {
  type: PropTypes.string.isRequired,
  template: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

// Modal Base
const Modal = ({ title, isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 id="modal-title" className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Fechar modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

// Componente Principal Unificado
const UnifiedWhatsAppManager = ({ clients = [], invoices = [], subscriptions = [], onClose }) => {
  // Estados principais
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('notifications');
  const [showQRCode, setShowQRCode] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [currentTemplateType, setCurrentTemplateType] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showManualSender, setShowManualSender] = useState(false);
  const [sendResults, setSendResults] = useState([]);
  const [templates, setTemplates] = useState({});
  const [qrCode, setQrCode] = useState(null);
  const [messagingStats, setMessagingStats] = useState(null);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        checkConnection(),
        calculateNotifications(),
        loadTemplates(),
        loadMessagingStats(),
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados iniciais. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      const status = await whatsappService.checkConnection();
      setConnectionStatus(status);
      return status;
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setConnectionStatus({ connected: false, error: error.message });
      return { connected: false, error: error.message };
    }
  }, []);

  const calculateNotifications = useCallback(async () => {
    try {
      const pendingNotifications = invoices
        .filter((invoice) => ['pending', 'overdue'].includes(invoice.status))
        .map((invoice) => {
          const client = clients.find((c) => c.id === invoice.clientId);
          if (!client || !client.phone) return null;

          const subscription = subscriptions.find((s) => s.id === invoice.subscriptionId);
          let type = 'reminder';
          if (invoice.status === 'overdue') {
            type = 'overdue';
          } else if (invoice.generatedToday) {
            type = 'new_invoice';
          }

          return {
            id: `${invoice.id}_${type}`,
            type,
            invoice,
            client,
            subscription,
            priority: type === 'overdue' ? 1 : type === 'reminder' ? 2 : 3,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.priority - b.priority);

      setNotifications(pendingNotifications);
      return pendingNotifications;
    } catch (error) {
      console.error('Erro ao calcular notificações:', error);
      alert('Erro ao calcular notificações. Tente novamente.');
      return [];
    }
  }, [clients, invoices, subscriptions]);

  const loadTemplates = useCallback(() => {
    const loadedTemplates = {};
    const templateTypes = ['overdue', 'reminder', 'new_invoice', 'payment_confirmed'];
    templateTypes.forEach((type) => {
      const saved = localStorage.getItem(`whatsapp_template_${type}`);
      if (saved) loadedTemplates[type] = saved;
    });
    setTemplates(loadedTemplates);
  }, []);

  const loadMessagingStats = useCallback(async () => {
    try {
      const stats = await whatsappService.getMessagingStats(30);
      setMessagingStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      alert('Erro ao carregar estatísticas de mensagens.');
    }
  }, []);

  const handleGetQRCode = useCallback(async () => {
    setLoading(true);
    try {
      const result = await whatsappService.getQRCode();
      if (result.success) {
        let qrCodeData = result.qrCode;
        if (qrCodeData && !qrCodeData.startsWith('data:')) {
          qrCodeData = `data:image/png;base64,${qrCodeData}`;
        }
        setQrCode(qrCodeData);
        setShowQRCode(true);
      } else {
        alert(`Erro ao obter QR Code: ${result.error}`);
      }
    } catch (error) {
      alert(`Erro ao obter QR Code: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTestConnection = useCallback(async () => {
    setLoading(true);
    try {
      const result = await whatsappService.testConnection(testPhone || null);
      setTestResult(result);

      if (result.connection?.connected) {
        if (testPhone && result.testResult?.success) {
          alert('✅ Conexão OK e mensagem de teste enviada!');
        } else {
          alert('✅ Conexão WhatsApp funcionando!');
        }
      } else {
        alert(`❌ WhatsApp não está conectado: ${result.connection?.error}`);
      }
      await checkConnection();
    } catch (error) {
      alert(`Erro no teste: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [testPhone, checkConnection]);

  const openTemplateEditor = useCallback((type) => {
    setCurrentTemplateType(type);
    setShowTemplateEditor(true);
  }, []);

  const handleSaveTemplate = useCallback(
    async (template) => {
      try {
        localStorage.setItem(`whatsapp_template_${currentTemplateType}`, template);
        setTemplates((prev) => ({ ...prev, [currentTemplateType]: template }));
        await whatsappService.setCustomTemplate(currentTemplateType, template);
        setShowTemplateEditor(false);
        alert('Template salvo com sucesso!');
      } catch (error) {
        alert(`Erro ao salvar template: ${error.message}`);
      }
    },
    [currentTemplateType]
  );

  const toggleNotificationSelection = useCallback((notificationId) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId]
    );
  }, []);

  const selectAllNotifications = useCallback(() => {
    setSelectedNotifications((prev) =>
      prev.length === notifications.length ? [] : notifications.map((n) => n.id)
    );
  }, [notifications]);

  const sendSelectedNotifications = useCallback(async () => {
    if (selectedNotifications.length === 0) {
      alert('Selecione pelo menos uma notificação');
      return;
    }

    const selectedNotifs = notifications.filter((n) => selectedNotifications.includes(n.id));
    setLoading(true);
    setSendResults([]);

    try {
      const results = await whatsappService.sendBulkMessages(selectedNotifs, 3000);
      setSendResults(results);
      setSelectedNotifications([]);

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      alert(`📊 Envio concluído!\n✅ Sucessos: ${successful}\n❌ Falhas: ${failed}`);
    } catch (error) {
      alert(`Erro no envio: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [notifications, selectedNotifications]);

  const getStatusColor = useCallback((connected) => (connected ? 'text-green-600' : 'text-red-600'), []);

  const getNotificationIcon = useCallback((type) => {
    return {
      overdue: '🚨',
      reminder: '🔔',
      new_invoice: '📄',
      default: '📱',
    }[type] || '📱';
  }, []);

  const getTypeLabel = useCallback((type) => {
    return {
      overdue: 'Vencida',
      reminder: 'Lembrete',
      new_invoice: 'Nova Fatura',
    }[type] || type;
  }, []);

  const renderNotificationsTab = useCallback(() => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Notificações Pendentes ({notifications.length})
            </h3>
            <p className="text-gray-600">Mensagens de cobrança aguardando envio</p>
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={selectAllNotifications}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                aria-label={selectedNotifications.length === notifications.length ? 'Desmarcar todas' : 'Marcar todas'}
              >
                {selectedNotifications.length === notifications.length ? 'Desmarcar' : 'Marcar'} Todas
              </button>
              {selectedNotifications.length > 0 && (
                <button
                  onClick={sendSelectedNotifications}
                  disabled={!connectionStatus?.connected || loading}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                  aria-label={`Enviar ${selectedNotifications.length} notificações`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      📤 Enviar {selectedNotifications.length}
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border">
        {notifications.length === 0 ? (
          <div className="text-center py-16 px-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎉</span>
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-3">Tudo em Dia!</h4>
            <p className="text-gray-600 text-lg">Não há notificações WhatsApp pendentes no momento.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => {
              const isSelected = selectedNotifications.includes(notification.id);
              const typeConfig = {
                overdue: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', badge: 'bg-red-500' },
                reminder: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-500' },
                new_invoice: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', badge: 'bg-blue-500' },
              };
              const config = typeConfig[notification.type] || typeConfig.reminder;

              return (
                <div
                  key={notification.id}
                  className={`p-6 ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleNotificationSelection(notification.id)}
                      className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                      aria-label={`Selecionar notificação para ${notification.client.name}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 ${config.bg} border rounded-xl flex items-center justify-center`}>
                            <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{notification.client.name}</h4>
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border`}
                              >
                                {getNotificationIcon(notification.type)} {getTypeLabel(notification.type)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>📱 {notification.client.phone}</span>
                              <span>💰 {formatCurrency(notification.invoice.amount)}</span>
                              <span>📅 Venc: {formatDate(notification.invoice.dueDate)}</span>
                            </div>
                            {notification.subscription && (
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
                                  📋 {notification.subscription.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  ), [
    notifications,
    selectedNotifications,
    connectionStatus,
    loading,
    selectAllNotifications,
    sendSelectedNotifications,
    toggleNotificationSelection,
    getNotificationIcon,
    getTypeLabel,
  ]);

  const renderConnectionTab = useCallback(() => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Status da Conexão</h3>
        <div className="flex items-center justify-between p-4 border rounded-lg mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${connectionStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">
                {connectionStatus?.connected ? '🟢 Conectado' : '🔴 Desconectado'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {connectionStatus?.state && <span>Estado: {connectionStatus.state}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {!connectionStatus?.connected && (
              <button
                onClick={handleGetQRCode}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                aria-label="Obter QR Code"
              >
                QR Code
              </button>
            )}
            <button
              onClick={checkConnection}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
              aria-label="Verificar conexão"
            >
              {loading ? <LoadingSpinner size="small" /> : 'Verificar'}
            </button>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">🧪 Teste de Envio</h4>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              placeholder="11999999999 (opcional)"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="Número de telefone para teste"
            />
            <button
              onClick={handleTestConnection}
              disabled={loading || !connectionStatus?.connected}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              aria-label="Testar conexão"
            >
              Testar
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Deixe vazio para testar apenas a conexão, ou informe um número para enviar mensagem de teste
          </p>
        </div>

        {testResult && (
          <div
            className={`mt-4 p-3 rounded-lg border ${
              testResult.connection?.connected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <h5 className="font-medium mb-2">Resultado do Teste:</h5>
            <div className="text-sm">
              <div>Status: {testResult.connection?.connected ? '✅ Conectado' : '❌ Falha'}</div>
              {testResult.testResult && <div>Envio: {testResult.testResult.success ? '✅ Enviado' : '❌ Falhou'}</div>}
              {testResult.connection?.error && (
                <div className="text-red-600">Erro: {testResult.connection.error}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {messagingStats && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 Estatísticas (últimos 30 dias)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: messagingStats.total, label: 'Total', color: 'blue' },
              { value: messagingStats.successful, label: 'Enviadas', color: 'green' },
              { value: messagingStats.failed, label: 'Falharam', color: 'red' },
              { value: `${messagingStats.successRate}%`, label: 'Taxa de Sucesso', color: 'orange' },
            ].map((stat) => (
              <div key={stat.label} className={`text-center p-4 bg-${stat.color}-50 rounded-lg`}>
                <div className={`font-bold text-2xl text-${stat.color}-600`}>{stat.value}</div>
                <div className={`text-sm text-${stat.color}-700`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  ), [connectionStatus, loading, testPhone, testResult, handleGetQRCode, checkConnection, handleTestConnection, messagingStats]);

  const renderTemplatesTab = useCallback(() => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">💬</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Templates de Mensagem</h3>
            <p className="text-gray-600">Personalize suas mensagens automáticas</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { key: 'overdue', label: 'Fatura Vencida', icon: '🚨', description: 'Cobranças após vencimento' },
            { key: 'reminder', label: 'Lembrete', icon: '🔔', description: 'Aviso antes do vencimento' },
            { key: 'new_invoice', label: 'Nova Fatura', icon: '📄', description: 'Fatura gerada' },
            { key: 'payment_confirmed', label: 'Pagamento', icon: '✅', description: 'Confirmação de pagamento' },
          ].map((template) => (
            <div key={template.key} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">{template.icon}</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{template.label}</h4>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      templates[template.key] ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {templates[template.key] ? '✨ Personalizado' : '📝 Padrão'}
                  </span>
                </div>
                <button
                  onClick={() => openTemplateEditor(template.key)}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  aria-label={`Editar template ${template.label}`}
                >
                  {templates[template.key] ? '✏️ Editar' : '🎨 Personalizar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ), [templates, openTemplateEditor]);

  const renderManualSenderTab = useCallback(() => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Envio Manual de Mensagens</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Telefone de Destino
            </label>
            <input
              id="phone"
              type="text"
              placeholder="11999999999"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="Telefone de destino"
            />
          </div>
          <div>
            <label htmlFor="message-type" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Mensagem
            </label>
            <select
              id="message-type"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="Tipo de mensagem"
            >
              <option value="custom">Mensagem Personalizada</option>
              <option value="overdue">Fatura Vencida</option>
              <option value="reminder">Lembrete</option>
              <option value="new_invoice">Nova Fatura</option>
              <option value="payment_confirmed">Pagamento Confirmado</option>
            </select>
          </div>
        </div>
        <div className="mt-6">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Mensagem
          </label>
          <textarea
            id="message"
            rows="8"
            placeholder="Digite sua mensagem aqui..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            aria-label="Mensagem manual"
          />
        </div>
        <div className="mt-6 flex justify-end">
          <button
            disabled={!connectionStatus?.connected || loading}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
            aria-label="Enviar mensagem manual"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Enviando...
              </>
            ) : (
              <>
                📤 Enviar Mensagem
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  ), [connectionStatus, loading]);

  if (loading && !connectionStatus) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" message="Carregando WhatsApp..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-600 to-green-500 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">📱</span>
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">WhatsApp Business</h1>
                <p className="text-green-100 text-lg">Sistema de Cobrança Inteligente</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(true)}
                className="px-6 py-2 bg-white text-green-600 rounded-xl hover:bg-green-50 transition-all duration-200 flex items-center space-x-2 shadow-lg font-medium"
                aria-label="Abrir configurações"
              >
                <span>⚙️</span>
                <span>Configurações</span>
              </button>
              <button
                onClick={loadInitialData}
                disabled={loading}
                className="px-6 py-2 bg-green-700 text-white rounded-xl hover:bg-green-800 transition-all duration-200 flex items-center space-x-2 shadow-lg disabled:opacity-50"
                aria-label="Atualizar dados"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Carregando...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Atualizar</span>
                  </>
                )}
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                  aria-label="Fechar gerenciador"
                >
                  <span>✕</span>
                  <span>Fechar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow border p-6">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  connectionStatus?.connected ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                <span className="text-2xl">{connectionStatus?.connected ? '✅' : '❌'}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">WhatsApp</h3>
                <p className={`text-sm font-medium ${getStatusColor(connectionStatus?.connected)}`}>
                  {connectionStatus?.connected ? 'Conectado' : 'Desconectado'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow border p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Notificações</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600">{notifications.length}</span> pendentes
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow border p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Taxa de Sucesso</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-purple-600">{messagingStats?.successRate || 0}%</span> último mês
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'notifications', label: 'Notificações', icon: '📋' },
              { key: 'connection', label: 'Conexão', icon: '📱' },
              { key: 'templates', label: 'Templates', icon: '💬' },
              { key: 'manual', label: 'Envio Manual', icon: '✏️' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                aria-label={`Aba ${tab.label}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'connection' && renderConnectionTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'manual' && renderManualSenderTab()}
      </div>

      <Modal title="QR Code WhatsApp" isOpen={showQRCode} onClose={() => setShowQRCode(false)}>
        <div className="text-center">
          {qrCode ? (
            <div>
              <p className="mb-4 text-gray-600">Escaneie o QR Code com seu WhatsApp para conectar:</p>
              <div className="flex justify-center mb-4">
                <img src={qrCode} alt="QR Code WhatsApp" className="max-w-xs border rounded" />
              </div>
              <p className="text-sm text-gray-500">
                Abra o WhatsApp → Mais opções → Dispositivos vinculados → Vincular dispositivo
              </p>
            </div>
          ) : (
            <div className="py-8">
              <LoadingSpinner size="large" message="Gerando QR Code..." />
            </div>
          )}
        </div>
      </Modal>

      <TemplateEditor
        type={currentTemplateType}
        template={templates[currentTemplateType]}
        onSave={handleSaveTemplate}
        onCancel={() => setShowTemplateEditor(false)}
        isOpen={showTemplateEditor}
      />

      <Modal title="Configurações WhatsApp" isOpen={showSettings} onClose={() => setShowSettings(false)}>
        <WhatsAppSettings onClose={() => setShowSettings(false)} />
      </Modal>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <LoadingSpinner size="large" message="Processando..." />
          </div>
        </div>
      )}
    </div>
  );
};

UnifiedWhatsAppManager.propTypes = {
  clients: PropTypes.array,
  invoices: PropTypes.array,
  subscriptions: PropTypes.array,
  onClose: PropTypes.func,
};

export default UnifiedWhatsAppManager;