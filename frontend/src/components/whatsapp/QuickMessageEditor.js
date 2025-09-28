// src/components/whatsapp/QuickMessageEditor.js - EDITOR RÁPIDO
import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const QuickMessageEditor = ({ 
  initialMessage = '', 
  notification = null, 
  onSave, 
  onCancel 
}) => {
  const [message, setMessage] = useState(initialMessage);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Variáveis disponíveis para inserção rápida
  const quickVariables = [
    { key: '{{client.name}}', label: '👤 Nome', value: notification?.client?.name || 'Cliente' },
    { key: '{{invoice.amount}}', label: '💰 Valor', value: formatCurrency(notification?.invoice?.amount || 0) },
    { key: '{{invoice.dueDate}}', label: '📅 Vencimento', value: formatDate(notification?.invoice?.dueDate || new Date()) },
    { key: '{{company.pix}}', label: '🔑 PIX', value: 'sua-chave-pix' }
  ];

  // Emojis úteis para inserção rápida
  const quickEmojis = [
    '🚨', '⚠️', '🔔', '📄', '✅', '💰', '📅', '⏰', 
    '📱', '💳', '🔑', '⚡', '📞', '🎯', '🏆', '😊'
  ];

  // Atualizar mensagem quando prop mudar
  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  // Inserir variável na posição do cursor
  const insertVariable = (variable) => {
    const textarea = document.getElementById('quick-message-textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.substring(0, start) + variable + message.substring(end);
      setMessage(newMessage);
      
      // Reposicionar cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  // Inserir emoji na posição do cursor
  const insertEmoji = (emoji) => {
    insertVariable(emoji + ' ');
  };

  // Gerar preview da mensagem com variáveis substituídas
  const generatePreview = () => {
    let preview = message;
    
    if (notification) {
      // Substituir variáveis com dados reais
      const replacements = {
        '{{client.name}}': notification.client?.name || 'Cliente',
        '{{client.phone}}': notification.client?.phone || '(11) 99999-9999',
        '{{client.email}}': notification.client?.email || 'cliente@email.com',
        '{{invoice.amount}}': formatCurrency(notification.invoice?.amount || 0),
        '{{invoice.dueDate}}': formatDate(notification.invoice?.dueDate || new Date()),
        '{{invoice.id}}': `#${notification.invoice?.id?.substring(0, 8) || 'INV123'}`,
        '{{subscription.name}}': notification.subscription?.name || 'Plano',
        '{{company.name}}': 'Conexão Delivery',
        '{{company.phone}}': '(11) 99999-9999',
        '{{company.pix}}': 'sua-chave-pix@email.com'
      };
      
      Object.entries(replacements).forEach(([key, value]) => {
        preview = preview.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
      });
    }
    
    return preview;
  };

  // Salvar mensagem
  const handleSave = async () => {
    if (!message.trim()) {
      alert('❌ Mensagem não pode estar vazia');
      return;
    }

    setSaving(true);
    try {
      const preview = generatePreview();
      await onSave(message, preview);
    } catch (error) {
      console.error('❌ Erro ao salvar mensagem:', error);
      alert('❌ Erro ao salvar mensagem');
    } finally {
      setSaving(false);
    }
  };

  // Templates rápidos
  const quickTemplates = [
    {
      name: '🚨 Cobrança Urgente',
      template: '🚨 *URGENTE* 🚨\n\nOlá {{client.name}}!\n\nSua fatura de {{invoice.amount}} precisa ser quitada hoje.\n\nPIX: {{company.pix}}\n\nObrigado!'
    },
    {
      name: '🔔 Lembrete Amigável',
      template: '🔔 Oi {{client.name}}! 😊\n\nSó lembrando que sua fatura de {{invoice.amount}} vence em {{invoice.dueDate}}.\n\nPIX: {{company.pix}}\n\nObrigado!'
    },
    {
      name: '💰 Cobrança Simples',
      template: 'Olá {{client.name}}!\n\nFatura: {{invoice.amount}}\nVencimento: {{invoice.dueDate}}\nPIX: {{company.pix}}\n\nObrigado!'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header com informações do cliente */}
      {notification && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
              {notification.client?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h4 className="font-medium text-blue-900">
                {notification.client?.name} - {formatCurrency(notification.invoice?.amount || 0)}
              </h4>
              <p className="text-sm text-blue-700">
                📱 {notification.client?.phone} • 📅 Vence: {formatDate(notification.invoice?.dueDate)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Editor/Preview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              previewMode
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            {previewMode ? '✏️ Editar' : '👁️ Preview'}
          </button>
        </div>
        
        <div className="text-sm text-gray-500">
          {message.length} caracteres
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Principal */}
        <div className="lg:col-span-2">
          {!previewMode ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ✏️ Sua Mensagem Personalizada
              </label>
              <textarea
                id="quick-message-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Digite sua mensagem personalizada aqui..."
                style={{ lineHeight: '1.6' }}
              />
              
              {/* Templates Rápidos */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">📋 Templates Rápidos:</p>
                <div className="flex flex-wrap gap-2">
                  {quickTemplates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => setMessage(template.template)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border transition-colors"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👁️ Preview (como será enviada)
              </label>
              <div className="h-64 p-4 border border-gray-300 rounded-lg bg-green-50 overflow-y-auto">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-medium">📱</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">WhatsApp Business</div>
                      <div className="text-xs text-gray-500">Conexão Delivery</div>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                    {generatePreview()}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra Lateral com Ferramentas */}
        <div className="space-y-4">
          {/* Variáveis Rápidas */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              🏷️ Variáveis Rápidas
            </h4>
            <div className="space-y-1">
              {quickVariables.map((variable) => (
                <button
                  key={variable.key}
                  onClick={() => insertVariable(variable.key)}
                  className="w-full text-left p-2 text-xs bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded transition-colors"
                >
                  <div className="font-mono text-blue-600">{variable.key}</div>
                  <div className="text-gray-600">{variable.label}: {variable.value}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Emojis Rápidos */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              😊 Emojis Úteis
            </h4>
            <div className="grid grid-cols-4 gap-1">
              {quickEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => insertEmoji(emoji)}
                  className="p-2 text-lg hover:bg-gray-100 rounded transition-colors text-center"
                  title={`Inserir ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Ações Rápidas */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              ⚡ Ações Rápidas
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => setMessage(message.toUpperCase())}
                className="w-full px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border transition-colors"
              >
                🔠 MAIÚSCULA
              </button>
              
              <button
                onClick={() => setMessage(message.toLowerCase())}
                className="w-full px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border transition-colors"
              >
                🔡 minúscula
              </button>
              
              <button
                onClick={() => setMessage('')}
                className="w-full px-3 py-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded border border-red-300 transition-colors"
              >
                🗑️ Limpar Tudo
              </button>
            </div>
          </div>

          {/* Informações da Fatura */}
          {notification && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="text-xs font-medium text-gray-700 mb-2">
                📋 Dados da Fatura
              </h5>
              <div className="space-y-1 text-xs text-gray-600">
                <div>💰 {formatCurrency(notification.invoice?.amount || 0)}</div>
                <div>📅 {formatDate(notification.invoice?.dueDate)}</div>
                <div>🆔 #{notification.invoice?.id?.substring(0, 8)}</div>
                {notification.subscription && (
                  <div>🔄 {notification.subscription.name}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          💡 Use as variáveis para personalizar automaticamente com dados do cliente
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            disabled={saving}
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || !message.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
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
  );
};

export default QuickMessageEditor;