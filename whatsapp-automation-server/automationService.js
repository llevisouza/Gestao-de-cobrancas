// automationService.js - SUA LÓGICA ADAPTADA PARA BACKEND
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config();

// Inicializar Firebase Admin
let db;
try {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };

  const app = initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });

  db = getFirestore(app);
  console.log('✅ Firebase Admin inicializado');
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase Admin:', error);
}

// Utilitários de data
const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDaysDifference = (dateString1, dateString2 = null) => {
  try {
    const today = dateString2 || getCurrentDate();
    
    const date1Str = dateString1.includes('T') ? dateString1.split('T')[0] : dateString1;
    const date2Str = today.includes('T') ? today.split('T')[0] : today;
    
    if (date1Str === date2Str) {
      return 0;
    }
    
    const [year1, month1, day1] = date1Str.split('-').map(Number);
    const [year2, month2, day2] = date2Str.split('-').map(Number);
    
    const date1 = new Date(Date.UTC(year1, month1 - 1, day1));
    const date2 = new Date(Date.UTC(year2, month2 - 1, day2));
    
    const diffTime = date1.getTime() - date2.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('❌ Erro ao calcular diferença de dias:', error);
    return 0;
  }
};

class WhatsAppAutomationService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.config = {
      enabled: false,
      checkInterval: 60000, // 1 minuto
      businessHours: {
        start: 8, // 8h
        end: 18, // 18h
        workDays: [1, 2, 3, 4, 5] // Segunda a Sexta
      },
      reminderDays: 3, // Lembrete 3 dias antes
      overdueScalation: [1, 3, 7, 15, 30], // Escalonamento em dias
      maxMessagesPerDay: 1, // Máximo 1 mensagem por cliente por dia
      delayBetweenMessages: 5000 // 5 segundos entre mensagens
    };
    
    this.stats = {
      messagesSent: 0,
      errors: 0,
      lastRun: null,
      startTime: null
    };
    
    // Configuração WhatsApp da Evolution API
    this.whatsappConfig = {
      baseURL: process.env.WHATSAPP_API_URL || 'https://gestaodecobrancas.ddns.net',
      apiKey: process.env.WHATSAPP_API_KEY || '429683C4C977415CAAFCCE10F7D57E11',
      instanceName: process.env.WHATSAPP_INSTANCE || 'main'
    };

    console.log('🤖 WhatsApp Automation Service inicializado');
    console.log(`    WhatsApp API: ${this.whatsappConfig.baseURL}`);
    console.log(`    Instance: ${this.whatsappConfig.instanceName}`);
  }

  // =============================================
  // CONTROLES PRINCIPAIS
  // =============================================

  async startAutomation() {
    if (this.isRunning) {
      console.warn('⚠️ Automação já está rodando');
      return { success: false, error: 'Automação já está ativa' };
    }

    try {
      console.log('🤖 Iniciando automação WhatsApp...');
      
      // Verificar se WhatsApp está conectado
      const connectionStatus = await this.checkWhatsAppConnection();
      if (!connectionStatus.connected) {
        throw new Error('WhatsApp não está conectado');
      }

      this.isRunning = true;
      this.stats.startTime = new Date();
      this.config.enabled = true;

      // Executar primeira verificação
      await this.runAutomationCycle();

      // Configurar intervalo
      this.intervalId = setInterval(async () => {
        if (this.isRunning && this.config.enabled) {
          await this.runAutomationCycle();
        }
      }, this.config.checkInterval);

      console.log('✅ Automação WhatsApp iniciada com sucesso');
      
      // Salvar log
      await this.saveAutomationLog('automation_started', {
        config: this.config,
        startTime: this.stats.startTime
      });

      return { 
        success: true, 
        message: 'Automação iniciada com sucesso',
        config: this.config
      };
    } catch (error) {
      console.error('❌ Erro ao iniciar automação:', error);
      this.isRunning = false;
      this.config.enabled = false;
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async stopAutomation() {
    if (!this.isRunning) {
      console.warn('⚠️ Automação não está rodando');
      return { success: false, error: 'Automação não está ativa' };
    }

    try {
      console.log('🛑 Parando automação WhatsApp...');
      
      this.isRunning = false;
      this.config.enabled = false;
      
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }

      console.log('✅ Automação WhatsApp parada');
      
      // Salvar log
      await this.saveAutomationLog('automation_stopped', {
        stats: this.stats,
        duration: new Date() - this.stats.startTime
      });

      return { 
        success: true, 
        message: 'Automação parada com sucesso' 
      };
    } catch (error) {
      console.error('❌ Erro ao parar automação:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async runManualCycle() {
    console.log('🔄 Executando ciclo manual de automação...');
    
    try {
      const result = await this.runAutomationCycle();
      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error('❌ Erro no ciclo manual:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =============================================
  // CICLO DE AUTOMAÇÃO
  // =============================================

  async runAutomationCycle() {
    try {
      console.log('🔄 Executando ciclo de automação...');
      this.stats.lastRun = new Date();

      // Verificar horário comercial
      if (!this.isBusinessHours()) {
        console.log('⏰ Fora do horário comercial, pulando ciclo');
        return {
          skipped: true,
          reason: 'Fora do horário comercial',
          nextCheck: this.getNextBusinessHour()
        };
      }

      // Verificar conexão WhatsApp
      const connectionStatus = await this.checkWhatsAppConnection();
      if (!connectionStatus.connected) {
        throw new Error('WhatsApp desconectado');
      }

      // Buscar dados necessários
      const [clients, invoices, subscriptions] = await Promise.all([
        this.getClients(),
        this.getInvoices(),
        this.getSubscriptions()
      ]);

      // Calcular notificações pendentes
      const pendingNotifications = await this.calculatePendingNotifications(
        invoices, 
        clients, 
        subscriptions
      );

      // Filtrar notificações que não foram enviadas hoje
      const filteredNotifications = await this.filterTodaysMessages(pendingNotifications);

      console.log(`📊 Notificações encontradas: ${filteredNotifications.length}`);

      let sent = 0;
      let errors = 0;

      // Processar notificações
      for (const notification of filteredNotifications) {
        try {
          const result = await this.processNotification(notification);
          if (result.success) {
            sent++;
            this.stats.messagesSent++;
          } else {
            errors++;
            this.stats.errors++;
          }

          // Delay entre mensagens
          if (filteredNotifications.indexOf(notification) < filteredNotifications.length - 1) {
            await this.delay(this.config.delayBetweenMessages);
          }
        } catch (error) {
          console.error('❌ Erro ao processar notificação:', error);
          errors++;
          this.stats.errors++;
        }
      }

      const cycleResult = {
        processed: filteredNotifications.length,
        sent,
        errors,
        timestamp: new Date(),
        businessHours: true
      };

      // Salvar log do ciclo
      await this.saveAutomationLog('cycle_completed', cycleResult);

      console.log(`✅ Ciclo concluído: ${sent} enviados, ${errors} erros`);

      return cycleResult;
    } catch (error) {
      console.error('❌ Erro no ciclo de automação:', error);
      this.stats.errors++;
      
      await this.saveAutomationLog('cycle_error', {
        error: error.message,
        timestamp: new Date()
      });

      throw error;
    }
  }

  // =============================================
  // PROCESSAMENTO DE NOTIFICAÇÕES
  // =============================================

  async calculatePendingNotifications(invoices, clients, subscriptions) {
    const today = new Date();
    const notifications = [];

    for (const invoice of invoices) {
      if (!['pending', 'overdue'].includes(invoice.status)) continue;

      const client = clients.find(c => c.id === invoice.clientId);
      if (!client || !client.phone) continue;

      const subscription = subscriptions.find(s => s.id === invoice.subscriptionId);
      const daysDiff = getDaysDifference(invoice.dueDate);

      // Lembretes (antes do vencimento)
      if (daysDiff >= 0 && daysDiff <= this.config.reminderDays) {
        notifications.push({
          type: 'reminder',
          priority: 2,
          invoice,
          client,
          subscription,
          daysDiff
        });
      }

      // Cobranças vencidas (escalonamento)
      if (daysDiff < 0) {
        const daysOverdue = Math.abs(daysDiff);
        
        if (this.config.overdueScalation.includes(daysOverdue)) {
          notifications.push({
            type: 'overdue',
            priority: 1, // Maior prioridade
            invoice,
            client,
            subscription,
            daysOverdue
          });
        }
      }

      // Novas faturas (geradas hoje)
      if (invoice.generationDate === getCurrentDate() && invoice.status === 'pending') {
        notifications.push({
          type: 'new_invoice',
          priority: 3,
          invoice,
          client,
          subscription,
          daysDiff: 0
        });
      }
    }

    // Ordenar por prioridade
    return notifications.sort((a, b) => a.priority - b.priority);
  }

  async filterTodaysMessages(notifications) {
    const filtered = [];

    for (const notification of notifications) {
      const alreadySent = await this.wasMessageSentToday(
        notification.client.id,
        notification.type
      );

      if (!alreadySent) {
        filtered.push(notification);
      } else {
        console.log(`⏭️ Mensagem já enviada hoje: ${notification.type} para ${notification.client.name}`);
      }
    }

    return filtered;
  }

  async processNotification(notification) {
    const { type, invoice, client, subscription } = notification;
    
    console.log(`📤 Processando: ${type} para ${client.name}`);

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
        default:
          throw new Error(`Tipo de notificação inválido: ${type}`);
      }

      // Log da notificação processada
      await this.saveNotificationLog(notification, result);

      return result;
    } catch (error) {
      console.error(`❌ Erro ao processar ${type} para ${client.name}:`, error);
      
      await this.saveNotificationLog(notification, {
        success: false,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  // =============================================
  // WHATSAPP SERVICE METHODS
  // =============================================

  async checkWhatsAppConnection() {
    try {
      const response = await axios.get(
        `${this.whatsappConfig.baseURL}/instance/connectionState/${this.whatsappConfig.instanceName}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.whatsappConfig.apiKey
          }
        }
      );

      return {
        connected: response.data.instance?.state === 'open',
        state: response.data.instance?.state || 'disconnected',
        instanceName: this.whatsappConfig.instanceName,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao verificar conexão WhatsApp:', error);
      return {
        connected: false,
        state: 'error',
        error: error.message,
        instanceName: this.whatsappConfig.instanceName
      };
    }
  }

  async sendWhatsAppMessage(phone, message) {
    try {
      const cleanPhone = this.formatPhoneNumber(phone);
      
      const messageData = {
        number: cleanPhone,
        textMessage: {
          text: message
        }
      };

      const response = await axios.post(
        `${this.whatsappConfig.baseURL}/message/sendText/${this.whatsappConfig.instanceName}`,
        messageData,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.whatsappConfig.apiKey
          }
        }
      );

      console.log(`✅ Mensagem WhatsApp enviada para ${phone}`);

      return {
        success: true,
        messageId: response.data.key?.id || response.data.messageId,
        response: response.data
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem WhatsApp:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendOverdueNotification(invoice, client, subscription = null) {
    const daysOverdue = Math.abs(getDaysDifference(invoice.dueDate));
    
    const message = `🚨 *FATURA VENCIDA* 🚨

Olá *${client.name}*! 👋

Sua fatura está *${daysOverdue} dias em atraso* e precisa ser regularizada.

💰 *RESUMO DA COBRANÇA*
💵 Valor: *R$ ${parseFloat(invoice.amount).toFixed(2).replace('.', ',')}*
📅 Vencimento: ${this.formatDate(invoice.dueDate)}
⚠️ Dias em atraso: *${daysOverdue} dias*
🆔 Código: #${invoice.id?.substring(0, 8)}

${subscription ? `🔄 *PLANO: ${subscription.name}*\n` : ''}
💳 *PAGUE AGORA VIA PIX*
🔑 Chave PIX: *${process.env.COMPANY_PIX_KEY || '11999999999'}*

📞 ${process.env.COMPANY_NAME || 'Conexão Delivery'} - ${process.env.COMPANY_PHONE || '(11) 99999-9999'}`;

    return await this.sendWhatsAppMessage(client.phone, message);
  }

  async sendReminderNotification(invoice, client, subscription = null) {
    const daysUntil = getDaysDifference(invoice.dueDate);
    const daysText = daysUntil === 0 ? 'hoje' : 
                     daysUntil === 1 ? '1 dia' : 
                     `${daysUntil} dias`;
    
    const message = `🔔 *LEMBRETE DE PAGAMENTO* 🔔

Oi *${client.name}*! 😊

Sua fatura vence em *${daysText}*. Que tal já garantir o pagamento?

💰 *DETALHES DO PAGAMENTO*
💵 Valor: *R$ ${parseFloat(invoice.amount).toFixed(2).replace('.', ',')}*
📅 Vencimento: ${this.formatDate(invoice.dueDate)}
⏰ Faltam: *${daysText}*
🆔 Código: #${invoice.id?.substring(0, 8)}

${subscription ? `🔄 *PLANO: ${subscription.name}*\n` : ''}
💳 *PIX PARA PAGAMENTO*
🔑 Chave PIX: *${process.env.COMPANY_PIX_KEY || '11999999999'}*

📞 ${process.env.COMPANY_NAME || 'Conexão Delivery'} - ${process.env.COMPANY_PHONE || '(11) 99999-9999'}`;

    return await this.sendWhatsAppMessage(client.phone, message);
  }

  async sendNewInvoiceNotification(invoice, client, subscription = null) {
    const message = `📄 *NOVA FATURA DISPONÍVEL* 📄

Olá *${client.name}*! 👋

Uma nova fatura foi gerada para você!

💰 *INFORMAÇÕES DA FATURA*
💵 Valor: *R$ ${parseFloat(invoice.amount).toFixed(2).replace('.', ',')}*
📅 Vencimento: ${this.formatDate(invoice.dueDate)}
📋 Gerada em: ${this.formatDate(invoice.generationDate || getCurrentDate())}
🆔 Código: #${invoice.id?.substring(0, 8)}

${subscription ? `🔄 *SEU PLANO: ${subscription.name}*\nAtivo e em funcionamento ✅\n` : ''}
💳 *PAGAMENTO VIA PIX*
🔑 Chave PIX: *${process.env.COMPANY_PIX_KEY || '11999999999'}*

📞 ${process.env.COMPANY_NAME || 'Conexão Delivery'} - ${process.env.COMPANY_PHONE || '(11) 99999-9999'}`;

    return await this.sendWhatsAppMessage(client.phone, message);
  }

  // =============================================
  // FUNÇÕES AUXILIARES
  // =============================================

  isBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, etc.

    // Verificar se é dia útil
    if (!this.config.businessHours.workDays.includes(dayOfWeek)) {
      return false;
    }

    // Verificar se está no horário comercial
    return hour >= this.config.businessHours.start && hour < this.config.businessHours.end;
  }

  getNextBusinessHour() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(this.config.businessHours.start, 0, 0, 0);
    
    return tomorrow;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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

  formatDate(dateInput) {
    if (!dateInput) return '';
    
    try {
      let date;
      
      if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateInput.split('-').map(Number);
        date = new Date(Date.UTC(year, month - 1, day));
      } else {
        date = new Date(dateInput);
      }
      
      if (isNaN(date.getTime())) {
        return dateInput.toString();
      }
      
      return date.toLocaleDateString('pt-BR', {
        timeZone: 'UTC',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error, dateInput);
      return dateInput.toString();
    }
  }

  // =============================================
  // ACESSO AOS DADOS (FIREBASE FIRESTORE)
  // =============================================

  async getClients() {
    try {
      const snapshot = await db.collection('clients').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      return [];
    }
  }

  async getInvoices() {
    try {
      const snapshot = await db.collection('invoices').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar faturas:', error);
      return [];
    }
  }

  async getSubscriptions() {
    try {
      const snapshot = await db.collection('subscriptions').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar assinaturas:', error);
      return [];
    }
  }

  // =============================================
  // CONFIGURAÇÕES
  // =============================================

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuração da automação atualizada:', this.config);
    
    // Se estava rodando, reiniciar com nova configuração
    if (this.isRunning) {
      this.stopAutomation().then(() => {
        this.startAutomation();
      });
    }
  }

  getConfig() {
    return { ...this.config };
  }

  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      uptime: this.stats.startTime ? new Date() - this.stats.startTime : 0,
      config: this.config
    };
  }

  // =============================================
  // LOGS E HISTÓRICO
  // =============================================

  async saveAutomationLog(action, data = {}) {
    try {
      await db.collection('automation_logs').add({
        action,
        data,
        timestamp: new Date(),
        service: 'whatsapp_automation'
      });
    } catch (error) {
      console.error('❌ Erro ao salvar log da automação:', error);
    }
  }

  async saveNotificationLog(notification, result) {
    try {
      await db.collection('notification_logs').add({
        type: notification.type,
        clientId: notification.client.id,
        clientName: notification.client.name,
        invoiceId: notification.invoice.id,
        invoiceAmount: notification.invoice.amount,
        subscriptionId: notification.subscription?.id || null,
        result,
        automated: true,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Erro ao salvar log de notificação:', error);
    }
  }

  async getAutomationLogs(limitCount = 50) {
    try {
      const snapshot = await db.collection('automation_logs')
        .where('service', '==', 'whatsapp_automation')
        .orderBy('timestamp', 'desc')
        .limit(limitCount)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar logs:', error);
      return [];
    }
  }

  async wasMessageSentToday(clientId, type) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const snapshot = await db.collection('notification_logs')
        .where('clientId', '==', clientId)
        .where('type', '==', type)
        .where('timestamp', '>=', today)
        .get();
      
      return !snapshot.empty;
    } catch (error) {
      console.error('❌ Erro ao verificar mensagem do dia:', error);
      return false;
    }
  }

  // =============================================
  // TESTES E DIAGNÓSTICOS
  // =============================================

  async testAutomation() {
    console.log('🧪 Testando automação (modo dry-run)...');
    
    try {
      // Buscar dados
      const [clients, invoices, subscriptions] = await Promise.all([
        this.getClients(),
        this.getInvoices(),
        this.getSubscriptions()
      ]);

      // Calcular notificações
      const pendingNotifications = await this.calculatePendingNotifications(
        invoices,
        clients,
        subscriptions
      );

      // Filtrar mensagens de hoje
      const filteredNotifications = await this.filterTodaysMessages(pendingNotifications);

      const testResult = {
        totalInvoices: invoices.length,
        totalClients: clients.length,
        totalSubscriptions: subscriptions.length,
        pendingNotifications: pendingNotifications.length,
        filteredNotifications: filteredNotifications.length,
        businessHours: this.isBusinessHours(),
        whatsappConnected: (await this.checkWhatsAppConnection()).connected,
        notifications: filteredNotifications.map(n => ({
          type: n.type,
          client: n.client.name,
          amount: n.invoice.amount,
          dueDate: n.invoice.dueDate,
          priority: n.priority
        })),
        config: this.config
      };

      console.log('✅ Teste da automação concluído:', testResult);
      return testResult;
    } catch (error) {
      console.error('❌ Erro no teste da automação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkHealth() {
    const health = {
      automation: {
        running: this.isRunning,
        enabled: this.config.enabled,
        lastRun: this.stats.lastRun,
        errors: this.stats.errors
      },
      whatsapp: await this.checkWhatsAppConnection(),
      businessHours: this.isBusinessHours(),
      database: true, // Assume que está ok se chegou até aqui
      timestamp: new Date()
    };

    try {
      // Testar acesso ao banco
      await db.collection('clients').limit(1).get();
    } catch (error) {
      health.database = false;
      health.databaseError = error.message;
    }

    return health;
  }

  async getPerformanceReport(days = 7) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const snapshot = await db.collection('notification_logs')
        .where('automated', '==', true)
        .where('timestamp', '>=', since)
        .get();

      const logs = snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));

      const report = {
        period: `${days} dias`,
        totalNotifications: logs.length,
        successful: logs.filter(log => log.result?.success).length,
        failed: logs.filter(log => !log.result?.success).length,
        byType: {
          overdue: logs.filter(log => log.type === 'overdue').length,
          reminder: logs.filter(log => log.type === 'reminder').length,
          new_invoice: logs.filter(log => log.type === 'new_invoice').length
        },
        byDay: this.groupLogsByDay(logs),
        errors: logs.filter(log => !log.result?.success).map(log => ({
          client: log.clientName,
          type: log.type,
          error: log.result?.error,
          timestamp: log.timestamp
        })),
        stats: this.getStats()
      };

      return report;
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      return {
        error: error.message,
        period: `${days} dias`
      };
    }
  }

  groupLogsByDay(logs) {
    const grouped = {};
    
    logs.forEach(log => {
      const day = log.timestamp?.toISOString().split('T')[0];
      if (!grouped[day]) {
        grouped[day] = { total: 0, successful: 0, failed: 0 };
      }
      
      grouped[day].total++;
      if (log.result?.success) {
        grouped[day].successful++;
      } else {
        grouped[day].failed++;
      }
    });

    return grouped;
  }

  // =============================================
  // CONTROLES DE EMERGÊNCIA
  // =============================================

  pause() {
    this.config.enabled = false;
    console.log('⏸️ Automação pausada temporariamente');
  }

  resume() {
    this.config.enabled = true;
    console.log('▶️ Automação retomada');
  }

  async reset() {
    console.log('🔄 Fazendo reset da automação...');
    
    await this.stopAutomation();
    
    this.stats = {
      messagesSent: 0,
      errors: 0,
      lastRun: null,
      startTime: null
    };

    this.config = {
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
    };

    console.log('✅ Reset da automação concluído');
    
    return {
      success: true,
      message: 'Automação resetada com sucesso'
    };
  }
}

module.exports = { WhatsAppAutomationService };