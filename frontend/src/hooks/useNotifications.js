// src/hooks/useNotifications.js - HOOK COMPLETO PARA WHATSAPP
import { useState, useEffect, useCallback } from 'react';
import { whatsappService } from '../services/whatsappService';
import { emailService } from '../services/emailService';

export const useNotifications = () => {
  const [whatsappStatus, setWhatsappStatus] = useState({
    connected: false,
    loading: false,
    error: null
  });
  const [emailStatus, setEmailStatus] = useState({
    configured: false,
    loading: false,
    error: null
  });
  const [stats, setStats] = useState(null);

  // Verificar conexão WhatsApp
  const checkWhatsAppConnection = useCallback(async () => {
    setWhatsappStatus(prev => ({ ...prev, loading: true }));
    try {
      const status = await whatsappService.checkConnection();
      setWhatsappStatus({
        connected: status.connected,
        loading: false,
        error: null,
        state: status.state
      });
      return status;
    } catch (error) {
      setWhatsappStatus({
        connected: false,
        loading: false,
        error: error.message
      });
      return { connected: false, error: error.message };
    }
  }, []);

  // Verificar configuração de email
  const checkEmailConfiguration = useCallback(() => {
    const configured = !!(
      process.env.REACT_APP_EMAILJS_SERVICE_ID &&
      process.env.REACT_APP_EMAILJS_PUBLIC_KEY
    );
    
    setEmailStatus({
      configured,
      loading: false,
      error: configured ? null : 'EmailJS não configurado'
    });
    
    return configured;
  }, []);

  // Enviar notificação (tenta WhatsApp primeiro, depois email)
  const sendNotification = useCallback(async (type, invoice, client, subscription = null) => {
    const results = { whatsapp: null, email: null, success: false };

    // Tentar WhatsApp primeiro
    if (whatsappStatus.connected && client.phone) {
      try {
        let whatsappResult;
        switch (type) {
          case 'overdue':
            whatsappResult = await whatsappService.sendOverdueNotification(invoice, client, subscription);
            break;
          case 'reminder':
            whatsappResult = await whatsappService.sendReminderNotification(invoice, client, subscription);
            break;
          case 'new_invoice':
            whatsappResult = await whatsappService.sendNewInvoiceNotification(invoice, client, subscription);
            break;
          case 'payment_confirmation':
            whatsappResult = await whatsappService.sendPaymentConfirmation(invoice, client, subscription);
            break;
          default:
            throw new Error('Tipo de notificação inválido');
        }
        
        results.whatsapp = whatsappResult;
        if (whatsappResult.success) {
          results.success = true;
          return results;
        }
      } catch (error) {
        results.whatsapp = { success: false, error: error.message };
      }
    }

    // Fallback para email se WhatsApp falhar
    if (emailStatus.configured && client.email) {
      try {
        let emailResult;
        switch (type) {
          case 'overdue':
            emailResult = await emailService.sendOverdueNotification(invoice, client);
            break;
          case 'reminder':
            emailResult = await emailService.sendReminderNotification(invoice, client);
            break;
          case 'new_invoice':
            emailResult = await emailService.sendNewInvoiceNotification(invoice, client);
            break;
          case 'payment_confirmation':
            emailResult = await emailService.sendPaymentConfirmation(invoice, client);
            break;
          default:
            throw new Error('Tipo de notificação inválido');
        }
        
        results.email = emailResult;
        if (emailResult.success) {
          results.success = true;
        }
      } catch (error) {
        results.email = { success: false, error: error.message };
      }
    }

    return results;
  }, [whatsappStatus.connected, emailStatus.configured]);

  // Enviar notificações em lote
  const sendBulkNotifications = useCallback(async (notifications, preferWhatsApp = true) => {
    const results = [];
    
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      const { type, invoice, client, subscription } = notification;
      
      console.log(`Enviando notificação ${i + 1}/${notifications.length} para ${client.name}`);
      
      const result = await sendNotification(type, invoice, client, subscription);
      
      results.push({
        client: client.name,
        phone: client.phone,
        email: client.email,
        type,
        ...result
      });

      // Delay entre envios
      if (i < notifications.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return results;
  }, [sendNotification]);

  // Calcular notificações pendentes
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
      
      if (!client) return;
      
      const dueDate = new Date(invoice.dueDate);
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
        
        if (client) {
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

  // Obter estatísticas
  const getNotificationStats = useCallback(async (days = 30) => {
    try {
      const [whatsappStats, emailStats] = await Promise.all([
        whatsappService.getMessagingStats(days),
        emailService.getEmailHistory ? emailService.getEmailHistory(null, 100) : Promise.resolve([])
      ]);

      const stats = {
        period: `${days} dias`,
        whatsapp: whatsappStats || { total: 0, successful: 0, failed: 0 },
        email: {
          total: emailStats.length,
          successful: emailStats.filter(e => e.status === 'sent').length,
          failed: emailStats.filter(e => e.status === 'failed').length
        },
        totalSent: (whatsappStats?.successful || 0) + emailStats.filter(e => e.status === 'sent').length,
        channels: {
          whatsapp: whatsappStatus.connected,
          email: emailStatus.configured
        }
      };

      setStats(stats);
      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
  }, [whatsappStatus.connected, emailStatus.configured]);

  // Testar canais de notificação
  const testNotificationChannels = useCallback(async (testData) => {
    const results = { whatsapp: null, email: null };

    // Testar WhatsApp
    if (whatsappStatus.connected) {
      try {
        results.whatsapp = await whatsappService.testConnection(testData.phone);
      } catch (error) {
        results.whatsapp = { success: false, error: error.message };
      }
    }

    // Testar Email
    if (emailStatus.configured && testData.email) {
      // EmailJS não tem função de teste nativa, então simulamos
      results.email = { 
        success: true, 
        message: 'Email configurado corretamente' 
      };
    }

    return results;
  }, [whatsappStatus.connected, emailStatus.configured]);

  // Auto-verificação ao montar
  useEffect(() => {
    checkWhatsAppConnection();
    checkEmailConfiguration();
  }, [checkWhatsAppConnection, checkEmailConfiguration]);

  // Verificação periódica da conexão WhatsApp
  useEffect(() => {
    const interval = setInterval(() => {
      if (!whatsappStatus.loading) {
        checkWhatsAppConnection();
      }
    }, 60000); // A cada minuto

    return () => clearInterval(interval);
  }, [checkWhatsAppConnection, whatsappStatus.loading]);

  return {
    // Status dos canais
    whatsappStatus,
    emailStatus,
    isWhatsAppConnected: whatsappStatus.connected,
    isEmailConfigured: emailStatus.configured,
    
    // Funções principais
    sendNotification,
    sendBulkNotifications,
    calculatePendingNotifications,
    
    // Verificações
    checkWhatsAppConnection,
    checkEmailConfiguration,
    testNotificationChannels,
    
    // Estatísticas
    stats,
    getNotificationStats,
    
    // Utilitários
    getConnectionStatusText: () => {
      if (whatsappStatus.loading) return 'Verificando...';
      if (whatsappStatus.connected) return '🟢 Conectado';
      return whatsappStatus.error ? `❌ ${whatsappStatus.error}` : '🔴 Desconectado';
    }
  };
};

// Hook simplificado apenas para WhatsApp
export const useWhatsAppNotifications = () => {
  const fullHook = useNotifications();
  
  return {
    // Estados
    connectionStatus: fullHook.whatsappStatus,
    isConnected: fullHook.isWhatsAppConnected,
    loading: fullHook.whatsappStatus.loading,

    // Funções específicas WhatsApp
    sendOverdueNotification: async (invoice, client, subscription) => {
      const result = await whatsappService.sendOverdueNotification(invoice, client, subscription);
      return result;
    },
    
    sendReminderNotification: async (invoice, client, subscription) => {
      const result = await whatsappService.sendReminderNotification(invoice, client, subscription);
      return result;
    },
    
    sendNewInvoiceNotification: async (invoice, client, subscription) => {
      const result = await whatsappService.sendNewInvoiceNotification(invoice, client, subscription);
      return result;
    },
    
    sendPaymentConfirmation: async (invoice, client, subscription) => {
      const result = await whatsappService.sendPaymentConfirmation(invoice, client, subscription);
      return result;
    },

    sendBulkNotifications: async (notifications, delayMs = 3000) => {
      return await whatsappService.sendBulkMessages(notifications, delayMs);
    },

    // Funções utilitárias
    calculatePendingNotifications: fullHook.calculatePendingNotifications,
    checkConnection: fullHook.checkWhatsAppConnection,
    getConnectionStatusText: fullHook.getConnectionStatusText,
    testConnection: whatsappService.testConnection
  };
};