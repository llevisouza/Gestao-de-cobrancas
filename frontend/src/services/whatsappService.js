// src/services/whatsappService.js - VERSÃO COM FIREBASE FIRESTORE
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';

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

    // Carregar configurações do Firebase quando houver usuário
    this.loadCompanyInfoFromFirebase();
  }

  // ========================================
  // CONFIGURAÇÕES DA EMPRESA - FIREBASE
  // ========================================
  
  async loadCompanyInfoFromFirebase() {
    try {
      // Aguardar usuário estar logado
      if (!auth.currentUser) {
        console.log('🔄 Aguardando usuário para carregar configurações...');
        return;
      }

      const userId = auth.currentUser.uid;
      const configDocRef = doc(db, 'settings', `company_${userId}`);
      const configDoc = await getDoc(configDocRef);
      
      if (configDoc.exists()) {
        const savedConfig = configDoc.data();
        this.companyInfo = { ...this.companyInfo, ...savedConfig };
        console.log('✅ Configurações da empresa carregadas do Firebase:', this.companyInfo.name);
      } else {
        console.log('ℹ️ Nenhuma configuração salva encontrada, usando padrões');
        // Salvar configurações padrão no Firebase
        await this.saveCompanyInfoToFirebase();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações do Firebase:', error);
      // Fallback para localStorage temporário
      this.loadCompanyInfoFromLocalStorage();
    }
  }

  async saveCompanyInfoToFirebase() {
    try {
      if (!auth.currentUser) {
        console.error('❌ Usuário não autenticado para salvar configurações');
        // Fallback para localStorage
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
      
      console.log('✅ Configurações da empresa salvas no Firebase!');
      
      // Também salvar no localStorage como backup
      this.saveCompanyInfoToLocalStorage();
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar configurações no Firebase:', error);
      // Fallback para localStorage
      this.saveCompanyInfoToLocalStorage();
      return false;
    }
  }

  // Fallback para localStorage
  loadCompanyInfoFromLocalStorage() {
    const saved = localStorage.getItem('whatsapp_company_info');
    if (saved) {
      this.companyInfo = { ...this.companyInfo, ...JSON.parse(saved) };
      console.log('🔄 Configurações carregadas do localStorage (fallback)');
    }
  }

  saveCompanyInfoToLocalStorage() {
    localStorage.setItem('whatsapp_company_info', JSON.stringify(this.companyInfo));
    console.log('💾 Configurações salvas no localStorage (backup)');
  }

  async updateCompanyInfo(newInfo) {
    console.log('🔄 Atualizando configurações da empresa:', newInfo);
    
    // Atualizar configurações locais
    this.companyInfo = { ...this.companyInfo, ...newInfo };
    
    // Salvar no Firebase
    const firebaseSaved = await this.saveCompanyInfoToFirebase();
    
    if (!firebaseSaved) {
      console.warn('⚠️ Não foi possível salvar no Firebase, salvo apenas localmente');
    }
    
    return firebaseSaved;
  }

  getCompanyInfo() {
    return this.companyInfo;
  }

  // Método para recarregar configurações (útil quando usuário faz login)
  async reloadCompanyInfo() {
    console.log('🔄 Recarregando configurações da empresa...');
    await this.loadCompanyInfoFromFirebase();
    return this.companyInfo;
  }

  // ========================================
  // TEMPLATES DE MENSAGENS
  // ========================================

  /**
   * Template para fatura vencida
   */
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

  /**
   * Template para lembrete de vencimento
   */
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

  /**
   * Template para nova fatura gerada
   */
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

  /**
   * Template para confirmação de pagamento
   */
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

  /**
   * Template para fatura final (último aviso)
   */
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
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  calculateDaysUntilDue(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
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
        // Implementar lógica semanal se necessário
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

      const response = await fetch(`${this.apiUrl}/message/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          instance: this.instanceName,
          number: phone.replace(/[^\d]/g, ''), // Remove formatação
          message: message,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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

      const response = await fetch(`${this.apiUrl}/instance/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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

      const response = await fetch(`${this.apiUrl}/instance/qr`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // UTILITÁRIOS DE VALIDAÇÃO
  // ========================================

  isValidPhoneNumber(phone) {
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/[^\d]/g, '');
    // Telefone brasileiro: 11 dígitos (celular) ou 10 dígitos (fixo)
    return cleaned.length === 11 || cleaned.length === 10;
  }

  formatPhoneForWhatsApp(phone) {
    // Remove formatação e adiciona código do país se necessário
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.startsWith('55')) {
      return cleaned;
    }
    return '55' + cleaned;
  }

  // ========================================
  // CONFIGURAÇÃO E SETUP
  // ========================================

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

  // ========================================
  // MÉTODOS ADICIONAIS PARA COMPATIBILIDADE
  // ========================================

  async checkConnection() {
    try {
      const status = await this.getInstanceStatus();
      return {
        connected: status.success && status.data?.status === 'connected',
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

// Criar instância única (Singleton)
const whatsappService = new WhatsAppService();

export { whatsappService };