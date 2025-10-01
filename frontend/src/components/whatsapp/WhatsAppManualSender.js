// src/components/whatsapp/WhatsAppManualSender.js - CONTROLE MANUAL COMPLETO
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { whatsappService } from '../../services/whatsappService';
import { formatCurrency, formatDate } from '../../utils/formatters';
// import { getDaysDifference } from '../../utils/dateUtils';

const WhatsAppManualSender = ({ 
  clients = [], 
  invoices = [], 
  subscriptions = [], 
  connectionStatus,
  onClose 
}) => {
  // ===== ESTADOS PRINCIPAIS =====
  const [selectedClients, setSelectedClients] = useState([]);
  const [messageType, setMessageType] = useState('custom');
  const [customMessage, setCustomMessage] = useState('');
  // const [selectedInvoices, setSelectedInvoices] = useState([]);
  
  // ===== ESTADOS DE CONTROLE =====
  const [activeStep, setActiveStep] = useState(1); // 1: Seleção, 2: Mensagem, 3: Confirmação
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendResults, setSendResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  
  // ===== ESTADOS DE FILTRO =====
  const [clientFilter, setClientFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewClient, setPreviewClient] = useState(null);

  // ===== VALIDAÇÕES DE SEGURANÇA =====
  const validateSystem = useCallback(() => {
    const systemErrors = [];
    
    if (!connectionStatus?.connected) {
      systemErrors.push('❌ WhatsApp não está conectado');
    }
    
    if (clients.length === 0) {
      systemErrors.push('❌ Nenhum cliente cadastrado');
    }
    
    if (!Array.isArray(invoices)) {
      systemErrors.push('❌ Dados de faturas inválidos');
    }
    
    setErrors(systemErrors);
    return systemErrors.length === 0;
  }, [connectionStatus, clients, invoices]);

  // Validar sistema ao carregar
  useEffect(() => {
    validateSystem();
  }, [validateSystem]);

  // ===== DADOS PROCESSADOS COM SEGURANÇA =====
  const processedClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    
    return clients
      .filter(client => {
        // Filtro de segurança
        if (!client || !client.name || !client.phone) return false;
        
        // Filtro de busca
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          return (
            client.name.toLowerCase().includes(search) ||
            client.phone.includes(search) ||
            client.email?.toLowerCase().includes(search)
          );
        }
        
        // Filtros específicos
        switch (clientFilter) {
          case 'active':
            return client.status === 'active';
          case 'with_pending':
            return invoices.some(inv => 
              inv.clientId === client.id && 
              ['pending', 'overdue'].includes(inv.status)
            );
          case 'with_overdue':
            return invoices.some(inv => 
              inv.clientId === client.id && 
              inv.status === 'overdue'
            );
          default:
            return true;
        }
      })
      .map(client => {
        // Adicionar dados de contexto com segurança
        const clientInvoices = invoices.filter(inv => inv.clientId === client.id) || [];
        const pendingInvoices = clientInvoices.filter(inv => 
          ['pending', 'overdue'].includes(inv.status)
        );
        const overdueInvoices = clientInvoices.filter(inv => inv.status === 'overdue');
        
        return {
          ...client,
          invoiceCount: clientInvoices.length,
          pendingCount: pendingInvoices.length,
          overdueCount: overdueInvoices.length,
          totalPending: pendingInvoices.reduce((sum, inv) => 
            sum + (parseFloat(inv.amount) || 0), 0
          ),
          lastInvoice: clientInvoices
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] || null
        };
      });
  }, [clients, invoices, clientFilter, searchTerm]);

  // ===== TEMPLATE DE MENSAGENS COM SEGURANÇA =====
  const messageTemplates = {
    overdue: {
      name: '🚨 Fatura Vencida',
      template: `🚨 *FATURA VENCIDA* 🚨

Olá *{{client.name}}*! 👋

Identificamos que sua fatura está em atraso e precisa ser regularizada urgentemente.

💰 *RESUMO DA COBRANÇA*
💵 Valor: *{{invoice.amount}}*
📅 Vencimento: {{invoice.dueDate}}
⚠️ Status: VENCIDA
🆔 Código: {{invoice.id}}

💳 *PAGAMENTO VIA PIX*
🔑 Chave PIX: {{company.pix}}

⚡ *REGULARIZE HOJE MESMO*
• Evite juros e multas
• Mantenha seu cadastro em dia
• Confirme o pagamento aqui

📞 {{company.name}} - {{company.phone}}`
    },
    reminder: {
      name: '🔔 Lembrete Amigável',
      template: `🔔 *LEMBRETE DE PAGAMENTO* 🔔

Oi *{{client.name}}*! 😊

Este é um lembrete amigável sobre sua fatura que vence em breve.

💰 *DETALHES DO PAGAMENTO*
💵 Valor: *{{invoice.amount}}*
📅 Vencimento: {{invoice.dueDate}}
🆔 Código: {{invoice.id}}

💳 *PAGAMENTO VIA PIX*
🔑 Chave PIX: {{company.pix}}

✅ *PAGUE ANTECIPADAMENTE*
• Sem juros ou multas
• Confirmação instantânea
• Tranquilidade garantida

📞 {{company.name}} - {{company.phone}}`
    },
    new_invoice: {
      name: '📄 Nova Fatura',
      template: `📄 *NOVA FATURA DISPONÍVEL* 📄

Olá *{{client.name}}*! 👋

Uma nova fatura foi gerada para você.

💰 *INFORMAÇÕES DA FATURA*
💵 Valor: *{{invoice.amount}}*
📅 Vencimento: {{invoice.dueDate}}
📋 Gerada em: {{current.date}}
🆔 Código: {{invoice.id}}

💳 *PAGAMENTO VIA PIX*
🔑 Chave PIX: {{company.pix}}

📞 {{company.name}} - {{company.phone}}`
    },
    custom: {
      name: '✏️ Mensagem Personalizada',
      template: ''
    }
  };

  // ===== FUNÇÕES DE SELEÇÃO COM VALIDAÇÃO =====
  const handleClientSelection = useCallback((clientId, selected) => {
    if (!clientId) {
      console.error('❌ ID do cliente inválido');
      return;
    }

    setSelectedClients(prev => {
      if (selected) {
        return prev.includes(clientId) ? prev : [...prev, clientId];
      } else {
        return prev.filter(id => id !== clientId);
      }
    });
    
    // Limpar avisos ao alterar seleção
    setWarnings([]);
  }, []);

  const selectAllClients = useCallback(() => {
    if (selectedClients.length === processedClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(processedClients.map(client => client.id));
    }
    setWarnings([]);
  }, [selectedClients.length, processedClients]);

  // ===== VALIDAÇÃO DE SELEÇÃO =====
  const validateSelection = useCallback(() => {
    const validationErrors = [];
    const validationWarnings = [];

    if (selectedClients.length === 0) {
      validationErrors.push('❌ Selecione pelo menos um cliente');
    }

    if (selectedClients.length > 50) {
      validationWarnings.push('⚠️ Muitos clientes selecionados (>50). Considere envios menores.');
    }

    // Validar clientes selecionados
    selectedClients.forEach(clientId => {
      const client = processedClients.find(c => c.id === clientId);
      if (!client) {
        validationErrors.push(`❌ Cliente ${clientId} não encontrado`);
        return;
      }

      if (!client.phone || client.phone.replace(/\D/g, '').length < 10) {
        validationErrors.push(`❌ ${client.name}: Telefone inválido`);
      }

      if (client.status !== 'active') {
        validationWarnings.push(`⚠️ ${client.name}: Cliente inativo`);
      }
    });

    setErrors(validationErrors);
    setWarnings(validationWarnings);
    return validationErrors.length === 0;
  }, [selectedClients, processedClients]);

  // ===== GERAÇÃO DE PREVIEW COM SEGURANÇA =====
  const generatePreview = useCallback((clientId, templateType, customMsg = '') => {
    try {
      const client = processedClients.find(c => c.id === clientId);
      if (!client) {
        throw new Error('Cliente não encontrado');
      }

      let template = customMsg;
      if (templateType !== 'custom') {
        template = messageTemplates[templateType]?.template || '';
      }

      if (!template) {
        return 'Mensagem vazia';
      }

      // Buscar fatura mais recente do cliente
      const clientInvoices = invoices.filter(inv => inv.clientId === clientId);
      const recentInvoice = clientInvoices
        .filter(inv => ['pending', 'overdue'].includes(inv.status))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] ||
        clientInvoices[0];

      // Substituições de segurança
      let preview = template;
      const replacements = {
        '{{client.name}}': client.name || 'Cliente',
        '{{client.phone}}': client.phone || '',
        '{{client.email}}': client.email || '',
        '{{invoice.amount}}': recentInvoice ? formatCurrency(recentInvoice.amount) : 'R$ 0,00',
        '{{invoice.dueDate}}': recentInvoice ? formatDate(recentInvoice.dueDate) : '01/01/2024',
        '{{invoice.id}}': recentInvoice ? `#${recentInvoice.id?.substring(0, 8)}` : '#12345678',
        '{{company.name}}': 'Conexão Delivery',
        '{{company.phone}}': '(11) 99999-9999',
        '{{company.pix}}': '11999999999',
        '{{current.date}}': formatDate(new Date().toISOString().split('T')[0])
      };

      Object.entries(replacements).forEach(([key, value]) => {
        preview = preview.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
      });

      return preview;
    } catch (error) {
      console.error('❌ Erro ao gerar preview:', error);
      return 'Erro ao gerar preview da mensagem';
    }
  }, [processedClients, invoices, messageTemplates]);

  // ===== ENVIO DE MENSAGENS COM MÁXIMA SEGURANÇA =====
  const handleSendMessages = useCallback(async () => {
    // Validações finais
    if (!validateSystem() || !validateSelection()) {
      return;
    }

    // Confirmação de segurança
    const confirmMessage = `
⚠️ CONFIRMAÇÃO DE ENVIO ⚠️

Você está prestes a enviar mensagens para ${selectedClients.length} cliente(s).

Tipo: ${messageTemplates[messageType]?.name || 'Personalizada'}

⚠️ ATENÇÃO: Esta ação não pode ser desfeita!

Deseja continuar?
    `;

    if (!window.confirm(confirmMessage.trim())) {
      return;
    }

    setSending(true);
    setSendProgress(0);
    setSendResults([]);

    const results = [];
    const totalClients = selectedClients.length;

    try {
      for (let i = 0; i < totalClients; i++) {
        const clientId = selectedClients[i];
        const client = processedClients.find(c => c.id === clientId);
        
        if (!client) {
          results.push({
            clientId,
            clientName: 'Cliente não encontrado',
            success: false,
            error: 'Cliente não encontrado no sistema'
          });
          continue;
        }

        try {
          // Gerar mensagem para este cliente
          const message = generatePreview(clientId, messageType, customMessage);
          
          // Validar mensagem
          if (!message || message.trim().length === 0) {
            throw new Error('Mensagem vazia');
          }

          // Enviar mensagem
          const result = await whatsappService.sendMessage(client.phone, message);
          
          results.push({
            clientId,
            clientName: client.name,
            phone: client.phone,
            success: result.success,
            error: result.error || null,
            messageId: result.messageId || null
          });

          // Log de auditoria
          console.log(`📤 Enviado para ${client.name}: ${result.success ? '✅' : '❌'}`);

        } catch (error) {
          results.push({
            clientId,
            clientName: client.name,
            phone: client.phone,
            success: false,
            error: error.message
          });
          console.error(`❌ Erro ao enviar para ${client.name}:`, error);
        }

        // Atualizar progresso
        setSendProgress(((i + 1) / totalClients) * 100);

        // Delay entre envios (obrigatório para evitar spam)
        if (i < totalClients - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      setSendResults(results);
      
      // Estatísticas finais
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      alert(`
✅ ENVIO CONCLUÍDO

Sucessos: ${successful}
Falhas: ${failed}
Total: ${results.length}
      `);

    } catch (error) {
      console.error('❌ Erro crítico no envio:', error);
      alert(`❌ Erro crítico: ${error.message}`);
    } finally {
      setSending(false);
    }
  }, [
    validateSystem, 
    validateSelection, 
    selectedClients, 
    processedClients, 
    messageType, 
    customMessage, 
    generatePreview, 
    messageTemplates
  ]);

  // ===== RESET DE DADOS =====
  const resetForm = useCallback(() => {
    setSelectedClients([]);
    setMessageType('custom');
    setCustomMessage('');
    setActiveStep(1);
    setSendResults([]);
    setErrors([]);
    setWarnings([]);
    setSendProgress(0);
  }, []);

  // ===== RENDERIZAÇÃO CONDICIONAL POR ETAPA =====
  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return renderClientSelection();
      case 2:
        return renderMessageComposer();
      case 3:
        return renderConfirmation();
      default:
        return renderClientSelection();
    }
  };

  // ===== ETAPA 1: SELEÇÃO DE CLIENTES =====
  const renderClientSelection = () => (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔍 Buscar Cliente
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome, telefone ou email..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📋 Filtrar por Status
            </label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Clientes</option>
              <option value="active">Somente Ativos</option>
              <option value="with_pending">Com Faturas Pendentes</option>
              <option value="with_overdue">Com Faturas Vencidas</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={selectAllClients}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {selectedClients.length === processedClients.length ? 'Desmarcar' : 'Selecionar'} Todos
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-900">
              📋 Clientes Disponíveis ({processedClients.length})
            </h3>
            <div className="text-sm text-gray-600">
              ✅ {selectedClients.length} selecionados
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {processedClients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>📭 Nenhum cliente encontrado</p>
              <p className="text-sm mt-1">Ajuste os filtros ou adicione novos clientes</p>
            </div>
          ) : (
            processedClients.map(client => (
              <div
                key={client.id}
                className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                  selectedClients.includes(client.id) ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.id)}
                    onChange={(e) => handleClientSelection(client.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{client.name}</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>📱 {client.phone}</p>
                          {client.email && <p>📧 {client.email}</p>}
                        </div>
                      </div>
                      
                      <div className="text-right text-sm">
                        {client.overdueCount > 0 && (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-xs mb-1">
                            🚨 {client.overdueCount} vencida{client.overdueCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {client.pendingCount > 0 && (
                          <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs mb-1 ml-1">
                            ⏳ {client.pendingCount} pendente{client.pendingCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {client.totalPending > 0 && (
                          <div className="text-xs text-gray-600 mt-1">
                            Total: {formatCurrency(client.totalPending)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPreviewClient(client);
                      setShowPreview(true);
                    }}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                  >
                    👁️ Preview
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // ===== ETAPA 2: COMPOSER DE MENSAGEM =====
  const renderMessageComposer = () => (
    <div className="space-y-6">
      {/* Seleção de Template */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📝 Tipo de Mensagem
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(messageTemplates).map(([key, template]) => (
            <button
              key={key}
              onClick={() => {
                setMessageType(key);
                if (key !== 'custom') {
                  setCustomMessage(template.template);
                } else {
                  setCustomMessage('');
                }
              }}
              className={`p-3 border rounded-lg text-left transition-colors ${
                messageType === key
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-sm">{template.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor de Mensagem */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ✏️ Mensagem {messageType === 'custom' ? 'Personalizada' : '(Template)'}
          </label>
          <textarea
            value={messageType === 'custom' ? customMessage : messageTemplates[messageType]?.template || ''}
            onChange={(e) => {
              if (messageType === 'custom') {
                setCustomMessage(e.target.value);
              }
            }}
            readOnly={messageType !== 'custom'}
            className={`w-full h-64 p-4 border border-gray-300 rounded-lg text-sm font-mono ${
              messageType === 'custom' 
                ? 'focus:ring-2 focus:ring-blue-500' 
                : 'bg-gray-50 cursor-not-allowed'
            }`}
            placeholder={messageType === 'custom' ? 'Digite sua mensagem personalizada aqui...' : ''}
          />
          <div className="mt-2 text-xs text-gray-500">
            <p>🏷️ Variáveis disponíveis:</p>
            <code className="text-xs">
              {'{'}client.name{'}'}, {'{'}invoice.amount{'}'}, {'{'}invoice.dueDate{'}'}, {'{'}company.pix{'}'}
            </code>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            👁️ Preview da Mensagem
          </label>
          <div className="h-64 bg-green-50 border border-green-200 rounded-lg p-4 overflow-y-auto">
            <div className="bg-white border border-green-300 rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 mb-2">WhatsApp - Preview</div>
              <pre className="whitespace-pre-wrap text-sm font-sans">
                {selectedClients.length > 0 
                  ? generatePreview(selectedClients[0], messageType, customMessage)
                  : 'Selecione um cliente para ver o preview'
                }
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ===== ETAPA 3: CONFIRMAÇÃO =====
  const renderConfirmation = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-yellow-800">
              Confirmar Envio de Mensagens
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Você está prestes a enviar mensagens para <strong>{selectedClients.length} cliente(s)</strong>.</p>
              <p className="mt-1">⚠️ Esta ação não pode ser desfeita!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo do Envio */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <h4 className="font-medium text-gray-900">📋 Resumo do Envio</h4>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Tipo de Mensagem:</p>
              <p className="text-sm text-gray-900">{messageTemplates[messageType]?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Total de Destinatários:</p>
              <p className="text-sm text-gray-900">{selectedClients.length} cliente(s)</p>
            </div>
          </div>

          {/* Lista de Destinatários */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Destinatários:</p>
            <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-2">
              {selectedClients.map(clientId => {
                const client = processedClients.find(c => c.id === clientId);
                return client ? (
                  <div key={clientId} className="text-xs text-gray-600 py-1">
                    📱 {client.name} - {client.phone}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Botão de Confirmação */}
      <div className="flex justify-center">
        <button
          onClick={handleSendMessages}
          disabled={sending || !connectionStatus?.connected}
          className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {sending ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Enviando... ({Math.round(sendProgress)}%)
            </div>
          ) : (
            '🚀 Confirmar e Enviar Mensagens'
          )}
        </button>
      </div>
    </div>
  );

  // ===== MODAL DE PREVIEW =====
  const renderPreviewModal = () => {
    if (!showPreview || !previewClient) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              👁️ Preview para {previewClient.name}
            </h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">👤 Informações do Cliente</h4>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  <p><strong>Nome:</strong> {previewClient.name}</p>
                  <p><strong>Telefone:</strong> {previewClient.phone}</p>
                  <p><strong>Email:</strong> {previewClient.email || 'Não informado'}</p>
                  <p><strong>Status:</strong> {previewClient.status === 'active' ? '✅ Ativo' : '❌ Inativo'}</p>
                  {previewClient.pendingCount > 0 && (
                    <p><strong>Pendências:</strong> {previewClient.pendingCount} faturas ({formatCurrency(previewClient.totalPending)})</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">📱 Preview da Mensagem</h4>
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="bg-white border border-green-300 rounded p-2 shadow-sm">
                    <div className="text-xs text-gray-500 mb-2">WhatsApp Preview</div>
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {generatePreview(previewClient.id, messageType, customMessage)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== RESULTADOS DE ENVIO =====
  const renderSendResults = () => {
    if (sendResults.length === 0) return null;

    const successful = sendResults.filter(r => r.success).length;
    const failed = sendResults.filter(r => !r.success).length;

    return (
      <div className="mt-6 bg-white border rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-medium text-gray-900">
            📊 Resultados do Envio
          </h3>
          <div className="mt-2 flex space-x-4 text-sm">
            <span className="text-green-600">✅ Sucessos: {successful}</span>
            <span className="text-red-600">❌ Falhas: {failed}</span>
            <span className="text-gray-600">📊 Total: {sendResults.length}</span>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {sendResults.map((result, index) => (
            <div
              key={index}
              className={`p-3 border-b flex justify-between items-center ${
                result.success ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <div>
                <p className="font-medium text-sm">
                  {result.success ? '✅' : '❌'} {result.clientName}
                </p>
                <p className="text-xs text-gray-600">{result.phone}</p>
              </div>
              <div className="text-right">
                {result.success ? (
                  <span className="text-xs text-green-600">Enviado com sucesso</span>
                ) : (
                  <span className="text-xs text-red-600">{result.error}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ===== RENDER PRINCIPAL =====
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            📱 Controle Manual de Envios
          </h2>
          <p className="text-gray-600">
            Sistema seguro para envio controlado de mensagens WhatsApp
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={resetForm}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            disabled={sending}
          >
            🔄 Resetar
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            disabled={sending}
          >
            ❌ Fechar
          </button>
        </div>
      </div>

      {/* Status de Conexão */}
      {!connectionStatus?.connected && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">❌</span>
            <p className="text-red-700">
              WhatsApp não está conectado. Conecte primeiro antes de enviar mensagens.
            </p>
          </div>
        </div>
      )}

      {/* Erros de Sistema */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">❌ Erros do Sistema:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Avisos */}
      {warnings.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">⚠️ Avisos:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-8">
          {[
            { step: 1, title: 'Seleção de Clientes', icon: '👥' },
            { step: 2, title: 'Composição da Mensagem', icon: '✏️' },
            { step: 3, title: 'Confirmação e Envio', icon: '🚀' }
          ].map(({ step, title, icon }) => (
            <div
              key={step}
              className={`flex items-center space-x-2 ${
                activeStep === step
                  ? 'text-blue-600 font-medium'
                  : activeStep > step
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  activeStep === step
                    ? 'bg-blue-100 text-blue-600'
                    : activeStep > step
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {activeStep > step ? '✓' : icon}
              </div>
              <span className="text-sm">{title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conteúdo da Etapa */}
      <div className="bg-white border rounded-lg p-6">
        {renderStepContent()}
      </div>

      {/* Navegação entre Etapas */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
          disabled={activeStep === 1 || sending}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Voltar
        </button>

        {activeStep < 3 ? (
          <button
            onClick={() => {
              if (activeStep === 1) {
                if (!validateSelection()) return;
              }
              setActiveStep(activeStep + 1);
            }}
            disabled={sending || (activeStep === 1 && selectedClients.length === 0)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo →
          </button>
        ) : (
          <div className="text-sm text-gray-500">
            Clique no botão vermelho acima para confirmar o envio
          </div>
        )}
      </div>

      {/* Resultados de Envio */}
      {renderSendResults()}

      {/* Modal de Preview */}
      {renderPreviewModal()}

      {/* Progress Bar durante Envio */}
      {sending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 min-w-96">
            <h3 className="text-lg font-medium mb-4">📤 Enviando Mensagens...</h3>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${sendProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progresso: {Math.round(sendProgress)}%</span>
              <span>{Math.ceil((sendProgress * selectedClients.length) / 100)} de {selectedClients.length}</span>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                ⚠️ Não feche esta janela durante o envio
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppManualSender;