// src/services/whatsappService.js - VERSÃO CORRIGIDA SEM MEMORY LEAKS
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';

class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.REACT_APP_WHATSAPP_API_URL;
    this.apiKey = process.env.REACT_APP_WHATSAPP_API_KEY;
    this.instanceName = process.env.REACT_APP_WHATSAPP_INSTANCE;
    
    // Configurações da empresa (padrão)
    this.companyInfo = {
      name: 'Conexão Delivery',
      phone: '(11) 99999-9999',
      email: 'contato@conexaodelivery.com',
      pixKey: '11999999999',
      website: 'www.conexaodelivery.com',
      supportHours: '8h às 18h, Segunda a Sexta'
    };

    // Listener do Firestore
    this.configUnsubscribe = null;
    
    // Inicializar quando auth estiver pronto
    this.initializeWhenReady();
  }

  // ========================================
  // INICIALIZAÇÃO CONTROLADA
  // ========================================
  
  async initializeWhenReady() {
    // Aguardar auth estar pronto
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        unsubscribeAuth(); // Limpar listener de auth
        await this.setupFirestoreListener();
      }
    });
  }

  // ========================================
  // CONFIGURAÇÕES COM FIRESTORE REAL-TIME
  // ========================================
  
  async setupFirestoreListener() {
    try {
      if (!auth.currentUser) {
        console.log('⚠️ Usuário não autenticado para listener');
        return;
      }

      const userId = auth.currentUser.uid;
      const configDocRef = doc(db, 'settings', `company_${userId}`);

      // Cleanup listener anterior se existir
      if (this.configUnsubscribe) {
        this.configUnsubscribe();
      }

      // Setup novo listener com onSnapshot
      this.configUnsubscribe = onSnapshot(
        configDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const savedConfig = docSnapshot.data();
            this.companyInfo = { ...this.companyInfo, ...savedConfig };
            console.log('✅ Configurações atualizadas via listener:', this.companyInfo.name);
          } else {
            console.log('ℹ️ Nenhuma configuração encontrada, criando padrão...');
            this.saveCompanyInfoToFirebase();
          }
        },
        (error) => {
          console.error('❌ Erro no listener de configurações:', error);
          // Fallback para localStorage
          this.loadCompanyInfoFromLocalStorage();
        }
      );

      console.log('✅ Listener de configurações ativado');
    } catch (error) {
      console.error('❌ Erro ao setup listener:', error);
      this.loadCompanyInfoFromLocalStorage();
    }
  }

  async saveCompanyInfoToFirebase() {
    try {
      if (!auth.currentUser) {
        console.error('❌ Usuário não autenticado');
        this.saveCompanyInfoToLocalStorage();
        return false;
      }

      const userId = auth.currentUser.uid;
      const configDocRef = doc(db, 'settings', `company_${userId}`);
      
      await setDoc(configDocRef, {
        ...this.companyInfo,
        updatedAt: serverTimestamp(),
        userId: userId
      }, { merge: true });
      
      console.log('✅ Configurações salvas no Firebase!');
      this.saveCompanyInfoToLocalStorage(); // Backup local
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar no Firebase:', error);
      this.saveCompanyInfoToLocalStorage();
      return false;
    }
  }

  // Fallback localStorage
  loadCompanyInfoFromLocalStorage() {
    try {
      const saved = localStorage.getItem('whatsapp_company_info');
      if (saved) {
        this.companyInfo = { ...this.companyInfo, ...JSON.parse(saved) };
        console.log('🔄 Configurações do localStorage (fallback)');
      }
    } catch (error) {
      console.error('Erro ao carregar localStorage:', error);
    }
  }

  saveCompanyInfoToLocalStorage() {
    try {
      localStorage.setItem('whatsapp_company_info', JSON.stringify(this.companyInfo));
      console.log('💾 Backup no localStorage');
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }

  async updateCompanyInfo(newInfo) {
    console.log('🔄 Atualizando configurações:', newInfo);
    this.companyInfo = { ...this.companyInfo, ...newInfo };
    return await this.saveCompanyInfoToFirebase();
  }

  getCompanyInfo() {
    return this.companyInfo;
  }

  async reloadCompanyInfo() {
    // Força reload do Firestore
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const configDocRef = doc(db, 'settings', `company_${userId}`);
      const docSnapshot = await getDoc(configDocRef);
      
      if (docSnapshot.exists()) {
        this.companyInfo = { ...this.companyInfo, ...docSnapshot.data() };
      }
    }
    return this.companyInfo;
  }

  // ========================================
  // CLEANUP (IMPORTANTE!)
  // ========================================
  
  cleanup() {
    // Limpar listener do Firestore
    if (this.configUnsubscribe) {
      this.configUnsubscribe();
      this.configUnsubscribe = null;
      console.log('🧹 Listener do WhatsApp Service limpo');
    }
  }

  // ========================================
  // TEMPLATES DE MENSAGENS
  // ========================================

  getOverdueInvoiceTemplate(invoice, client, subscription = null) {
    const clientPix = client.pix || this.companyInfo.pixKey;
    const daysOverdue = this.calculateDaysOverdue(invoice.dueDate);
    
    return `🚨 *FATURA VENCIDA - ${this.companyInfo.name.toUpperCase()}*

Olá *${client.name}*! 👋

Sua fatura está vencida há *${daysOverdue} dia${daysOverdue > 1 ? 's' : ''}*:

📋 *DETALHES DA FATURA:*
• Fatura: #${invoice.id}
• Serviço: ${subscription ? subscription.name : invoice.subscriptionName || 'Serviço'}
• Valor: *${formatCurrency(invoice.amount)}*
• Vencimento: ${formatDate(invoice.dueDate)}

💰 *FORMAS DE PAGAMENTO:*

📱 *PIX (Mais rápido):*
\`\`\`${clientPix}\`\`\`

📞 *Dúvidas?* Entre em contato:
• WhatsApp: ${this.companyInfo.phone}
• E-mail: ${this.companyInfo.email}

⏰ *Atendimento:* ${this.companyInfo.supportHours}

---
💡 *Dica:* Após o pagamento, envie o comprovante para confirmação imediata!

*${this.companyInfo.name}* - ${this.companyInfo.website || ''}`;
  }

  getReminderTemplate(invoice, client, subscription = null) {
    const clientPix = client.pix || this.companyInfo.pixKey;
    const daysUntilDue = this.calculateDaysUntilDue(invoice.dueDate);
    
    return `🔔 *LEMBRETE DE VENCIMENTO - ${this.companyInfo.name.toUpperCase()}*

Olá *${client.name}*! 👋

Sua fatura vence ${daysUntilDue === 0 ? '*hoje*' : `em *${daysUntilDue} dia${daysUntilDue > 1 ? 's' : ''}*`}:

📋 *DETALHES DA FATURA:*
• Fatura: #${invoice.id}
• Serviço: ${subscription ? subscription.name : invoice.subscriptionName || 'Serviço'}
• Valor: *${formatCurrency(invoice.amount)}*
• Vencimento: ${formatDate(invoice.dueDate)}

💰 *FORMAS DE PAGAMENTO:*

📱 *PIX (Instantâneo):*
\`\`\`${clientPix}\`\`\`

${subscription && subscription.recurrenceType === 'monthly' ? `🔄 *Plano Ativo:* ${subscription.name} - Mensalidade que vence todo dia ${subscription.dayOfMonth}` : ''}

📞 *Dúvidas?* Entre em contato:
• WhatsApp: ${this.companyInfo.phone}
• E-mail: ${this.companyInfo.email}

⏰ *Atendimento:* ${this.companyInfo.supportHours}

---
💡 *Pague antecipadamente e evite preocupações!*

*${this.companyInfo.name}* - ${this.companyInfo.website || ''}`;
  }

  getNewInvoiceTemplate(invoice, client, subscription = null) {
    const clientPix = client.pix || this.companyInfo.pixKey;
    
    return `📄 *NOVA FATURA GERADA - ${this.companyInfo.name.toUpperCase()}*

Olá *${client.name}*! 👋

Uma nova fatura foi gerada para você:

📋 *DETALHES DA FATURA:*
• Fatura: #${invoice.id}
• Serviço: ${subscription ? subscription.name : invoice.subscriptionName || 'Serviço'}
• Valor: *${formatCurrency(invoice.amount)}*
• Vencimento: ${formatDate(invoice.dueDate)}
• Data geração: ${formatDate(invoice.generationDate || new Date().toISOString().split('T')[0])}

${subscription ? `🔄 *Detalhes do Plano:*
• Nome: ${subscription.name}
• Recorrência: ${this.formatRecurrence(subscription)}
• Status: ${subscription.status === 'active' ? '✅ Ativo' : '⏸️ Pausado'}` : ''}

💰 *FORMAS DE PAGAMENTO:*

📱 *PIX (Mais rápido):*
\`\`\`${clientPix}\`\`\`

📞 *Dúvidas?* Entre em contato:
• WhatsApp: ${this.companyInfo.phone}
• E-mail: ${this.companyInfo.email}

⏰ *Atendimento:* ${this.companyInfo.supportHours}

---
💡 *Pague até a data de vencimento e mantenha seu serviço ativo!*

*${this.companyInfo.name}* - ${this.companyInfo.website || ''}`;
  }

  getPaymentConfirmedTemplate(invoice, client, subscription = null) {
    return `✅ *PAGAMENTO CONFIRMADO - ${this.companyInfo.name.toUpperCase()}*

Olá *${client.name}*! 👋

Recebemos o pagamento da sua fatura! 🎉

📋 *DETALHES DO PAGAMENTO:*
• Fatura: #${invoice.id}
• Serviço: ${subscription ? subscription.name : invoice.subscriptionName || 'Serviço'}
• Valor: *${formatCurrency(invoice.amount)}*
• Data pagamento: ${formatDate(invoice.paidDate || new Date().toISOString().split('T')[0])}

${subscription ? `🔄 *Seu plano continua ativo!*
• Próximo vencimento: ${this.calculateNextDueDate(subscription)}
• Status: ✅ Ativo e funcionando` : ''}

📧 *Comprovante:*
O comprovante oficial será enviado para ${client.email}

🎯 *Próximos passos:*
• Seu serviço segue ativo normalmente
• Próxima fatura será gerada automaticamente
• Qualquer dúvida, estamos aqui!

📞 *Suporte:*
• WhatsApp: ${this.companyInfo.phone}
• E-mail: ${this.companyInfo.email}

⏰ *Atendimento:* ${this.companyInfo.supportHours}

---
🙏 *Obrigado por escolher a ${this.companyInfo.name}!*

*${this.companyInfo.name}* - ${this.companyInfo.website || ''}`;
  }

  getFinalNoticeTemplate(invoice, client, subscription = null) {
    const clientPix = client.pix || this.companyInfo.pixKey;
    const daysOverdue = this.calculateDaysOverdue(invoice.dueDate);
    
    return `⚠️ *AVISO FINAL - ${this.companyInfo.name.toUpperCase()}*

Olá *${client.name}*,

Esta é nossa **última tentativa** de contato sobre sua fatura em atraso.

🚨 *SITUAÇÃO ATUAL:*
• Fatura: #${invoice.id}
• Serviço: ${subscription ? subscription.name : invoice.subscriptionName || 'Serviço'}
• Valor: *${formatCurrency(invoice.amount)}*
• Vencimento: ${formatDate(invoice.dueDate)}
• Dias em atraso: *${daysOverdue} dia${daysOverdue > 1 ? 's' : ''}*

⚠️ *AÇÕES NECESSÁRIAS:*
• Pagamento imediato para evitar suspensão
• Contato conosco para negociação (se necessário)

💰 *PAGUE AGORA:*

📱 *PIX:*
\`\`\`${clientPix}\`\`\`

📞 *URGENTE - Entre em contato:*
• WhatsApp: ${this.companyInfo.phone}
• E-mail: ${this.companyInfo.email}

⏰ *Atendimento:* ${this.companyInfo.supportHours}

---
⚠️ *Sem o pagamento, seu serviço pode ser suspenso a qualquer momento.*

*${this.companyInfo.name}* - ${this.companyInfo.website || ''}`;
  }

  // ========================================
  // FUNÇÕES AUXILIARES
  // ========================================

  calculateDaysOverdue(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  calculateDaysUntilDue(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  formatRecurrence(subscription) {
    switch (subscription.recurrenceType) {
      case 'daily':
        return 'Diária';
      case 'weekly':
        return 'Semanal';
      case 'monthly':
        return `Mensal (dia ${subscription.dayOfMonth})`;
      case 'custom':
        return `A cada ${subscription.recurrenceDays} dias`;
      default:
        return 'Personalizada';
    }
  }

  calculateNextDueDate(subscription) {
    const today = new Date();
    let nextDate = new Date(today);
    
    switch (subscription.recurrenceType) {
      case 'monthly':
        if (today.getDate() >= subscription.dayOfMonth) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        nextDate.setDate(subscription.dayOfMonth);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    return formatDate(nextDate.toISOString().split('T')[0]);
  }

  // ========================================
  // API WHATSAPP (EVOLUTION API)
  // ========================================

  async sendMessage(phone, message, options = {}) {
    try {
      if (!this.apiUrl || !this.apiKey || !this.instanceName) {
        throw new Error('Configuração WhatsApp incompleta');
      }

      const cleanPhone = phone.replace(/[^\d]/g, '');
      const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;

      const response = await fetch(`${this.apiUrl}/message/sendText/${this.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
        },
        body: JSON.stringify({
          number: formattedPhone,
          text: message,
          ...options
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return { success: false, error: error.message };
    }
  }

  async getInstanceStatus() {
    try {
      if (!this.apiUrl || !this.apiKey || !this.instanceName) {
        return { success: false, error: 'Configuração incompleta' };
      }

      const response = await fetch(`${this.apiUrl}/instance/connectionState/${this.instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return { success: false, error: error.message };
    }
  }

  async getQRCode() {
    try {
      if (!this.apiUrl || !this.apiKey || !this.instanceName) {
        return { success: false, error: 'Configuração incompleta' };
      }

      const response = await fetch(`${this.apiUrl}/instance/connect/${this.instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // UTILITÁRIOS
  // ========================================

  isValidPhoneNumber(phone) {
    const cleaned = phone.replace(/[^\d]/g, '');
    return cleaned.length >= 10 && cleaned.length <= 13;
  }

  formatPhoneForWhatsApp(phone) {
    const cleaned = phone.replace(/[^\d]/g, '');
    return cleaned.startsWith('55') ? cleaned : '55' + cleaned;
  }

  updateAPIConfig(config) {
    this.apiUrl = config.apiUrl || this.apiUrl;
    this.apiKey = config.apiKey || this.apiKey;
    this.instanceName = config.instanceName || this.instanceName;
  }

  getAPIConfig() {
    return {
      apiUrl: this.apiUrl,
      apiKey: this.apiKey ? '***' + this.apiKey.slice(-4) : '',
      instanceName: this.instanceName
    };
  }

  isConfigured() {
    return !!(this.apiUrl && this.apiKey && this.instanceName);
  }

  async checkConnection() {
    try {
      const status = await this.getInstanceStatus();
      return {
        connected: status.success && status.data?.state === 'open',
        data: status.data,
        error: status.error
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  // Métodos de conveniência
  async sendOverdueNotification(invoice, client, subscription = null) {
    const message = this.getOverdueInvoiceTemplate(invoice, client, subscription);
    const phone = this.formatPhoneForWhatsApp(client.phone);
    return await this.sendMessage(phone, message);
  }

  async sendReminderNotification(invoice, client, subscription = null) {
    const message = this.getReminderTemplate(invoice, client, subscription);
    const phone = this.formatPhoneForWhatsApp(client.phone);
    return await this.sendMessage(phone, message);
  }

  async sendNewInvoiceNotification(invoice, client, subscription = null) {
    const message = this.getNewInvoiceTemplate(invoice, client, subscription);
    const phone = this.formatPhoneForWhatsApp(client.phone);
    return await this.sendMessage(phone, message);
  }

  async sendPaymentConfirmation(invoice, client, subscription = null) {
    const message = this.getPaymentConfirmedTemplate(invoice, client, subscription);
    const phone = this.formatPhoneForWhatsApp(client.phone);
    return await this.sendMessage(phone, message);
  }
}

// Singleton instance
const whatsappService = new WhatsAppService();

// Cleanup global quando necessário
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    whatsappService.cleanup();
  });
}

export { whatsappService };