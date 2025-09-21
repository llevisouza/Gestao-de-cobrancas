// src/hooks/useWhatsAppNotifications.js - IMPLEMENTAÇÃO COMPLETA
import { useState, useEffect, useCallback } from 'react';
import { whatsappService } from '../services/whatsappService';

export const useWhatsAppNotifications = () => {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messagingStats, setMessagingStats] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Verificar conexão
  const checkConnection = useCallback(async () => {
    setLoading(true);
    try {
      const status = await whatsappService.checkConnection();
      setConnectionStatus(status);
      setIsConnected(status.connected);
      return status;
    } catch (error) {
      console.error('Erro ao verificar conexão WhatsApp:', error);
      setConnectionStatus({ connected: false, error: error.message });
      setIsConnected(false);
      return { connected: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Enviar notificação de fatura vencida
  const sendOverdueNotification = useCallback(async (invoice, client, subscription = null) => {
    if (!isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    setLoading(true);
    try {
      const result = await whatsappService.sendOverdueNotification(invoice, client, subscription);
      
      // Atualizar estatísticas após o envio
      if (result.success) {
        await getMessagingStats();
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao enviar notificação vencida:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Enviar lembrete de vencimento
  const sendReminderNotification = useCallback(async (invoice, client, subscription = null) => {
    if (!isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    setLoading(true);
    try {
      const result = await whatsappService.sendReminderNotification(invoice, client, subscription);
      
      if (result.success) {
        await getMessagingStats();
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Enviar notificação de nova fatura
  const sendNewInvoiceNotification = useCallback(async (invoice, client, subscription = null) => {
    if (!isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    setLoading(true);
    try {
      const result = await whatsappService.sendNewInvoiceNotification(invoice, client, subscription);
      
      if (result.success) {
        await getMessagingStats();
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao enviar notificação de nova fatura:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Enviar confirmação de pagamento
  const sendPaymentConfirmation = useCallback(async (invoice, client, subscription = null) => {
    if (!isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    setLoading(true);
    try {
      const result = await whatsappService.sendPaymentConfirmation(invoice, client, subscription);
      
      if (result.success) {
        await getMessagingStats();
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao enviar confirmação de pagamento:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Enviar notificações em lote
  const sendBulkNotifications = useCallback(async (notifications, delayMs = 3000) => {
    if (!isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    if (!notifications || notifications.length === 0) {
      throw new Error('Nenhuma notificação para enviar');
    }

    setLoading(true);
    try {
      const results = await whatsappService.sendBulkMessages(notifications, delayMs);
      
      // Atualizar estatísticas após envio em lote
      await getMessagingStats();
      
      return results;
    } catch (error) {
      console.error('Erro no envio em lote:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Obter estatísticas de mensagens
  const getMessagingStats = useCallback(async (days = 30) => {
    try {
      const stats = await whatsappService.getMessagingStats(days);
      setMessagingStats(stats);
      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
  }, []);

  // Obter histórico de mensagens de um cliente
  const getClientMessageHistory = useCallback(async (clientId, limit = 10) => {
    try {
      return await whatsappService.getMessageHistory(clientId, limit);
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      return [];
    }
  }, []);

  // Verificar se mensagem foi enviada hoje
  const wasMessageSentToday = useCallback(async (clientId, type) => {
    try {
      return await whatsappService.wasMessageSentToday(clientId, type);
    } catch (error) {
      console.error('Erro ao verificar mensagem do dia:', error);
      return false;
    }
  }, []);

  // Testar conexão com mensagem
  const testConnection = useCallback(async (testPhone = null) => {
    setLoading(true);
    try {
      const result = await whatsappService.testConnection(testPhone);
      setConnectionStatus(result.connection);
      setIsConnected(result.connection.connected);
      return result;
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calcular notificações pendentes (helper)
  const calculatePendingNotifications = useCallback((invoices, clients, subscriptions) => {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    const notifications = {
      overdue: [],
      reminders: [],
      newInvoices: [],
      total: 0
    };

    invoices.forEach(invoice => {
      if (!['pending', 'overdue'].includes(invoice.status)) return;
      
      const client = clients.find(c => c.id === invoice.clientId);
      const subscription = subscriptions.find(s => s.id === invoice.subscriptionId);
      
      if (!client || !client.phone) return;
      
      const dueDate = new Date(invoice.dueDate + 'T12:00:00');
      const notification = { type: null, invoice, client, subscription };
      
      if (dueDate < today) {
        notification.type = 'overdue';
        notifications.overdue.push(notification);
      } else if (dueDate <= threeDaysFromNow) {
        notification.type = 'reminder';
        notifications.reminders.push(notification);
      }
    });

    // Faturas geradas hoje
    const todayStr = today.toISOString().split('T')[0];
    invoices.forEach(invoice => {
      if (invoice.generationDate === todayStr && invoice.status === 'pending') {
        const client = clients.find(c => c.id === invoice.clientId);
        const subscription = subscriptions.find(s => s.id === invoice.subscriptionId);
        
        if (client && client.phone) {
          notifications.newInvoices.push({
            type: 'new_invoice',
            invoice,
            client,
            subscription
          });
        }
      }
    });

    notifications.total = notifications.overdue.length + 
                         notifications.reminders.length + 
                         notifications.newInvoices.length;

    return notifications;
  }, []);

  // Gerar preview de mensagem
  const generateMessagePreview = useCallback((type, invoice, client, subscription = null) => {
    try {
      switch (type) {
        case 'overdue':
          return whatsappService.getOverdueInvoiceTemplate(invoice, client, subscription);
        case 'reminder':
          return whatsappService.getReminderTemplate(invoice, client, subscription);
        case 'new_invoice':
          return whatsappService.getNewInvoiceTemplate(invoice, client, subscription);
        case 'payment_confirmation':
          return whatsappService.getPaymentConfirmedTemplate(invoice, client, subscription);
        default:
          throw new Error('Tipo de mensagem inválido');
      }
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
      throw error;
    }
  }, []);

  // Configurar informações da empresa
  const updateCompanySettings = useCallback((settings) => {
    try {
      whatsappService.updateCompanyInfo(settings);
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Validar se cliente tem WhatsApp
  const validateClientWhatsApp = useCallback((client) => {
    if (!client.phone) {
      return { valid: false, error: 'Cliente não possui telefone cadastrado' };
    }

    // Validação básica do formato do telefone
    const phoneNumbers = client.phone.replace(/\D/g, '');
    if (phoneNumbers.length < 10) {
      return { valid: false, error: 'Telefone inválido' };
    }

    return { valid: true };
  }, []);

  // Obter status da conexão formatado
  const getConnectionStatusText = useCallback(() => {
    if (!connectionStatus) return 'Verificando...';
    
    if (connectionStatus.connected) {
      return '🟢 Conectado';
    }
    
    switch (connectionStatus.state) {
      case 'connecting':
        return '🟡 Conectando...';
      case 'disconnected':
        return '🔴 Desconectado';
      case 'error':
        return '❌ Erro na conexão';
      default:
        return '⚪ Status desconhecido';
    }
  }, [connectionStatus]);

  // Auto-verificar conexão ao montar
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Verificar conexão periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        checkConnection();
      }
    }, 60000); // A cada minuto

    return () => clearInterval(interval);
  }, [loading, checkConnection]);

  // Carregar estatísticas iniciais
  useEffect(() => {
    if (isConnected) {
      getMessagingStats();
    }
  }, [isConnected, getMessagingStats]);

  return {
    // Estados
    connectionStatus,
    isConnected,
    loading,
    messagingStats,

    // Funções de conexão
    checkConnection,
    testConnection,
    getConnectionStatusText,

    // Funções de envio individual
    sendOverdueNotification,
    sendReminderNotification,
    sendNewInvoiceNotification,
    sendPaymentConfirmation,

    // Funções de envio em lote
    sendBulkNotifications,

    // Funções de dados
    getMessagingStats,
    getClientMessageHistory,
    wasMessageSentToday,

    // Funções auxiliares
    calculatePendingNotifications,
    generateMessagePreview,
    validateClientWhatsApp,
    updateCompanySettings
  };
};

// Hook simplificado para uso básico
export const useWhatsAppBasic = () => {
  const {
    isConnected,
    loading,
    sendOverdueNotification,
    sendReminderNotification,
    sendNewInvoiceNotification,
    sendPaymentConfirmation,
    checkConnection
  } = useWhatsAppNotifications();

  return {
    isConnected,
    loading,
    sendOverdueNotification,
    sendReminderNotification,
    sendNewInvoiceNotification,
    sendPaymentConfirmation,
    checkConnection
  };
};