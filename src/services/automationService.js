// src/services/automationService.js
import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { emailService } from './emailService';
import { whatsappService } from './whatsappService';
import { invoiceService } from './firestore';

class AutomationService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.config = {
      checkIntervalMinutes: 60, // Verificar a cada hora
      reminderDays: [3, 1], // Lembretes 3 dias antes e 1 dia antes
      escalationDays: [1, 3, 7, 15, 30], // Escalação em dias após vencimento
      maxRetries: 3,
      enableEmail: true,
      enableWhatsApp: true,
      businessHours: {
        start: 8, // 8h
        end: 18, // 18h
        weekdays: [1, 2, 3, 4, 5] // Segunda a sexta
      }
    };
  }

  // Iniciar automação
  async startAutomation() {
    if (this.isRunning) {
      console.log('⚠️ Automação já está executando');
      return { success: false, message: 'Automação já está executando' };
    }

    console.log('🚀 Iniciando automação de cobranças...');
    this.isRunning = true;
    
    // Executar uma verificação imediata
    await this.runAutomationCycle();
    
    // Configurar interval para verificações periódicas
    this.intervalId = setInterval(async () => {
      await this.runAutomationCycle();
    }, this.config.checkIntervalMinutes * 60 * 1000);

    await this.logActivity('automation_started', 'Automação iniciada pelo usuário');
    
    return { success: true, message: 'Automação iniciada com sucesso' };
  }

  // Parar automação
  async stopAutomation() {
    if (!this.isRunning) {
      console.log('⚠️ Automação não está executando');
      return { success: false, message: 'Automação não está executando' };
    }

    console.log('🛑 Parando automação de cobranças...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    await this.logActivity('automation_stopped', 'Automação parada pelo usuário');
    
    return { success: true, message: 'Automação parada com sucesso' };
  }

  // Verificar se está em horário comercial
  isBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    const isWeekday = this.config.businessHours.weekdays.includes(dayOfWeek);
    const isBusinessHour = hour >= this.config.businessHours.start && hour < this.config.businessHours.end;
    
    return isWeekday && isBusinessHour;
  }

  // Ciclo principal de automação
  async runAutomationCycle() {
    if (!this.isRunning) return;
    
    console.log('🔄 Executando ciclo de automação...', new Date().toLocaleString('pt-BR'));
    
    try {
      // 1. Buscar todas as faturas e clientes
      const invoices = await this.getAllInvoices();
      const clients = await this.getAllClients();
      
      // 2. Processar lembretes de vencimento
      await this.processReminders(invoices, clients);
      
      // 3. Processar faturas vencidas (escalação)
      await this.processOverdueInvoices(invoices, clients);
      
      // 4. Gerar novas faturas mensais (se for o dia certo)
      await this.generateMonthlyInvoices();
      
      // 5. Verificar pagamentos pendentes
      await this.checkPendingPayments(invoices, clients);
      
      await this.logActivity('automation_cycle_completed', `Ciclo concluído - ${invoices.length} faturas processadas`);
      
    } catch (error) {
      console.error('❌ Erro no ciclo de automação:', error);
      await this.logActivity('automation_cycle_error', `Erro: ${error.message}`);
    }
  }

  // Processar lembretes de vencimento
  async processReminders(invoices, clients) {
    console.log('📅 Processando lembretes de vencimento...');
    
    const today = new Date();
    const reminders = [];
    
    for (const invoice of invoices) {
      if (invoice.status !== 'pending') continue;
      
      const client = clients.find(c => c.id === invoice.clientId);
      if (!client) continue;
      
      const dueDate = new Date(invoice.dueDate);
      const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
      
      // Verificar se deve enviar lembrete
      if (this.config.reminderDays.includes(daysUntilDue)) {
        // Verificar se já foi enviado hoje
        const emailSentToday = this.config.enableEmail ? 
          await emailService.wasEmailSentToday(client.id, 'reminder') : true;
        const whatsappSentToday = this.config.enableWhatsApp ? 
          await whatsappService.wasMessageSentToday(client.id, 'reminder') : true;
        
        if (!emailSentToday || !whatsappSentToday) {
          reminders.push({ invoice, client, type: 'reminder', daysUntilDue });
        }
      }
    }
    
    // Enviar lembretes apenas em horário comercial
    if (reminders.length > 0 && this.isBusinessHours()) {
      console.log(`📨 Enviando ${reminders.length} lembretes...`);
      await this.sendNotifications(reminders);
    }
  }

  // Processar faturas vencidas (escalação)
  async processOverdueInvoices(invoices, clients) {
    console.log('⚠️ Processando faturas vencidas...');
    
    const today = new Date();
    const overdueNotifications = [];
    
    for (const invoice of invoices) {
      if (invoice.status !== 'pending' && invoice.status !== 'overdue') continue;
      
      const client = clients.find(c => c.id === invoice.clientId);
      if (!client) continue;
      
      const dueDate = new Date(invoice.dueDate);
      const daysPastDue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      
      if (daysPastDue > 0) {
        // Atualizar status para overdue se necessário
        if (invoice.status === 'pending') {
          await updateDoc(doc(db, 'invoices', invoice.id), { 
            status: 'overdue',
            overdueDate: new Date()
          });
          invoice.status = 'overdue'; // Atualizar localmente
        }
        
        // Verificar se deve enviar cobrança (baseado na escalação)
        const shouldSend = this.config.escalationDays.includes(daysPastDue);
        
        if (shouldSend) {
          const emailSentToday = this.config.enableEmail ? 
            await emailService.wasEmailSentToday(client.id, 'overdue') : true;
          const whatsappSentToday = this.config.enableWhatsApp ? 
            await whatsappService.wasMessageSentToday(client.id, 'overdue') : true;
          
          if (!emailSentToday || !whatsappSentToday) {
            overdueNotifications.push({ 
              invoice, 
              client, 
              type: 'overdue', 
              daysPastDue,
              escalationLevel: this.getEscalationLevel(daysPastDue)
            });
          }
        }
      }
    }
    
    if (overdueNotifications.length > 0 && this.isBusinessHours()) {
      console.log(`🚨 Enviando ${overdueNotifications.length} cobranças de faturas vencidas...`);
      await this.sendNotifications(overdueNotifications);
    }
  }

  // Determinar nível de escalação
  getEscalationLevel(daysPastDue) {
    if (daysPastDue <= 3) return 'gentle'; // Cobrança gentil
    if (daysPastDue <= 7) return 'firm'; // Cobrança mais firme
    if (daysPastDue <= 15) return 'urgent'; // Urgente
    return 'final'; // Última chance
  }

  // Gerar faturas mensais automaticamente
  async generateMonthlyInvoices() {
    const today = new Date();
    const isFirstDayOfMonth = today.getDate() === 1;
    
    if (!isFirstDayOfMonth) return;
    
    console.log('📄 Gerando faturas mensais automáticas...');
    
    try {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      const count = await invoiceService.generateForMonth(currentMonth, currentYear);
      
      if (count > 0) {
        await this.logActivity('monthly_invoices_generated', `${count} faturas geradas automaticamente`);
        console.log(`✅ ${count} faturas geradas automaticamente`);
        
        // Enviar notificações de novas faturas
        const newInvoices = await this.getInvoicesByGenerationDate(today);
        const clients = await this.getAllClients();
        
        const notifications = newInvoices.map(invoice => {
          const client = clients.find(c => c.id === invoice.clientId);
          return client ? { invoice, client, type: 'new_invoice' } : null;
        }).filter(Boolean);
        
        if (notifications.length > 0) {
          await this.sendNotifications(notifications);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao gerar faturas mensais:', error);
      await this.logActivity('monthly_invoices_error', `Erro: ${error.message}`);
    }
  }

  // Verificar pagamentos pendentes e enviar confirmações
  async checkPendingPayments(invoices, clients) {
    // Esta função seria expandida para integrar com APIs de pagamento
    // Por enquanto, apenas registra a verificação
    const paidInvoices = invoices.filter(inv => 
      inv.status === 'paid' && 
      inv.paidDate && 
      this.isToday(new Date(inv.paidDate))
    );
    
    if (paidInvoices.length > 0) {
      console.log(`✅ ${paidInvoices.length} pagamentos confirmados hoje`);
      
      const confirmations = paidInvoices.map(invoice => {
        const client = clients.find(c => c.id === invoice.clientId);
        return client ? { invoice, client, type: 'payment_confirmation' } : null;
      }).filter(Boolean);
      
      if (confirmations.length > 0) {
        await this.sendNotifications(confirmations);
      }
    }
  }

  // Enviar notificações (email e/ou WhatsApp)
  async sendNotifications(notifications) {
    const results = { email: [], whatsapp: [] };
    
    try {
      // Separar por tipo de notificação para melhor controle
      const emailNotifications = notifications.filter(() => this.config.enableEmail);
      const whatsappNotifications = notifications.filter(() => this.config.enableWhatsApp);
      
      // Enviar emails em lote
      if (emailNotifications.length > 0) {
        console.log(`📧 Enviando ${emailNotifications.length} emails...`);
        results.email = await emailService.sendBulkEmails(emailNotifications, 2000);
      }
      
      // Enviar WhatsApp em lote (com mais delay)
      if (whatsappNotifications.length > 0) {
        console.log(`📱 Enviando ${whatsappNotifications.length} mensagens WhatsApp...`);
        results.whatsapp = await whatsappService.sendBulkMessages(whatsappNotifications, 5000);
      }
      
      // Log dos resultados
      const totalSent = (results.email.filter(r => r.success).length || 0) + 
                       (results.whatsapp.filter(r => r.success).length || 0);
      const totalFailed = (results.email.filter(r => !r.success).length || 0) + 
                         (results.whatsapp.filter(r => !r.success).length || 0);
      
      await this.logActivity('notifications_sent', 
        `Enviadas: ${totalSent} | Falharam: ${totalFailed}`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Erro ao enviar notificações:', error);
      await this.logActivity('notifications_error', `Erro: ${error.message}`);
      return results;
    }
  }

  // Buscar todas as faturas
  async getAllInvoices() {
    try {
      const querySnapshot = await getDocs(collection(db, 'invoices'));
      const invoices = [];
      querySnapshot.forEach((doc) => {
        invoices.push({ id: doc.id, ...doc.data() });
      });
      return invoices;
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
      return [];
    }
  }

  // Buscar todos os clientes
  async getAllClients() {
    try {
      const querySnapshot = await getDocs(collection(db, 'clients'));
      const clients = [];
      querySnapshot.forEach((doc) => {
        clients.push({ id: doc.id, ...doc.data() });
      });
      return clients;
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
  }

  // Buscar faturas por data de geração
  async getInvoicesByGenerationDate(date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const q = query(
        collection(db, 'invoices'),
        where('generationDate', '>=', startOfDay),
        where('generationDate', '<=', endOfDay)
      );
      
      const querySnapshot = await getDocs(q);
      const invoices = [];
      querySnapshot.forEach((doc) => {
        invoices.push({ id: doc.id, ...doc.data() });
      });
      return invoices;
    } catch (error) {
      console.error('Erro ao buscar faturas por data:', error);
      return [];
    }
  }

  // Verificar se é hoje
  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  // Registrar atividade de automação
  async logActivity(type, description, metadata = {}) {
    try {
      await addDoc(collection(db, 'automationLogs'), {
        type,
        description,
        metadata,
        timestamp: new Date(),
        isRunning: this.isRunning
      });
    } catch (error) {
      console.error('Erro ao registrar log de automação:', error);
    }
  }

  // Obter logs de automação
  async getAutomationLogs(limit = 50) {
    try {
      const q = query(
        collection(db, 'automationLogs'),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const logs = [];
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      return logs;
    } catch (error) {
      console.error('Erro ao buscar logs de automação:', error);
      return [];
    }
  }

  // Obter estatísticas de automação
  async getAutomationStats(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const q = query(
        collection(db, 'automationLogs'),
        where('timestamp', '>=', startDate)
      );
      
      const querySnapshot = await getDocs(q);
      const logs = [];
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      
      // Calcular estatísticas
      const cyclesCompleted = logs.filter(log => log.type === 'automation_cycle_completed').length;
      const notificationsSent = logs.filter(log => log.type === 'notifications_sent').length;
      const errors = logs.filter(log => log.type.includes('error')).length;
      
      return {
        period: `${days} dias`,
        cyclesCompleted,
        notificationsSent,
        errors,
        totalLogs: logs.length,
        averageCyclesPerDay: Math.round(cyclesCompleted / days * 10) / 10,
        successRate: cyclesCompleted > 0 ? Math.round((cyclesCompleted / (cyclesCompleted + errors)) * 100) : 0
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return {
        period: `${days} dias`,
        cyclesCompleted: 0,
        notificationsSent: 0,
        errors: 0,
        totalLogs: 0,
        averageCyclesPerDay: 0,
        successRate: 0
      };
    }
  }

  // Configurar parâmetros de automação
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuração de automação atualizada:', this.config);
  }

  // Obter configuração atual
  getConfig() {
    return { ...this.config };
  }

  // Status da automação
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId ? 'ativo' : 'inativo',
      config: this.config,
      isBusinessHours: this.isBusinessHours()
    };
  }

  // Executar manualmente um ciclo
  async runManualCycle() {
    console.log('🔄 Executando ciclo manual de automação...');
    await this.logActivity('manual_cycle_started', 'Ciclo manual iniciado pelo usuário');
    await this.runAutomationCycle();
    return { success: true, message: 'Ciclo manual executado com sucesso' };
  }

  // Teste de conectividade
  async testConnections() {
    const results = {
      email: { available: false, configured: false },
      whatsapp: { available: false, connected: false }
    };
    
    // Testar configuração de email
    try {
      results.email.configured = !!(
        process.env.REACT_APP_EMAILJS_SERVICE_ID &&
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );
      results.email.available = results.email.configured;
    } catch (error) {
      console.error('Erro ao testar email:', error);
    }
    
    // Testar conexão WhatsApp
    try {
      const whatsappStatus = await whatsappService.checkConnection();
      results.whatsapp.available = true;
      results.whatsapp.connected = whatsappStatus.connected;
      results.whatsapp.state = whatsappStatus.state;
    } catch (error) {
      console.error('Erro ao testar WhatsApp:', error);
      results.whatsapp.error = error.message;
    }
    
    return results;
  }
}

export const automationService = new AutomationService();