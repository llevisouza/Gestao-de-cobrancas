// src/components/notifications/WhatsAppMessageTemplates.js - VERSÃO CORRIGIDA COM FIREBASE
import React, { useState, useEffect } from 'react';
import { whatsappService } from '../../services/whatsappService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import Modal from '../common/Modal';

const WhatsAppMessageTemplates = () => {
  const { user } = useFirebaseAuth();
  const [selectedTemplate, setSelectedTemplate] = useState('overdue');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [companySettings, setCompanySettings] = useState(whatsappService.getCompanyInfo());
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Recarregar configurações quando usuário logar ou componente montar
  useEffect(() => {
    const loadSettings = async () => {
      if (user) {
        try {
          setLoading(true);
          const settings = await whatsappService.reloadCompanyInfo();
          setCompanySettings(settings);
          console.log('✅ Configurações carregadas do Firebase:', settings.name);
        } catch (error) {
          console.error('❌ Erro ao carregar configurações:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadSettings();
  }, [user]);

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
      status: 'pending',
      paidDate: null
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
    },
    final_notice: {
      name: '⚠️ Aviso Final',
      description: 'Último aviso antes da suspensão',
      color: 'bg-orange-100 border-orange-300 text-orange-800',
      icon: '⚠️',
      example: 'Usado para faturas muito em atraso'
    }
  };

  // Gerar preview da mensagem
  const generatePreview = (templateType) => {
    try {
      let message = '';
      const { client, invoice, subscription } = mockData;
      
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
          const invoiceWithPayment = { ...invoice, paidDate: new Date().toISOString().split('T')[0] };
          message = whatsappService.getPaymentConfirmedTemplate(invoiceWithPayment, client, subscription);
          break;
        case 'final_notice':
          message = whatsappService.getFinalNoticeTemplate(invoice, client, subscription);
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
      console.error('Erro ao gerar preview:', error);
      alert('Erro ao gerar preview: ' + error.message);
    }
  };

  // Salvar configurações da empresa no Firebase
  const saveCompanySettings = async () => {
    if (!user) {
      alert('❌ Você precisa estar logado para salvar as configurações');
      return;
    }

    try {
      setLoading(true);
      setSuccessMessage('');
      
      console.log('💾 Salvando configurações no Firebase:', companySettings);
      
      // Atualizar configurações no serviço (que salva no Firebase)
      const success = await whatsappService.updateCompanyInfo(companySettings);
      
      if (success) {
        setSuccessMessage('✅ Configurações salvas no Firebase com sucesso!');
        console.log('✅ Configurações salvas no Firebase!');
      } else {
        setSuccessMessage('⚠️ Configurações salvas localmente (problema na conexão com servidor)');
        console.warn('⚠️ Fallback para localStorage aplicado');
      }
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      alert('❌ Erro ao salvar configurações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Copiar template para área de transferência
  const copyTemplate = async (templateType) => {
    try {
      generatePreview(templateType);
      
      // Aguardar um pouco para o preview ser gerado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (previewData?.message) {
        await navigator.clipboard.writeText(previewData.message);
        alert('📋 Template copiado para área de transferência!');
      }
    } catch (error) {
      console.error('Erro ao copiar template:', error);
      alert('Erro ao copiar template: ' + error.message);
    }
  };

  // Verificar status da conexão Firebase
  const getFirebaseStatus = () => {
    if (!user) {
      return { status: 'disconnected', message: '❌ Não logado', color: 'text-red-600' };
    }
    
    return { 
      status: 'connected', 
      message: '✅ Firebase conectado', 
      color: 'text-green-600',
      userEmail: user.email 
    };
  };

  const firebaseStatus = getFirebaseStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📱 Templates WhatsApp</h1>
              <p className="text-gray-600 mt-1">
                Personalize as mensagens enviadas para seus clientes
              </p>
            </div>
          </div>
        </div>

        {/* Mensagem de sucesso */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

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
                      <li><strong>Persistência:</strong> Configurações salvas no Firebase para sincronização entre dispositivos</li>
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
                {firebaseStatus.status === 'connected' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Salvando como: {firebaseStatus.userEmail}
                  </p>
                )}
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
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Conexão Delivery"
                    disabled={loading}
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
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(11) 99999-9999"
                    disabled={loading}
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
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contato@empresa.com"
                    disabled={loading}
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
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Email, telefone, CPF ou chave aleatória"
                    disabled={loading}
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
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="www.empresa.com"
                    disabled={loading}
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
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="8h às 18h, Segunda a Sexta"
                    disabled={loading}
                  />
                </div>

                <button
                  onClick={saveCompanySettings}
                  disabled={loading || !user}
                  className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                    loading || !user
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                        <path fill="currentColor" strokeWidth="4" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </span>
                  ) : !user ? (
                    '🔒 Faça login para salvar'
                  ) : (
                    '💾 Salvar no Firebase'
                  )}
                </button>
                
                {!user && (
                  <p className="text-xs text-orange-600 text-center">
                    Faça login para salvar permanentemente no Firebase
                  </p>
                )}
              </div>
            </div>

            {/* Status do Firebase */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  🔥 Status Firebase
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Conectividade e persistência de dados
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Conexão Firebase:</span>
                    <span className={`font-medium ${firebaseStatus.color}`}>
                      {firebaseStatus.message}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">WhatsApp API:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      whatsappService.isConfigured() 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {whatsappService.isConfigured() ? '✅ Configurado' : '❌ Não Configurado'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Templates:</span>
                    <span className="font-medium text-green-600">✅ 5 Disponíveis</span>
                  </div>

                  {firebaseStatus.status === 'connected' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Usuário:</span>
                      <span className="font-medium text-blue-600">{firebaseStatus.userEmail}</span>
                    </div>
                  )}
                </div>

                {firebaseStatus.status === 'disconnected' && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <p className="text-xs text-orange-700">
                      ⚠️ <strong>Atenção:</strong> Faça login para salvar as configurações permanentemente no Firebase. Sem login, as configurações ficam apenas no navegador.
                    </p>
                  </div>
                )}

                {!whatsappService.isConfigured() && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xs text-red-700">
                      ❌ <strong>WhatsApp API não configurado:</strong> Configure as variáveis de ambiente do WhatsApp para envio de mensagens.
                    </p>
                  </div>
                )}
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
        {showPreview && (
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
                    Template gerado com suas configurações {firebaseStatus.status === 'connected' ? 'do Firebase' : 'locais'}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(previewData.message);
                        alert('📋 Template copiado!');
                      }}
                      className="bg-gray-200 text-gray-900 px-4 py-2 rounded-md font-medium hover:bg-gray-300 text-sm"
                    >
                      📋 Copiar Texto
                    </button>
                    
                    <button
                      onClick={() => setShowPreview(false)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 text-sm"
                    >
                      ✓ Fechar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Modal>
        )}
      </div>
    </div>
  );
};

export default WhatsAppMessageTemplates;