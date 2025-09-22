// src/services/whatsappService.js - IMPLEMENTAÇÃO COMPLETA
import { db } from './firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { formatCurrency, formatDate } from '../utils/formatters';

class WhatsAppService {
  constructor() {
    // Configurações da API
    this.baseURL = process.env.REACT_APP_WHATSAPP_API_URL || 'http://localhost:8080';
    this.apiKey = process.env.REACT_APP_WHATSAPP_API_KEY || '';
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
    
    // Templates customizados
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        connected: data.instance?.state === 'open',
        state: data.instance?.state || 'disconnected',
        instanceName: this.instanceName,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao verificar conexão WhatsApp:', error);
      return {
        connected: false,
        state: 'error',
        error: error.message,
        instanceName: this.instanceName
      };
    }
  }

  // Criar nova instância
  async createInstance() {
    try {
      const response = await fetch(`${this.baseURL}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        body: JSON.stringify({
          instanceName: this.instanceName,
          integration: 'WHATSAPP-BAILEYS',
          token: this.apiKey,
          webhook_wa_business: {
            events: ['messages.upsert', 'connection.update'],
            url: `${window.location.origin}/webhook/whatsapp`,
            webhook_by_events: false
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar instância');
      }

      return {
        success: true,
        instance: data,
        qrCode: data.qrcode?.base64 || null
      };
    } catch (error) {
      console.error('❌ Erro ao criar instância:', error);
      return {
        success: false,
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

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        qrCode: data.base64 || data.qrcode?.base64,
        pairingCode: data.pairingCode || data.code
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
      const connectionCheck = await this.checkConnection();
      
      if (!connectionCheck.connected) {
        return {
          connection: connectionCheck,
          testResult: null
        };
      }

      let testResult = null;
      
      if (testPhone) {
        // Enviar mensagem de teste
        const cleanPhone = this.formatPhoneNumber(testPhone);
        testResult = await this.sendMessage(
          cleanPhone,
          '🧪 *Teste de Conexão*\n\nSua API WhatsApp está funcionando perfeitamente!\n\n✅ Sistema: Conexão Delivery\n📱 Integração: Evolution API'
        );
      }

      return {
        connection: connectionCheck,
        testResult
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
  async sendMessage(phone, message, mediaUrl = null) {
    try {
      const cleanPhone = this.formatPhoneNumber(phone);
      
      const messageData = {
        number: cleanPhone,
        text: message
      };

      // Adicionar mídia se fornecida
      if (mediaUrl) {
        messageData.mediaMessage = {
          mediaUrl: mediaUrl,
          caption: message
        };
        delete messageData.text;
      }

      const response = await fetch(`${this.baseURL}/message/sendText/${this.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        body: JSON.stringify(messageData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao enviar mensagem');
      }

      // Log do envio
      await this.logMessage({
        phone: cleanPhone,
        message,
        type: 'sent',
        response: result,
        timestamp: new Date()
      });

      return {
        success: true,
        messageId: result.key?.id || result.messageId,
        response: result
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      
      // Log do erro
      await this.logMessage({
        phone,
        message,
        type: 'error',
        error: error.message,
        timestamp: new Date()
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar mensagem personalizada
  async sendCustomMessage(phone, message, invoice = null, client = null) {
    try {
      // Substituir variáveis na mensagem personalizada
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
      
      // Substituir informações da empresa
      processedMessage = processedMessage
        .replace(/\{\{company\.name\}\}/g, this.companyInfo.name)
        .replace(/\{\{company\.phone\}\}/g, this.companyInfo.phone)
        .replace(/\{\{company\.pix\}\}/g, this.companyInfo.pixKey);

      const result = await this.sendMessage(phone, processedMessage);
      
      // Salvar histórico se sucesso
      if (result.success && client) {
        await this.saveMessageHistory(client.id, 'custom', processedMessage, invoice);
      }

      return result;
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
    try {
      const template = this.getOverdueInvoiceTemplate(invoice, client, subscription);
      const result = await this.sendMessage(client.phone, template);
      
      if (result.success) {
        await this.saveMessageHistory(client.id, 'overdue', template, invoice);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de fatura vencida:', error);
      return { success: false, error: error.message };
    }
  }

  // Lembrete de vencimento
  async sendReminderNotification(invoice, client, subscription = null) {
    try {
      const template = this.getReminderTemplate(invoice, client, subscription);
      const result = await this.sendMessage(client.phone, template);
      
      if (result.success) {
        await this.saveMessageHistory(client.id, 'reminder', template, invoice);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar lembrete:', error);
      return { success: false, error: error.message };
    }
  }

  // Nova fatura gerada
  async sendNewInvoiceNotification(invoice, client, subscription = null) {
    try {
      const template = this.getNewInvoiceTemplate(invoice, client, subscription);
      const result = await this.sendMessage(client.phone, template);
      
      if (result.success) {
        await this.saveMessageHistory(client.id, 'new_invoice', template, invoice);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de nova fatura:', error);
      return { success: false, error: error.message };
    }
  }

  // Confirmação de pagamento
  async sendPaymentConfirmation(invoice, client, subscription = null) {
    try {
      const template = this.getPaymentConfirmedTemplate(invoice, client, subscription);
      const result = await this.sendMessage(client.phone, template);
      
      if (result.success) {
        await this.saveMessageHistory(client.id, 'payment_confirmation', template, invoice);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar confirmação de pagamento:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // TEMPLATES DE MENSAGENS
  // =============================================

  // Template fatura vencida
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

  // Template lembrete
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

  // Template nova fatura
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

  // Template pagamento confirmado
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
  // FUNÇÕES DE ENVIO EM LOTE
  // =============================================

  // Enviar mensagens em lote
  async sendBulkMessages(notifications, delayMs = 3000) {
    const results = [];
    
    console.log(`🔄 Iniciando envio em lote de ${notifications.length} mensagens...`);
    
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      const { type, invoice, client, subscription } = notification;
      
      console.log(`📤 Enviando ${i + 1}/${notifications.length}: ${type} para ${client.name}`);
      
      try {
        let result;
        
        switch (type) {
          case 'overdue':
            result = await this.sendOverdueNotification(invoice, client, subscription);
            break;
          case 'reminder':
            result = await this.sendReminderNotification(invoice, client, subscription);
            break;
          case 'new_invoice':
            result = await this.sendNewInvoiceNotification(invoice, client, subscription);
            break;
          case 'payment_confirmation':
            result = await this.sendPaymentConfirmation(invoice, client, subscription);
            break;
          default:
            result = { success: false, error: 'Tipo de notificação inválido' };
        }
        
        results.push({
          client: client.name,
          phone: client.phone,
          email: client.email,
          amount: formatCurrency(invoice.amount),
          type,
          hasSubscription: !!subscription,
          ...result
        });
        
      } catch (error) {
        console.error(`❌ Erro ao enviar para ${client.name}:`, error);
        results.push({
          client: client.name,
          phone: client.phone,
          email: client.email,
          amount: formatCurrency(invoice.amount),
          type,
          hasSubscription: !!subscription,
          success: false,
          error: error.message
        });
      }
      
      // Delay entre envios para evitar spam
      if (i < notifications.length - 1) {
        console.log(`⏳ Aguardando ${delayMs}ms antes do próximo envio...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Envio em lote concluído: ${successful} sucessos, ${failed} falhas`);
    
    return results;
  }

  // =============================================
  // FUNÇÕES UTILITÁRIAS
  // =============================================

  // Formatar número de telefone
  formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove todos os caracteres não numéricos
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Se não começar com 55 (Brasil), adiciona
    if (!cleanPhone.startsWith('55')) {
      // Se começar com 0, remove
      if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
      }
      // Adiciona código do Brasil
      cleanPhone = '55' + cleanPhone;
    }
    
    return cleanPhone;
  }

  // Calcular dias em atraso
  calculateDaysOverdue(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  // Calcular dias até vencimento
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

  // Texto da recorrência
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

  // Substituir variáveis do template
  replaceTemplateVariables(template, invoice, client, subscription = null) {
    let message = template;
    
    // Calcular dias
    const daysOverdue = this.calculateDaysOverdue(invoice.dueDate);
    const daysUntil = this.calculateDaysUntil(invoice.dueDate);
    
    // Substituições
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

  // Atualizar informações da empresa
  updateCompanyInfo(newInfo) {
    this.companyInfo = { ...this.companyInfo, ...newInfo };
    console.log('✅ Informações da empresa atualizadas:', this.companyInfo);
  }

  // =============================================
  // HISTÓRICO E LOGS
  // =============================================

  // Salvar histórico de mensagem
  async saveMessageHistory(clientId, type, message, invoice = null) {
    try {
      await addDoc(collection(db, 'whatsapp_messages'), {
        clientId,
        type,
        message,
        invoiceId: invoice?.id || null,
        invoiceAmount: invoice?.amount || null,
        status: 'sent',
        sentAt: new Date(),
        createdAt: new Date()
      });
    } catch (error) {
      console.error('❌ Erro ao salvar histórico:', error);
    }
  }

  // Obter histórico de mensagens
  async getMessageHistory(clientId, limitCount = 10) {
    try {
      const q = query(
        collection(db, 'whatsapp_messages'),
        where('clientId', '==', clientId),
        orderBy('sentAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate()
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      return [];
    }
  }

  // Log de mensagem
  async logMessage(data) {
    try {
      await addDoc(collection(db, 'whatsapp_logs'), {
        ...data,
        timestamp: data.timestamp || new Date(),
        instanceName: this.instanceName
      });
    } catch (error) {
      console.error('❌ Erro ao fazer log:', error);
    }
  }

  // Verificar se mensagem foi enviada hoje
  async wasMessageSentToday(clientId, type) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const q = query(
        collection(db, 'whatsapp_messages'),
        where('clientId', '==', clientId),
        where('type', '==', type),
        where('sentAt', '>=', today)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('❌ Erro ao verificar mensagem do dia:', error);
      return false;
    }
  }

  // Obter estatísticas de mensagens
  async getMessagingStats(days = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      
      const q = query(
        collection(db, 'whatsapp_messages'),
        where('sentAt', '>=', since)
      );
      
      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(doc => doc.data());
      
      const total = messages.length;
      const successful = messages.filter(m => m.status === 'sent').length;
      const failed = total - successful;
      const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
      
      return {
        total,
        successful,
        failed,
        successRate,
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
}

// Instância singleton
const whatsappService = new WhatsAppService();

export { whatsappService };