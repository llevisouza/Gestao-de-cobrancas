// utils/invoiceStatusUtils.js - Versão Corrigida

import { getDaysDifference, getDaysInfo, formatDaysText } from './dateUtils';
import { getCurrentDate } from './dateUtils';

/**
 * Determina o status correto de uma fatura baseado na data de vencimento
 * @param {Object} invoice - Objeto da fatura
 * @returns {string} Status corrigido
 */
export const getCorrectedInvoiceStatus = (invoice) => {
  if (!invoice) return 'unknown';
  
  // Se já foi paga, mantém como paga
  if (invoice.status === 'paid' || invoice.status === 'pago') {
    return 'paid';
  }
  
  // Se está cancelada, mantém cancelada
  if (invoice.status === 'cancelled' || invoice.status === 'cancelada') {
    return 'cancelled';
  }
  
  // Para faturas pendentes, verifica se está vencida
  const diffDays = getDaysDifference(invoice.dueDate);
  
  if (diffDays < 0) {
    return 'overdue'; // Vencida
  } else {
    return 'pending'; // Pendente
  }
};

/**
 * Obtém informações padronizadas sobre os dias de uma fatura
 * @param {Object} invoice - Objeto da fatura
 * @returns {Object} Informações dos dias
 */
export const getStandardizedDaysInfo = (invoice) => {
  const diffDays = getDaysDifference(invoice.dueDate);
  const daysInfo = getDaysInfo(invoice.dueDate);
  
  return {
    ...daysInfo,
    isOverdue: diffDays < 0,
    daysDiff: diffDays,
    text: formatDaysText(diffDays),
    bgClass: getBgClass(diffDays),
    class: getTextClass(diffDays)
  };
};

/**
 * Retorna a classe de background baseada nos dias
 * @param {number} diffDays - Diferença em dias
 * @returns {string} Classe CSS
 */
const getBgClass = (diffDays) => {
  if (diffDays < 0) return 'bg-red-50';
  if (diffDays === 0) return 'bg-orange-50';
  if (diffDays <= 3) return 'bg-yellow-50';
  return 'bg-gray-50';
};

/**
 * Retorna a classe de texto baseada nos dias
 * @param {number} diffDays - Diferença em dias
 * @returns {string} Classe CSS
 */
const getTextClass = (diffDays) => {
  if (diffDays < 0) return 'text-red-700';
  if (diffDays === 0) return 'text-orange-700';
  if (diffDays <= 3) return 'text-yellow-700';
  return 'text-gray-700';
};

/**
 * Processa uma lista de faturas aplicando status padronizados
 * @param {Array} invoices - Lista de faturas
 * @returns {Array} Faturas com status corrigidos
 */
export const processInvoicesStandardized = (invoices) => {
  return invoices.map(invoice => ({
    ...invoice,
    status: getCorrectedInvoiceStatus(invoice),
    daysInfo: getStandardizedDaysInfo(invoice)
  }));
};

/**
 * Calcula notificações pendentes de forma padronizada
 * @param {Array} invoices - Lista de faturas
 * @param {Array} clients - Lista de clientes
 * @param {Array} subscriptions - Lista de assinaturas
 * @returns {Object} Notificações organizadas por tipo
 */
