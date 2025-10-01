// src/services/automationService.js - VERSÃO CORRIGIDA
import { whatsappService } from './whatsappService';
import { invoiceService } from './firestore';

class AutomationService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.mountedRef = { current: true };
    
    this.config = {
      checkIntervalMinutes: 5,
      businessHours: {
        start: '08:00',
        end: '18:00',
        workDays: [1, 2, 3, 4, 5] // Seg-Sex
      },
      escalation: {
        reminderDaysBefore: 3,
        overdueEscalation: [1, 3, 7, 15, 30]
      },
      limits: {
        maxMessagesPerDay: 1,
        delayBetweenMessages: 5000 // 5 segundos
      }
    };

    this.sentToday = new Map(); // clientId -> timestamp
    this.logs = [];
  }

  // ========================================
  // CONTROLES PRINCIPAIS
  // ========================================

  async startAutomation() {
    if (this.isRunning) {
      return { success: false, error: 'Automação já está rodando' };
    }

    try {
      // Limpar qualquer interval anterior PRIMEIRO
      this.cleanupInterval();
      
      this.isRunning = true;
      this.mountedRef.current = true;
      
      console.log('🤖 Iniciando automação WhatsApp...');
      
      // Executar primeiro ciclo imediatamente
      await this.runAutomationCycle();
      
      // Configurar ciclo periódico
      this.intervalId = setInterval(async () => {
        if (this.isRunning && this.mountedRef.current) {
          await this.runAutomationCycle();
        }
      }, this.config.checkIntervalMinutes * 60 * 1000);
      
      this.addLog('info', 'Automação iniciada com sucesso');
      return { success: true };
    } catch (error) {
      this.isRunning = false;
      this.cleanupInterval();
      console.error('Erro ao iniciar automação:', error);
      this.addLog('error', `Erro ao iniciar: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async stopAutomation() {
    if (!this.isRunning) {
      return { success: false, error: 'Automação não está rodando' };
    }

    try {
      console.log('⏸️ Parando automação WhatsApp...');
      
      this.isRunning = false;
      this.mountedRef.current = false;
      this.cleanupInterval();
      
      this.addLog('info', 'Automação parada');
      return { success: true };
    } catch (error) {
      console.error('Erro ao parar automação:', error);
      return { success: false, error: error.message };
    }
  }

  cleanupInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🧹 Interval limpo');
    }
  }

  cleanup() {
    this.stopAutomation();
    this.sentToday.clear();
    this.logs = [];
  }

  // ========================================
  // CICLO DE AUTOMAÇÃO
  // ========================================

  async runAutomationCycle() {
    if (!this.isRunning || !this.mountedRef.current) {
      return;
    }

    try {
      console.log('🔄 Executando ciclo de automação...');
      
      // Verificar se está no horário comercial
      if (!this.isWithinBusinessHours()) {
        console.log('⏰ Fora do horário comercial');
        return;
      }

      // Limpar cache de envios do dia anterior
      this.cleanOldSentCache();

      // Buscar faturas que precisam de ação
      const invoices = await this.getInvoicesNeedingAction();
      
      if (invoices.length === 0) {
        console.log('✅ Nenhuma fatura precisa de ação');
        return;
      }

      console.log(`📋 ${invoices.length} faturas para processar`);

      // Processar faturas com delay entre envios
      let processed = 0;
      let sent = 0;
      let skipped = 0;

      for (const invoice of invoices) {
        if (!this.isRunning || !this.mountedRef.current) {
          console.log('⏸️ Automação parada durante processamento');
          break;
        }

        processed++;

        // Verificar se já enviou mensagem hoje para este cliente
        if (this.wasMessageSentToday(invoice.clientId)) {
          console.log(`⏭️ Cliente ${invoice.clientName} já recebeu mensagem hoje`);
          skipped++;
          continue;
        }

        // Enviar notificação apropriada
        const result = await this.sendAppropriateNotification(invoice);
        
        if (result.success) {
          sent++;
          this.markMessageSentToday(invoice.clientId);
          this.addLog('success', `Mensagem enviada: ${invoice.clientName}`);
        } else {
          this.addLog('error', `Falha ao enviar para ${invoice.clientName}: ${result.error}`);
        }

        // Delay entre mensagens (se não for a última)
        if (processed < invoices.length) {
          await this.delay(this.config.limits.delayBetweenMessages);
        }
      }

      console.log(`✅ Ciclo concluído: ${sent} enviadas, ${skipped} puladas, ${processed} processadas`);
      this.addLog('info', `Ciclo: ${sent} enviadas, ${skipped} puladas`);

    } catch (error) {
      console.error('❌ Erro no ciclo de automação:', error);
      this.addLog('error', `Erro no ciclo: ${error.message}`);
    }
  }

  async sendAppropriateNotification(invoice) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

      // Determinar tipo de notificação
      let notificationType;
      
      if (daysOverdue > 0) {
        // Fatura vencida - verificar escalonamento
        if (this.config.escalation.overdueEscalation.includes(daysOverdue)) {
          notificationType = 'overdue';
        } else {
          return { success: false, error: 'Não é dia de enviar cobrança' };
        }
      } else if (daysUntilDue <= this.config.escalation.reminderDaysBefore && daysUntilDue > 0) {
        // Lembrete antes do vencimento
        notificationType = 'reminder';
      } else if (daysUntilDue === 0) {
        // Vence hoje
        notificationType = 'reminder';
      } else {
        return { success: false, error: 'Fatura não precisa de ação agora' };
      }

      // Enviar notificação via WhatsApp
      const result = await whatsappService[`send${notificationType.charAt(0).toUpperCase() + notificationType.slice(1)}Notification`](
        invoice,
        invoice.client,
        invoice.subscription
      );

      return result;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // HELPERS
  // ========================================

  async getInvoicesNeedingAction() {
    try {
      // Buscar todas as faturas pendentes e vencidas
      const allInvoices = await invoiceService.getAll();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return allInvoices.filter(invoice => {
        if (invoice.status !== 'pending' && invoice.status !== 'overdue') {
          return false;
        }

        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

        // Incluir se:
        // 1. Vence em até 3 dias (lembrete)
        // 2. Vence hoje
        // 3. Vencida e está no dia de escalonamento
        if (daysUntilDue <= this.config.escalation.reminderDaysBefore && daysUntilDue >= 0) {
          return true;
        }

        if (daysOverdue > 0 && this.config.escalation.overdueEscalation.includes(daysOverdue)) {
          return true;
        }

        return false;
      });
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
      return [];
    }
  }

  isWithinBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const dayOfWeek = now.getDay();

    // Verificar dia da semana
    if (!this.config.businessHours.workDays.includes(dayOfWeek)) {
      return false;
    }

    // Verificar horário
    const [startHour, startMinute] = this.config.businessHours.start.split(':').map(Number);
    const [endHour, endMinute] = this.config.businessHours.end.split(':').map(Number);

    const currentMinutes = hour * 60 + minute;
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  wasMessageSentToday(clientId) {
    const sent = this.sentToday.get(clientId);
    if (!sent) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sentDate = new Date(sent);
    sentDate.setHours(0, 0, 0, 0);

    return today.getTime() === sentDate.getTime();
  }

  markMessageSentToday(clientId) {
    this.sentToday.set(clientId, new Date().toISOString());
  }

  cleanOldSentCache() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const [clientId, timestamp] of this.sentToday.entries()) {
      const sentDate = new Date(timestamp);
      sentDate.setHours(0, 0, 0, 0);

      if (sentDate < today) {
        this.sentToday.delete(clientId);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ========================================
  // CONFIGURAÇÃO
  // ========================================

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.addLog('info', 'Configuração atualizada');
    return { success: true };
  }

  getConfig() {
    return { ...this.config };
  }

  // ========================================
  // LOGS E MÉTRICAS
  // ========================================

  addLog(level, message) {
    const log = {
      timestamp: new Date().toISOString(),
      level,
      message
    };

    this.logs.unshift(log);
    
    // Manter apenas últimos 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(0, 100);
    }

    console.log(`[${level.toUpperCase()}] ${message}`);
  }

  getLogs(limit = 50) {
    return this.logs.slice(0, limit);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.getConfig(),
      stats: {
        sentToday: this.sentToday.size,
        logsCount: this.logs.length
      }
    };
  }

  clearLogs() {
    this.logs = [];
    return { success: true };
  }

  // ========================================
  // TESTE MANUAL
  // ========================================

  async runManualCycle() {
    console.log('🔄 Executando ciclo manual...');
    this.addLog('info', 'Ciclo manual iniciado');
    
    try {
      await this.runAutomationCycle();
      return { success: true, message: 'Ciclo manual concluído' };
    } catch (error) {
      console.error('Erro no ciclo manual:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton
const automationService = new AutomationService();

// Cleanup global
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    automationService.cleanup();
  });
}

export { automationService };