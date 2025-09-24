// src/components/notifications/WhatsAppBillingManager.js - VERSÃO FINAL CORRIGIDA
import React, { useState, useEffect } from 'react';
// CORREÇÃO: Remover importações problemáticas e usar componentes inline temporariamente
// import LoadingSpinner from '../common/LoadingSpinner';
// import Modal from '../common/Modal';
// import WhatsAppTemplateEditor from '../whatsapp/WhatsAppTemplateEditor';

// Serviços (estas importações devem funcionar)
import { whatsappService } from '../../services/whatsappService';
import { whatsappAutomationService } from '../../services/whatsappAutomationService';
import { formatCurrency } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';

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
      <div className="flex justify-between items-center mb-4">
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

      {/* Tab Empresa */}
      {activeTab === 'company' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Empresa *
              </label>
              <input
                type="text"
                value={companyInfo.name}
                onChange={(e) => handleCompanyChange('name', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome da empresa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone de Contato *
              </label>
              <input
                type="text"
                value={companyInfo.phone}
                onChange={(e) => handleCompanyChange('phone', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de Contato
              </label>
              <input
                type="email"
                value={companyInfo.email}
                onChange={(e) => handleCompanyChange('email', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contato@empresa.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chave PIX para Pagamentos *
              </label>
              <input
                type="text"
                value={companyInfo.pixKey}
                onChange={(e) => handleCompanyChange('pixKey', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="CPF, CNPJ, telefone ou email"
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta chave será incluída nas mensagens de cobrança
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="text"
                value={companyInfo.website}
                onChange={(e) => handleCompanyChange('website', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="www.empresa.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horário de Atendimento
              </label>
              <input
                type="text"
                value={companyInfo.supportHours}
                onChange={(e) => handleCompanyChange('supportHours', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="8h às 18h, Segunda a Sexta"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-medium text-gray-800 mb-2">Preview das Informações</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Empresa:</span> {companyInfo.name}</p>
              <p><span className="font-medium">Telefone:</span> {companyInfo.phone}</p>
              <p><span className="font-medium">Email:</span> {companyInfo.email}</p>
              <p><span className="font-medium">Chave PIX:</span> {companyInfo.pixKey}</p>
              <p><span className="font-medium">Website:</span> {companyInfo.website}</p>
              <p><span className="font-medium">Atendimento:</span> {companyInfo.supportHours}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={saveCompanyInfo}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Informações'}
            </button>
          </div>
        </div>
      )}

      {/* Tab Automação */}
      {activeTab === 'automation' && (
        <div className="space-y-4">
          {/* Horário Comercial */}
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-medium text-gray-800 mb-3">Horário Comercial</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário de Início
                </label>
                <select
                  value={automationConfig.businessHours.start}
                  onChange={(e) => handleAutomationChange('businessHours.start', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  {Array.from({length: 24}, (_, i) => (
                    <option key={i} value={i}>{i}:00</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário de Término
                </label>
                <select
                  value={automationConfig.businessHours.end}
                  onChange={(e) => handleAutomationChange('businessHours.end', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  {Array.from({length: 24}, (_, i) => (
                    <option key={i} value={i}>{i}:00</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dias da Semana */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dias de Funcionamento
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map(day => (
                  <label key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={automationConfig.businessHours.workDays.includes(day)}
                      onChange={() => handleWorkDaysChange(day)}
                      className="mr-2"
                    />
                    <span className="text-sm">{dayLabels[day]}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Configurações de Lembrete */}
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-medium text-gray-800 mb-3">Lembretes e Cobranças</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lembrete (dias antes)
                </label>
                <input
                  type="number"
                  value={automationConfig.reminderDays}
                  onChange={(e) => handleAutomationChange('reminderDays', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded"
                  min="1"
                  max="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max. Mensagens/Dia
                </label>
                <input
                  type="number"
                  value={automationConfig.maxMessagesPerDay}
                  onChange={(e) => handleAutomationChange('maxMessagesPerDay', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded"
                  min="1"
                  max="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delay entre Envios (ms)
                </label>
                <input
                  type="number"
                  value={automationConfig.delayBetweenMessages}
                  onChange={(e) => handleAutomationChange('delayBetweenMessages', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded"
                  min="1000"
                  step="1000"
                />
              </div>
            </div>
          </div>

          {/* Escalonamento */}
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-medium text-gray-800 mb-3">
              Escalonamento de Cobranças (dias em atraso)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {automationConfig.overdueScalation.map((days, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cobrança {index + 1}
                  </label>
                  <input
                    type="number"
                    value={days}
                    onChange={(e) => handleEscalationChange(index, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    min="1"
                    placeholder="Dias"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Sistema enviará cobrança automaticamente nos dias especificados após o vencimento
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={saveAutomationConfig}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// COMPONENTES INLINE PARA EVITAR PROBLEMAS DE IMPORTAÇÃO

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
  
  // Estados de resultados
  const [sendResults, setSendResults] = useState([]);
  const [automationStats, setAutomationStats] = useState({});
  
  // Estados de templates
  const [templates, setTemplates] = useState({});
  const [qrCode, setQrCode] = useState(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Carregar dados
  const loadInitialData = async () => {
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
  };

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

  // Calcular notificações pendentes
  const calculateNotifications = async () => {
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

      // --- INÍCIO DA CORREÇÃO ---
      let qrCodeData = result.qrCode;
      // Verifica se a string já começa com "data:", se não, adiciona o prefixo.
      if (qrCodeData && !qrCodeData.startsWith('data:')) {
        qrCodeData = `data:image/png;base64,${qrCodeData}`;
      }
      setQrCode(qrCodeData);
      // --- FIM DA CORREÇÃO ---

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
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'overdue': return '🚨';
      case 'reminder': return '🔔';
      case 'new_invoice': return '📄';
      default: return '📱';
    }
  };

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
    <div className="space-y-6">
      {/* Header com Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            WhatsApp - Gestão de Cobrança
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              ⚙️ Configurações
            </button>
            <button
              onClick={loadInitialData}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>

        {/* Status da Conexão */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status WhatsApp</p>
                <p className={`font-medium ${getStatusColor(connectionStatus?.connected)}`}>
                  {connectionStatus?.connected ? '✅ Conectado' : '❌ Desconectado'}
                </p>
              </div>
              <div className="flex gap-2">
                {!connectionStatus?.connected && (
                  <button
                    onClick={handleGetQRCode}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                  >
                    QR Code
                  </button>
                )}
                <button
                  onClick={handleTestConnection}
                  disabled={loading}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                >
                  Testar
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Automação</p>
                <p className={`font-medium ${automationRunning ? 'text-green-600' : 'text-gray-600'}`}>
                  {automationRunning ? '🤖 Ativa' : '⏸️ Parada'}
                </p>
              </div>
              <button
                onClick={toggleAutomation}
                disabled={loading || !connectionStatus?.connected}
                className={`px-3 py-1 rounded text-xs ${
                  automationRunning 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {automationRunning ? 'Parar' : 'Iniciar'}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Notificações</p>
                <p className="font-medium text-gray-800">
                  📊 {notifications.length} pendentes
                </p>
              </div>
              <button
                onClick={runManualCycle}
                disabled={loading || !connectionStatus?.connected}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                Executar
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas da Automação */}
        {automationStats && Object.keys(automationStats).length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Estatísticas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-blue-600">Mensagens Enviadas</p>
                <p className="font-medium">{automationStats.messagesSent || 0}</p>
              </div>
              <div>
                <p className="text-blue-600">Erros</p>
                <p className="font-medium">{automationStats.errors || 0}</p>
              </div>
              <div>
                <p className="text-blue-600">Última Execução</p>
                <p className="font-medium">
                  {automationStats.lastRun ? 
                    formatDate(automationStats.lastRun) : 'Nunca'
                  }
                </p>
              </div>
              <div>
                <p className="text-blue-600">Uptime</p>
                <p className="font-medium">
                  {automationStats.uptime ? 
                    Math.round(automationStats.uptime / 60000) + 'm' : '0m'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Templates */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Templates de Mensagem</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: 'overdue', label: 'Fatura Vencida', icon: '🚨' },
            { key: 'reminder', label: 'Lembrete', icon: '🔔' },
            { key: 'new_invoice', label: 'Nova Fatura', icon: '📄' },
            { key: 'payment_confirmed', label: 'Pagamento Confirmado', icon: '✅' }
          ].map(template => (
            <div key={template.key} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="mr-2">{template.icon}</span>
                  <span className="font-medium">{template.label}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  templates[template.key] 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {templates[template.key] ? 'Personalizado' : 'Padrão'}
                </span>
              </div>
              <button
                onClick={() => openTemplateEditor(template.key)}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
              >
                {templates[template.key] ? 'Editar' : 'Personalizar'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de Notificações */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Notificações Pendentes ({notifications.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={selectAllNotifications}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                disabled={notifications.length === 0}
              >
                {selectedNotifications.length === notifications.length ? 'Desmarcar' : 'Marcar'} Todas
              </button>
              <button
                onClick={sendSelectedNotifications}
                disabled={selectedNotifications.length === 0 || loading || !connectionStatus?.connected}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
              >
                Enviar Selecionadas ({selectedNotifications.length})
              </button>
            </div>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>📭 Nenhuma notificação pendente</p>
            <p className="text-sm mt-1">Todas as faturas estão em dia!</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  selectedNotifications.includes(notification.id) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => toggleNotificationSelection(notification.id)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {notification.client.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {notification.client.phone} • {getTypeLabel(notification.type)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatCurrency(notification.invoice.amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Venc: {formatDate(notification.invoice.dueDate)}
                        </p>
                      </div>
                    </div>
                    
                    {notification.subscription && (
                      <div className="mt-2 text-xs text-gray-500">
                        📋 Plano: {notification.subscription.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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