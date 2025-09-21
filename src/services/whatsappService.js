// src/services/whatsappService.js - VERSÃO AVANÇADA COM DETALHES VISUAIS
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
    
    // Configurações da empresa
    this.companyInfo = {
      name: 'Conexão Delivery',
      phone: '(11) 99999-9999',
      email: 'contato@conexaodelivery.com',
      pixKey: '11999999999', // Chave PIX principal
      website: 'www.conexaodelivery.com',
      supportHours: '8h às 18h, Segunda a Sexta'
    };
  }

  // Formatar número de telefone para WhatsApp
  formatPhoneNumber(phone) {
    if (!phone) return null;
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 11 && cleanPhone.startsWith('11')) {
      return `55${cleanPhone}@c.us`;
    } else if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
      return `${cleanPhone}@c.us`;
    } else if (cleanPhone.length === 10) {
      return `5511${cleanPhone}@c.us`;
    }
    
    return `55${cleanPhone}@c.us`;
  }

  // 📱 TEMPLATE PRINCIPAL - FATURA VENCIDA COM DETALHES VISUAIS
  getOverdueInvoiceTemplate(invoice, client, subscription = null) {
    const daysPastDue = Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
    const pixKey = client.pix || this.companyInfo.pixKey;
    
    // Obter detalhes da recorrência se disponível
    const planDetails = subscription ? this.getPlanDetails(subscription) : null;
    
    return `🚨 *FATURA VENCIDA* 🚨
${Array(30).fill('━').join('')}

Olá *${client.name}*! 👋

Sua fatura está *${daysPastDue} dias em atraso* e precisa ser regularizada com urgência.

${planDetails ? planDetails : ''}

💰 *RESUMO DA COBRANÇA*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💵 Valor: *${formatCurrency(invoice.amount)}*
┃ 📅 Vencimento: ${formatDate(invoice.dueDate)}
┃ ⚠️ Dias em atraso: *${daysPastDue} dias*
┃ 🆔 Código: #${invoice.id?.substring(0, 8)}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

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
• ❓ Dúvidas? Responda aqui

${this.getFooterTemplate()}`;
  }

  // 🔔 TEMPLATE - LEMBRETE DE VENCIMENTO
  getReminderTemplate(invoice, client, subscription = null) {
    const daysUntilDue = Math.floor((new Date(invoice.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    const pixKey = client.pix || this.companyInfo.pixKey;
    
    const planDetails = subscription ? this.getPlanDetails(subscription) : null;
    
    return `🔔 *LEMBRETE DE PAGAMENTO* 🔔
${Array(32).fill('━').join('')}

Oi *${client.name}*! 😊

Sua fatura vence em *${daysUntilDue} ${daysUntilDue === 1 ? 'dia' : 'dias'}*. Que tal já garantir o pagamento?

${planDetails ? planDetails : ''}

💰 *DETALHES DO PAGAMENTO*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💵 Valor: *${formatCurrency(invoice.amount)}*
┃ 📅 Vence em: ${formatDate(invoice.dueDate)}
┃ ⏰ Faltam: *${daysUntilDue} ${daysUntilDue === 1 ? 'dia' : 'dias'}*
┃ 🆔 Código: #${invoice.id?.substring(0, 8)}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

💳 *PIX PARA PAGAMENTO*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔑 Nossa Chave PIX:
┃ \`${pixKey}\`
┃ 
┃ ✅ Pague antecipado
┃ 📷 Envie o comprovante
┃ 🏆 Sem juros nem multas
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

${this.getFooterTemplate()}`;
  }

  // 📄 TEMPLATE - NOVA FATURA GERADA
  getNewInvoiceTemplate(invoice, client, subscription = null) {
    const pixKey = client.pix || this.companyInfo.pixKey;
    const planDetails = subscription ? this.getPlanDetails(subscription) : null;
    
    return `📄 *NOVA FATURA DISPONÍVEL* 📄
${Array(33).fill('━').join('')}

Olá *${client.name}*! 👋

Uma nova fatura foi gerada para você!

${planDetails ? planDetails : ''}

💰 *INFORMAÇÕES DA FATURA*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💵 Valor: *${formatCurrency(invoice.amount)}*
┃ 📅 Vencimento: ${formatDate(invoice.dueDate)}
┃ 📋 Gerada em: ${formatDate(invoice.generationDate)}
┃ 🆔 Código: #${invoice.id?.substring(0, 8)}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

💳 *PAGAMENTO VIA PIX*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔑 Chave PIX:
┃ \`${pixKey}\`
┃ 
┃ 🚀 Pagamento instantâneo
┃ 📱 Confirmação automática
┃ 🎯 Sem taxas extras
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

${this.getFooterTemplate()}`;
  }

  // ✅ TEMPLATE - PAGAMENTO CONFIRMADO
  getPaymentConfirmedTemplate(invoice, client, subscription = null) {
    const planDetails = subscription ? this.getPlanDetails(subscription) : null;
    
    return `✅ *PAGAMENTO CONFIRMADO* ✅
${Array(30).fill('━').join('')}

*${client.name}*, seu pagamento foi confirmado! 🎉

${planDetails ? planDetails : ''}

💰 *COMPROVANTE DE PAGAMENTO*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ✅ Status: *PAGO*
┃ 💵 Valor: ${formatCurrency(invoice.amount)}
┃ 📅 Pago em: ${formatDate(invoice.paidDate || new Date())}
┃ 🆔 Código: #${invoice.id?.substring(0, 8)}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

🎯 *PRÓXIMOS PASSOS:*
• ✅ Pagamento processado
• 📱 Comprovante salvo
• 🔄 Próxima fatura em breve
• 🏆 Obrigado pela preferência!

${this.getFooterTemplate()}`;
  }

  // 🎯 DETALHES VISUAIS DO PLANO/ASSINATURA
  getPlanDetails(subscription) {
    const recurrenceInfo = this.getRecurrenceDescription(subscription);
    
    return `🎯 *DETALHES DO SEU PLANO*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 📋 Plano: *${subscription.name}*
┃ ${recurrenceInfo.icon} Tipo: ${recurrenceInfo.description}
┃ 💰 Valor: ${formatCurrency(subscription.amount)}
┃ 📅 Desde: ${formatDate(subscription.startDate)}
┃ ⚡ Status: ${subscription.status === 'active' ? '🟢 Ativo' : '🔴 Inativo'}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

`;
  }

  // 🔄 DESCRIÇÕES DE RECORRÊNCIA DETALHADAS
  getRecurrenceDescription(subscription) {
    switch (subscription.recurrenceType) {
      case 'daily':
        return {
          icon: '🔄',
          description: '*Cobrança Diária*',
          detail: 'Renovação automática todo dia'
        };
      
      case 'weekly':
        const weekDays = {
          'sunday': 'Domingo', 'monday': 'Segunda-feira', 'tuesday': 'Terça-feira',
          'wednesday': 'Quarta-feira', 'thursday': 'Quinta-feira', 'friday': 'Sexta-feira', 'saturday': 'Sábado'
        };
        const dayName = weekDays[subscription.dayOfWeek] || 'Segunda-feira';
        return {
          icon: '📅',
          description: '*Cobrança Semanal*',
          detail: `Renovação toda ${dayName}`
        };
      
      case 'monthly':
        return {
          icon: '📆',
          description: '*Cobrança Mensal*',
          detail: `Renovação dia ${subscription.dayOfMonth} de cada mês`
        };
      
      case 'custom':
        const days = subscription.recurrenceDays || 30;
        return {
          icon: '⏱️',
          description: '*Cobrança Personalizada*',
          detail: `Renovação a cada ${days} dias`
        };
      
      default:
        return {
          icon: '📋',
          description: '*Cobrança Única*',
          detail: 'Pagamento único'
        };
    }
  }

  // 📱 RODAPÉ PADRÃO DAS MENSAGENS
  getFooterTemplate() {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 *${this.companyInfo.name}*
📞 ${this.companyInfo.phone}
🌐 ${this.companyInfo.website}
⏰ Atendimento: ${this.companyInfo.supportHours}

📱 *Salve este número!*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  // 🚀 ENVIAR NOTIFICAÇÃO DE FATURA VENCIDA
  async sendOverdueNotification(invoice, client, subscription = null) {
    if (!client.phone) {
      return { success: false, error: 'Cliente não possui telefone cadastrado' };
    }

    const message = this.getOverdueInvoiceTemplate(invoice, client, subscription);
    const result = await this.sendTextMessage(client.phone, message);
    
    // Salvar log detalhado
    await this.saveMessageLog({
      type: 'overdue',
      recipient: client.phone,
      clientId: client.id,
      invoiceId: invoice.id,
      subscriptionId: subscription?.id,
      message: message,
      status: result.success ? 'sent' : 'failed',
      error: result.error,
      messageId: result.messageId,
      sentAt: new Date(),
      metadata: {
        daysPastDue: Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24)),
        amount: invoice.amount,
        hasSubscription: !!subscription
      }
    });

    return result;
  }

  // 🔔 ENVIAR LEMBRETE DE VENCIMENTO
  async sendReminderNotification(invoice, client, subscription = null) {
    if (!client.phone) {
      return { success: false, error: 'Cliente não possui telefone cadastrado' };
    }

    const message = this.getReminderTemplate(invoice, client, subscription);
    const result = await this.sendTextMessage(client.phone, message);
    
    await this.saveMessageLog({
      type: 'reminder',
      recipient: client.phone,
      clientId: client.id,
      invoiceId: invoice.id,
      subscriptionId: subscription?.id,
      message: message,
      status: result.success ? 'sent' : 'failed',
      error: result.error,
      messageId: result.messageId,
      sentAt: new Date(),
      metadata: {
        daysUntilDue: Math.floor((new Date(invoice.dueDate) - new Date()) / (1000 * 60 * 60 * 24)),
        amount: invoice.amount,
        hasSubscription: !!subscription
      }
    });

    return result;
  }

  // 📄 ENVIAR NOTIFICAÇÃO DE NOVA FATURA
  async sendNewInvoiceNotification(invoice, client, subscription = null) {
    if (!client.phone) {
      return { success: false, error: 'Cliente não possui telefone cadastrado' };
    }

    const message = this.getNewInvoiceTemplate(invoice, client, subscription);
    const result = await this.sendTextMessage(client.phone, message);
    
    await this.saveMessageLog({
      type: 'new_invoice',
      recipient: client.phone,
      clientId: client.id,
      invoiceId: invoice.id,
      subscriptionId: subscription?.id,
      message: message,
      status: result.success ? 'sent' : 'failed',
      error: result.error,
      messageId: result.messageId,
      sentAt: new Date(),
      metadata: {
        amount: invoice.amount,
        hasSubscription: !!subscription
      }
    });

    return result;
  }

  // ✅ ENVIAR CONFIRMAÇÃO DE PAGAMENTO
  async sendPaymentConfirmation(invoice, client, subscription = null) {
    if (!client.phone) {
      return { success: false, error: 'Cliente não possui telefone cadastrado' };
    }

    const message = this.getPaymentConfirmedTemplate(invoice, client, subscription);
    const result = await this.sendTextMessage(client.phone, message);
    
    await this.saveMessageLog({
      type: 'payment_confirmation',
      recipient: client.phone,
      clientId: client.id,
      invoiceId: invoice.id,
      subscriptionId: subscription?.id,
      message: message,
      status: result.success ? 'sent' : 'failed',
      error: result.error,
      messageId: result.messageId,
      sentAt: new Date(),
      metadata: {
        amount: invoice.amount,
        hasSubscription: !!subscription
      }
    });

    return result;
  }

  // 📱 ENVIAR MENSAGEM VIA EVOLUTION API
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

  // 🔧 VERIFICAR CONEXÃO
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
      return { success: false, state: 'error', error: error.message };
    }
  }

  // 📊 SALVAR LOG DE MENSAGEM
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

  // 📈 OBTER HISTÓRICO DE MENSAGENS
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

  // 🚫 VERIFICAR SE MENSAGEM JÁ FOI ENVIADA HOJE
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

  // 🚀 ENVIO EM LOTE COM CONTROLE
  async sendBulkMessages(notifications, delayMs = 5000) {
    const results = [];
    const connection = await this.checkConnection();
    
    if (!connection.connected) {
      throw new Error(`WhatsApp não conectado. Status: ${connection.state}`);
    }

    console.log(`📱 Iniciando envio em lote de ${notifications.length} mensagens...`);

    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      
      try {
        console.log(`📤 Enviando WhatsApp ${i + 1}/${notifications.length} para: ${notification.client.name}`);
        
        let result;
        const { invoice, client, type } = notification;
        
        // Buscar assinatura se disponível
        let subscription = null;
        if (invoice.subscriptionId) {
          // Você pode implementar uma busca da assinatura aqui se necessário
          subscription = notification.subscription || null;
        }

        switch (type) {
          case 'overdue':
            result = await this.sendOverdueNotification(invoice, client, subscription);
            break;
          case 'reminder':
            result = await this.sendReminderNotification(invoice, client, subscription);
            break;
          case 'payment_confirmation':
            result = await this.sendPaymentConfirmation(invoice, client, subscription);
            break;
          case 'new_invoice':
            result = await this.sendNewInvoiceNotification(invoice, client, subscription);
            break;
          default:
            result = { success: false, error: 'Tipo de notificação inválido' };
        }
        
        results.push({
          client: client.name,
          phone: client.phone,
          type: type,
          hasSubscription: !!subscription,
          amount: formatCurrency(invoice.amount),
          ...result
        });

        // Delay entre envios para não sobrecarregar a API
        if (i < notifications.length - 1) {
          console.log(`⏱️ Aguardando ${delayMs / 1000}s para próxima mensagem...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
      } catch (error) {
        console.error(`❌ Erro ao enviar WhatsApp para ${notification.client.phone}:`, error);
        results.push({
          client: notification.client.name,
          phone: notification.client.phone,
          type: notification.type,
          success: false,
          error: error.message
        });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`📊 Envio em lote concluído: ${successful} sucessos, ${failed} falhas`);
    
    return results;
  }

  // 🎯 CONFIGURAR INFORMAÇÕES DA EMPRESA
  updateCompanyInfo(newInfo) {
    this.companyInfo = { ...this.companyInfo, ...newInfo };
    console.log('🏢 Informações da empresa atualizadas:', this.companyInfo);
  }

  // 📊 OBTER ESTATÍSTICAS DE ENVIOS
  async getMessagingStats(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, 'whatsappLogs'),
        where('sentAt', '>=', startDate)
      );
      
      const querySnapshot = await getDocs(q);
      const messages = [];
      
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });

      const stats = {
        total: messages.length,
        successful: messages.filter(m => m.status === 'sent').length,
        failed: messages.filter(m => m.status === 'failed').length,
        byType: {
          overdue: messages.filter(m => m.type === 'overdue').length,
          reminder: messages.filter(m => m.type === 'reminder').length,
          new_invoice: messages.filter(m => m.type === 'new_invoice').length,
          payment_confirmation: messages.filter(m => m.type === 'payment_confirmation').length
        },
        successRate: messages.length > 0 ? 
          Math.round((messages.filter(m => m.status === 'sent').length / messages.length) * 100) : 0
      };

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
  }

  // 🎮 TESTAR CONEXÃO E ENVIO
  async testConnection(testPhone = null) {
    console.log('🧪 Testando conexão WhatsApp...');
    
    const connection = await this.checkConnection();
    console.log('📊 Status da conexão:', connection);
    
    if (testPhone && connection.connected) {
      console.log('📱 Enviando mensagem de teste...');
      const testMessage = `🧪 *TESTE DE CONEXÃO*\n\nOlá! Esta é uma mensagem de teste do sistema ${this.companyInfo.name}.\n\n✅ Conexão funcionando perfeitamente!\n\nData/Hora: ${new Date().toLocaleString('pt-BR')}`;
      
      const result = await this.sendTextMessage(testPhone, testMessage);
      console.log('📤 Resultado do teste:', result);
      
      return { connection, testResult: result };
    }
    
    return { connection };
  }
}

// Instância única do serviço
export const whatsappService = new WhatsAppService();

// Funções utilitárias exportadas
export const sendOverdueNotification = (invoice, client, subscription) => 
  whatsappService.sendOverdueNotification(invoice, client, subscription);

export const sendReminderNotification = (invoice, client, subscription) => 
  whatsappService.sendReminderNotification(invoice, client, subscription);

export const sendNewInvoiceNotification = (invoice, client, subscription) => 
  whatsappService.sendNewInvoiceNotification(invoice, client, subscription);

export const sendPaymentConfirmation = (invoice, client, subscription) => 
  whatsappService.sendPaymentConfirmation(invoice, client, subscription);

export const checkWhatsAppConnection = () => 
  whatsappService.checkConnection();

export default whatsappService;