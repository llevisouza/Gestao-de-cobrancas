// src/services/whatsappService.js - VERSÃO CORRIGIDA PARA PRODUCTION
import { formatCurrency, formatDate } from '../utils/formatters';

class WhatsAppService {
  constructor() {
    // Configuração da Evolution API
    this.baseURL = process.env.REACT_APP_WHATSAPP_API_URL || 'https://gestaodecobrancas.ddns.net';
    this.apiKey = process.env.REACT_APP_WHATSAPP_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
    this.instanceName = process.env.REACT_APP_WHATSAPP_INSTANCE || 'main';
    
    // URL do servidor de automação (sua VM)
    this.automationServerURL = process.env.REACT_APP_AUTOMATION_SERVER_URL || 'http://localhost:3001';

    // Informações da empresa (carregadas do localStorage)
    this.companyInfo = this.loadCompanyInfo();

    console.log('🔧 WhatsApp Service inicializado:');
    console.log(`   Evolution API: ${this.baseURL}`);
    console.log(`   Instance: ${this.instanceName}`);
    console.log(`   Automation Server: ${this.automationServerURL}`);
  }

  // =============================================
  // CONEXÃO E STATUS
  // =============================================

  // Verificar status da conexão diretamente na Evolution API
  async checkConnection() {
    try {
      console.log('🔍 Verificando conexão WhatsApp...');
      
      const response = await fetch(
        `${this.baseURL}/instance/connectionState/${this.instanceName}`, 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.apiKey
          },
          timeout: 10000
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const isConnected = data.instance?.state === 'open';
      
      console.log(`📱 WhatsApp Status: ${isConnected ? 'Conectado' : 'Desconectado'}`);
      
      return {
        connected: isConnected,
        state: data.instance?.state || 'unknown',
        instanceName: this.instanceName,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao verificar conexão:', error);
      return {
        connected: false,
        state: 'error',
        error: error.message,
        instanceName: this.instanceName
      };
    }
  }

  // Obter QR Code para conexão
  async getQRCode() {
    try {
      console.log('📱 Gerando QR Code...');
      
      const response = await fetch(
        `${this.baseURL}/instance/connect/${this.instanceName}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.apiKey
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      let qrCode = data.base64 || data.qrcode?.base64;
      
      // Garantir formato base64 correto
      if (qrCode && !qrCode.startsWith('data:')) {
        qrCode = `data:image/png;base64,${qrCode}`;
      }

      return {
        success: true,
        qrCode: qrCode,
        pairingCode: data.pairingCode || data.code
      };
    } catch (error) {
      console.error('❌ Erro ao obter QR Code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Testar conexão com envio opcional
  async testConnection(testPhone = null) {
    try {
      console.log('🧪 Testando conexão...');
      
      // Primeiro verificar status
      const connectionStatus = await this.checkConnection();
      
      if (!connectionStatus.connected) {
        return {
          connection: connectionStatus,
          testResult: null
        };
      }

      // Se tem telefone, enviar mensagem de teste
      let testResult = null;
      if (testPhone) {
        const cleanPhone = this.formatPhoneNumber(testPhone);
        const message = `🧪 *TESTE DE CONEXÃO*\n\nSua API WhatsApp está funcionando perfeitamente!\n\n✅ Sistema: ${this.companyInfo.name}\n📱 Integração: Evolution API\n🕐 ${new Date().toLocaleString('pt-BR')}`;
        
        testResult = await this.sendMessage(cleanPhone, message);
      }

      return {
        connection: connectionStatus,
        testResult
      };
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      return {
        connection: { connected: false, error: error.message },
        testResult: { success: false, error: error.message }
      };
    }
  }

  // =============================================
  // ENVIO DE MENSAGENS
  // =============================================

  // Método base para enviar mensagem
  async sendMessage(phone, message) {
    try {
      const cleanPhone = this.formatPhoneNumber(phone);
      
      if (!cleanPhone) {
        throw new Error('Número de telefone inválido');
      }

      console.log(`📤 Enviando mensagem para ${cleanPhone}...`);
      
      const response = await fetch(
        `${this.baseURL}/message/sendText/${this.instanceName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.apiKey
          },
          body: JSON.stringify({
            number: cleanPhone,
            textMessage: {
              text: message
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || `HTTP ${response.status}`);
      }

      console.log(`✅ Mensagem enviada com sucesso para ${cleanPhone}`);
      
      return {
        success: true,
        messageId: data.key?.id || data.messageId,
        response: data
      };
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem para ${phone}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =============================================
  // NOTIFICAÇÕES DE COBRANÇA
  // =============================================

  // Fatura vencida
  async sendOverdueNotification(invoice, client, subscription = null) {
    const message = this.getOverdueTemplate(invoice, client, subscription);
    return await this.sendMessage(client.phone, message);
  }

  // Lembrete de vencimento
  async sendReminderNotification(invoice, client, subscription = null) {
    const message = this.getReminderTemplate(invoice, client, subscription);
    return await this.sendMessage(client.phone, message);
  }

  // Nova fatura
  async sendNewInvoiceNotification(invoice, client, subscription = null) {
    const message = this.getNewInvoiceTemplate(invoice, client, subscription);
    return await this.sendMessage(client.phone, message);
  }

  // Confirmação de pagamento
  async sendPaymentConfirmation(invoice, client, subscription = null) {
    const message = this.getPaymentTemplate(invoice, client, subscription);
    return await this.sendMessage(client.phone, message);
  }

  // =============================================
  // AUTOMAÇÃO SERVER (BACKEND)
  // =============================================

  // Iniciar automação no servidor
  async startAutomation() {
    try {
      console.log('🚀 Iniciando automação no servidor...');
      
      const response = await fetch(`${this.automationServerURL}/automation/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Automação iniciada no servidor');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao iniciar automação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Parar automação no servidor
  async stopAutomation() {
    try {
      console.log('🛑 Parando automação no servidor...');
      
      const response = await fetch(`${this.automationServerURL}/automation/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Automação parada no servidor');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao parar automação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verificar status da automação
  async getAutomationStatus() {
    try {
      const response = await fetch(`${this.automationServerURL}/automation/status`);
      const status = await response.json();
      
      return {
        success: true,
        ...status
      };
    } catch (error) {
      console.error('❌ Erro ao verificar status da automação:', error);
      return {
        success: false,
        isRunning: false,
        error: error.message
      };
    }
  }

  // Executar ciclo manual
  async runManualCycle() {
    try {
      console.log('🔄 Executando ciclo manual...');
      
      const response = await fetch(`${this.automationServerURL}/automation/run-cycle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Ciclo manual executado');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro no ciclo manual:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =============================================
  // ENVIO EM LOTE
  // =============================================

  // Enviar mensagens em lote
  async sendBulkMessages(notifications, delayMs = 3000) {
    try {
      console.log(`🔄 Iniciando envio em lote de ${notifications.length} mensagens...`);
      
      const results = [];
      let successful = 0;
      let failed = 0;

      for (let i = 0; i < notifications.length; i++) {
        const notification = notifications[i];
        const { type, invoice, client, subscription } = notification;
        
        console.log(`📤 Enviando ${i + 1}/${notifications.length}: ${type} para ${client.name}`);
        
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
            case 'payment_confirmation':
              result = await this.sendPaymentConfirmation(invoice, client, subscription);
              break;
            default:
              throw new Error(`Tipo de notificação inválido: ${type}`);
          }
          
          results.push({
            client: client.name,
            phone: client.phone,
            type,
            amount: invoice.amount,
            ...result
          });
          
          if (result.success) {
            successful++;
          } else {
            failed++;
          }
          
        } catch (error) {
          console.error(`❌ Erro ao enviar para ${client.name}:`, error);
          results.push({
            client: client.name,
            phone: client.phone,
            type,
            amount: invoice.amount,
            success: false,
            error: error.message
          });
          failed++;
        }
        
        // Delay entre mensagens (exceto na última)
        if (i < notifications.length - 1) {
          console.log(`⏳ Aguardando ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      console.log(`✅ Envio em lote concluído: ${successful} sucessos, ${failed} falhas`);
      
      return {
        success: true,
        results,
        summary: {
          total: results.length,
          successful,
          failed,
          successRate: results.length > 0 ? Math.round((successful / results.length) * 100) : 0
        }
      };
    } catch (error) {
      console.error('❌ Erro no envio em lote:', error);
      throw error;
    }
  }

  // =============================================
  // TEMPLATES DE MENSAGEM
  // =============================================

  getOverdueTemplate(invoice, client, subscription = null) {
    const daysOverdue = this.calculateDaysOverdue(invoice.dueDate);
    
    let message = `🚨 *FATURA VENCIDA* 🚨

Olá *${client.name}*! 👋

Sua fatura está *${daysOverdue} dias em atraso* e precisa ser regularizada.

💰 *RESUMO DA COBRANÇA*
💵 Valor: *${formatCurrency(invoice.amount)}*
📅 Vencimento: ${formatDate(invoice.dueDate)}
⚠️ Dias em atraso: *${daysOverdue} dias*
🆔 Código: #${invoice.id?.substring(0, 8)}`;

    if (subscription) {
      message += `\n🔄 *PLANO: ${subscription.name}*`;
    }

    message += `\n\n💳 *PAGUE AGORA VIA PIX*
🔑 Chave PIX: *${this.companyInfo.pixKey}*

📞 ${this.companyInfo.name} - ${this.companyInfo.phone}`;

    return message;
  }

  getReminderTemplate(invoice, client, subscription = null) {
    const daysUntil = this.calculateDaysUntil(invoice.dueDate);
    
    let message = `🔔 *LEMBRETE DE PAGAMENTO* 🔔

Oi *${client.name}*! 😊

Sua fatura vence em *${daysUntil}*. Que tal já garantir o pagamento?

💰 *DETALHES DO PAGAMENTO*
💵 Valor: *${formatCurrency(invoice.amount)}*
📅 Vencimento: ${formatDate(invoice.dueDate)}
⏰ Faltam: *${daysUntil}*
🆔 Código: #${invoice.id?.substring(0, 8)}`;

    if (subscription) {
      message += `\n🔄 *PLANO: ${subscription.name}*`;
    }

    message += `\n\n💳 *PIX PARA PAGAMENTO*
🔑 Chave PIX: *${this.companyInfo.pixKey}*

📞 ${this.companyInfo.name} - ${this.companyInfo.phone}`;

    return message;
  }

  getNewInvoiceTemplate(invoice, client, subscription = null) {
    let message = `📄 *NOVA FATURA DISPONÍVEL* 📄

Olá *${client.name}*! 👋

Uma nova fatura foi gerada para você!

💰 *INFORMAÇÕES DA FATURA*
💵 Valor: *${formatCurrency(invoice.amount)}*
📅 Vencimento: ${formatDate(invoice.dueDate)}
📋 Gerada em: ${formatDate(invoice.generationDate || new Date())}
🆔 Código: #${invoice.id?.substring(0, 8)}`;

    if (subscription) {
      message += `\n🔄 *SEU PLANO: ${subscription.name}*\nAtivo e em funcionamento ✅`;
    }

    message += `\n\n💳 *PAGAMENTO VIA PIX*
🔑 Chave PIX: *${this.companyInfo.pixKey}*

📞 ${this.companyInfo.name} - ${this.companyInfo.phone}`;

    return message;
  }

  getPaymentTemplate(invoice, client, subscription = null) {
    let message = `✅ *PAGAMENTO CONFIRMADO* ✅

*${client.name}*, seu pagamento foi confirmado! 🎉

💰 *COMPROVANTE DE PAGAMENTO*
✅ Status: *PAGO*
💵 Valor: ${formatCurrency(invoice.amount)}
📅 Pago em: ${formatDate(invoice.paidDate || new Date())}
🆔 Código: #${invoice.id?.substring(0, 8)}`;

    if (subscription) {
      message += `\n\n🔄 *PLANO RENOVADO: ${subscription.name}*
Válido até a próxima cobrança
Status: Ativo e funcionando ✅`;
    }

    message += `\n\n🎯 *PRÓXIMOS PASSOS:*
• ✅ Pagamento processado
• 📱 Comprovante salvo
• 🔄 Próxima fatura em breve
• 🏆 Obrigado pela preferência!

📞 ${this.companyInfo.name} - ${this.companyInfo.phone}`;

    return message;
  }

  // =============================================
  // HISTÓRICO E ESTATÍSTICAS
  // =============================================

  // Obter histórico de mensagens de um cliente
  async getMessageHistory(clientId, limit = 10) {
    try {
      // Implementar busca no Firestore ou logs locais
      // Por enquanto, retorna array vazio
      return [];
    } catch (error) {
      console.error('❌ Erro ao obter histórico:', error);
      return [];
    }
  }

  // Verificar se mensagem foi enviada hoje
  async wasMessageSentToday(clientId, type) {
    try {
      // Implementar verificação no Firestore
      // Por enquanto, sempre retorna false
      return false;
    } catch (error) {
      console.error('❌ Erro ao verificar mensagem do dia:', error);
      return false;
    }
  }

  // Obter estatísticas de mensagens
  async getMessagingStats(days = 30) {
    try {
      // Por enquanto, retorna dados mock
      return {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        period: `${days} dias`
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        period: `${days} dias`
      };
    }
  }

  // =============================================
  // CONFIGURAÇÕES DA EMPRESA
  // =============================================

  updateCompanyInfo(newInfo) {
    this.companyInfo = { ...this.companyInfo, ...newInfo };
    console.log('✅ Informações da empresa atualizadas');
    
    try {
      localStorage.setItem('whatsapp_company_info', JSON.stringify(this.companyInfo));
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao salvar informações:', error);
      return { success: false, error: error.message };
    }
  }

  loadCompanyInfo() {
    try {
      const saved = localStorage.getItem('whatsapp_company_info');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar informações da empresa:', error);
    }
    
    // Retorna configurações padrão
    return {
      name: 'Conexão Delivery',
      phone: '(11) 99999-9999',
      email: 'contato@conexaodelivery.com',
      pixKey: '11999999999',
      website: 'www.conexaodelivery.com',
      supportHours: '8h às 18h, Segunda a Sexta'
    };
  }

  // =============================================
  // FUNÇÕES UTILITÁRIAS
  // =============================================

  // Formatar número de telefone
  formatPhoneNumber(phone) {
    if (!phone) return '';

    // Remove todos os caracteres não numéricos
    let cleanPhone = phone.replace(/\D/g, '');

    // Verifica se o número tem pelo menos 10 dígitos
    if (cleanPhone.length < 10) {
      console.warn(`⚠️ Número inválido: ${phone}`);
      return '';
    }

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

  // Calcular dias em atraso
  calculateDaysOverdue(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  // Calcular dias até vencimento
  calculateDaysUntil(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'hoje';
    if (diffDays === 1) return '1 dia';
    if (diffDays > 1) return `${diffDays} dias`;
    return 'vencida';
  }

  // Validar cliente para WhatsApp
  validateClientWhatsApp(client) {
    if (!client.phone) {
      return { valid: false, error: 'Cliente não possui telefone cadastrado' };
    }

    const cleanPhone = this.formatPhoneNumber(client.phone);
    if (!cleanPhone) {
      return { valid: false, error: 'Telefone inválido' };
    }

    return { valid: true, phone: cleanPhone };
  }
}

// Instância singleton
export const whatsappService = new WhatsAppService();