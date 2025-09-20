// src/hooks/useFirestore.js
import { useState, useEffect } from 'react';
import { 
  clientService,
  subscriptionService,
  invoiceService,
  seedService
} from '../services/firestore';

/**
 * Hook personalizado para gerenciar operações do Firestore
 * Fornece estado reativo e funções para CRUD de todas as entidades
 */
export const useFirestore = () => {
  // Estados
  const [clients, setClients] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true); // Manter true para loading inicial
  const [error, setError] = useState(null);

  // Função para verificar se data está vencida
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Subscrições em tempo real
  useEffect(() => {
    setLoading(true);
    console.log('🔄 Iniciando subscrições do Firestore...');
    
    const unsubscribeClients = clientService.subscribe((data) => {
      console.log('✅ Clientes atualizados:', data.length);
      setClients(data);
    });

    const unsubscribeSubscriptions = subscriptionService.subscribe((data) => {
      console.log('✅ Assinaturas atualizadas:', data.length);
      setSubscriptions(data);
    });

    const unsubscribeInvoices = invoiceService.subscribe((data) => {
      console.log('✅ Faturas atualizadas:', data.length);
      const updatedInvoices = data.map(invoice => ({
        ...invoice,
        status: invoice.status === 'pending' && isOverdue(invoice.dueDate) 
          ? 'overdue' 
          : invoice.status
      }));
      setInvoices(updatedInvoices);
      setLoading(false); // Finaliza o loading após receber as faturas
    });

    return () => {
      console.log('🔄 Limpando subscrições do Firestore...');
      unsubscribeClients();
      unsubscribeSubscriptions();
      unsubscribeInvoices();
    };
  }, []);

  // =================== FUNÇÕES DE CLIENTES ===================

  const createClient = async (clientData) => {
    setLoading(true);
    setError(null);
    try {
      await clientService.create(clientData);
      console.log('✅ Cliente criado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateClient = async (clientId, clientData) => {
    setLoading(true);
    setError(null);
    try {
      await clientService.update(clientId, clientData);
      console.log('✅ Cliente atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (clientId) => {
    setLoading(true);
    setError(null);
    try {
      await clientService.delete(clientId);
      console.log('✅ Cliente deletado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar cliente:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // =================== FUNÇÕES DE ASSINATURAS ===================

  const createSubscription = async (subscriptionData) => {
    setLoading(true);
    setError(null);
    try {
      await subscriptionService.create(subscriptionData);
      console.log('✅ Assinatura criada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar assinatura:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (subscriptionId, subscriptionData) => {
    setLoading(true);
    setError(null);
    try {
      await subscriptionService.update(subscriptionId, subscriptionData);
      console.log('✅ Assinatura atualizada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar assinatura:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteSubscription = async (subscriptionId) => {
    setLoading(true);
    setError(null);
    try {
      await subscriptionService.delete(subscriptionId);
      console.log('✅ Assinatura deletada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar assinatura:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // =================== FUNÇÕES DE FATURAS ===================

  const createInvoice = async (invoiceData) => {
    setLoading(true);
    setError(null);
    try {
      await invoiceService.create(invoiceData);
      console.log('✅ Fatura criada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar fatura:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateInvoice = async (invoiceId, invoiceData) => {
    // ESTA É A FUNÇÃO CORRIGIDA
    setLoading(true);
    setError(null);
    try {
      const dataToUpdate = {};

      if (invoiceData.status !== undefined) {
        dataToUpdate.status = invoiceData.status;
        if (invoiceData.status === 'paid') {
          dataToUpdate.paidDate = new Date();
        }
      }
      if (invoiceData.amount !== undefined) {
        dataToUpdate.amount = parseFloat(invoiceData.amount);
      }
      if (invoiceData.description !== undefined) {
        dataToUpdate.description = invoiceData.description;
      }
      if (invoiceData.dueDate !== undefined) {
        dataToUpdate.dueDate = new Date(invoiceData.dueDate);
      }
      if (Object.keys(dataToUpdate).length > 0) {
        await invoiceService.update(invoiceId, dataToUpdate);
        console.log('✅ Fatura atualizada com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar fatura:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (invoiceId) => {
    setLoading(true);
    setError(null);
    try {
      await invoiceService.delete(invoiceId);
      console.log('✅ Fatura deletada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar fatura:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (invoiceId) => {
    setLoading(true);
    setError(null);
    try {
      await invoiceService.markAsPaid(invoiceId);
      console.log('✅ Fatura marcada como paga');
    } catch (error) {
      console.error('❌ Erro ao marcar fatura como paga:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // =================== FUNÇÕES AUXILIARES ===================

  const getInvoicesByDateRange = async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      const invoices = await invoiceService.getByPeriod(startDate, endDate);
      console.log('✅ Faturas por período carregadas:', invoices.length);
      return invoices;
    } catch (error) {
      console.error('❌ Erro ao carregar faturas por período:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyInvoices = async (month, year) => {
    // NOME CORRIGIDO PARA CORRESPONDER AO DASHBOARD
    setLoading(true);
    setError(null);
    try {
      const count = await invoiceService.generateForMonth(month, year);
      console.log(`✅ ${count} faturas geradas para ${month + 1}/${year}`);
      return count;
    } catch (error) {
      console.error('❌ Erro ao gerar faturas mensais:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const createExampleData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await seedService.createSampleData();
      console.log('✅ Dados de exemplo criados:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao criar dados de exemplo:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // =================== GETTERS COMPUTADOS (RESTAURADOS) ===================

  const getClientById = (clientId) => {
    return clients.find(client => client.id === clientId);
  };

  const getSubscriptionsByClientId = (clientId) => {
    return subscriptions.filter(sub => sub.clientId === clientId);
  };

  const getInvoicesByClientId = (clientId) => {
    return invoices.filter(invoice => invoice.clientId === clientId);
  };

  const getStats = () => {
    const totalClients = clients.length;
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
    const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending').length;
    const overdueInvoices = invoices.filter(invoice => invoice.status === 'overdue').length;
    const totalRevenue = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
    const pendingRevenue = invoices
      .filter(invoice => invoice.status === 'pending')
      .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
    return {
      totalClients,
      activeSubscriptions,
      pendingInvoices,
      overdueInvoices,
      totalRevenue,
      pendingRevenue
    };
  };

  // Retornar todas as funções e dados
  return {
    // Estados
    clients,
    subscriptions,
    invoices,
    loading,
    error,

    // Funções de clientes
    createClient,
    updateClient,
    deleteClient,

    // Funções de assinaturas
    createSubscription,
    updateSubscription,
    deleteSubscription,

    // Funções de faturas
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,

    // Funções auxiliares
    getInvoicesByDateRange,
    generateMonthlyInvoices, // Corrigido para corresponder à chamada
    createExampleData,

    // Getters
    getClientById,
    getSubscriptionsByClientId,
    getInvoicesByClientId,
    getStats
  };
};