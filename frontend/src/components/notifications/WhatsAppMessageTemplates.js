// src/components/notifications/WhatsAppMessageTemplates.js
import React, { useState } from 'react';
import { whatsappService } from '../../services/whatsappService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Modal from '../common/Modal';

const WhatsAppMessageTemplates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('overdue');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [companySettings, setCompanySettings] = useState({
    name: 'Conexão Delivery',
    phone: '(11) 99999-9999',
    email: 'contato@conexaodelivery.com',
    pixKey: '11999999999',
    website: 'www.conexaodelivery.com',
    supportHours: '8h às 18h, Segunda a Sexta'
  });

  // Dados de exemplo para preview
  const mockData = {
    client: {
      id: 'client-123',
      name: 'João da Silva',
      email: 'joao@exemplo.com',
      phone: '(11) 99999-1234',
      pix: 'joao@exemplo.com'
    },
    invoice: {
      id: 'inv-456',
      amount: 150.00,
      dueDate: '2024-12-25',
      generationDate: '2024-12-01',
      status: 'pending'
    },
    subscription: {
      id: 'sub-789',
      name: 'Plano Premium Mensal',
      amount: 150.00,
      recurrenceType: 'monthly',
      dayOfMonth: 25,
      startDate: '2024-01-01',
      status: 'active'
    }
  };

  const templates = {
    overdue: {
      name: '🚨 Fatura Vencida',
      description: 'Mensagem para cobranças de faturas em atraso',
      color: 'bg-red-100 border-red-300 text-red-800',
      icon: '🚨',
      example: 'Usado quando a fatura está vencida há X dias'
    },
    reminder: {
      name: '🔔 Lembrete de Vencimento',
      description: 'Lembrete enviado antes do vencimento',
      color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      icon: '🔔',
      example: 'Enviado 3 dias antes do vencimento'
    },
    new_invoice: {
      name: '📄 Nova Fatura',
      description: 'Notificação de fatura recém gerada',
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      icon: '📄',
      example: 'Enviado quando uma nova fatura é criada'
    },
    payment_confirmed: {
      name: '✅ Pagamento Confirmado',
      description: 'Confirmação de pagamento recebido',
      color: 'bg-green-100 border-green-300 text-green-800',
      icon: '✅',
      example: 'Enviado após confirmação do pagamento'
    }
  };

  // Gerar preview da mensagem
  const generatePreview = (templateType) => {
    try {
      let message = '';
      const { client, invoice, subscription } = mockData;
      
      // Configurar o serviço com as configurações atuais
      whatsappService.updateCompanyInfo(companySettings);
      
      switch (templateType) {
        case 'overdue':
          message = whatsappService.getOverdueInvoiceTemplate(invoice, client, subscription);
          break;
        case 'reminder':
          message = whatsappService.getReminderTemplate(invoice, client, subscription);
          break;
        case 'new_invoice':
          message = whatsappService.getNewInvoiceTemplate(invoice, client, subscription);
          break;
        case 'payment_confirmed':
          message = whatsappService.getPaymentConfirmedTemplate(invoice, client, subscription);
          break;
        default:
          message = 'Template não encontrado';
      }
      
      setPreviewData({
        type: templateType,
        template: templates[templateType],
        message,
        client,
        invoice,
        subscription
      });
      setShowPreview(true);
    } catch (error) {
      alert('Erro ao gerar preview: ' + error.message);
    }
  };

  // Salvar configurações da empresa
  const saveCompanySettings = () => {
    whatsappService.updateCompanyInfo(companySettings);
    alert('✅ Configurações salvas! Os templates foram atualizados.');
  };

  // Copiar template para área de transferência
  const copyTemplate = async (templateType) => {
    try {
      generatePreview(templateType);
      const message = previewData?.message || 'Erro ao gerar template';
      await navigator.clipboard.writeText(message);
      alert('📋 Template copiado para área de transferência!');
    } catch (error) {
      alert('Erro ao copiar template');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="dashboard-title">📱 Templates WhatsApp</h1>
              <p className="dashboard-subtitle">
                Personalize as mensagens enviadas para seus clientes
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Templates */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  📋 Templates Disponíveis
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Clique em um template para ver o preview
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {Object.entries(templates).map(([key, template]) => (
                  <div
                    key={key}
                    className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedTemplate === key ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedTemplate(key);
                      generatePreview(key);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{template.icon}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">{template.name}</h4>
                            <p className="text-sm text-gray-600">{template.description}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${template.color}`}>
                            {template.example}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center space-x-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              generatePreview(key);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            👁️ Ver Preview
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyTemplate(key);
                            }}
                            className="text-sm text-green-600 hover:text-green-800 font-medium"
                          >
                            📋 Copiar Template
                          </button>
                        </div>
                      </div>
                      
                      {selectedTemplate === key && (
                        <div className="ml-4">
                          <span className="inline-flex items-center p-1 rounded-full bg-blue-100">
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informações sobre os templates */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-blue-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-900">Como funciona</h4>
                  <div className="mt-2 text-sm text-blue-800">
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Templates Dinâmicos:</strong> Informações do cliente, plano e fatura são inseridas automaticamente</li>
                      <li><strong>Visual Atrativo:</strong> Emojis e formatação para melhor comunicação</li>
                      <li><strong>Chave PIX:</strong> Incluída automaticamente em cada mensagem</li>
                      <li><strong>Informações do Plano:</strong> Detalhes da recorrência quando disponível</li>
                      <li><strong>Personalizável:</strong> Ajuste as informações da empresa nas configurações</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Configurações da Empresa */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  🏢 Configurações da Empresa
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Essas informações aparecem nos templates
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input"
                    placeholder="Ex: Conexão Delivery"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone de Contato *
                  </label>
                  <input
                    type="text"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="form-input"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email de Contato
                  </label>
                  <input
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                    className="form-input"
                    placeholder="contato@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chave PIX Principal *
                  </label>
                  <input
                    type="text"
                    value={companySettings.pixKey}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, pixKey: e.target.value }))}
                    className="form-input"
                    placeholder="Email, telefone, CPF ou chave aleatória"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta chave será usada quando o cliente não tiver PIX cadastrado
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="text"
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, website: e.target.value }))}
                    className="form-input"
                    placeholder="www.empresa.com"
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
                    placeholder="8h às 18h, Segunda a Sexta"
                  />
                </div>

                <button
                  onClick={saveCompanySettings}
                  className="w-full btn-primary"
                >
                  💾 Salvar Configurações
                </button>
              </div>
            </div>

            {/* Dados de Exemplo */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  🎯 Dados de Exemplo
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Usados para gerar os previews
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium">{mockData.client.name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telefone:</span>
                    <span className="font-medium">{mockData.client.phone}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-medium">{formatCurrency(mockData.invoice.amount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plano:</span>
                    <span className="font-medium">{mockData.subscription.name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recorrência:</span>
                    <span className="font-medium">Mensal (dia {mockData.subscription.dayOfMonth})</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs text-yellow-700">
                    💡 <strong>Dica:</strong> Nos templates reais, essas informações vêm dos dados reais de cada cliente e fatura.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Preview */}
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title={previewData ? `📱 Preview: ${previewData.template.name}` : 'Preview'}
        >
          {previewData && (
            <div className="space-y-6">
              {/* Info do destinatário */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {previewData.client.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Para: {previewData.client.name}</h4>
                    <p className="text-sm text-gray-600">{previewData.client.phone}</p>
                  </div>
                </div>
              </div>

              {/* Preview da mensagem */}
              <div className="bg-green-50 border-l-4 border-green-400 rounded-r-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{previewData.template.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-green-800 mb-2">
                      {previewData.template.name}
                    </h4>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <pre className="text-sm whitespace-pre-wrap font-sans text-gray-800">
                        {previewData.message}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações contextuais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-1">📄 Fatura</h5>
                  <div className="text-blue-700 space-y-1">
                    <div>Valor: {formatCurrency(previewData.invoice.amount)}</div>
                    <div>Vencimento: {formatDate(previewData.invoice.dueDate)}</div>
                    <div>ID: #{previewData.invoice.id}</div>
                  </div>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg">
                  <h5 className="font-medium text-purple-900 mb-1">🔄 Plano</h5>
                  <div className="text-purple-700 space-y-1">
                    <div>{previewData.subscription.name}</div>
                    <div>Recorrência: Mensal</div>
                    <div>Ativo desde: {formatDate(previewData.subscription.startDate)}</div>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Template gerado com suas configurações atuais
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(previewData.message);
                      alert('📋 Template copiado!');
                    }}
                    className="btn-secondary text-sm"
                  >
                    📋 Copiar Texto
                  </button>
                  
                  <button
                    onClick={() => setShowPreview(false)}
                    className="btn-primary text-sm"
                  >
                    ✓ Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default WhatsAppMessageTemplates;