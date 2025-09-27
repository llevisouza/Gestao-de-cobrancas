// services/WhatsAppManager.js

import { whatsappService } from './whatsappService';

class WhatsAppManager {
  constructor() {
    this.service = whatsappService;
    this.isUsingBackend = false; // Flag para alternar entre API direta e backend
    this.status = {
      connected: false,
      state: 'initializing',
      lastUpdated: null
    };
    this.initialize();
  }

  // Inicialização e verificação de status
  async initialize() {
    const connectionCheck = await this.checkConnection();
    this.updateStatus(connectionCheck);
    console.log('🏠 WhatsAppManager inicializado:', this.status);
  }

  // Atualizar status interno
  updateStatus(connectionData) {
    this.status = {
      ...this.status,
      ...connectionData,
      lastUpdated: new Date().toISOString()
    };
  }

  // Verificar conexão
  async checkConnection() {
    try {
      const result = await this.service.checkConnection();
      return result;
    } catch (error) {
      console.error('❌ Erro ao verificar conexão no WhatsAppManager:', error);
      return {
        connected: false,
        state: 'error',
        error: error.message,
        instanceName: this.service.instanceName
      };
    }
  }

  // Enviar mensagem (abstração para futura integração com backend)
  async sendMessage(type, invoice, client, subscription = null) {
    try {
      let result;
      const message = this.getTemplate(type, invoice, client, subscription);

      if (this.isUsingBackend) {
        // Lógica futura para backend (a implementar)
        console.warn('Modo backend não implementado. Usando API direta.');
      }

      switch (type) {
        case 'overdue':
          result = await this.service.sendOverdueNotification(invoice, client, subscription);
          break;
        case 'reminder':
          result = await this.service.sendReminderNotification(invoice, client, subscription);
          break;
        case 'new_invoice':
          result = await this.service.sendNewInvoiceNotification(invoice, client, subscription);
          break;
        case 'payment_confirmation':
          result = await this.service.sendPaymentConfirmation(invoice, client, subscription);
          break;
        default:
          throw new Error('Tipo de notificação inválido');
      }

      if (result.success) {
        console.log(`📤 Mensagem ${type} enviada com sucesso para ${client.name}`);
      }
      return result;
    } catch (error) {
      console.error(`❌ Erro ao enviar ${type} para ${client.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Obter template com base no tipo
  getTemplate(type, invoice, client, subscription = null) {
    switch (type) {
      case 'overdue':
        return this.service.getOverdueInvoiceTemplate(invoice, client, subscription);
      case 'reminder':
        return this.service.getReminderTemplate(invoice, client, subscription);
      case 'new_invoice':
        return this.service.getNewInvoiceTemplate(invoice, client, subscription);
      case 'payment_confirmation':
        return this.service.getPaymentConfirmedTemplate(invoice, client, subscription);
      default:
        throw new Error('Tipo de template inválido');
    }
  }

  // Envio em lote
  async sendBulkMessages(notifications, delayMs = 3000) {
    try {
      const results = await this.service.sendBulkMessages(notifications, delayMs);
      console.log(`✅ Envio em lote concluído: ${results.filter(r => r.success).length} sucessos, ${results.filter(r => !r.success).length} falhas`);
      return results;
    } catch (error) {
      console.error('❌ Erro no envio em lote:', error);
      return [];
    }
  }

  // Teste de conexão
  async testConnection(testPhone = null) {
    try {
      const result = await this.service.testConnection(testPhone);
      this.updateStatus(result.connection);
      return result;
    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
      return { connection: { connected: false, state: 'error', error: error.message }, testResult: null };
    }
  }

  // Alternar modo (futura integração com backend)
  setUseBackend(useBackend) {
    this.isUsingBackend = !!useBackend;
    console.log(`🔄 Modo alterado para ${this.isUsingBackend ? 'backend' : 'API direta'}`);
  }
}

// Instância singleton
export const whatsappManager = new WhatsAppManager();