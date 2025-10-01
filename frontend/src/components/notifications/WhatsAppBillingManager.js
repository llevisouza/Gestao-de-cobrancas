// src/components/notifications/WhatsAppBillingManager.js - VERSÃO CORRIGIDA
import React, { useState, useEffect, useCallback } from 'react';
import { whatsappService } from '../../services/whatsappService';
import { whatsappAutomationService } from '../../services/whatsappAutomationService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import WhatsAppManualSender from '../whatsapp/WhatsAppManualSender';

// COMPONENTE DE CONFIGURAÇÕES CORRIGIDO E COMPLETO
const WhatsAppSettingsManager = ({ onClose }) => {
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Conexão Delivery',
    phone: '(11) 99999-9999',
    email: 'contato@conexaodelivery.com',
    pixKey: '11999999999',
    website: 'www.conexaodelivery.com',
    supportHours: '8h às 18h, Segunda a Sexta'
  });

  const [automationConfig, setAutomationConfig] = useState({
    enabled: false,
    checkInterval: 60000,
    businessHours: {
      start: 8,
      end: 18,
      workDays: [1, 2, 3, 4, 5]
    },
    reminderDays: 3,
    overdueScalation: [1, 3, 7, 15, 30],
    maxMessagesPerDay: 1,
    delayBetweenMessages: 5000
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedCompanyInfo = localStorage.getItem('whatsapp_company_info');
      if (savedCompanyInfo) {
        setCompanyInfo(JSON.parse(savedCompanyInfo));
      }

      const currentConfig = whatsappAutomationService.getConfig();
      if (currentConfig) {
        setAutomationConfig(currentConfig);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveCompanyInfo = async () => {
    setLoading(true);
    try {
      localStorage.setItem('whatsapp_company_info', JSON.stringify(companyInfo));
      whatsappService.updateCompanyInfo(companyInfo);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveAutomationConfig = async () => {
    setLoading(true);
    try {
      whatsappAutomationService.updateConfig(automationConfig);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (field, value) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAutomationChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setAutomationConfig(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setAutomationConfig(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleWorkDaysChange = (day) => {
    setAutomationConfig(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        workDays: prev.businessHours.workDays.includes(day)
          ? prev.businessHours.workDays.filter(d => d !== day)
          : [...prev.businessHours.workDays, day].sort()
      }
    }));
  };

  const handleEscalationChange = (index, value) => {
    const newEscalation = [...automationConfig.overdueScalation];
    newEscalation[index] = parseInt(value) || 0;
    setAutomationConfig(prev => ({
      ...prev,
      overdueScalation: newEscalation
    }));
  };

  const dayLabels = {
    1: 'Segunda', 2: 'Terça', 3: 'Quarta',
    4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 0: 'Domingo'
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('company')}
            className={`pb-2 border-b-2 font-medium ${
              activeTab === 'company' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-600'
            }`}
          >
            🏢 Empresa
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`pb-2 border-b-2 font-medium ${
              activeTab === 'automation' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-600'
            }`}
          >
            🤖 Automação
          </button>
        </div>
        {saved && (
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm">
            ✅ Salvo!
          </div>
        )}
      </div>

      {/* Aba Empresa */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Empresa
              </label>
              <input
                type="text"
                value={companyInfo.name}
                onChange={(e) => handleCompanyChange('name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nome da sua empresa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="text"
                value={companyInfo.phone}
                onChange={(e) => handleCompanyChange('phone', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={companyInfo.email}
                onChange={(e) => handleCompanyChange('email', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="contato@empresa.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chave PIX
              </label>
              <input
                type="text"
                value={companyInfo.pixKey}
                onChange={(e) => handleCompanyChange('pixKey', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Chave PIX para pagamentos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="text"
                value={companyInfo.website}
                onChange={(e) => handleCompanyChange('website', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="www.empresa.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário de Atendimento
              </label>
              <input
                type="text"
                value={companyInfo.supportHours}
                onChange={(e) => handleCompanyChange('supportHours', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="8h às 18h, Segunda a Sexta"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveCompanyInfo}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Informações'}
            </button>
          </div>
        </div>
      )}

      {/* Aba Automação */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Status da Automação</h3>
                <p className="text-sm text-gray-600">Controle quando a automação deve funcionar</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={automationConfig.enabled}
                  onChange={(e) => handleAutomationChange('enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Automação Ativa
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intervalo de Verificação (minutos)
              </label>
              <input
                type="number"
                value={automationConfig.checkInterval / 60000}
                onChange={(e) => handleAutomationChange('checkInterval', parseInt(e.target.value) * 60000)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="1440"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dias para Lembrete
              </label>
              <input
                type="number"
                value={automationConfig.reminderDays}
                onChange={(e) => handleAutomationChange('reminderDays', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário Início
              </label>
              <input
                type="number"
                value={automationConfig.businessHours.start}
                onChange={(e) => handleAutomationChange('businessHours.start', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                max="23"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário Fim
              </label>
              <input
                type="number"
                value={automationConfig.businessHours.end}
                onChange={(e) => handleAutomationChange('businessHours.end', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                max="23"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dias da Semana
            </label>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {Object.entries(dayLabels).map(([day, label]) => (
                <label key={day} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automationConfig.businessHours.workDays.includes(parseInt(day))}
                    onChange={() => handleWorkDaysChange(parseInt(day))}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escalação de Vencimento (dias)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {automationConfig.overdueScalation.map((days, index) => (
                <input
                  key={index}
                  type="number"
                  value={days}
                  onChange={(e) => handleEscalationChange(index, e.target.value)}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Dias após vencimento para enviar lembretes
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveAutomationConfig}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// COMPONENTES AUXILIARES
const LoadingSpinner = ({ size = 'medium', message = '' }) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'w-4 h-4';
      case 'medium': return 'w-8 h-8';
      case 'large': return 'w-12 h-12';
      default: return 'w-8 h-8';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${getSizeClasses()} animate-spin rounded-full border-b-2 border-primary-600`} />
      {message && (
        <p className="mt-2 text-gray-600 text-sm">{message}</p>
      )}
    </div>
  );
};

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
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
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

const WhatsAppTemplateEditor = ({ type, template, onSave, onCancel, isOpen }) => {
  const [editedTemplate, setEditedTemplate] = useState(template || '');
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    setEditedTemplate(template || getDefaultTemplate(type));
  }, [template, type]);

  const getDefaultTemplate = (templateType) => {
    const defaults = {
      overdue: `🚨 *FATURA VENCIDA* 🚨

Olá *{{client.name}}*! 👋

Sua fatura está em atraso e precisa ser regularizada.

💰 *RESUMO DA COBRANÇA*
💵 Valor: *{{invoice.amount}}*
📅 Vencimento: {{invoice.dueDate}}
🆔 Código: {{invoice.id}}

💳 *PAGUE AGORA VIA PIX*
🔑 Chave PIX: {{company.pix}}

📞 {{company.name}} - {{company.phone}}`,

      reminder: `🔔 *LEMBRETE DE PAGAMENTO* 🔔

Oi *{{client.name}}*! 😊

Sua fatura vence em breve. Que tal já garantir o pagamento?

💰 *DETALHES DO PAGAMENTO*
💵 Valor: *{{invoice.amount}}*
📅 Vencimento: {{invoice.dueDate}}
🆔 Código: {{invoice.id}}

💳 *PIX PARA PAGAMENTO*
🔑 Chave PIX: {{company.pix}}

📞 {{company.name}} - {{company.phone}}`,

      new_invoice: `📄 *NOVA FATURA DISPONÍVEL* 📄

Olá *{{client.name}}*! 👋

Uma nova fatura foi gerada para você!

💰 *INFORMAÇÕES DA FATURA*
💵 Valor: *{{invoice.amount}}*
📅 Vencimento: {{invoice.dueDate}}
🆔 Código: {{invoice.id}}

💳 *PAGAMENTO VIA PIX*
🔑 Chave PIX: {{company.pix}}

📞 {{company.name}} - {{company.phone}}`,

      payment_confirmed: `✅ *PAGAMENTO CONFIRMADO* ✅

*{{client.name}}*, seu pagamento foi confirmado! 🎉

💰 *COMPROVANTE DE PAGAMENTO*
✅ Status: *PAGO*
💵 Valor: {{invoice.amount}}
📅 Pago em: {{invoice.paidDate}}
🆔 Código: {{invoice.id}}

📞 {{company.name}} - {{company.phone}}`
    };

    return defaults[templateType] || '';
  };

  const generatePreview = () => {
    let preview = editedTemplate;
    const mockData = {
      '{{client.name}}': 'João Silva',
      '{{invoice.amount}}': 'R$ 150,00',
      '{{invoice.dueDate}}': '25/12/2024',
      '{{invoice.id}}': '#12345678',
      '{{company.name}}': 'Conexão Delivery',
      '{{company.phone}}': '(11) 99999-9999',
      '{{company.pix}}': '11999999999'
    };

    Object.entries(mockData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return preview;
  };

  const typeLabels = {
    overdue: 'Fatura Vencida',
    reminder: 'Lembrete de Vencimento',
    new_invoice: 'Nova Fatura',
    payment_confirmed: 'Pagamento Confirmado'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            Editor de Template: {typeLabels[type]}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1">
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
              className="flex-1 p-4 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500"
              placeholder="Digite seu template aqui..."
            />
          </div>

          <div className="w-1/2 flex flex-col p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Preview</h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm px-3 py-1 rounded bg-green-100 text-green-700"
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
          <button onClick={onCancel} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => onSave(editedTemplate)}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Salvar Template
          </button>
        </div>
      </div>
    </div>
  );
};

// COMPONENTE PRINCIPAL
const WhatsAppBillingManager = ({ 
  clients = [], 
  invoices = [], 
  subscriptions = [], 
  onRefresh 
}) => {
  // Estados principais
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [automationRunning, setAutomationRunning] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  
  // Estados dos modais
  const [showQRCode, setShowQRCode] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [currentTemplateType, setCurrentTemplateType] = useState('');
  const [showBulkSender, setShowBulkSender] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showManualSender, setShowManualSender] = useState(false);
  
  // Estados de resultados
  const [sendResults, setSendResults] = useState([]);
  const [automationStats, setAutomationStats] = useState({});
  
  // Estados de templates
  const [templates, setTemplates] = useState({});
  const [qrCode, setQrCode] = useState(null);

  // Funções internas definidas antes de serem usadas
  const calculateNotifications = useCallback(async () => {
    try {
      const pendingNotifications = [];
      
      invoices.forEach(invoice => {
        if (!['pending', 'overdue'].includes(invoice.status)) return;
        
        const client = clients.find(c => c.id === invoice.clientId);
        if (!client || !client.phone) return;
        
        const subscription = subscriptions.find(s => s.id === invoice.subscriptionId);
        
        let type = 'reminder';
        if (invoice.status === 'overdue') {
          type = 'overdue';
        } else if (invoice.generatedToday) {
          type = 'new_invoice';
        }
        
        pendingNotifications.push({
          id: `${invoice.id}_${type}`,
          type,
          invoice,
          client,
          subscription,
          priority: type === 'overdue' ? 1 : type === 'reminder' ? 2 : 3
        });
      });
      
      pendingNotifications.sort((a, b) => a.priority - b.priority);
      setNotifications(pendingNotifications);
      return pendingNotifications;
    } catch (error) {
      console.error('Erro ao calcular notificações:', error);
      return [];
    }
  }, [clients, invoices, subscriptions]);

  // Carregar dados
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        checkConnection(),
        loadAutomationStatus(),
        calculateNotifications(),
        loadTemplates()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [calculateNotifications]);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Verificar conexão WhatsApp
  const checkConnection = async () => {
    try {
      const status = await whatsappService.checkConnection();
      setConnectionStatus(status);
      return status;
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setConnectionStatus({ connected: false, error: error.message });
    }
  };

  // Carregar status da automação
  const loadAutomationStatus = async () => {
    try {
      const stats = whatsappAutomationService.getStats();
      setAutomationRunning(stats.isRunning);
      setAutomationStats(stats);
    } catch (error) {
      console.error('Erro ao carregar status da automação:', error);
    }
  };

  // Carregar templates salvos
  const loadTemplates = () => {
    const loadedTemplates = {};
    const templateTypes = ['overdue', 'reminder', 'new_invoice', 'payment_confirmed'];
    
    templateTypes.forEach(type => {
      const saved = localStorage.getItem(`whatsapp_template_${type}`);
      if (saved) {
        loadedTemplates[type] = saved;
      }
    });
    
    setTemplates(loadedTemplates);
  };

  // Obter QR Code
  const handleGetQRCode = async () => {
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
        alert('Erro ao obter QR Code: ' + result.error);
      }
    } catch (error) {
      alert('Erro ao obter QR Code: ' + error.message)
    } finally {
      setLoading(false);
    }
  };

  // Testar conexão
  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const result = await whatsappService.testConnection();
      if (result.connection.connected) {
        alert('✅ Conexão WhatsApp funcionando perfeitamente!');
      } else {
        alert('❌ WhatsApp não está conectado: ' + result.connection.error);
      }
      await checkConnection();
    } catch (error) {
      alert('Erro no teste: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Iniciar/Parar automação
  const toggleAutomation = async () => {
    setLoading(true);
    try {
      let result;
      if (automationRunning) {
        result = await whatsappAutomationService.stopAutomation();
      } else {
        result = await whatsappAutomationService.startAutomation();
      }
      
      if (result.success) {
        await loadAutomationStatus();
        alert(result.message);
      } else {
        alert('Erro: ' + result.error);
      }
    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Executar ciclo manual
  const runManualCycle = async () => {
    setLoading(true);
    try {
      const result = await whatsappAutomationService.runManualCycle();
      if (result.success) {
        alert(`Ciclo executado: ${result.sent} enviados, ${result.errors} erros`);
        await Promise.all([
          calculateNotifications(),
          loadAutomationStatus()
        ]);
      } else {
        alert('Erro no ciclo: ' + result.error);
      }
    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Abrir editor de template
  const openTemplateEditor = (type) => {
    setCurrentTemplateType(type);
    setShowTemplateEditor(true);
  };

  // Salvar template
  const handleSaveTemplate = async (template) => {
    try {
      localStorage.setItem(`whatsapp_template_${currentTemplateType}`, template);
      setTemplates(prev => ({ ...prev, [currentTemplateType]: template }));
      setShowTemplateEditor(false);
      alert('Template salvo com sucesso!');
    } catch (error) {
      alert('Erro ao salvar template: ' + error.message);
    }
  };

  // Selecionar/desselecionar notificação
  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  // Selecionar todas
  const selectAllNotifications = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  // Enviar notificações selecionadas
  const sendSelectedNotifications = async () => {
    if (selectedNotifications.length === 0) {
      alert('Selecione pelo menos uma notificação');
      return;
    }

    const selectedNotifs = notifications.filter(n => 
      selectedNotifications.includes(n.id)
    );

    setLoading(true);
    setSendResults([]);
    
    try {
      const results = [];
      
      for (const notification of selectedNotifs) {
        let result;
        const { type, invoice, client, subscription } = notification;
        
        try {
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
            default:
              result = { success: false, error: 'Tipo inválido' };
          }
          
          results.push({
            client: client.name,
            phone: client.phone,
            type,
            amount: formatCurrency(invoice.amount),
            ...result
          });
          
          if (selectedNotifs.indexOf(notification) < selectedNotifs.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error) {
          results.push({
            client: client.name,
            phone: client.phone,
            type,
            amount: formatCurrency(invoice.amount),
            success: false,
            error: error.message
          });
        }
      }
      
      setSendResults(results);
      setShowBulkSender(true);
      setSelectedNotifications([]);
      
    } catch (error) {
      alert('Erro no envio: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Funções auxiliares
  const getStatusColor = (connected) => connected ? 'text-green-600' : 'text-red-600';
  
  // const getNotificationIcon = (type) => {
  //   switch (type) {
  //     case 'overdue': return '🚨';
  //     case 'reminder': return '🔔';
  //     case 'new_invoice': return '📄';
  //     default: return '📱';
  //   }
  // };

  const getTypeLabel = (type) => {
    const labels = {
      overdue: 'Vencida',
      reminder: 'Lembrete',
      new_invoice: 'Nova Fatura'
    };
    return labels[type] || type;
  };

  if (loading && !connectionStatus) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" message="Carregando WhatsApp..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-6 lg:mb-0">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">📱</span>
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">WhatsApp Business</h1>
                <p className="text-green-100 text-lg">Sistema de Cobrança Inteligente</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowManualSender(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <span>🎯</span>
                <span className="font-medium">Envio Manual</span>
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-6 py-3 bg-white text-green-600 rounded-xl hover:bg-green-50 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl font-medium"
              >
                <span>⚙️</span>
                <span>Configurações</span>
              </button>
              <button
                onClick={loadInitialData}
                disabled={loading}
                className="px-6 py-3 bg-green-700 text-white rounded-xl hover:bg-green-800 transition-all duration-200 flex items-center space-x-2 shadow-lg disabled:opacity-50"
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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Status Cards Modernos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status WhatsApp */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    connectionStatus?.connected ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <span className="text-2xl">
                      {connectionStatus?.connected ? '✅' : '❌'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Status WhatsApp</h3>
                    <p className={`text-sm font-medium ${getStatusColor(connectionStatus?.connected)}`}>
                      {connectionStatus?.connected ? 'Conectado' : 'Desconectado'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {!connectionStatus?.connected && (
                  <button
                    onClick={handleGetQRCode}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    QR Code
                  </button>
                )}
                <button
                  onClick={handleTestConnection}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Testar
                </button>
              </div>
            </div>
          </div>

          {/* Status Automação */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    automationRunning ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <span className="text-2xl">
                      {automationRunning ? '🤖' : '⏸️'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Automação</h3>
                    <p className={`text-sm font-medium ${
                      automationRunning ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {automationRunning ? 'Ativa' : 'Parada'}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={toggleAutomation}
                disabled={loading || !connectionStatus?.connected}
                className={`w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  automationRunning 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                } disabled:opacity-50`}
              >
                {automationRunning ? 'Parar Automação' : 'Iniciar Automação'}
              </button>
            </div>
          </div>

          {/* Notificações Pendentes */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">📊</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Notificações</h3>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600">{notifications.length}</span> pendentes
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={runManualCycle}
                disabled={loading || !connectionStatus?.connected}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Executar Ciclo
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas Detalhadas */}
        {automationStats && Object.keys(automationStats).length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Estatísticas de Performance</h3>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {automationStats.messagesSent || 0}
                </div>
                <div className="text-sm text-green-700">Mensagens Enviadas</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {automationStats.errors || 0}
                </div>
                <div className="text-sm text-red-700">Erros</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {automationStats.lastRun ? formatDate(automationStats.lastRun) : 'Nunca'}
                </div>
                <div className="text-sm text-blue-700">Última Execução</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {automationStats.uptime ? Math.round(automationStats.uptime / 60000) + 'm' : '0m'}
                </div>
                <div className="text-sm text-purple-700">Uptime</div>
              </div>
            </div>
          </div>
        )}

        {/* Templates de Mensagem Modernos */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">💬</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Templates de Mensagem</h3>
              <p className="text-gray-600">Personalize suas mensagens automáticas</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { key: 'overdue', label: 'Fatura Vencida', icon: '🚨', color: 'red', description: 'Cobranças após vencimento' },
              { key: 'reminder', label: 'Lembrete', icon: '🔔', color: 'yellow', description: 'Aviso antes do vencimento' },
              { key: 'new_invoice', label: 'Nova Fatura', icon: '📄', color: 'blue', description: 'Fatura gerada' },
              { key: 'payment_confirmed', label: 'Pagamento', icon: '✅', color: 'green', description: 'Confirmação de pagamento' }
            ].map(template => (
              <div key={template.key} className="relative group bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">{template.icon}</span>
                  </div>
                  
                  <h4 className="font-bold text-gray-900 mb-2">
                    {template.label}
                  </h4>
                  
                  <p className="text-sm text-gray-700 mb-4">
                    {template.description}
                  </p>
                  
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      templates[template.key] 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {templates[template.key] ? '✨ Personalizado' : '📝 Padrão'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => openTemplateEditor(template.key)}
                    className="w-full px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    {templates[template.key] ? '✏️ Editar' : '🎨 Personalizar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Notificações Moderna */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header da seção */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="text-white">
                  <h3 className="text-2xl font-bold">Notificações Pendentes</h3>
                  <p className="text-blue-100">
                    {notifications.length} {notifications.length === 1 ? 'mensagem' : 'mensagens'} aguardando envio
                  </p>
                </div>
              </div>
              
              {notifications.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={selectAllNotifications}
                    className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all duration-200 text-sm font-medium"
                    disabled={notifications.length === 0}
                  >
                    {selectedNotifications.length === notifications.length ? 'Desmarcar' : 'Marcar'} Todas
                  </button>
                  {selectedNotifications.length > 0 && (
                    <button
                      onClick={sendSelectedNotifications}
                      disabled={!connectionStatus?.connected || loading}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-all duration-200 font-medium shadow-lg flex items-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <span>📤</span>
                          <span>Enviar {selectedNotifications.length}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lista de notificações */}
          {notifications.length === 0 ? (
            <div className="text-center py-16 px-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🎉</span>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">
                Tudo em Dia!
              </h4>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                Não há notificações WhatsApp pendentes no momento. Todas as cobranças estão em dia!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const isSelected = selectedNotifications.includes(notification.id);
                const typeConfig = {
                  overdue: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon: '🚨', badge: 'bg-red-500' },
                  reminder: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', icon: '🔔', badge: 'bg-yellow-500' },
                  new_invoice: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon: '📄', badge: 'bg-blue-500' }
                };
                const config = typeConfig[notification.type] || typeConfig.reminder;
                
                return (
                  <div key={notification.id} className={`p-6 transition-all duration-200 hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleNotificationSelection(notification.id)}
                          className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className={`w-12 h-12 ${config.bg} border rounded-xl flex items-center justify-center`}>
                              <span className="text-xl">{config.icon}</span>
                            </div>
                            
                            <div>
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">
                                  {notification.client.name}
                                </h4>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border`}>
                                  {config.icon} {getTypeLabel(notification.type)}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <span>📱</span>
                                  <span>{notification.client.phone}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span>💰</span>
                                  <span className="font-medium">{formatCurrency(notification.invoice.amount)}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span>📅</span>
                                  <span>Venc: {formatDate(notification.invoice.dueDate)}</span>
                                </div>
                              </div>
                              
                              {notification.subscription && (
                                <div className="mt-2 flex items-center space-x-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
                                    <span className="mr-1">📋</span>
                                    {notification.subscription.name}
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

      {/* Modal QR Code */}
      <Modal
        title="QR Code WhatsApp"
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
      >
        <div className="text-center">
          {qrCode ? (
            <div>
              <p className="mb-4 text-gray-600">
                Escaneie o QR Code com seu WhatsApp para conectar:
              </p>
              <div className="flex justify-center mb-4">
                <img
                  src={qrCode} 
                  alt="QR Code WhatsApp"
                  className="max-w-xs border rounded"
                />
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

      {/* Template Editor */}
      <WhatsAppTemplateEditor
        type={currentTemplateType}
        template={templates[currentTemplateType]}
        onSave={handleSaveTemplate}
        onCancel={() => setShowTemplateEditor(false)}
        isOpen={showTemplateEditor}
      />

      {/* Modal Resultados de Envio */}
      <Modal
        title="Resultados do Envio"
        isOpen={showBulkSender}
        onClose={() => setShowBulkSender(false)}
      >
        <div className="space-y-4">
          {sendResults.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Resumo do Envio</h4>
                <div className="text-sm text-gray-600">
                  ✅ {sendResults.filter(r => r.success).length} sucessos • 
                  ❌ {sendResults.filter(r => !r.success).length} falhas
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-2">
                {sendResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {result.success ? '✅' : '❌'} {result.client}
                        </p>
                        <p className="text-sm text-gray-600">
                          {result.phone} • {getTypeLabel(result.type)} • {result.amount}
                        </p>
                      </div>
                    </div>
                    {result.error && (
                      <p className="text-sm text-red-600 mt-1">
                        Erro: {result.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Configurações */}
      <Modal
        title="Configurações WhatsApp"
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      >
        <WhatsAppSettingsManager onClose={() => setShowSettings(false)} />
      </Modal>

      {/* Modal Envio Manual Controlado */}
      {showManualSender && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl">
              <WhatsAppManualSender
                clients={clients}
                invoices={invoices}
                subscriptions={subscriptions}
                connectionStatus={connectionStatus}
                onClose={() => setShowManualSender(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
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

export default WhatsAppBillingManager;