// src/components/notifications/WhatsAppTemplateEditor.js
import React, { useState, useEffect } from 'react';
import { whatsappService } from '../../services/whatsappService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';

const WhatsAppTemplateEditor = ({ isOpen, onClose, onSave, templateType, initialData }) => {
  const [template, setTemplate] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [previewMessage, setPreviewMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [variables, setVariables] = useState([]);
  
  // Dados de exemplo para preview
  const mockData = {
    client: {
      id: 'client-123',
      name: 'João Silva',
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

  // Variáveis disponíveis para uso nos templates
  const availableVariables = [
    { key: '{{client.name}}', description: 'Nome do cliente', example: 'João Silva' },
    { key: '{{client.phone}}', description: 'Telefone do cliente', example: '(11) 99999-1234' },
    { key: '{{client.email}}', description: 'Email do cliente', example: 'joao@exemplo.com' },
    { key: '{{invoice.amount}}', description: 'Valor da fatura', example: 'R$ 150,00' },
    { key: '{{invoice.dueDate}}', description: 'Data de vencimento', example: '25/12/2024' },
    { key: '{{invoice.id}}', description: 'ID da fatura', example: '#inv-456' },
    { key: '{{subscription.name}}', description: 'Nome do plano', example: 'Plano Premium' },
    { key: '{{company.name}}', description: 'Nome da empresa', example: 'Conexão Delivery' },
    { key: '{{company.phone}}', description: 'Telefone da empresa', example: '(11) 99999-9999' },
    { key: '{{company.pix}}', description: 'Chave PIX da empresa', example: 'empresa@email.com' },
    { key: '{{days.overdue}}', description: 'Dias em atraso', example: '5 dias' },
    { key: '{{days.until}}', description: 'Dias até vencimento', example: '3 dias' }
  ];

  // Templates padrão
  const defaultTemplates = {
    overdue: `🚨 *FATURA VENCIDA* 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Olá *{{client.name}}*! 👋

Sua fatura está *{{days.overdue}} em atraso* e precisa ser regularizada com urgência.

💰 *RESUMO DA COBRANÇA*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💵 Valor: *{{invoice.amount}}*
┃ 📅 Vencimento: {{invoice.dueDate}}
┃ ⚠️ Dias em atraso: *{{days.overdue}}*
┃ 🆔 Código: {{invoice.id}}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

💳 *PAGUE AGORA VIA PIX*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔑 Chave PIX:
┃ \`{{company.pix}}\`
┃ 
┃ 📱 Copie a chave acima
┃ 💸 Faça o PIX do valor exato
┃ 📷 Envie o comprovante aqui
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

⚡ *IMPORTANTE:*
• ⏰ Quite hoje e evite juros
• 📱 Comprovante via WhatsApp
• 🔄 Confirmação em até 1h

📞 {{company.name}} - {{company.phone}}`,

    reminder: `🔔 *LEMBRETE DE PAGAMENTO* 🔔
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Oi *{{client.name}}*! 😊

Sua fatura vence em *{{days.until}}*. Que tal já garantir o pagamento?

💰 *DETALHES DO PAGAMENTO*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💵 Valor: *{{invoice.amount}}*
┃ 📅 Vence em: {{invoice.dueDate}}
┃ ⏰ Faltam: *{{days.until}}*
┃ 🆔 Código: {{invoice.id}}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

💳 *PIX PARA PAGAMENTO*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔑 Nossa Chave PIX:
┃ \`{{company.pix}}\`
┃ 
┃ ✅ Pague antecipado
┃ 📷 Envie o comprovante
┃ 🏆 Sem juros nem multas
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📞 {{company.name}} - {{company.phone}}`,

    new_invoice: `📄 *NOVA FATURA DISPONÍVEL* 📄
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Olá *{{client.name}}*! 👋

Uma nova fatura foi gerada para você!

💰 *INFORMAÇÕES DA FATURA*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💵 Valor: *{{invoice.amount}}*
┃ 📅 Vencimento: {{invoice.dueDate}}
┃ 📋 Gerada em: {{invoice.generationDate}}
┃ 🆔 Código: {{invoice.id}}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

💳 *PAGAMENTO VIA PIX*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔑 Chave PIX:
┃ \`{{company.pix}}\`
┃ 
┃ 🚀 Pagamento instantâneo
┃ 📱 Confirmação automática
┃ 🎯 Sem taxas extras
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📞 {{company.name}} - {{company.phone}}`,

    payment_confirmed: `✅ *PAGAMENTO CONFIRMADO* ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*{{client.name}}*, seu pagamento foi confirmado! 🎉

💰 *COMPROVANTE DE PAGAMENTO*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ✅ Status: *PAGO*
┃ 💵 Valor: {{invoice.amount}}
┃ 📅 Pago em: {{invoice.paidDate}}
┃ 🆔 Código: {{invoice.id}}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

🎯 *PRÓXIMOS PASSOS:*
• ✅ Pagamento processado
• 📱 Comprovante salvo
• 🔄 Próxima fatura em breve
• 🏆 Obrigado pela preferência!

📞 {{company.name}} - {{company.phone}}`
  };

  // Carregar template inicial
  useEffect(() => {
    if (isOpen) {
      const savedTemplate = localStorage.getItem(`whatsapp_template_${templateType}`);
      if (savedTemplate) {
        setTemplate(savedTemplate);
      } else if (initialData?.template) {
        setTemplate(initialData.template);
      } else if (defaultTemplates[templateType]) {
        setTemplate(defaultTemplates[templateType]);
      }
    }
  }, [isOpen, templateType, initialData]);

  // Função para substituir variáveis
  const replaceVariables = (text) => {
    let result = text;
    
    // Dados da empresa (pegar do whatsappService)
    const companyInfo = whatsappService.companyInfo || {
      name: 'Conexão Delivery',
      phone: '(11) 99999-9999',
      pix: '11999999999'
    };

    // Calcular dias
    const today = new Date();
    const dueDate = new Date(mockData.invoice.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const daysOverdue = diffDays < 0 ? Math.abs(diffDays) : 0;
    const daysUntil = diffDays > 0 ? diffDays : 0;

    // Substituições
    const replacements = {
      '{{client.name}}': mockData.client.name,
      '{{client.phone}}': mockData.client.phone,
      '{{client.email}}': mockData.client.email,
      '{{invoice.amount}}': formatCurrency(mockData.invoice.amount),
      '{{invoice.dueDate}}': formatDate(mockData.invoice.dueDate),
      '{{invoice.generationDate}}': formatDate(mockData.invoice.generationDate),
      '{{invoice.paidDate}}': formatDate(new Date()),
      '{{invoice.id}}': `#${mockData.invoice.id?.substring(0, 8)}`,
      '{{subscription.name}}': mockData.subscription.name,
      '{{company.name}}': companyInfo.name,
      '{{company.phone}}': companyInfo.phone,
      '{{company.pix}}': companyInfo.pixKey || companyInfo.pix,
      '{{days.overdue}}': `${daysOverdue} dias`,
      '{{days.until}}': `${daysUntil} dias`
    };

    Object.entries(replacements).forEach(([key, value]) => {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return result;
  };

  // Atualizar preview em tempo real
  useEffect(() => {
    if (template) {
      const preview = replaceVariables(template);
      setPreviewMessage(preview);
    }
  }, [template]);

  // Inserir variável no cursor
  const insertVariable = (variable) => {
    const textarea = document.getElementById('template-textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newTemplate = template.substring(0, start) + variable + template.substring(end);
      setTemplate(newTemplate);
      
      // Reposicionar cursor após a variável inserida
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  // Salvar template
  const handleSave = async () => {
    setSaving(true);
    try {
      // Salvar no localStorage
      localStorage.setItem(`whatsapp_template_${templateType}`, template);
      
      // Atualizar o serviço WhatsApp com o novo template
      whatsappService.customTemplates = whatsappService.customTemplates || {};
      whatsappService.customTemplates[templateType] = template;
      
      // Callback para o componente pai
      if (onSave) {
        await onSave({
          type: templateType,
          template: template,
          preview: previewMessage
        });
      }
      
      alert('✅ Template salvo com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      alert('❌ Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  // Restaurar template padrão
  const restoreDefault = () => {
    if (window.confirm('Deseja restaurar o template padrão? Isso substituirá suas alterações.')) {
      setTemplate(defaultTemplates[templateType] || '');
    }
  };

  // Obter título do template
  const getTemplateTitle = () => {
    const titles = {
      overdue: '🚨 Fatura Vencida',
      reminder: '🔔 Lembrete de Vencimento',
      new_invoice: '📄 Nova Fatura',
      payment_confirmed: '✅ Pagamento Confirmado'
    };
    return titles[templateType] || 'Template';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Template: ${getTemplateTitle()}`}
    >
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                previewMode
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              {previewMode ? '✏️ Editar' : '👁️ Preview'}
            </button>
            
            <button
              onClick={restoreDefault}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              🔄 Restaurar Padrão
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            {template.length} caracteres
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor de Template */}
          <div className="lg:col-span-2 space-y-4">
            {!previewMode ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template da Mensagem
                </label>
                <textarea
                  id="template-textarea"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Digite seu template aqui..."
                  style={{ lineHeight: '1.6' }}
                />
                <div className="mt-2 text-xs text-gray-500">
                  💡 Use as variáveis da lista ao lado para personalizar a mensagem
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview da Mensagem (como será enviada)
                </label>
                <div className="h-96 p-4 border border-gray-300 rounded-lg bg-green-50 overflow-y-auto">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-medium">CD</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Conexão Delivery</div>
                        <div className="text-xs text-gray-500">WhatsApp Business</div>
                      </div>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                      {previewMessage}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lista de Variáveis */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                📝 Variáveis Disponíveis
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableVariables.map((variable) => (
                  <div
                    key={variable.key}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => insertVariable(variable.key)}
                  >
                    <div className="font-mono text-xs text-blue-600 font-medium">
                      {variable.key}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {variable.description}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Ex: {variable.example}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dados de Exemplo */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="text-xs font-medium text-gray-700 mb-2">
                🎯 Dados de Exemplo
              </h5>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Cliente: {mockData.client.name}</div>
                <div>Valor: {formatCurrency(mockData.invoice.amount)}</div>
                <div>Vencimento: {formatDate(mockData.invoice.dueDate)}</div>
                <div>Plano: {mockData.subscription.name}</div>
              </div>
            </div>

            {/* Emojis Úteis */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h5 className="text-xs font-medium text-gray-700 mb-2">
                😀 Emojis Úteis
              </h5>
              <div className="grid grid-cols-4 gap-2">
                {['🚨', '🔔', '📄', '✅', '💰', '📅', '⏰', '📱', '💳', '🔑', '⚡', '📞'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertVariable(emoji)}
                    className="text-lg p-2 rounded hover:bg-yellow-100 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            💡 Alterações são salvas automaticamente e aplicadas a todas as futuras mensagens
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving || !template.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Salvando...</span>
                </>
              ) : (
                '💾 Salvar Template'
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WhatsAppTemplateEditor;