export const calculatePendingNotificationsStandardized = (invoices, clients, subscriptions) => {
  const today = new Date();
  // const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
  
  const notifications = {
    overdue: [],
    reminders: [],
    newInvoices: [],
    total: 0
  };
  
  // Processar faturas para notificações
  invoices.forEach(invoice => {
    const correctedStatus = getCorrectedInvoiceStatus(invoice);
    
    // Só processar faturas pendentes ou vencidas
    if (!['pending', 'overdue'].includes(correctedStatus)) return;
    
    const client = clients.find(c => c.id === invoice.clientId);
    const subscription = subscriptions.find(s => s.id === invoice.subscriptionId);
    
    // Cliente deve existir e ter telefone
    if (!client || !client.phone) return;
    
    const diffDays = getDaysDifference(invoice.dueDate);
    const notification = { type: null, invoice, client, subscription };
    
    // Fatura vencida
    if (diffDays < 0) {
      notification.type = 'overdue';
      notification.daysOverdue = Math.abs(diffDays);
      notifications.overdue.push(notification);
    } 
    // Fatura vence em até 3 dias
    else if (diffDays <= 3) {
      notification.type = 'reminder';
      notification.daysUntilDue = diffDays;
      notifications.reminders.push(notification);
    }
  });
  
  // Faturas novas de hoje
  const todayStr = getCurrentDate();
  invoices.forEach(invoice => {
    if (invoice.generationDate === todayStr && getCorrectedInvoiceStatus(invoice) === 'pending') {
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
};

/**
 * Obtém informações sobre um tipo de notificação
 * @param {string} type - Tipo da notificação
 * @returns {Object} Informações do tipo
 */
export const getNotificationInfo = (type) => {
  const notificationTypes = {
    overdue: {
      icon: '🚨',
      text: 'Vencida',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      urgent: true,
      priority: 1
    },
    reminder: {
      icon: '🔔',
      text: 'Lembrete',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      urgent: false,
      priority: 2
    },
    new_invoice: {
      icon: '📄',
      text: 'Nova Fatura',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      urgent: false,
      priority: 3
    },
    payment_confirmation: {
      icon: '✅',
      text: 'Pagamento',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      urgent: false,
      priority: 4
    }
  };
  
  return notificationTypes[type] || {
    icon: '📋',
    text: type,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    urgent: false,
    priority: 5
  };
};

/**
 * Filtra notificações por prioridade
 * @param {Array} notifications - Lista de notificações
 * @param {string} priority - Prioridade desejada ('high', 'medium', 'low')
 * @returns {Array} Notificações filtradas
 */
export const filterNotificationsByPriority = (notifications, priority) => {
  return notifications.filter(notification => {
    const info = getNotificationInfo(notification.type);
    
    switch (priority) {
      case 'high':
        return info.priority <= 2 && info.urgent;
      case 'medium':
        return info.priority <= 3;
      case 'low':
        return true;
      default:
        return true;
    }
  });
};

/**
 * Agrupa notificações por cliente
 * @param {Array} notifications - Lista de notificações
 * @returns {Object} Notificações agrupadas por cliente
 */
export const groupNotificationsByClient = (notifications) => {
  return notifications.reduce((groups, notification) => {
    const clientId = notification.client.id;
    
    if (!groups[clientId]) {
      groups[clientId] = {
        client: notification.client,
        notifications: [],
        totalAmount: 0,
        urgentCount: 0
      };
    }
    
    groups[clientId].notifications.push(notification);
    groups[clientId].totalAmount += parseFloat(notification.invoice.amount || 0);
    
    const info = getNotificationInfo(notification.type);
    if (info.urgent) {
      groups[clientId].urgentCount++;
    }
    
    return groups;
  }, {});
};

/**
 * Obtém estatísticas de notificações
 * @param {Array} notifications - Lista de notificações
 * @returns {Object} Estatísticas
 */
export const getNotificationStats = (notifications) => {
  const stats = {
    total: notifications.length,
    byType: {},
    totalAmount: 0,
    urgentCount: 0,
    clientsAffected: new Set()
  };
  
  notifications.forEach(notification => {
    const { type } = notification;
    
    // Contar por tipo
    if (!stats.byType[type]) {
      stats.byType[type] = { count: 0, amount: 0 };
    }
    stats.byType[type].count++;
    stats.byType[type].amount += parseFloat(notification.invoice.amount || 0);
    
    // Totais
    stats.totalAmount += parseFloat(notification.invoice.amount || 0);
    
    // Urgentes
    const info = getNotificationInfo(type);
    if (info.urgent) {
      stats.urgentCount++;
    }
    
    // Clientes afetados
    stats.clientsAffected.add(notification.client.id);
  });
  
  stats.clientsAffected = stats.clientsAffected.size;
  
  return stats;
};

/**
 * Verifica se uma fatura precisa de notificação
 * @param {Object} invoice - Fatura
 * @param {Object} client - Cliente
 * @param {Array} sentToday - Lista de tipos já enviados hoje para este cliente
 * @returns {Object|null} Tipo de notificação necessária ou null
 */
export const checkNotificationNeeded = (invoice, client, sentToday = []) => {
  if (!client || !client.phone) return null;
  
  const correctedStatus = getCorrectedInvoiceStatus(invoice);
  if (!['pending', 'overdue'].includes(correctedStatus)) return null;
  
  const diffDays = getDaysDifference(invoice.dueDate);
  
  // Fatura vencida
  if (diffDays < 0 && !sentToday.includes('overdue')) {
    return {
      type: 'overdue',
      priority: 1,
      urgent: true,
      reason: `Fatura vencida há ${Math.abs(diffDays)} dia(s)`
    };
  }
  
  // Lembrete (vence em até 3 dias)
  if (diffDays >= 0 && diffDays <= 3 && !sentToday.includes('reminder')) {
    return {
      type: 'reminder',
      priority: 2,
      urgent: diffDays <= 1,
      reason: diffDays === 0 ? 'Vence hoje' : `Vence em ${diffDays} dia(s)`
    };
  }
  
  // Fatura nova de hoje
  if (invoice.generationDate === getCurrentDate() && !sentToday.includes('new_invoice')) {
    return {
      type: 'new_invoice',
      priority: 3,
      urgent: false,
      reason: 'Nova fatura gerada hoje'
    };
  }
  
  return null;
};

/**
 * Calcula o próximo escalonamento para uma fatura vencida
 * @param {Object} invoice - Fatura vencida
 * @param {Array} escalationDays - Dias de escalonamento configurados
 * @returns {Object|null} Próximo escalonamento ou null
 */
export const getNextEscalation = (invoice, escalationDays = [1, 3, 7, 15, 30]) => {
  const diffDays = getDaysDifference(invoice.dueDate);
  if (diffDays >= 0) return null; // Não está vencida
  
  const daysOverdue = Math.abs(diffDays);
  
  // Encontrar o próximo dia de escalonamento
  const nextEscalation = escalationDays.find(day => day > daysOverdue);
  
  if (!nextEscalation) return null; // Não há mais escalonamentos
  
  return {
    currentDays: daysOverdue,
    nextEscalationDays: nextEscalation,
    daysUntilNext: nextEscalation - daysOverdue,
    shouldEscalate: escalationDays.includes(daysOverdue)
  };
};