// src/services/whatsappAutomationService.js - CORREÇÕES APLICADAS
import { whatsappService } from './whatsappService';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc,
  limit,        // CORREÇÃO: Importação correta da função limit
  orderBy       // CORREÇÃO: Importação correta da função orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { formatDate, getCurrentDate, getDaysDifference } from '../utils/dateUtils';

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
      messagesSent: 0, // CORREÇÃO: Corrigido o nome da propriedade
      errors: 0,
      lastRun: null,
      startTime: null
    };
  }

  // =============================================
  // CONTROLES PRINCIPAIS
  // =============================================

  // Iniciar automação
  async startAutomation() {
    if (this.isRunning) {
      console.warn('⚠️ Automação já está rodando');
      return { success: false, error: 'Automação já está ativa' };
    }

    try {
      console.log('🤖 Iniciando automação WhatsApp...');
      
      // Verificar se WhatsApp está conectado
      const connectionStatus = await whatsappService.checkConnection();
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

  // Parar automação
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

  // Executar ciclo manual
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

  // Executar ciclo completo de automação
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
      const connectionStatus = await whatsappService.checkConnection();
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
            this.stats.messagesSent++; // CORREÇÃO: Nome corrigido
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

  // Calcular notificações pendentes
  async calculatePendingNotifications(invoices, clients, subscriptions) {
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

  // Filtrar mensagens já enviadas hoje
  async filterTodaysMessages(notifications) {
    const filtered = [];

    for (const notification of notifications) {
      const alreadySent = await whatsappService.wasMessageSentToday(
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

  // Processar notificação individual
  async processNotification(notification) {
    const { type, invoice, client, subscription } = notification;
    
    console.log(`📤 Processando: ${type} para ${client.name}`);

    try {
      let result;

      switch (type) {
        case 'overdue':
          result = await whatsappService.sendOverdueNotification(invoice, client, subscription);
          break;
        case 'reminder':
          result = await whatsappService.sendReminderNotification(invoice, client, subscription);
          break;
        case 'new_invoice':
          result = await whatsappService.sendNewInvoiceNotification(invoice, client, subscription);
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
  // FUNÇÕES AUXILIARES
  // =============================================

  // Verificar se está em horário comercial
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

  // Obter próximo horário comercial
  getNextBusinessHour() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(this.config.businessHours.start, 0, 0, 0);
    
    return tomorrow;
  }

  // Delay assíncrono
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =============================================
  // ACESSO AOS DADOS
  // =============================================

  // Buscar clientes
  async getClients() {
    try {
      const snapshot = await getDocs(collection(db, 'clients'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      return [];
    }
  }

  // Buscar faturas
  async getInvoices() {
    try {
      const snapshot = await getDocs(collection(db, 'invoices'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar faturas:', error);
      return [];
    }
  }

  // Buscar assinaturas
  async getSubscriptions() {
    try {
      const snapshot = await getDocs(collection(db, 'subscriptions'));
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

  // Atualizar configuração
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

  // Obter configuração atual
  getConfig() {
    return { ...this.config };
  }

  // Obter estatísticas
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

  // Salvar log da automação
  async saveAutomationLog(action, data = {}) {
    try {
      await addDoc(collection(db, 'automation_logs'), {
        action,
        data,
        timestamp: new Date(),
        service: 'whatsapp_automation'
      });
    } catch (error) {
      console.error('❌ Erro ao salvar log da automação:', error);
    }
  }

  // Salvar log de notificação
  async saveNotificationLog(notification, result) {
    try {
      await addDoc(collection(db, 'notification_logs'), {
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

  // CORREÇÃO PRINCIPAL: Função getAutomationLogs corrigida
  async getAutomationLogs(limitCount = 50) {
    try {
      const q = query(
        collection(db, 'automation_logs'),
        where('service', '==', 'whatsapp_automation'),
        orderBy('timestamp', 'desc'), // CORREÇÃO: orderBy importado e usado corretamente
        limit(limitCount) // CORREÇÃO: limit importado e usado corretamente
      );
      
      const snapshot = await getDocs(q);
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

  // =============================================
  // TESTES E DIAGNÓSTICOS
  // =============================================

  // Testar automação (modo dry-run)
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
        whatsappConnected: (await whatsappService.checkConnection()).connected,
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

  // Verificar saúde do sistema
  async checkHealth() {
    const health = {
      automation: {
        running: this.isRunning,
        enabled: this.config.enabled,
        lastRun: this.stats.lastRun,
        errors: this.stats.errors
      },
      whatsapp: await whatsappService.checkConnection(),
      businessHours: this.isBusinessHours(),
      database: true, // Assume que está ok se chegou até aqui
      timestamp: new Date()
    };

    try {
      // Testar acesso ao banco
      const testQuery = query(collection(db, 'clients'), limit(1)); // CORREÇÃO: Uso correto da função limit
      await getDocs(testQuery);
    } catch (error) {
      health.database = false;
      health.databaseError = error.message;
    }

    return health;
  }

  // =============================================
  // RELATÓRIOS
  // =============================================

  // CORREÇÃO: Função getPerformanceReport corrigida
  async getPerformanceReport(days = 7) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const q = query(
        collection(db, 'notification_logs'),
        where('automated', '==', true),
        where('timestamp', '>=', since),
        orderBy('timestamp', 'desc') // CORREÇÃO: orderBy importado e usado corretamente
      );

      const snapshot = await getDocs(q);
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

  // Agrupar logs por dia
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

  // Pausar temporariamente
  pause() {
    this.config.enabled = false;
    console.log('⏸️ Automação pausada temporariamente');
  }

  // Retomar
  resume() {
    this.config.enabled = true;
    console.log('▶️ Automação retomada');
  }

  // Reset completo
  async reset() {
    console.log('🔄 Fazendo reset da automação...');
    
    await this.stopAutomation();
    
    this.stats = {
      messagesSent: 0, // CORREÇÃO: Nome corrigido
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

// Instância singleton
const whatsappAutomationService = new WhatsAppAutomationService();

export { whatsappAutomationService };