// whatsapp-automation-server/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config({ path: '.env' });

// Inicializar Firebase Admin
let db;
try {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('📡 [Server] Carregando FIREBASE_SERVICE_ACCOUNT do .env...');
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    console.log('📡 [Server] FIREBASE_SERVICE_ACCOUNT não definido, tentando carregar de arquivo...');
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
    } else {
      throw new Error('FIREBASE_SERVICE_ACCOUNT não definido e serviceAccountKey.json não encontrado');
    }
  }

  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || 'gestao-de-cobrancas-e349d'
  });
  db = getFirestore();
  console.log('✅ [Server] Firebase Admin inicializado com sucesso');
} catch (error) {
  console.error('❌ [Server] Erro ao inicializar Firebase Admin:', error.message);
  console.warn('⚠️ [Server] Continuando sem Firestore (funcionalidade limitada)');
  // Não encerrar o processo para permitir testes
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

// ==================== SERVIÇO DE AUTOMAÇÃO ====================

class AutomationService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.config = {
      checkInterval: 300000,
      maxMessagesPerDay: 50,
      businessHours: { start: 9, end: 18, days: [1,2,3,4,5] },
      reminderDaysBefore: 3,
      overdueSequence: [1,3,7,15,30],
      enabled: true
    };
    this.logs = [];
    this.stats = { messagesSent: 0, errors: 0, lastCycle: null };
    this.clients = new Map();
    this.subscriptions = new Map();
    this.invoices = new Map();
    if (db) {
      this.loadInitialState();
    } else {
      this.log('⚠️ Firestore não disponível, usando estado padrão', 'warn');
    }
  }

  async loadInitialState() {
    try {
      console.log('📡 [AutomationService] Carregando estado inicial do Firestore...');
      const doc = await db.collection('automation').doc('state').get();
      if (doc.exists) {
        this.isRunning = doc.data().isRunning || false;
        this.config = { ...this.config, ...doc.data().config };
        console.log('✅ [AutomationService] Estado inicial carregado:', { isRunning: this.isRunning, config: this.config });
      } else {
        console.log('ℹ️ [AutomationService] Nenhum estado salvo encontrado, usando padrão');
        await this.saveState();
      }
    } catch (error) {
      console.error('❌ [AutomationService] Erro ao carregar estado inicial:', error.message);
      this.log('⚠️ Falha ao carregar estado do Firestore', 'error');
    }
  }

  async saveState() {
    if (!db) {
      this.log('⚠️ Firestore não disponível, estado não salvo', 'warn');
      return;
    }
    try {
      console.log('💾 [AutomationService] Salvando estado no Firestore:', { isRunning: this.isRunning, config: this.config });
      await db.collection('automation').doc('state').set({
        isRunning: this.isRunning,
        config: this.config,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ [AutomationService] Estado salvo com sucesso');
    } catch (error) {
      console.error('❌ [AutomationService] Erro ao salvar estado:', error.message);
      this.log('⚠️ Falha ao salvar estado no Firestore', 'error');
    }
  }

  log(message, level = 'info') {
    const entry = { timestamp: new Date().toISOString(), level, message };
    this.logs.unshift(entry);
    if (this.logs.length > 100) this.logs.pop();
    console.log(`[${level.toUpperCase()}] ${message}`);
  }

  async loadData() {
    if (!db) {
      this.log('⚠️ Firestore não disponível, dados não carregados', 'warn');
      return;
    }
    try {
      console.log('📡 [AutomationService] Carregando dados do Firestore...');
      const clientsSnap = await db.collection('clients').get();
      clientsSnap.forEach(doc => this.clients.set(doc.id, doc.data()));
      const subsSnap = await db.collection('subscriptions').get();
      subsSnap.forEach(doc => this.subscriptions.set(doc.id, doc.data()));
      const invoicesSnap = await db.collection('invoices').get();
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
    const isBusiness = this.config.businessHours.days.includes(day) &&
                       hour >= this.config.businessHours.start &&
                       hour < this.config.businessHours.end;
    this.log(`Verificando horário comercial: ${isBusiness ? 'Dentro' : 'Fora'} do horário`);
    return isBusiness;
  }

  async checkWhatsAppConnection() {
    try {
      console.log('📱 [AutomationService] Verificando conexão WhatsApp...');
      const response = await axios.get(
        `${process.env.WHATSAPP_API_URL}/instance/fetchInstances?instanceName=${process.env.WHATSAPP_INSTANCE}`,
        { headers: { Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}` }, timeout: 10000 }
      );
      const connected = response.data[0]?.instance?.status === 'open';
      this.log(`Conexão WhatsApp: ${connected ? 'Conectado' : 'Desconectado'}`);
      return connected;
    } catch (error) {
      this.log(`Erro ao verificar WhatsApp: ${error.message}`, 'error');
      return false;
    }
  }

  async sendWhatsAppMessage(phone, message) {
    try {
      console.log(`📤 [AutomationService] Enviando mensagem para ${phone}: ${message}`);
      const response = await axios.post(
        `${process.env.WHATSAPP_API_URL}/message/sendText/${process.env.WHATSAPP_INSTANCE}`,
        { number: phone, options: { delay: 1200 }, textMessage: { text: message } },
        { headers: { Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}` }, timeout: 10000 }
      );
      this.stats.messagesSent++;
      this.log(`Mensagem enviada para ${phone}`);
      return { success: true, response: response.data };
    } catch (error) {
      this.stats.errors++;
      this.log(`Erro ao enviar mensagem: ${error.message}`, 'error');
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

    for (const [id, invoice] of this.invoices) {
      if (processed >= this.config.maxMessagesPerDay) break;

      const dueDate = new Date(invoice.dueDate);
      const daysToDue = Math.floor((dueDate - new Date()) / (1000 * 60 * 60 * 24));

      let message = '';
      if (daysToDue === this.config.reminderDaysBefore) {
        message = `Lembrete: Sua fatura de R$${invoice.amount} vence em ${this.config.reminderDaysBefore} dias.`;
      } else if (daysToDue < 0) {
        const overdueDays = -daysToDue;
        if (this.config.overdueSequence.includes(overdueDays)) {
          message = `Cobrança: Sua fatura de R$${invoice.amount} está vencida há ${overdueDays} dias. Por favor, pague via PIX: ${process.env.COMPANY_PIX}`;
        }
      }

      if (message) {
        const client = this.clients.get(invoice.clientId);
        if (client && client.phone) {
          const result = await this.sendWhatsAppMessage(client.phone, message);
          if (result.success) sent++;
          processed++;
        }
      }
    }

    this.stats.lastCycle = new Date().toISOString();
    this.log(`Ciclo processado: ${processed} faturas, ${sent} mensagens enviadas`);
    return { processed, sent };
  }

  startAutomation() {
    if (this.isRunning) {
      this.log('Automação já está rodando');
      return { success: false, error: 'Já está rodando' };
    }

    this.loadData().then(() => {
      this.intervalId = setInterval(() => this.processInvoices(), this.config.checkInterval);
      this.isRunning = true;
      this.config.enabled = true;
      this.saveState();
      this.log('Automação iniciada');
    }).catch(error => {
      this.log(`Erro ao iniciar automação: ${error.message}`, 'error');
      return { success: false, error: error.message };
    });

    return { success: true };
  }

  stopAutomation() {
    if (!this.isRunning) {
      this.log('Automação não está rodando');
      return { success: false, error: 'Não está rodando' };
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    this.config.enabled = false;
    this.saveState();
    this.log('Automação parada');
    return { success: true };
  }

  runManualCycle() {
    this.log('Executando ciclo manual');
    return this.processInvoices();
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.log('Configuração atualizada');
    if (this.isRunning && newConfig.checkInterval) {
      clearInterval(this.intervalId);
      this.intervalId = setInterval(() => this.processInvoices(), this.config.checkInterval);
    }
    this.saveState();
    return { success: true, config: this.config };
  }

  checkHealth() {
    return {
      database: !!db,
      whatsapp: { connected: this.checkWhatsAppConnection() },
      businessHours: this.isBusinessHours()
    };
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      stats: this.stats,
      lastLog: this.logs[0]
    };
  }

  reset() {
    this.stopAutomation();
    this.logs = [];
    this.stats = { messagesSent: 0, errors: 0, lastCycle: null };
    this.clients.clear();
    this.subscriptions.clear();
    this.invoices.clear();
    this.log('Automação resetada');
    this.saveState();
    return { success: true };
  }

  async getQRCode() {
    try {
      this.log('Obtendo QR Code para conexão WhatsApp');
      const response = await axios.get(
        `${process.env.WHATSAPP_API_URL}/instance/qrCode/${process.env.WHATSAPP_INSTANCE}`,
        { headers: { Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}` }, timeout: 10000 }
      );
      return { success: true, qrCode: response.data };
    } catch (error) {
      this.log(`Erro ao obter QR Code: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testConnection(phone) {
    const connected = await this.checkWhatsAppConnection();
    if (!connected) {
      this.log('Teste de conexão falhou: WhatsApp não conectado', 'error');
      return { success: false, error: 'WhatsApp não conectado' };
    }
    if (phone) {
      return await this.sendWhatsAppMessage(phone, 'Mensagem de teste');
    }
    return { success: true, connected };
  }

  async saveNotificationLog(notification, result) {
    if (!db) {
      this.log('⚠️ Firestore não disponível, notificação não salva', 'warn');
      return;
    }
    try {
      await db.collection('notifications').add({
        ...notification,
        sentAt: new Date().toISOString(),
        status: result.success ? 'sent' : 'failed',
        response: result.response || result.error
      });
      this.log(`Notificação salva: ${notification.type} para ${notification.client.phone}`);
    } catch (error) {
      this.log(`Erro ao salvar log de notificação: ${error.message}`, 'error');
    }
  }

  async getMessageHistory(clientId, limit) {
    if (!db) {
      this.log('⚠️ Firestore não disponível, histórico não retornado', 'warn');
      return [];
    }
    const query = db.collection('notifications')
      .where('client.id', '==', clientId)
      .orderBy('sentAt', 'desc')
      .limit(limit);
    const snap = await query.get();
    return snap.docs.map(doc => doc.data());
  }

  async wasMessageSentToday(clientId, type) {
    if (!db) {
      this.log('⚠️ Firestore não disponível, verificação de mensagens não realizada', 'warn');
      return false;
    }
    const today = new Date().toISOString().split('T')[0];
    const query = db.collection('notifications')
      .where('client.id', '==', clientId)
      .where('type', '==', type)
      .where('sentAt', '>=', today);
    const snap = await query.get();
    return !snap.empty;
  }

  async getMessagingStats(days) {
    if (!db) {
      this.log('⚠️ Firestore não disponível, estatísticas não retornadas', 'warn');
      return { total: 0, byType: {} };
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const query = db.collection('notifications')
      .where('sentAt', '>=', startDate.toISOString());
    const snap = await query.get();
    const stats = { total: snap.size, byType: {} };
    snap.forEach(doc => {
      const type = doc.data().type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });
    return stats;
  }

  getConfig() {
    return this.config;
  }

  pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.config.enabled = false;
      this.saveState();
      this.log('Automação pausada');
    }
  }

  resume() {
    if (!this.intervalId) {
      this.intervalId = setInterval(() => this.processInvoices(), this.config.checkInterval);
      this.config.enabled = true;
      this.saveState();
      this.log('Automação retomada');
    }
  }

  async getAutomationLogs(limit) {
    return this.logs.slice(0, limit);
  }

  async getPerformanceReport(days) {
    return {
      messagesSent: this.stats.messagesSent,
      errors: this.stats.errors,
      cycles: Math.floor(this.stats.messagesSent / this.config.maxMessagesPerDay)
    };
  }

  async testAutomation() {
    return { success: true, simulated: 'Ciclo de teste executado' };
  }

  async sendOverdueNotification(invoice, client, subscription) {
    const daysOverdue = Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
    const message = `Cobrança: Sua fatura de R$${invoice.amount} está vencida há ${daysOverdue} dias. Por favor, pague via PIX: ${process.env.COMPANY_PIX}`;
    const result = await this.sendWhatsAppMessage(client.phone, message);
    if (result.success) {
      await this.saveNotificationLog({ type: 'overdue', invoice, client, subscription }, result);
    }
    return result;
  }

  async sendReminderNotification(invoice, client, subscription) {
    const daysToDue = Math.floor((new Date(invoice.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    const message = `Lembrete: Sua fatura de R$${invoice.amount} vence em ${daysToDue} dias.`;
    const result = await this.sendWhatsAppMessage(client.phone, message);
    if (result.success) {
      await this.saveNotificationLog({ type: 'reminder', invoice, client, subscription }, result);
    }
    return result;
  }

  async sendNewInvoiceNotification(invoice, client, subscription) {
    const message = `Nova fatura gerada: R$${invoice.amount}, vencimento em ${invoice.dueDate}.`;
    const result = await this.sendWhatsAppMessage(client.phone, message);
    if (result.success) {
      await this.saveNotificationLog({ type: 'new_invoice', invoice, client, subscription }, result);
    }
    return result;
  }

  async sendPaymentConfirmation(invoice, client, subscription) {
    const message = `Pagamento confirmado: Fatura de R$${invoice.amount} paga em ${new Date().toLocaleDateString()}. Obrigado!`;
    const result = await this.sendWhatsAppMessage(client.phone, message);
    if (result.success) {
      await this.saveNotificationLog({ type: 'payment_confirmation', invoice, client, subscription }, result);
    }
    return result;
  }
}

const automationService = new AutomationService();

// ==================== ROTAS DA API ====================

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

app.get('/api/automation/status', (req, res) => {
  console.log('📊 [API] Requisição para /automation/status');
  const status = automationService.getStatus();
  console.log('✅ [API] Retornando status:', status);
  res.json({ success: true, ...status });
});

app.post('/api/automation/start', async (req, res) => {
  console.log('🚀 [API] Requisição para /automation/start');
  const result = automationService.startAutomation();
  console.log('✅ [API] Resultado:', result);
  res.json(result);
});

app.post('/api/automation/stop', async (req, res) => {
  console.log('🛑 [API] Requisição para /automation/stop');
  const result = automationService.stopAutomation();
  console.log('✅ [API] Resultado:', result);
  res.json(result);
});

app.post('/api/automation/manual-cycle', async (req, res) => {
  console.log('🔄 [API] Requisição para /automation/manual-cycle');
  const result = await automationService.runManualCycle();
  console.log('✅ [API] Resultado:', result);
  res.json({ success: true, result });
});

app.post('/api/automation/config', (req, res) => {
  console.log('⚙️ [API] Requisição para /automation/config:', req.body);
  const result = automationService.updateConfig(req.body);
  console.log('✅ [API] Resultado:', result);
  res.json(result);
});

app.get('/api/automation/stats', (req, res) => {
  console.log('📊 [API] Requisição para /automation/stats');
  res.json({ success: true, stats: automationService.stats });
});

app.get('/api/automation/logs', (req, res) => {
  console.log('📜 [API] Requisição para /automation/logs');
  res.json({ success: true, logs: automationService.logs });
});

app.get('/api/automation/test-connections', async (req, res) => {
  console.log('🔍 [API] Requisição para /automation/test-connections');
  const health = await automationService.checkHealth();
  console.log('✅ [API] Resultado:', health);
  res.json({ success: true, health });
});

app.post('/api/automation/reset', async (req, res) => {
  console.log('🗑️ [API] Requisição para /automation/reset');
  const result = automationService.reset();
  console.log('✅ [API] Resultado:', result);
  res.json({ success: true, message: 'Automação resetada', result });
});

app.get('/api/automation/events', (req, res) => {
  console.log('📡 [API] Nova conexão SSE em /automation/events');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); // Ajuste para produção

  res.write(`data: ${JSON.stringify(automationService.getStatus())}\n\n`);

  const interval = setInterval(() => {
    console.log('📨 [API] Enviando update SSE:', automationService.getStatus());
    res.write(`data: ${JSON.stringify(automationService.getStatus())}\n\n`);
  }, 5000);

  req.on('close', () => {
    console.log('🛑 [API] Conexão SSE fechada');
    clearInterval(interval);
    res.end();
  });
});

app.get('/api/messages/connection', async (req, res) => {
  try {
    console.log('📱 [API] Requisição para /messages/connection');
    const status = await automationService.checkWhatsAppConnection();
    res.json({ success: true, connection: status });
  } catch (error) {
    console.error('❌ [API] Erro em /messages/connection:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/messages/qr-code', async (req, res) => {
  try {
    console.log('📷 [API] Requisição para /messages/qr-code');
    const result = await automationService.getQRCode();
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erro em /messages/qr-code:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/messages/test', async (req, res) => {
  try {
    console.log('🔍 [API] Requisição para /messages/test:', req.body);
    const { phone } = req.body;
    const result = await automationService.testConnection(phone);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erro em /messages/test:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/messages/send', async (req, res) => {
  try {
    console.log('📤 [API] Requisição para /messages/send:', req.body);
    const { phone, message, type = 'manual' } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Telefone e mensagem são obrigatórios' });
    }
    const result = await automationService.sendWhatsAppMessage(phone, message);
    if (result.success) {
      await automationService.saveNotificationLog({
        type: type,
        invoice: { id: 'manual', amount: 0 },
        client: { id: 'manual', name: 'Manual', phone: phone }
      }, result);
    }
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erro em /messages/send:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/messages/overdue', async (req, res) => {
  try {
    console.log('📤 [API] Requisição para /messages/overdue:', req.body);
    const { invoice, client, subscription } = req.body;
    if (!invoice || !client) {
      return res.status(400).json({ success: false, error: 'Dados da fatura e cliente são obrigatórios' });
    }
    const result = await automationService.sendOverdueNotification(invoice, client, subscription);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erro em /messages/overdue:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/messages/reminder', async (req, res) => {
  try {
    console.log('📤 [API] Requisição para /messages/reminder:', req.body);
    const { invoice, client, subscription } = req.body;
    if (!invoice || !client) {
      return res.status(400).json({ success: false, error: 'Dados da fatura e cliente são obrigatórios' });
    }
    const result = await automationService.sendReminderNotification(invoice, client, subscription);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erro em /messages/reminder:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/messages/new-invoice', async (req, res) => {
  try {
    console.log('📤 [API] Requisição para /messages/new-invoice:', req.body);
    const { invoice, client, subscription } = req.body;
    if (!invoice || !client) {
      return res.status(400).json({ success: false, error: 'Dados da fatura e cliente são obrigatórios' });
    }
    const result = await automationService.sendNewInvoiceNotification(invoice, client, subscription);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erro em /messages/new-invoice:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/messages/payment-confirmed', async (req, res) => {
  try {
    console.log('📤 [API] Requisição para /messages/payment-confirmed:', req.body);
    const { invoice, client, subscription } = req.body;
    if (!invoice || !client) {
      return res.status(400).json({ success: false, error: 'Dados da fatura e cliente são obrigatórios' });
    }
    const result = await automationService.sendPaymentConfirmation(invoice, client, subscription);
    res.json(result);
  } catch (error) {
    console.error('❌ [API] Erro em /messages/payment-confirmed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/messages/bulk', async (req, res) => {
  try {
    console.log('📤 [API] Requisição para /messages/bulk:', req.body);
    const { notifications, delayMs = 3000 } = req.body;
    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({ success: false, error: 'Lista de notificações é obrigatória' });
    }
    const results = [];
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      const { type, invoice, client, subscription } = notification;
      console.log(`📤 [API] Enviando ${i + 1}/${notifications.length}: ${type} para ${client.name}`);
      try {
        let result;
        switch (type) {
          case 'overdue':
            result = await automationService.sendOverdueNotification(invoice, client, subscription);
            break;
          case 'reminder':
            result = await automationService.sendReminderNotification(invoice, client, subscription);
            break;
          case 'new_invoice':
            result = await automationService.sendNewInvoiceNotification(invoice, client, subscription);
            break;
          case 'payment_confirmation':
            result = await automationService.sendPaymentConfirmation(invoice, client, subscription);
            break;
          case 'custom':
            result = await automationService.sendWhatsAppMessage(client.phone, notification.message);
            break;
          default:
            result = { success: false, error: 'Tipo de notificação inválido' };
        }
        results.push({
          client: client.name,
          phone: client.phone,
          type,
          amount: invoice.amount,
          hasSubscription: !!subscription,
          ...result
        });
      } catch (error) {
        console.error(`❌ [API] Erro ao enviar para ${client.name}:`, error.message);
        results.push({
          client: client.name,
          phone: client.phone,
          type,
          amount: invoice.amount,
          hasSubscription: !!subscription,
          success: false,
          error: error.message
        });
      }
      if (i < notifications.length - 1) {
        console.log(`⏳ [API] Aguardando ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`✅ [API] Envio em lote concluído: ${successful} sucessos, ${failed} falhas`);
    res.json({
      success: true,
      results,
      summary: { total: results.length, successful, failed, successRate: results.length > 0 ? Math.round((successful / results.length) * 100) : 0 }
    });
  } catch (error) {
    console.error('❌ [API] Erro em /messages/bulk:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/messages/history/:clientId', async (req, res) => {
  try {
    console.log('📜 [API] Requisição para /messages/history:', req.params);
    const { clientId } = req.params;
    const { limit = 10 } = req.query;
    const history = await automationService.getMessageHistory(clientId, parseInt(limit));
    res.json({ success: true, history });
  } catch (error) {
    console.error('❌ [API] Erro em /messages/history:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/messages/sent-today/:clientId/:type', async (req, res) => {
  try {
    console.log('📅 [API] Requisição para /messages/sent-today:', req.params);
    const { clientId, type } = req.params;
    const wasSent = await automationService.wasMessageSentToday(clientId, type);
    res.json({ success: true, sentToday: wasSent });
  } catch (error) {
    console.error('❌ [API] Erro em /messages/sent-today:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/messages/stats', async (req, res) => {
  try {
    console.log('📊 [API] Requisição para /messages/stats:', req.query);
    const { days = 30 } = req.query;
    const stats = await automationService.getMessagingStats(parseInt(days));
    res.json({ success: true, stats });
  } catch (error) {
    console.error('❌ [API] Erro em /messages/stats:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/automation/toggle', (req, res) => {
  try {
    console.log('🔄 [API] Requisição para /automation/toggle');
    if (automationService.config.enabled) {
      automationService.pause();
      res.json({ success: true, message: 'Automação pausada', status: 'paused' });
    } else {
      automationService.resume();
      res.json({ success: true, message: 'Automação retomada', status: 'running' });
    }
  } catch (error) {
    console.error('❌ [API] Erro em /automation/toggle:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/automation/config', (req, res) => {
  try {
    console.log('⚙️ [API] Requisição para /automation/config');
    const config = automationService.getConfig();
    res.json({ success: true, config });
  } catch (error) {
    console.error('❌ [API] Erro em /automation/config:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/automation/config', (req, res) => {
  try {
    console.log('⚙️ [API] Requisição para atualizar /automation/config:', req.body);
    const { config } = req.body;
    if (!config) {
      return res.status(400).json({ success: false, error: 'Configuração é obrigatória' });
    }
    automationService.updateConfig(config);
    res.json({ success: true, message: 'Configuração atualizada', config: automationService.getConfig() });
  } catch (error) {
    console.error('❌ [API] Erro em /automation/config:', error.message);
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
    console.error('❌ [API] Erro em /automation/performance:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/automation/test', async (req, res) => {
  try {
    console.log('🔍 [API] Requisição para /automation/test');
    const testResult = await automationService.testAutomation();
    res.json({ success: true, test: testResult });
  } catch (error) {
    console.error('❌ [API] Erro em /automation/test:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

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

process.on('SIGTERM', async () => {
  console.log('📴 [Server] Recebido SIGTERM, parando automação...');
  automationService.stopAutomation();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📴 [Server] Recebido SIGINT (Ctrl+C), parando automação...');
  automationService.stopAutomation();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('💥 [Server] Exceção não capturada:', error);
  automationService.stopAutomation();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 [Server] Promise rejeitada não tratada:', reason);
  automationService.stopAutomation();
  process.exit(1);
});

async function autoStartAutomation() {
  console.log('🔄 [Server] Verificando auto-start da automação...');
  if (!db) {
    console.warn('⚠️ [Server] Firestore não disponível, pulando auto-start');
    return;
  }
  let retries = 5;
  while (retries > 0) {
    try {
      const health = await automationService.checkHealth();
      console.log('✅ [Server] Health check:', health);
      if (!health.database || !health.whatsapp.connected) {
        console.error('⚠️ [Server] Conexões não prontas, tentando novamente em 30s...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        retries--;
        continue;
      }

      const doc = await db.collection('automation').doc('state').get();
      if (doc.exists && doc.data().isRunning && !automationService.isRunning) {
        console.log('🚀 [Server] Estado salvo indica automação ativa, iniciando...');
        const result = automationService.startAutomation();
        if (result.success) {
          console.log(`✅ [Server] Automação iniciada - ciclo a cada ${automationService.config.checkInterval / 60000} minutos`);
          setTimeout(async () => {
            await automationService.runManualCycle();
          }, 5000);
          return;
        } else {
          console.error('❌ [Server] Falha ao iniciar automação:', result.error);
        }
      } else {
        console.log('ℹ️ [Server] Automação não estava ativa ou já está rodando');
      }
      break;
    } catch (error) {
      console.error('❌ [Server] Erro no auto-start:', error.message);
      retries--;
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  console.log('ℹ️ [Server] Auto-start não concluído após tentativas');
}

app.listen(port, async () => {
  console.log('🚀 ======================================');
  console.log('🚀 SERVIDOR WHATSAPP AUTOMATION INICIADO');
  console.log('🚀 ======================================');
  console.log(`🌐 Porta: ${port}`);
  console.log(`🔗 URL: https://gestaodecobrancas.ddns.net:${port}`);
  console.log(`🏥 Health: https://gestaodecobrancas.ddns.net:${port}/api/health`);
  console.log(`📊 Status: https://gestaodecobrancas.ddns.net:${port}/api/automation/status`);
  console.log(`📱 Messages API: https://gestaodecobrancas.ddns.net:${port}/api/messages/*`);
  console.log('🚀 ======================================');

  console.log('⚙️ CONFIGURAÇÕES:');
  console.log(`    Firebase Project: ${process.env.FIREBASE_PROJECT_ID || '❌ NÃO DEFINIDO'}`);
  console.log(`    WhatsApp API: ${process.env.WHATSAPP_API_URL || '❌ NÃO DEFINIDO'}`);
  console.log(`    WhatsApp Instance: ${process.env.WHATSAPP_INSTANCE || '❌ NÃO DEFINIDO'}`);
  console.log('🚀 ======================================');

  try {
    const health = await automationService.checkHealth();
    console.log('💚 HEALTH CHECK:');
    console.log(`    Database: ${health.database ? '✅' : '❌'}`);
    console.log(`    WhatsApp: ${health.whatsapp.connected ? '✅' : '❌'}`);
    console.log(`    Business Hours: ${health.businessHours ? '✅ Horário comercial' : '⏰ Fora do horário'}`);
    if (health.database && health.whatsapp.connected) {
      console.log('🤖 Sistema pronto para automação!');
    } else {
      console.log('⚠️ Sistema parcialmente configurado');
    }
  } catch (error) {
    console.error('❌ Erro no health check inicial:', error.message);
  }

  console.log('🚀 ======================================');
  autoStartAutomation();
});

module.exports = app;