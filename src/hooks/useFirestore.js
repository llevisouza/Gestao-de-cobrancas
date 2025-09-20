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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Função para verificar se data está vencida
  const isOverdue = (dueDate) => {
    const today = new Date();
    const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
    return due < today;
  };

  // Subscrições em tempo real
  useEffect(() => {
    console.log('🔄 Iniciando subscrições do Firestore...');
    
    // Subscrição para clientes
    const unsubscribeClients = clientService.subscribe((data) => {
      console.log('✅ Clientes atualizados:', data.length);
      setClients(data);
    });

    // Subscrição para assinaturas
    const unsubscribeSubscriptions = subscriptionService.subscribe((data) => {
      console.log('✅ Assinaturas atualizadas:', data.length);
      setSubscriptions(data);
    });

    // Subscrição para faturas
    const unsubscribeInvoices = invoiceService.subscribe((data) => {
      console.log('✅ Faturas atualizadas:', data.length);
      // Atualizar status das faturas vencidas
      const updatedInvoices = data.map(invoice => {
        return {
          ...invoice,
          status: invoice.status === 'pending' && isOverdue(invoice.dueDate) 
            ? 'overdue' 
            : invoice.status
        };
      });
      setInvoices(updatedInvoices);
    });

    // Cleanup das subscrições
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
      const newClient = {
        name: clientData.name?.trim(),
        email: clientData.email?.trim().toLowerCase(),
        phone: clientData.phone?.trim(),
        company: clientData.company?.trim() || '',
        address: clientData.address?.trim() || ''
      };
      await clientService.create(newClient);
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
      const updatedClient = {
        name: clientData.name?.trim(),
        email: clientData.email?.trim().toLowerCase(),
        phone: clientData.phone?.trim(),
        company: clientData.company?.trim() || '',
        address: clientData.address?.trim() || ''
      };
      await clientService.update(clientId, updatedClient);
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
      const newSubscription = {
        clientId: subscriptionData.clientId,
        service: subscriptionData.service?.trim(),
        description: subscriptionData.description?.trim() || '',
        amount: parseFloat(subscriptionData.amount),
        billingCycle: subscriptionData.billingCycle,
        startDate: new Date(subscriptionData.startDate),
        status: subscriptionData.status || 'active',
        billingDay: parseInt(subscriptionData.billingDay) || 5
      };
      await subscriptionService.create(newSubscription);
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
      const updatedSubscription = {
        service: subscriptionData.service?.trim(),
        description: subscriptionData.description?.trim() || '',
        amount: parseFloat(subscriptionData.amount),
        billingCycle: subscriptionData.billingCycle,
        status: subscriptionData.status,
        billingDay: parseInt(subscriptionData.billingDay) || 5
      };
      await subscriptionService.update(subscriptionId, updatedSubscription);
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
      const newInvoice = {
        clientId: invoiceData.clientId,
        subscriptionId: invoiceData.subscriptionId || null,
        amount: parseFloat(invoiceData.amount),
        description: invoiceData.description?.trim(),
        dueDate: new Date(invoiceData.dueDate),
        status: invoiceData.status || 'pending',
        month: invoiceData.month || new Date().getMonth(),
        year: invoiceData.year || new Date().getFullYear()
      };
      await invoiceService.create(newInvoice);
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
    setLoading(true);
    setError(null);
    try {
      const updatedInvoice = {
        amount: parseFloat(invoiceData.amount),
        description: invoiceData.description?.trim(),
        dueDate: new Date(invoiceData.dueDate),
        status: invoiceData.status
      };
      await invoiceService.update(invoiceId, updatedInvoice);
      console.log('✅ Fatura atualizada com sucesso');
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

  // =================== GETTERS COMPUTADOS ===================

  // Buscar cliente por ID
  const getClientById = (clientId) => {
    return clients.find(client => client.id === clientId);
  };

  // Buscar assinaturas por cliente
  const getSubscriptionsByClientId = (clientId) => {
    return subscriptions.filter(sub => sub.clientId === clientId);
  };

  // Buscar faturas por cliente
  const getInvoicesByClientId = (clientId) => {
    return invoices.filter(invoice => invoice.clientId === clientId);
  };

  // Estatísticas
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
    generateMonthlyInvoices,
    createExampleData,

    // Getters
    getClientById,
    getSubscriptionsByClientId,
    getInvoicesByClientId,
    getStats
  };
};