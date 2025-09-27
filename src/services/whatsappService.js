// src/services/whatsappService.js - Refatorado para usar Evolution API diretamente
const { formatCurrency, formatDate } = require('../utils/formatters');

class WhatsAppService {
  constructor() {
    // Configuração da Evolution API a partir do .env.local
    this.baseURL = process.env.REACT_APP_WHATSAPP_API_URL || 'https://gestaodecobrancas.ddns.net';
    this.apiKey = process.env.REACT_APP_WHATSAPP_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
    this.instanceName = process.env.REACT_APP_WHATSAPP_INSTANCE || 'main';

    // Informações da empresa
    this.companyInfo = {
      name: 'Conexão Delivery',
      phone: '(11) 99999-9999',
      email: 'contato@conexaodelivery.com',
      pixKey: '11999999999',
      website: 'www.conexaodelivery.com',
      supportHours: '8h às 18h, Segunda a Sexta'
    };

    // Templates customizados armazenados localmente
    this.customTemplates = {};
  }

  // =============================================
  // CONFIGURAÇÃO E CONEXÃO
  // =============================================

  // Verificar status da conexão
  async checkConnection() {
    try {
      const response = await fetch(`${this.baseURL}/instance/connectionState/${this.instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      return {
        connected: data.instance?.state === 'open',
        state: data.instance?.state || 'disconnected',
      };
    } catch (error) {
      console.error('❌ Erro ao verificar conexão WhatsApp:', error);
      return {
        connected: false,
        state: 'error',
        error: error.message
      };
    }
  }

  // Obter QR Code para conexão
  async getQRCode() {
    try {
      const response = await fetch(`${this.baseURL}/instance/connect/${this.instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return {
        success: true,
        qrCode: data.base64 || data.qrcode?.base64,
      };
    } catch (error) {
      console.error('❌ Erro ao obter QR Code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Testar conexão com envio opcional
  async testConnection(testPhone = null) {
    try {
      const response = await fetch(`${this.baseURL}/message/sendText/${this.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        body: JSON.stringify({
          number: testPhone,
          text: 'Teste de conexão do Conexão Delivery'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return {
        connection: { connected: true },
        testResult: { success: true }
      };
    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
      return {
        connection: { connected: false, error: error.message },
        testResult: { success: false, error: error.message }
      };
    }
  }

  // =============================================
  // ENVIO DE MENSAGENS
  // =============================================

  // Enviar mensagem base
  async sendMessage(phone, message) {
    try {
      const response = await fetch(`${this.baseURL}/message/sendText/${this.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        body: JSON.stringify({
          number: phone,
          text: message
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return {
        success: true,
        messageId: data.key?.id
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar mensagem personalizada
  async sendCustomMessage(phone, message, invoice = null, client = null) {
    try {
      let processedMessage = message;

      if (client) {
        processedMessage = processedMessage
          .replace(/\{\{client\.name\}\}/g, client.name)
          .replace(/\{\{client\.phone\}\}/g, client.phone)
          .replace(/\{\{client\.email\}\}/g, client.email);
      }

      if (invoice) {
        processedMessage = processedMessage
          .replace(/\{\{invoice\.amount\}\}/g, formatCurrency(invoice.amount))
          .replace(/\{\{invoice\.dueDate\}\}/g, formatDate(invoice.dueDate))
          .replace(/\{\{invoice\.id\}\}/g, `#${invoice.id?.substring(0, 8)}`);
      }

      processedMessage = processedMessage
        .replace(/\{\{company\.name\}\}/g, this.companyInfo.name)
        .replace(/\{\{company\.phone\}\}/g, this.companyInfo.phone)
        .replace(/\{\{company\.pix\}\}/g, this.companyInfo.pixKey);

      return await this.sendMessage(phone, processedMessage);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem personalizada:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =============================================
  // NOTIFICAÇÕES DE COBRANÇA
  // =============================================

  // Notificação de fatura vencida
  async sendOverdueNotification(invoice, client, subscription = null) {
    const message = this.getOverdueInvoiceTemplate(invoice, client, subscription);
    return await this.sendMessage(client.phone, message);
  }

  // Lembrete de vencimento
  async sendReminderNotification(invoice, client, subscription = null) {
    const message = this.getReminderTemplate(invoice, client, subscription);
    return await this.sendMessage(client.phone, message);
  }

  // Nova fatura gerada
  async sendNewInvoiceNotification(invoice, client, subscription = null) {
    const message = this.getNewInvoiceTemplate(invoice, client, subscription);
    return await this.sendMessage(client.phone, message);
  }

  // Confirmação de pagamento
  async sendPaymentConfirmation(invoice, client, subscription = null) {
    const message = this.getPaymentConfirmedTemplate(invoice, client, subscription);
    return await this.sendMessage(client.phone, message);
  }

  // =============================================
  // ENVIO EM LOTE
  // =============================================

  // Enviar mensagens em lote
  async sendBulkMessages(notifications, delayMs = 3000) {
    try {
      console.log(`🔄 Iniciando envio em lote de ${notifications.length} mensagens...`);
      const results = [];
      let successful = 0;
      let failed = 0;

      for (const notification of notifications) {
        const { type, invoice, client, subscription } = notification;
        let message;

        switch (type) {
          case 'overdue':
            message = this.getOverdueInvoiceTemplate(invoice, client, subscription);
            break;
          case 'reminder':
            message = this.getReminderTemplate(invoice, client, subscription);
            break;
          case 'new_invoice':
            message = this.getNewInvoiceTemplate(invoice, client, subscription);
            break;
          case 'payment_confirmed':
            message = this.getPaymentConfirmedTemplate(invoice, client, subscription);
            break;
          default:
            throw new Error(`Tipo de notificação inválido: ${type}`);
        }

        const result = await this.sendMessage(client.phone, message);
        results.push(result);
        if (result.success) {
          successful++;
        } else {
          failed++;
        }

        // Adicionar atraso entre mensagens
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      console.log(`✅ Envio em lote concluído: ${successful} sucessos, ${failed} falhas`);
      return { results, summary: { successful, failed } };
    } catch (error) {
      console.error('❌ Erro no envio em lote:', error);
      throw error;
    }
  }

  // =============================================
  // TEMPLATES DE MENSAGENS (LOCAL)
  // =============================================

  getOverdueInvoiceTemplate(invoice, client, subscription = null) {
    if (this.customTemplates.overdue) {
      return this.replaceTemplateVariables(this.customTemplates.overdue, invoice, client, subscription);
    }

    const daysOverdue = this.calculateDaysOverdue(invoice.dueDate);
    const pixKey = client.pix || this.companyInfo.pixKey;

    let message = `🚨 *FATURA VENCIDA* 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Olá *${client.name}*! 👋

Sua fatura está *${daysOverdue} dias em atraso* e precisa ser regularizada com urgência.

💰 *RESUMO DA COBRANÇA*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💵 Valor: *${formatCurrency(invoice.amount)}*
┃ 📅 Vencimento: ${formatDate(invoice.dueDate)}
┃ ⚠️ Dias em atraso: *${daysOverdue} dias*
┃ 🆔 Código: #${invoice.id?.substring(0, 8)}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

    if (subscription) {
      message += `

🔄 *PLANO: ${subscription.name}*
• ${this.getRecurrenceText(subscription)}
• Ativo desde ${formatDate(subscription.startDate)}`;
    }

    message += `

💳 *PAGUE AGORA VIA PIX*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔑 Chave PIX:
┃ \`${pixKey}\`
┃ 
┃ 📱 Copie a chave acima
┃ 💸 Faça o PIX do valor exato
┃ 📷 Envie o comprovante aqui
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

⚡ *IMPORTANTE:*
• ⏰ Quite hoje e evite juros
• 📱 Comprovante via WhatsApp
• 🔄 Confirmação em até 1h

📞 ${this.companyInfo.name} - ${this.companyInfo.phone}`;

    return message;
  }

  getReminderTemplate(invoice, client, subscription = null) {
    if (this.customTemplates.reminder) {
      return this.replaceTemplateVariables(this.customTemplates.reminder, invoice, client, subscription);
    }

    const daysUntil = this.calculateDaysUntil(invoice.dueDate);
    const pixKey = client.pix || this.companyInfo.pixKey;

    let message = `🔔 *LEMBRETE DE PAGAMENTO* 🔔
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Oi *${client.name}*! 😊

Sua fatura vence em *${daysUntil}*. Que tal já garantir o pagamento?

💰 *DETALHES DO PAGAMENTO*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💵 Valor: *${formatCurrency(invoice.amount)}*
┃ 📅 Vence em: ${formatDate(invoice.dueDate)}
┃ ⏰ Faltam: *${daysUntil}*
┃ 🆔 Código: #${invoice.id?.substring(0, 8)}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

    if (subscription) {
      message += `

🔄 *PLANO: ${subscription.name}*
• ${this.getRecurrenceText(subscription)}
• ${formatCurrency(subscription.amount)} ${this.getRecurrenceText(subscription, true)}`;
    }

    message += `

💳 *PIX PARA PAGAMENTO*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔑 Nossa Chave PIX:
┃ \`${pixKey}\`
┃ 
┃ ✅ Pague antecipado
┃ 📷 Envie o comprovante
┃ 🏆 Sem juros nem multas
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📞 ${this.companyInfo.name} - ${this.companyInfo.phone}`;

    return message;
  }

  getNewInvoiceTemplate(invoice, client, subscription = null) {
    if (this.customTemplates.new_invoice) {
      return this.replaceTemplateVariables(this.customTemplates.new_invoice, invoice, client, subscription);
    }

    const pixKey = client.pix || this.companyInfo.pixKey;

    let message = `📄 *NOVA FATURA DISPONÍVEL* 📄
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Olá *${client.name}*! 👋

Uma nova fatura foi gerada para você!

💰 *INFORMAÇÕES DA FATURA*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💵 Valor: *${formatCurrency(invoice.amount)}*
┃ 📅 Vencimento: ${formatDate(invoice.dueDate)}
┃ 📋 Gerada em: ${formatDate(invoice.generationDate || new Date())}
┃ 🆔 Código: #${invoice.id?.substring(0, 8)}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

    if (subscription) {
      message += `

🔄 *SEU PLANO: ${subscription.name}*
• ${this.getRecurrenceText(subscription)}
• Ativo e em funcionamento ✅`;
    }

    message += `

💳 *PAGAMENTO VIA PIX*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔑 Chave PIX:
┃ \`${pixKey}\`
┃ 
┃ 🚀 Pagamento instantâneo
┃ 📱 Confirmação automática
┃ 🎯 Sem taxas extras
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📞 ${this.companyInfo.name} - ${this.companyInfo.phone}`;

    return message;
  }

  getPaymentConfirmedTemplate(invoice, client, subscription = null) {
    if (this.customTemplates.payment_confirmed) {
      return this.replaceTemplateVariables(this.customTemplates.payment_confirmed, invoice, client, subscription);
    }

    let message = `✅ *PAGAMENTO CONFIRMADO* ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*${client.name}*, seu pagamento foi confirmado! 🎉

💰 *COMPROVANTE DE PAGAMENTO*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ✅ Status: *PAGO*
┃ 💵 Valor: ${formatCurrency(invoice.amount)}
┃ 📅 Pago em: ${formatDate(invoice.paidDate || new Date())}
┃ 🆔 Código: #${invoice.id?.substring(0, 8)}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

    if (subscription) {
      message += `

🔄 *PLANO RENOVADO: ${subscription.name}*
• Válido até a próxima cobrança
• Status: Ativo e funcionando ✅`;
    }

    message += `

🎯 *PRÓXIMOS PASSOS:*
• ✅ Pagamento processado
• 📱 Comprovante salvo
• 🔄 Próxima fatura em breve
• 🏆 Obrigado pela preferência!

📞 ${this.companyInfo.name} - ${this.companyInfo.phone}`;

    return message;
  }

  // =============================================
  // HISTÓRICO E ESTATÍSTICAS
  // =============================================

  // Obter histórico de mensagens
  async getMessageHistory(clientId, limit = 10) {
    try {
      const response = await fetch(`${this.baseURL}/chat/messages/${this.instanceName}/${clientId}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data.messages || [];
    } catch (error) {
      console.error('❌ Erro ao obter histórico:', error);
      return [];
    }
  }

  // Verificar se mensagem foi enviada hoje
  async wasMessageSentToday(clientId, type) {
    try {
      const response = await fetch(`${this.baseURL}/chat/messages/${this.instanceName}/${clientId}/sent-today?type=${type}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data.sentToday || false;
    } catch (error) {
      console.error('❌ Erro ao verificar mensagem do dia:', error);
      return false;
    }
  }

  // Obter estatísticas de mensagens
  async getMessagingStats(days = 30) {
    try {
      const response = await fetch(`${this.baseURL}/chat/stats/${this.instanceName}?days=${days}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data.stats || {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        period: `${days} dias`
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        period: `${days} dias`
      };
    }
  }

  // =============================================
  // FUNÇÕES UTILITÁRIAS (LOCAL)
  // =============================================

  calculateDaysOverdue(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  calculateDaysUntil(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'hoje';
    if (diffDays === 1) return '1 dia';
    if (diffDays > 1) return `${diffDays} dias`;
    return 'vencida';
  }

  getRecurrenceText(subscription, short = false) {
    const { recurrenceType, dayOfMonth, dayOfWeek, recurrenceDays } = subscription;

    if (short) {
      switch (recurrenceType) {
        case 'daily': return '/dia';
        case 'weekly': return '/semana';
        case 'monthly': return '/mês';
        case 'custom': return `/${recurrenceDays} dias`;
        default: return '/período';
      }
    }

    switch (recurrenceType) {
      case 'daily':
        return 'Cobrança diária';
      case 'weekly':
        const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
        const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(dayOfWeek);
        return `Cobrança semanal (${days[dayIndex] || 'segunda'})`;
      case 'monthly':
        return `Cobrança mensal (dia ${dayOfMonth || 1})`;
      case 'custom':
        return `Cobrança a cada ${recurrenceDays || 30} dias`;
      default:
        return 'Cobrança recorrente';
    }
  }

  replaceTemplateVariables(template, invoice, client, subscription = null) {
    let message = template;

    const daysOverdue = this.calculateDaysOverdue(invoice.dueDate);
    const daysUntil = this.calculateDaysUntil(invoice.dueDate);

    const replacements = {
      '{{client.name}}': client.name,
      '{{client.phone}}': client.phone,
      '{{client.email}}': client.email,
      '{{invoice.amount}}': formatCurrency(invoice.amount),
      '{{invoice.dueDate}}': formatDate(invoice.dueDate),
      '{{invoice.generationDate}}': formatDate(invoice.generationDate || new Date()),
      '{{invoice.paidDate}}': formatDate(invoice.paidDate || new Date()),
      '{{invoice.id}}': `#${invoice.id?.substring(0, 8)}`,
      '{{company.name}}': this.companyInfo.name,
      '{{company.phone}}': this.companyInfo.phone,
      '{{company.pix}}': this.companyInfo.pixKey,
      '{{days.overdue}}': `${daysOverdue} dias`,
      '{{days.until}}': daysUntil
    };

    if (subscription) {
      replacements['{{subscription.name}}'] = subscription.name;
    }

    Object.entries(replacements).forEach(([key, value]) => {
      message = message.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return message;
  }

  updateCompanyInfo(newInfo) {
    this.companyInfo = { ...this.companyInfo, ...newInfo };
    console.log('✅ Informações da empresa atualizadas:', this.companyInfo);

    try {
      localStorage.setItem('whatsapp_company_info', JSON.stringify(this.companyInfo));
    } catch (error) {
      console.error('Erro ao salvar informações da empresa:', error);
    }
  }

  loadCompanyInfo() {
    try {
      const saved = localStorage.getItem('whatsapp_company_info');
      if (saved) {
        this.companyInfo = { ...this.companyInfo, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Erro ao carregar informações da empresa:', error);
    }
  }

  setCustomTemplate(type, template) {
    this.customTemplates[type] = template;
    try {
      localStorage.setItem(`whatsapp_template_${type}`, template);
    } catch (error) {
      console.error('Erro ao salvar template:', error);
    }
  }

  loadCustomTemplates() {
    const templateTypes = ['overdue', 'reminder', 'new_invoice', 'payment_confirmed'];

    templateTypes.forEach(type => {
      try {
        const saved = localStorage.getItem(`whatsapp_template_${type}`);
        if (saved) {
          this.customTemplates[type] = saved;
        }
      } catch (error) {
        console.error(`Erro ao carregar template ${type}:`, error);
      }
    });
  }

  validateClientWhatsApp(client) {
    if (!client.phone) {
      return { valid: false, error: 'Cliente não possui telefone cadastrado' };
    }

    const phoneNumbers = client.phone.replace(/\D/g, '');
    if (phoneNumbers.length < 10) {
      return { valid: false, error: 'Telefone inválido' };
    }

    return { valid: true };
  }
}

// Instância singleton
const whatsappService = new WhatsAppService();

// Carregar informações salvas ao inicializar
whatsappService.loadCompanyInfo();
whatsappService.loadCustomTemplates();

module.exports = { whatsappService };