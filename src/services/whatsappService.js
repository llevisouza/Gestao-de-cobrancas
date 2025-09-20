// src/services/whatsappService.js
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { formatCurrency, formatDate } from '../utils/formatters';

class WhatsAppService {
  constructor() {
    // Evolution API Configuration
    this.apiUrl = process.env.REACT_APP_WHATSAPP_API_URL || 'https://api.whatsapp.local';
    this.apiKey = process.env.REACT_APP_WHATSAPP_API_KEY;
    this.instanceName = process.env.REACT_APP_WHATSAPP_INSTANCE || 'conexao_delivery';
    this.businessPhone = process.env.REACT_APP_BUSINESS_PHONE || '5511999999999';
  }

  // Formatar número de telefone para WhatsApp
  formatPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Adiciona código do país se não tiver
    if (cleanPhone.length === 11 && cleanPhone.startsWith('11')) {
      return `55${cleanPhone}@c.us`;
    } else if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
      return `${cleanPhone}@c.us`;
    } else if (cleanPhone.length === 10) {
      return `5511${cleanPhone}@c.us`;
    }
    
    return `55${cleanPhone}@c.us`;
  }

  // Verificar se WhatsApp está conectado
  async checkConnection() {
    try {
      const response = await fetch(`${this.apiUrl}/instance/connectionState/${this.instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao verificar conexão');
      }

      const data = await response.json();
      return {
        connected: data.instance?.state === 'open',
        state: data.instance?.state || 'disconnected'
      };
    } catch (error) {
      console.error('Erro ao verificar conexão WhatsApp:', error);
      return { connected: false, state: 'error', error: error.message };
    }
  }

  // Enviar mensagem de texto
  async sendTextMessage(phone, message) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      if (!formattedPhone) {
        throw new Error('Número de telefone inválido');
      }

      const payload = {
        number: formattedPhone,
        text: message,
        delay: 1200
      };

      const response = await fetch(`${this.apiUrl}/message/sendText/${this.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar mensagem');
      }

      const result = await response.json();
      return { success: true, messageId: result.key?.id, data: result };
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }

  // Templates de mensagem
  getMessageTemplate(type, data) {
    const templates = {
      overdue: (data) => {
        const { client, invoice, daysPastDue } = data;
        return `🚨 *FATURA VENCIDA* 🚨

Olá ${client.name}! 👋

Sua fatura está vencida há *${daysPastDue} dias*.

📋 *Detalhes:*
• Valor: *${formatCurrency(invoice.amount)}*
• Vencimento: ${formatDate(invoice.dueDate)}
• ID: #${invoice.id}

💰 *PIX para Pagamento:*
\`\`\`${client.pix || this.businessPhone}\`\`\`

📞 Dúvidas? Entre em contato conosco!

_Conexão Delivery - Sistema de Cobranças_`;
      },

      reminder: (data) => {
        const { client, invoice, daysUntilDue } = data;
        return `🔔 *LEMBRETE DE VENCIMENTO* 🔔

Olá ${client.name}! 👋

Sua fatura vence em *${daysUntilDue} dias*.

📋 *Detalhes:*
• Valor: *${formatCurrency(invoice.amount)}*
• Vencimento: ${formatDate(invoice.dueDate)}
• ID: #${invoice.id}

💰 *PIX para Pagamento:*
\`\`\`${client.pix || this.businessPhone}\`\`\`

Efetue o pagamento para evitar juros e multas! 💡

_Conexão Delivery - Sistema de Cobranças_`;
      },

      payment_confirmation: (data) => {
        const { client, invoice } = data;
        return `✅ *PAGAMENTO CONFIRMADO* ✅

Olá ${client.name}! 👋

Recebemos seu pagamento! 🎉

📋 *Detalhes:*
• Valor: *${formatCurrency(invoice.amount)}*
• Data: ${formatDate(invoice.paidDate || new Date())}
• ID: #${invoice.id}

Obrigado por manter suas contas em dia! 💙

_Conexão Delivery - Sistema de Cobranças_`;
      },

      new_invoice: (data) => {
        const { client, invoice } = data;
        return `📄 *NOVA FATURA GERADA* 📄

Olá ${client.name}! 👋

Uma nova fatura foi gerada para você.

📋 *Detalhes:*
• Valor: *${formatCurrency(invoice.amount)}*
• Vencimento: ${formatDate(invoice.dueDate)}
• ID: #${invoice.id}

💰 *PIX para Pagamento:*
\`\`\`${client.pix || this.businessPhone}\`\`\`

📱 Salve este número para futuras comunicações!

_Conexão Delivery - Sistema de Cobranças_`;
      },

      welcome: (data) => {
        const { client } = data;
        return `🎉 *BEM-VINDO(A)!* 🎉

Olá ${client.name}! 👋

Você agora faz parte do nosso sistema de cobranças via WhatsApp! 

📱 *Benefícios:*
• Receba lembretes automáticos
• Notificações de vencimento
• Confirmação de pagamentos
• Suporte direto por aqui

💡 *Dica:* Salve este número na sua agenda como "Conexão Delivery - Cobranças"

Seja bem-vindo(a)! 🤝

_Conexão Delivery - Sistema de Cobranças_`;
      }
    };

    return templates[type] ? templates[type](data) : null;
  }

  // Notificação de fatura vencida
  async sendOverdueNotification(invoice, client) {
    if (!client.phone) {
      return { success: false, error: 'Cliente não possui telefone cadastrado' };
    }

    const daysPastDue = Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
    
    const message = this.getMessageTemplate('overdue', {
      client,
      invoice,
      daysPastDue
    });

    const result = await this.sendTextMessage(client.phone, message);
    
    // Salvar log
    await this.saveMessageLog({
      type: 'overdue',
      recipient: client.phone,
      clientId: client.id,
      invoiceId: invoice.id,
      message: message,
      status: result.success ? 'sent' : 'failed',
      error: result.error,
      messageId: result.messageId,
      sentAt: new Date()
    });

    return result;
  }

  // Lembrete de vencimento
  async sendReminderNotification(invoice, client) {
    if (!client.phone) {
      return { success: false, error: 'Cliente não possui telefone cadastrado' };
    }

    const daysUntilDue = Math.floor((new Date(invoice.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    const message = this.getMessageTemplate('reminder', {
      client,
      invoice,
      daysUntilDue
    });

    const result = await this.sendTextMessage(client.phone, message);
    
    await this.saveMessageLog({
      type: 'reminder',
      recipient: client.phone,
      clientId: client.id,
      invoiceId: invoice.id,
      message: message,
      status: result.success ? 'sent' : 'failed',
      error: result.error,
      messageId: result.messageId,
      sentAt: new Date()
    });

    return result;
  }

  // Confirmação de pagamento
  async sendPaymentConfirmation(invoice, client) {
    if (!client.phone) {
      return { success: false, error: 'Cliente não possui telefone cadastrado' };
    }

    const message = this.getMessageTemplate('payment_confirmation', {
      client,
      invoice
    });

    const result = await this.sendTextMessage(client.phone, message);
    
    await this.saveMessageLog({
      type: 'payment_confirmation',
      recipient: client.phone,
      clientId: client.id,
      invoiceId: invoice.id,
      message: message,
      status: result.success ? 'sent' : 'failed',
      error: result.error,
      messageId: result.messageId,
      sentAt: new Date()
    });

    return result;
  }

  // Nova fatura
  async sendNewInvoiceNotification(invoice, client) {
    if (!client.phone) {
      return { success: false, error: 'Cliente não possui telefone cadastrado' };
    }

    const message = this.getMessageTemplate('new_invoice', {
      client,
      invoice
    });

    const result = await this.sendTextMessage(client.phone, message);
    
    await this.saveMessageLog({
      type: 'new_invoice',
      recipient: client.phone,
      clientId: client.id,
      invoiceId: invoice.id,
      message: message,
      status: result.success ? 'sent' : 'failed',
      error: result.error,
      messageId: result.messageId,
      sentAt: new Date()
    });

    return result;
  }

  // Mensagem de boas-vindas
  async sendWelcomeMessage(client) {
    if (!client.phone) {
      return { success: false, error: 'Cliente não possui telefone cadastrado' };
    }

    const message = this.getMessageTemplate('welcome', { client });
    const result = await this.sendTextMessage(client.phone, message);
    
    await this.saveMessageLog({
      type: 'welcome',
      recipient: client.phone,
      clientId: client.id,
      message: message,
      status: result.success ? 'sent' : 'failed',
      error: result.error,
      messageId: result.messageId,
      sentAt: new Date()
    });

    return result;
  }

  // Envio em lote
  async sendBulkMessages(notifications, delayMs = 3000) {
    const results = [];
    const connection = await this.checkConnection();
    
    if (!connection.connected) {
      throw new Error(`WhatsApp não conectado. Status: ${connection.state}`);
    }

    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      
      try {
        console.log(`Enviando WhatsApp ${i + 1}/${notifications.length}:`, notification.client.phone);
        
        let result;
        switch (notification.type) {
          case 'overdue':
            result = await this.sendOverdueNotification(notification.invoice, notification.client);
            break;
          case 'reminder':
            result = await this.sendReminderNotification(notification.invoice, notification.client);
            break;
          case 'payment_confirmation':
            result = await this.sendPaymentConfirmation(notification.invoice, notification.client);
            break;
          case 'new_invoice':
            result = await this.sendNewInvoiceNotification(notification.invoice, notification.client);
            break;
          case 'welcome':
            result = await this.sendWelcomeMessage(notification.client);
            break;
          default:
            result = { success: false, error: 'Tipo de notificação inválido' };
        }
        
        results.push({
          client: notification.client.name,
          phone: notification.client.phone,
          type: notification.type,
          ...result
        });

        // Delay entre envios para não sobrecarregar a API
        if (i < notifications.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
      } catch (error) {
        console.error(`Erro ao enviar WhatsApp para ${notification.client.phone}:`, error);
        results.push({
          client: notification.client.name,
          phone: notification.client.phone,
          type: notification.type,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // Salvar log de mensagem
  async saveMessageLog(messageData) {
    try {
      const docRef = await addDoc(collection(db, 'whatsappLogs'), {
        ...messageData,
        createdAt: new Date()
      });
      console.log('Log de WhatsApp salvo:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao salvar log de WhatsApp:', error);
    }
  }

  // Obter histórico de mensagens
  async getMessageHistory(clientId, limit = 10) {
    try {
      const q = query(
        collection(db, 'whatsappLogs'),
        where('clientId', '==', clientId)
      );
      
      const querySnapshot = await getDocs(q);
      const messages = [];
      
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });

      return messages
        .sort((a, b) => b.sentAt.toDate() - a.sentAt.toDate())
        .slice(0, limit);
    } catch (error) {
      console.error('Erro ao buscar histórico de mensagens:', error);
      return [];
    }
  }

  // Verificar se mensagem foi enviada hoje
  async wasMessageSentToday(clientId, type) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const q = query(
        collection(db, 'whatsappLogs'),
        where('clientId', '==', clientId),
        where('type', '==', type)
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const sentDate = data.sentAt.toDate();
        if (sentDate >= today && data.status === 'sent') {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao verificar mensagem enviada hoje:', error);
      return false;
    }
  }

  // Gerar QR Code para conexão
  async generateQRCode() {
    try {
      const response = await fetch(`${this.apiUrl}/instance/connect/${this.instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar QR Code');
      }

      const data = await response.json();
      return {
        success: true,
        qrcode: data.qrcode?.code,
        base64: data.qrcode?.base64
      };
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      return { success: false, error: error.message };
    }
  }

  // Desconectar instância
  async disconnect() {
    try {
      const response = await fetch(`${this.apiUrl}/instance/logout/${this.instanceName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        }
      });

      return { success: response.ok };
    } catch (error) {
      console.error('Erro ao desconectar WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }
}

export const whatsappService = new WhatsAppService();