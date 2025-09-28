const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente da raiz
dotenv.config({ path: path.join(__dirname, '..', '.env') });


// ✅ CORREÇÃO 1: Melhor inicialização do Firebase
let db;
try {
  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };

  if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error('Missing Firebase credentials in environment variables');
  }

  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
  
  db = getFirestore();
  console.log('✅ [Server] Firebase Admin inicializado com sucesso');
} catch (error) {
  console.error('❌ [Server] Erro ao inicializar Firebase Admin:', error.message);
  console.warn('⚠️ [Server] Continuando sem Firestore (funcionalidade limitada)');
}

// Inicializar Express
const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: ['http://localhost:3000', 'https://gestaodecobrancas.ddns.net'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ CORREÇÃO 2: AutomationService com persistência melhorada
class AutomationService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.config = {
      checkInterval: 300000, // 5 minutos
      maxMessagesPerDay: 50,
      businessHours: { start: 9, end: 18, days: [1,2,3,4,5] },
      reminderDaysBefore: 3,
      overdueSequence: [1,3,7,15,30],
      enabled: true
    };
    this.logs = [];
    this.stats = { 
      messagesSent: 0, 
      errors: 0, 
      lastCycle: null,
      startTime: null,
      uptime: 0
    };
    this.clients = new Map();
    this.subscriptions = new Map();
    this.invoices = new Map();
    
    if (db) {
      this.loadInitialState();
    } else {
      this.log('⚠️ Firestore não disponível, usando estado padrão', 'warn');
    }
  }

  // ✅ CORREÇÃO 3: Carregar estado persistido
  async loadInitialState() {
    try {
      console.log('📡 [AutomationService] Carregando estado inicial do Firestore...');
      const doc = await db.collection('automation').doc('state').get();
      
      if (doc.exists) {
        const data = doc.data();
        
        // ✅ Restaurar estado da automação
        this.isRunning = data.isRunning || false;
        this.config = { ...this.config, ...data.config };
        this.stats = { ...this.stats, ...data.stats };
        
        console.log('✅ [AutomationService] Estado restaurado:', { 
          isRunning: this.isRunning, 
          config: this.config 
        });
        
        // ✅ Se estava rodando, reiniciar automação
        if (this.isRunning) {
          console.log('🔄 [AutomationService] Automação estava ativa, reiniciando...');
          this.stats.startTime = new Date().toISOString();
          await this.startAutomationProcess();
        }
        
      } else {
        console.log('ℹ️ [AutomationService] Nenhum estado salvo encontrado, usando padrão');
        await this.saveState();
      }
    } catch (error) {
      console.error('❌ [AutomationService] Erro ao carregar estado inicial:', error.message);
      this.log('⚠️ Falha ao carregar estado do Firestore', 'error');
    }
  }

  // ✅ CORREÇÃO 4: Salvar estado de forma mais robusta
  async saveState() {
    if (!db) {
      this.log('⚠️ Firestore não disponível, estado não salvo', 'warn');
      return false;
    }
    
    try {
      const stateData = {
        isRunning: this.isRunning,
        config: this.config,
        stats: {
          ...this.stats,
          uptime: this.stats.startTime 
            ? Date.now() - new Date(this.stats.startTime).getTime()
            : 0
        },
        lastUpdated: new Date().toISOString(),
        serverInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          uptime: process.uptime()
        }
      };
      
      console.log('💾 [AutomationService] Salvando estado:', stateData);
      
      await db.collection('automation').doc('state').set(stateData, { merge: true });
      console.log('✅ [AutomationService] Estado salvo com sucesso');
      return true;
      
    } catch (error) {
      console.error('❌ [AutomationService] Erro ao salvar estado:', error.message);
      this.log('⚠️ Falha ao salvar estado no Firestore', 'error');
      return false;
    }
  }

  // ✅ CORREÇÃO 5: Processo de início da automação melhorado
  async startAutomationProcess() {
    try {
      console.log('🚀 [AutomationService] Iniciando processo de automação...');
      
      // Carregar dados necessários
      await this.loadData();
      
      // Configurar interval
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
      
      this.intervalId = setInterval(async () => {
        if (this.isRunning && this.config.enabled) {
          await this.processInvoices();
        }
      }, this.config.checkInterval);
      
      this.log('✅ Processo de automação iniciado');
      return true;
      
    } catch (error) {
      console.error('❌ [AutomationService] Erro ao iniciar processo:', error);
      this.log(`❌ Erro ao iniciar processo: ${error.message}`, 'error');
      return false;
    }
  }

  log(message, level = 'info') {
    const entry = { 
      timestamp: new Date().toISOString(), 
      level, 
      message,
      service: 'automation'
    };
    
    this.logs.unshift(entry);
    if (this.logs.length > 100) this.logs.pop();
    
    console.log(`[${level.toUpperCase()}] ${message}`);
    
    // ✅ Salvar logs críticos no Firestore
    if (level === 'error' && db) {
      try {
        db.collection('automation_logs').add(entry);
      } catch (e) {
        console.warn('Falha ao salvar log crítico:', e.message);
      }
    }
  }

  async loadData() {
    if (!db) {
      this.log('⚠️ Firestore não disponível, dados não carregados', 'warn');
      return;
    }
    try {
      console.log('📡 [AutomationService] Carregando dados do Firestore...');
      
      const [clientsSnap, subsSnap, invoicesSnap] = await Promise.all([
        db.collection('clients').get(),
        db.collection('subscriptions').get(),
        db.collection('invoices').get()
      ]);
      
      // Limpar coleções antigas
      this.clients.clear();
      this.subscriptions.clear();
      this.invoices.clear();
      
      // Carregar novos dados
      clientsSnap.forEach(doc => this.clients.set(doc.id, doc.data()));
      subsSnap.forEach(doc => this.subscriptions.set(doc.id, doc.data()));
      invoicesSnap.forEach(doc => this.invoices.set(doc.id, doc.data()));
      
      this.log(`Dados carregados: ${this.clients.size} clientes, ${this.subscriptions.size} assinaturas, ${this.invoices.size} faturas`);
      
    } catch (error) {
      this.log(`Erro ao carregar dados: ${error.message}`, 'error');
      throw error;
    }
  }

  isBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    return this.config.businessHours.days.includes(day) &&
           hour >= this.config.businessHours.start &&
           hour < this.config.businessHours.end;
  }

  async checkWhatsAppConnection() {
    try {
      console.log('📱 [AutomationService] Verificando conexão WhatsApp...');
      
      const response = await axios.get(
        `${process.env.WHATSAPP_API_URL}/instance/connectionState/${process.env.WHATSAPP_INSTANCE}`,
        { 
          headers: { 
            'Content-Type': 'application/json',
            'apikey': process.env.WHATSAPP_API_KEY 
          }, 
          timeout: 10000 
        }
      );
      
      const connected = response.data?.instance?.state === 'open';
      this.log(`Conexão WhatsApp: ${connected ? 'Conectado' : 'Desconectado'}`);
      return connected;
      
    } catch (error) {
      this.log(`Erro ao verificar WhatsApp: ${error.message}`, 'error');
      return false;
    }
  }

  async sendWhatsAppMessage(phone, message) {
    try {
      console.log(`📤 [AutomationService] Enviando mensagem para ${phone}`);
      
      const response = await axios.post(
        `${process.env.WHATSAPP_API_URL}/message/sendText/${process.env.WHATSAPP_INSTANCE}`,
        { 
          number: phone, 
          textMessage: { text: message } 
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'apikey': process.env.WHATSAPP_API_KEY 
          }, 
          timeout: 10000 
        }
      );
      
      this.stats.messagesSent++;
      this.log(`Mensagem enviada para ${phone}`);
      
      // ✅ Salvar estado após envio
      await this.saveState();
      
      return { success: true, response: response.data };
      
    } catch (error) {
      this.stats.errors++;
      this.log(`Erro ao enviar mensagem: ${error.message}`, 'error');
      
      // ✅ Salvar estado após erro
      await this.saveState();
      
      return { success: false, error: error.message };
    }
  }

  async processInvoices() {
    if (!this.config.enabled) {
      this.log('Automação desabilitada - pulando ciclo');
      return { skipped: true };
    }
    
    if (!this.isBusinessHours()) {
      this.log('Fora do horário comercial - pulando ciclo');
      return { skipped: true };
    }
    
    const whatsappConnected = await this.checkWhatsAppConnection();
    if (!whatsappConnected) {
      this.log('WhatsApp não conectado - pulando ciclo');
      return { skipped: true };
    }

    let processed = 0;
    let sent = 0;

    try {
      // ✅ Recarregar dados antes do processamento
      await this.loadData();

      for (const [id, invoice] of this.invoices) {
        if (processed >= this.config.maxMessagesPerDay) break;

        const dueDate = new Date(invoice.dueDate);
        const daysToDue = Math.floor((dueDate - new Date()) / (1000 * 60 * 60 * 24));

        let message = '';
        if (daysToDue === this.config.reminderDaysBefore) {
          message = `🔔 Lembrete: Sua fatura de R$${invoice.amount} vence em ${this.config.reminderDaysBefore} dias.\n\n💳 PIX: ${process.env.COMPANY_PIX_KEY}`;
        } else if (daysToDue < 0) {
          const overdueDays = -daysToDue;
          if (this.config.overdueSequence.includes(overdueDays)) {
            message = `🚨 Cobrança: Sua fatura de R$${invoice.amount} está vencida há ${overdueDays} dias.\n\n💳 PIX: ${process.env.COMPANY_PIX_KEY}`;
          }
        }

        if (message) {
          const client = this.clients.get(invoice.clientId);
          if (client && client.phone) {
            const result = await this.sendWhatsAppMessage(client.phone, message);
            if (result.success) {
              sent++;
            }
            processed++;
            
            // ✅ Delay entre mensagens
            if (processed < this.config.maxMessagesPerDay) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
      }

      this.stats.lastCycle = new Date().toISOString();
      
      // ✅ Salvar estado após ciclo
      await this.saveState();
      
      this.log(`Ciclo processado: ${processed} faturas, ${sent} mensagens enviadas`);
      return { processed, sent, timestamp: new Date().toISOString() };
      
    } catch (error) {
      this.log(`Erro no processamento: ${error.message}`, 'error');
      this.stats.errors++;
      await this.saveState();
      return { error: error.message };
    }
  }

  // ✅ CORREÇÃO 6: Métodos públicos melhorados
  async startAutomation() {
    if (this.isRunning) {
      this.log('Automação já está rodando');
      return { success: false, error: 'Já está rodando' };
    }

    try {
      this.log('🚀 Iniciando automação...');
      
      this.isRunning = true;
      this.config.enabled = true;
      this.stats.startTime = new Date().toISOString();
      
      // ✅ Salvar estado ANTES de iniciar processo
      await this.saveState();
      
      const processStarted = await this.startAutomationProcess();
      
      if (processStarted) {
        this.log('✅ Automação iniciada com sucesso');
        return { success: true, message: 'Automação iniciada', isRunning: true };
      } else {
        this.isRunning = false;
        this.config.enabled = false;
        await this.saveState();
        return { success: false, error: 'Falha ao iniciar processo' };
      }
      
    } catch (error) {
      this.log(`❌ Erro ao iniciar automação: ${error.message}`, 'error');
      this.isRunning = false;
      this.config.enabled = false;
      await this.saveState();
      return { success: false, error: error.message };
    }
  }

  async stopAutomation() {
    if (!this.isRunning) {
      this.log('Automação não está rodando');
      return { success: false, error: 'Não está rodando' };
    }

    try {
      this.log('🛑 Parando automação...');
      
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      
      this.isRunning = false;
      this.config.enabled = false;
      
      // ✅ Salvar estado IMEDIATAMENTE após parar
      await this.saveState();
      
      this.log('✅ Automação parada com sucesso');
      return { success: true, message: 'Automação parada', isRunning: false };
      
    } catch (error) {
      this.log(`❌ Erro ao parar automação: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  runManualCycle() {
    this.log('🔄 Executando ciclo manual');
    return this.processInvoices();
  }

  updateConfig(newConfig) {
    try {
      const oldConfig = { ...this.config };
      this.config = { ...this.config, ...newConfig };
      
      this.log('⚙️ Configuração atualizada');
      
      // ✅ Reiniciar interval se mudou o tempo
      if (this.isRunning && newConfig.checkInterval && newConfig.checkInterval !== oldConfig.checkInterval) {
        this.log('🔄 Reiniciando interval com nova configuração');
        if (this.intervalId) {
          clearInterval(this.intervalId);
        }
        this.intervalId = setInterval(async () => {
          if (this.isRunning && this.config.enabled) {
            await this.processInvoices();
          }
        }, this.config.checkInterval);
      }
      
      // ✅ Salvar nova configuração
      this.saveState();
      
      return { success: true, config: this.config };
      
    } catch (error) {
      this.log(`❌ Erro ao atualizar config: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async checkHealth() {
    try {
      const whatsappStatus = await this.checkWhatsAppConnection();
      
      const health = {
        database: !!db,
        whatsapp: { 
          connected: whatsappStatus,
          instance: process.env.WHATSAPP_INSTANCE,
          apiUrl: process.env.WHATSAPP_API_URL
        },
        businessHours: this.isBusinessHours(),
        automation: {
          isRunning: this.isRunning,
          enabled: this.config.enabled,
          uptime: this.stats.startTime 
            ? Date.now() - new Date(this.stats.startTime).getTime()
            : 0
        },
        server: {
          nodejs: process.version,
          platform: process.platform,
          uptime: process.uptime(),
          memory: process.memoryUsage()
        },
        timestamp: new Date().toISOString()
      };
      
      return health;
      
    } catch (error) {
      this.log(`❌ Erro no health check: ${error.message}`, 'error');
      return {
        database: false,
        whatsapp: { connected: false, error: error.message },
        businessHours: false,
        error: error.message
      };
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      stats: {
        ...this.stats,
        uptime: this.stats.startTime 
          ? Date.now() - new Date(this.stats.startTime).getTime()
          : 0
      },
      lastLog: this.logs[0],
      dataLoaded: {
        clients: this.clients.size,
        subscriptions: this.subscriptions.size,
        invoices: this.invoices.size
      },
      serverInfo: {
        version: '1.0.0',
        nodejs: process.version,
        platform: process.platform,
        uptime: process.uptime()
      }
    };
  }

  async reset() {
    try {
      this.log('🔄 Fazendo reset da automação...');
      
      // Parar automação
      await this.stopAutomation();
      
      // Resetar stats
      this.stats = { 
        messagesSent: 0, 
        errors: 0, 
        lastCycle: null,
        startTime: null,
        uptime: 0
      };
      
      // Limpar logs
      this.logs = [];
      
      // Limpar dados em memória
      this.clients.clear();
      this.subscriptions.clear();
      this.invoices.clear();
      
      // Resetar config para padrão
      this.config = {
        checkInterval: 300000,
        maxMessagesPerDay: 50,
        businessHours: { start: 9, end: 18, days: [1,2,3,4,5] },
        reminderDaysBefore: 3,
        overdueSequence: [1,3,7,15,30],
        enabled: false
      };
      
      // ✅ Salvar estado resetado
      await this.saveState();
      
      this.log('✅ Reset concluído');
      return { success: true, message: 'Reset concluído' };
      
    } catch (error) {
      this.log(`❌ Erro no reset: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // Métodos adicionais para compatibilidade
  async getQRCode() {
    try {
      this.log('📷 Obtendo QR Code...');
      const response = await axios.get(
        `${process.env.WHATSAPP_API_URL}/instance/connect/${process.env.WHATSAPP_INSTANCE}`,
        { 
          headers: { 
            'Content-Type': 'application/json',
            'apikey': process.env.WHATSAPP_API_KEY 
          }, 
          timeout: 10000 
        }
      );
      return { success: true, qrCode: response.data };
    } catch (error) {
      this.log(`❌ Erro ao obter QR Code: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testConnection(phone = null) {
    try {
      const connected = await this.checkWhatsAppConnection();
      
      let testResult = { connected };
      
      if (connected && phone) {
        testResult = await this.sendWhatsAppMessage(
          phone, 
          '🧪 Teste de conexão - Sistema funcionando!'
        );
      }
      
      return { success: true, connection: testResult };
      
    } catch (error) {
      this.log(`❌ Erro no teste: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // Métodos de dados
  async saveNotificationLog(notification, result) {
    if (!db) return;
    
    try {
      await db.collection('notifications').add({
        ...notification,
        result,
        automated: true,
        sentAt: new Date().toISOString(),
        serverInfo: {
          instance: process.env.WHATSAPP_INSTANCE,
          version: '1.0.0'
        }
      });
    } catch (error) {
      this.log(`❌ Erro ao salvar log de notificação: ${error.message}`, 'error');
    }
  }

  async getMessageHistory(clientId, limit = 10) {
    if (!db) return [];
    
    try {
      const query = db.collection('notifications')
        .where('client.id', '==', clientId)
        .orderBy('sentAt', 'desc')
        .limit(limit);
      const snap = await query.get();
      return snap.docs.map(doc => doc.data());
    } catch (error) {
      this.log(`❌ Erro ao buscar histórico: ${error.message}`, 'error');
      return [];
    }
  }

  async wasMessageSentToday(clientId, type) {
    if (!db) return false;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const query = db.collection('notifications')
        .where('client.id', '==', clientId)
        .where('type', '==', type)
        .where('sentAt', '>=', today);
      const snap = await query.get();
      return !snap.empty;
    } catch (error) {
      this.log(`❌ Erro ao verificar mensagem: ${error.message}`, 'error');
      return false;
    }
  }

  async getMessagingStats(days = 30) {
    if (!db) return { total: 0, byType: {} };
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const query = db.collection('notifications')
        .where('sentAt', '>=', startDate.toISOString());
      const snap = await query.get();
      
      const stats = { 
        total: snap.size, 
        successful: 0,
        failed: 0,
        byType: {} 
      };
      
      snap.forEach(doc => {
        const data = doc.data();
        const type = data.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
        
        if (data.result?.success) {
          stats.successful++;
        } else {
          stats.failed++;
        }
      });
      
      return stats;
    } catch (error) {
      this.log(`❌ Erro ao obter stats: ${error.message}`, 'error');
      return { total: 0, byType: {}, error: error.message };
    }
  }

  pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.config.enabled = false;
      this.saveState();
      this.log('⏸️ Automação pausada');
    }
  }

  resume() {
    if (!this.intervalId && this.isRunning) {
      this.intervalId = setInterval(async () => {
        if (this.isRunning && this.config.enabled) {
          await this.processInvoices();
        }
      }, this.config.checkInterval);
      this.config.enabled = true;
      this.saveState();
      this.log('▶️ Automação retomada');
    }
  }

  async getAutomationLogs(limit = 50) {
    return this.logs.slice(0, limit);
  }

  async getPerformanceReport(days = 7) {
    const stats = await this.getMessagingStats(days);
    
    return {
      period: `${days} dias`,
      messagesSent: this.stats.messagesSent,
      errors: this.stats.errors,
      successRate: stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0,
      uptime: this.stats.startTime 
        ? Date.now() - new Date(this.stats.startTime).getTime()
        : 0,
      cycles: Math.floor(this.stats.messagesSent / (this.config.maxMessagesPerDay || 1)),
      stats,
      lastCycle: this.stats.lastCycle
    };
  }

  async testAutomation() {
    try {
      this.log('🧪 Executando teste da automação...');
      
      const health = await this.checkHealth();
      const testData = {
        clientsLoaded: this.clients.size,
        subscriptionsLoaded: this.subscriptions.size,
        invoicesLoaded: this.invoices.size,
        businessHours: this.isBusinessHours(),
        config: this.config,
        health
      };
      
      return { success: true, test: testData };
      
    } catch (error) {
      this.log(`❌ Erro no teste: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // Métodos específicos para notificações
  async sendOverdueNotification(invoice, client, subscription = null) {
    const daysOverdue = Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
    const message = `🚨 FATURA VENCIDA: R${invoice.amount} há ${daysOverdue} dias.\n\n💳 PIX: ${process.env.COMPANY_PIX_KEY}`;
    const result = await this.sendWhatsAppMessage(client.phone, message);
    
    if (result.success) {
      await this.saveNotificationLog({ 
        type: 'overdue', 
        invoice, 
        client, 
        subscription,
        daysOverdue 
      }, result);
    }
    
    return result;
  }

  async sendReminderNotification(invoice, client, subscription = null) {
    const daysToDue = Math.floor((new Date(invoice.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    const message = `🔔 LEMBRETE: Fatura de R${invoice.amount} vence em ${daysToDue} dias.\n\n💳 PIX: ${process.env.COMPANY_PIX_KEY}`;
    const result = await this.sendWhatsAppMessage(client.phone, message);
    
    if (result.success) {
      await this.saveNotificationLog({ 
        type: 'reminder', 
        invoice, 
        client, 
        subscription,
        daysToDue 
      }, result);
    }
    
    return result;
  }

  async sendNewInvoiceNotification(invoice, client, subscription = null) {
    const message = `📄 NOVA FATURA: R${invoice.amount}, vence em ${invoice.dueDate}.\n\n💳 PIX: ${process.env.COMPANY_PIX_KEY}`;
    const result = await this.sendWhatsAppMessage(client.phone, message);
    
    if (result.success) {
      await this.saveNotificationLog({ 
        type: 'new_invoice', 
        invoice, 
        client, 
        subscription 
      }, result);
    }
    
    return result;
  }

  async sendPaymentConfirmation(invoice, client, subscription = null) {
    const message = `✅ PAGAMENTO CONFIRMADO: Fatura de R${invoice.amount} paga. Obrigado!`;
    const result = await this.sendWhatsAppMessage(client.phone, message);
    
    if (result.success) {
      await this.saveNotificationLog({ 
        type: 'payment_confirmation', 
        invoice, 
        client, 
        subscription 
      }, result);
    }
    
    return result;
  }
}

// ✅ CORREÇÃO 7: Instância única com inicialização adequada
const automationService = new AutomationService();

// ==================== ROTAS DA API CORRIGIDAS ====================

// ✅ Health check melhorado
app.get('/api/health', async (req, res) => {
  try {
    console.log('🏥 [API] Requisição para /health');
    const health = await automationService.checkHealth();
    res.json({ success: true, health });
  } catch (error) {
    console.error('❌ [API] Erro em /health:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Status com informações completas
app.get('/api/automation/status', async (req, res) => {
  try {
    console.log('📊 [API] Requisição para /automation/status');
    const status = automationService.getStatus();
    console.log('✅ [API] Retornando status:', { 
      isRunning: status.isRunning, 
      enabled: status.config?.enabled 
    });
    res.json({ success: true, ...status });
  } catch (error) {
    console.error('❌ [API] Erro em /status:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Start com resposta imediata
app.post('/api/automation/start', async (req, res) => {
  try {
    console.log('🚀 [API] Requisição para /automation/start');
    const result = await automationService.startAutomation();
    console.log('✅ [API] Resultado do start:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erro em /start:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Stop com resposta imediata
app.post('/api/automation/stop', async (req, res) => {
  try {
    console.log('🛑 [API] Requisição para /automation/stop');
    const result = await automationService.stopAutomation();
    console.log('✅ [API] Resultado do stop:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erro em /stop:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/automation/manual-cycle', async (req, res) => {
  try {
    console.log('🔄 [API] Requisição para /automation/manual-cycle');
    const result = await automationService.runManualCycle();
    console.log('✅ [API] Resultado:', result);
    res.json({ success: true, result });
  } catch (error) {
    console.error('❌ [API] Erro em /manual-cycle:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Config com PUT method
app.put('/api/automation/config', async (req, res) => {
  try {
    console.log('⚙️ [API] Requisição para atualizar /automation/config:', req.body);
    const { config } = req.body;
    if (!config) {
      return res.status(400).json({ success: false, error: 'Configuração é obrigatória' });
    }
    const result = automationService.updateConfig(config);
    console.log('✅ [API] Configuração atualizada:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erro em /config:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/automation/config', (req, res) => {
  try {
    console.log('⚙️ [API] Requisição para /automation/config');
    const config = automationService.config;
    res.json({ success: true, config });
  } catch (error) {
    console.error('❌ [API] Erro em /automation/config:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/automation/logs', async (req, res) => {
  try {
    console.log('📜 [API] Requisição para /automation/logs');
    const { limit = 50 } = req.query;
    const logs = await automationService.getAutomationLogs(parseInt(limit));
    res.json({ success: true, logs });
  } catch (error) {
    console.error('❌ [API] Erro em /logs:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/automation/performance', async (req, res) => {
  try {
    console.log('📊 [API] Requisição para /automation/performance:', req.query);
    const days = parseInt(req.query.days) || 7;
    const report = await automationService.getPerformanceReport(days);
    res.json({ success: true, report });
  } catch (error) {
    console.error('❌ [API] Erro em /performance:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/automation/reset', async (req, res) => {
  try {
    console.log('🔄 [API] Requisição para /automation/reset');
    const result = await automationService.reset();
    console.log('✅ [API] Reset:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erro em /reset:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ SSE com heartbeat melhorado
app.get('/api/automation/events', (req, res) => {
  console.log('📡 [API] Nova conexão SSE em /automation/events');
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Enviar status inicial
  const initialStatus = automationService.getStatus();
  res.write(`data: ${JSON.stringify(initialStatus)}\n\n`);

  // ✅ Update a cada 10 segundos com heartbeat
  const interval = setInterval(() => {
    try {
      const status = automationService.getStatus();
      const message = JSON.stringify({
        ...status,
        heartbeat: new Date().toISOString()
      });
      
      console.log('📨 [API] Enviando update SSE');
      res.write(`data: ${message}\n\n`);
    } catch (error) {
      console.error('❌ [API] Erro no SSE:', error);
      clearInterval(interval);
      res.end();
    }
  }, 10000);

  // ✅ Cleanup robusto
  req.on('close', () => {
    console.log('🛑 [API] Conexão SSE fechada');
    clearInterval(interval);
    res.end();
  });

  req.on('error', () => {
    console.log('❌ [API] Erro na conexão SSE');
    clearInterval(interval);
    res.end();
  });
});

// Rotas de WhatsApp
app.get('/api/messages/connection', async (req, res) => {
  try {
    console.log('📱 [API] Requisição para /messages/connection');
    const status = await automationService.checkWhatsAppConnection();
    res.json({ success: true, connection: { connected: status } });
  } catch (error) {
    console.error('❌ [API] Erro em /messages/connection:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('❌ [API] Erro na API:', error);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno do servidor'
  });
});

app.use('*', (req, res) => {
  console.error('❌ [API] Rota não encontrada:', req.originalUrl);
  res.status(404).json({ success: false, error: 'Rota não encontrada', path: req.originalUrl });
});

// ✅ CORREÇÃO 8: Graceful shutdown melhorado
const gracefulShutdown = async (signal) => {
  console.log(`📴 [Server] Recebido ${signal}, fazendo shutdown graceful...`);
  
  try {
    // Salvar estado antes de fechar
    await automationService.saveState();
    
    // Parar automação
    await automationService.stopAutomation();
    
    console.log('✅ [Server] Shutdown concluído');
    process.exit(0);
  } catch (error) {
    console.error('❌ [Server] Erro no shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', async (error) => {
  console.error('💥 [Server] Exceção não capturada:', error);
  await automationService.saveState();
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  console.error('💥 [Server] Promise rejeitada:', reason);
  await automationService.saveState();
  process.exit(1);
});

// ✅ CORREÇÃO 9: Auto-start inteligente
async function autoStartAutomation() {
  console.log('🔄 [Server] Verificando auto-start da automação...');
  
  if (!db) {
    console.warn('⚠️ [Server] Firestore não disponível, pulando auto-start');
    return;
  }

  // Aguardar inicialização completa
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    const health = await automationService.checkHealth();
    console.log('💚 [Server] Health check inicial:', health);

    // Verificar se precisa restaurar estado
    const doc = await db.collection('automation').doc('state').get();
    
    if (doc.exists && doc.data().isRunning) {
      console.log('🚀 [Server] Automação estava ativa, já foi restaurada na inicialização');
    } else {
      console.log('ℹ️ [Server] Automação não estava ativa anteriormente');
    }

  } catch (error) {
    console.error('❌ [Server] Erro no auto-start:', error.message);
  }
}

// Iniciar servidor
app.listen(port, async () => {
  console.log('🚀 ======================================');
  console.log('🚀 SERVIDOR WHATSAPP AUTOMATION INICIADO');
  console.log('🚀 ======================================');
  console.log(`🌐 Porta: ${port}`);
  console.log(`🔗 URL: http://localhost:${port}`);
  console.log(`🏥 Health: http://localhost:${port}/api/health`);
  console.log(`📊 Status: http://localhost:${port}/api/automation/status`);
  console.log('🚀 ======================================');

  console.log('⚙️ CONFIGURAÇÕES:');
  console.log(`    Firebase Project: ${process.env.FIREBASE_PROJECT_ID || '❌ NÃO DEFINIDO'}`);
  console.log(`    WhatsApp API: ${process.env.WHATSAPP_API_URL || '❌ NÃO DEFINIDO'}`);
  console.log(`    WhatsApp Instance: ${process.env.WHATSAPP_INSTANCE || '❌ NÃO DEFINIDO'}`);
  console.log('🚀 ======================================');

  // Auto-start após inicialização
  autoStartAutomation();
});

module.exports = app;
