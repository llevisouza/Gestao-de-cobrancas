// src/hooks/useWhatsAppAutomation.js - HOOK PARA AUTOMAÇÃO
import { useState, useEffect } from 'react';
import { whatsappAutomationService } from '../services/whatsappAutomationService';

export const useWhatsAppAutomation = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [config, setConfig] = useState({});
  const [stats, setStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const currentStats = whatsappAutomationService.getStats();
      const currentConfig = whatsappAutomationService.getConfig();
      
      setIsRunning(currentStats.isRunning);
      setStats(currentStats);
      setConfig(currentConfig);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Iniciar automação
  const startAutomation = async () => {
    setLoading(true);
    try {
      const result = await whatsappAutomationService.startAutomation();
      if (result.success) {
        await loadData();
      }
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Parar automação
  const stopAutomation = async () => {
    setLoading(true);
    try {
      const result = await whatsappAutomationService.stopAutomation();
      if (result.success) {
        await loadData();
      }
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Executar ciclo manual
  const runManualCycle = async () => {
    setLoading(true);
    try {
      const result = await whatsappAutomationService.runManualCycle();
      await loadData();
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Atualizar configuração
  const updateConfig = (newConfig) => {
    try {
      whatsappAutomationService.updateConfig(newConfig);
      setConfig({ ...config, ...newConfig });
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    isRunning,
    config,
    stats,
    logs,
    loading,
    error,
    startAutomation,
    stopAutomation,
    runManualCycle,
    updateConfig,
    loadData
  };
};

// src/hooks/useWhatsAppConnection.js - HOOK PARA CONEXÃO
import { useState, useEffect, useCallback } from 'react';
import { whatsappService } from '../services/whatsappService';

export const useWhatsAppConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState(null);

  // Verificar conexão
  const checkConnection = useCallback(async () => {
    setLoading(true);
    try {
      const status = await whatsappService.checkConnection();
      setConnectionStatus(status);
      setError(null);
      return status;
    } catch (err) {
      setError(err.message);
      setConnectionStatus({ connected: false, error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  // Obter QR Code
  const getQRCode = useCallback(async () => {
    setLoading(true);
    try {
      const result = await whatsappService.getQRCode();
      if (result.success) {
        setQrCode(result.qrCode);
      }
      return result;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Testar conexão
  const testConnection = useCallback(async (testPhone) => {
    setLoading(true);
    try {
      const result = await whatsappService.testConnection(testPhone);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-verificar conexão
  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 60000); // A cada minuto
    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    connectionStatus,
    isConnected: connectionStatus?.connected || false,
    loading,
    qrCode,
    error,
    checkConnection,
    getQRCode,
    testConnection
  };
};

// src/hooks/useWhatsAppTemplates.js - HOOK PARA TEMPLATES
import { useState, useEffect } from 'react';
import { whatsappService } from '../services/whatsappService';

export const useWhatsAppTemplates = () => {
  const [templates, setTemplates] = useState({});
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Conexão Delivery',
    phone: '(11) 99999-9999',
    email: 'contato@conexaodelivery.com',
    pixKey: '11999999999',
    website: 'www.conexaodelivery.com',
    supportHours: '8h às 18h, Segunda a Sexta'
  });
  const [loading, setLoading] = useState(false);

  // Carregar templates salvos
  useEffect(() => {
    const savedTemplates = {};
    const templateTypes = ['overdue', 'reminder', 'new_invoice', 'payment_confirmed'];
    
    templateTypes.forEach(type => {
      const saved = localStorage.getItem(`whatsapp_template_${type}`);
      if (saved) {
        savedTemplates[type] = saved;
      }
    });
    
    setTemplates(savedTemplates);
  }, []);

  // Salvar template
  const saveTemplate = async (type, template) => {
    setLoading(true);
    try {
      localStorage.setItem(`whatsapp_template_${type}`, template);
      setTemplates(prev => ({ ...prev, [type]: template }));
      
      // Atualizar no serviço
      whatsappService.customTemplates = whatsappService.customTemplates || {};
      whatsappService.customTemplates[type] = template;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Gerar preview de template
  const generatePreview = (type, mockData) => {
    const template = templates[type];
    if (!template) return '';

    // Substituir variáveis
    let preview = template;
    const replacements = {
      '{{client.name}}': mockData.client?.name || 'Cliente',
      '{{client.phone}}': mockData.client?.phone || '(11) 99999-9999',
      '{{invoice.amount}}': `R$ ${mockData.invoice?.amount?.toFixed(2).replace('.', ',') || '0,00'}`,
      '{{invoice.dueDate}}': mockData.invoice?.dueDate || '01/01/2024',
      '{{company.name}}': companyInfo.name,
      '{{company.phone}}': companyInfo.phone,
      '{{company.pix}}': companyInfo.pixKey
    };

    Object.entries(replacements).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return preview;
  };

  // Atualizar informações da empresa
  const updateCompanyInfo = (newInfo) => {
    const updated = { ...companyInfo, ...newInfo };
    setCompanyInfo(updated);
    whatsappService.updateCompanyInfo(updated);
  };

  return {
    templates,
    companyInfo,
    loading,
    saveTemplate,
    generatePreview,
    updateCompanyInfo
  };
};

// src/hooks/useWhatsAppAnalytics.js - HOOK PARA ANALYTICS
import { useState, useEffect, useCallback } from 'react';
import { whatsappService } from '../services/whatsappService';
import { whatsappAutomationService } from '../services/whatsappAutomationService';

export const useWhatsAppAnalytics = () => {
  const [stats, setStats] = useState({});
  const [performanceReport, setPerformanceReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar estatísticas básicas
  const loadStats = useCallback(async (days = 30) => {
    setLoading(true);
    try {
      const messagingStats = await whatsappService.getMessagingStats(days);
      const automationStats = whatsappAutomationService.getStats();
      
      setStats({
        messaging: messagingStats,
        automation: automationStats,
        period: days
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Gerar relatório de performance
  const generatePerformanceReport = useCallback(async (days = 7) => {
    setLoading(true);
    try {
      const report = await whatsappAutomationService.getPerformanceReport(days);
      setPerformanceReport(report);
      return report;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calcular métricas avançadas
  const calculateAdvancedMetrics = useCallback((invoices, clients) => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentInvoices = invoices.filter(inv => 
      new Date(inv.createdAt) >= thirtyDaysAgo
    );

    const metrics = {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'active').length,
      totalInvoices: recentInvoices.length,
      paidInvoices: recentInvoices.filter(inv => inv.status === 'paid').length,
      overdueInvoices: recentInvoices.filter(inv => inv.status === 'overdue').length,
      totalRevenue: recentInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0),
      averageInvoiceValue: recentInvoices.length > 0 
        ? recentInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0) / recentInvoices.length
        : 0,
      paymentRate: recentInvoices.length > 0 
        ? (recentInvoices.filter(inv => inv.status === 'paid').length / recentInvoices.length) * 100
        : 0
    };

    return metrics;
  }, []);

  // Auto-atualização de stats
  useEffect(() => {
    loadStats();
    const interval = setInterval(() => loadStats(), 300000); // A cada 5 minutos
    return () => clearInterval(interval);
  }, [loadStats]);

  return {
    stats,
    performanceReport,
    loading,
    error,
    loadStats,
    generatePerformanceReport,
    calculateAdvancedMetrics
  };
};

// src/hooks/useWhatsAppBulkSender.js - HOOK PARA ENVIO EM LOTE
import { useState, useCallback } from 'react';
import { whatsappService } from '../services/whatsappService';

export const useWhatsAppBulkSender = () => {
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [currentSending, setCurrentSending] = useState(null);

  // Enviar notificações em lote
  const sendBulkNotifications = useCallback(async (notifications, delayMs = 3000) => {
    setSending(true);
    setProgress(0);
    setResults([]);
    
    const totalNotifications = notifications.length;
    const batchResults = [];

    for (let i = 0; i < totalNotifications; i++) {
      const notification = notifications[i];
      setCurrentSending(notification);
      
      try {
        let result;
        switch (notification.type) {
          case 'overdue':
            result = await whatsappService.sendOverdueNotification(
              notification.invoice, 
              notification.client, 
              notification.subscription
            );
            break;
          case 'reminder':
            result = await whatsappService.sendReminderNotification(
              notification.invoice, 
              notification.client, 
              notification.subscription
            );
            break;
          case 'new_invoice':
            result = await whatsappService.sendNewInvoiceNotification(
              notification.invoice, 
              notification.client, 
              notification.subscription
            );
            break;
          default:
            result = { success: false, error: 'Tipo inválido' };
        }

        const resultWithData = {
          ...result,
          client: notification.client.name,
          phone: notification.client.phone,
          type: notification.type,
          amount: notification.invoice.amount
        };

        batchResults.push(resultWithData);
        setResults([...batchResults]);
        
      } catch (error) {
        batchResults.push({
          success: false,
          error: error.message,
          client: notification.client.name,
          phone: notification.client.phone,
          type: notification.type,
          amount: notification.invoice.amount
        });
      }

      // Atualizar progresso
      setProgress(((i + 1) / totalNotifications) * 100);

      // Delay entre envios
      if (i < totalNotifications - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    setSending(false);
    setCurrentSending(null);
    return batchResults;
  }, []);

  // Resetar estado
  const reset = useCallback(() => {
    setSending(false);
    setProgress(0);
    setResults([]);
    setCurrentSending(null);
  }, []);

  return {
    sending,
    progress,
    results,
    currentSending,
    sendBulkNotifications,
    reset
  };
};

export default {
  useWhatsAppAutomation,
  useWhatsAppConnection,
  useWhatsAppTemplates,
  useWhatsAppAnalytics,
  useWhatsAppBulkSender
};