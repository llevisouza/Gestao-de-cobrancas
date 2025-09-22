// src/hooks/useFirestore.js - VERSÃO TOTALMENTE CORRIGIDA
import { useState, useEffect, useCallback } from 'react';
import { useFirebaseAuth } from './useFirebaseAuth';
import { clientService, subscriptionService, invoiceService } from '../services/firestore';

export const useFirestore = () => {
  const { user } = useFirebaseAuth();
  
  // Estados principais
  const [clients, setClients] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregamento inicial de dados
  useEffect(() => {
    let unsubscribeClients = null;
    let unsubscribeSubscriptions = null;
    let unsubscribeInvoices = null;

    if (user) {
      console.log('👤 Usuário logado, carregando dados...', user.email);
      setLoading(true);

      try {
        // Configurar listeners em tempo real
        unsubscribeClients = clientService.subscribe((clientsData) => {
          console.log('📊 Clientes recebidos:', clientsData.length);
          setClients(clientsData);
        });

        unsubscribeSubscriptions = subscriptionService.subscribe((subscriptionsData) => {
          console.log('📊 Assinaturas recebidas:', subscriptionsData.length);
          setSubscriptions(subscriptionsData);
        });

        unsubscribeInvoices = invoiceService.subscribe((invoicesData) => {
          console.log('📊 Faturas recebidas:', invoicesData.length);
          setInvoices(invoicesData);
        });

        setError(null);
      } catch (err) {
        console.error('❌ Erro ao configurar listeners:', err);
        setError(err.message);
      } finally {
        // Dar tempo para os dados carregarem
        setTimeout(() => setLoading(false), 2000);
      }
    } else {
      console.log('🚪 Usuário não logado, limpando dados...');
      setClients([]);
      setSubscriptions([]);
      setInvoices([]);
      setLoading(false);
      setError(null);
    }

    // Cleanup function
    return () => {
      console.log('🧹 Limpando listeners...');
      if (unsubscribeClients) unsubscribeClients();
      if (unsubscribeSubscriptions) unsubscribeSubscriptions();
      if (unsubscribeInvoices) unsubscribeInvoices();
    };
  }, [user]);

  // ===== OPERAÇÕES DE CLIENTES =====
  const createClient = useCallback(async (clientData) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('🔄 Criando cliente:', clientData);
      
      // Adicionar timestamp e ID de usuário
      const clientWithMetadata = {
        ...clientData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      const result = await clientService.create(clientWithMetadata);
      
      if (result.success) {
        console.log('✅ Cliente criado com sucesso:', result.id);
        // Os dados serão atualizados automaticamente pelo listener
        return result.id;
      } else {
        console.error('❌ Erro ao criar cliente:', result.error);
        throw new Error(result.error || 'Erro ao criar cliente');
      }
    } catch (error) {
      console.error('❌ Erro na criação do cliente:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  const updateClient = useCallback(async (clientId, clientData) => {
    if (!user || !clientId) {
      throw new Error('Parâmetros inválidos para atualizar cliente');
    }

    try {
      console.log('🔄 Atualizando cliente:', clientId, clientData);
      
      const updateData = {
        ...clientData,
        updatedAt: new Date().toISOString()
      };

      const result = await clientService.update(clientId, updateData);
      
      if (result.success) {
        console.log('✅ Cliente atualizado com sucesso:', clientId);
        // Os dados serão atualizados automaticamente pelo listener
        return true;
      } else {
        console.error('❌ Erro ao atualizar cliente:', result.error);
        throw new Error(result.error || 'Erro ao atualizar cliente');
      }
    } catch (error) {
      console.error('❌ Erro na atualização do cliente:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  const deleteClient = useCallback(async (clientId) => {
    if (!user || !clientId) {
      throw new Error('Parâmetros inválidos para deletar cliente');
    }

    try {
      console.log('🔄 Deletando cliente:', clientId);
      
      const result = await clientService.delete(clientId);
      
      if (result.success) {
        console.log('✅ Cliente deletado com sucesso:', clientId);
        // Os dados serão atualizados automaticamente pelo listener
        return true;
      } else {
        console.error('❌ Erro ao deletar cliente:', result.error);
        throw new Error(result.error || 'Erro ao deletar cliente');
      }
    } catch (error) {
      console.error('❌ Erro ao deletar cliente:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  // ===== OPERAÇÕES DE ASSINATURAS =====
  const createSubscription = useCallback(async (subscriptionData) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('🔄 Criando assinatura:', subscriptionData);
      
      const subscriptionWithMetadata = {
        ...subscriptionData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: subscriptionData.status || 'active'
      };

      const result = await subscriptionService.create(subscriptionWithMetadata);
      
      if (result.success) {
        console.log('✅ Assinatura criada com sucesso:', result.id);
        return result.id;
      } else {
        console.error('❌ Erro ao criar assinatura:', result.error);
        throw new Error(result.error || 'Erro ao criar assinatura');
      }
    } catch (error) {
      console.error('❌ Erro na criação da assinatura:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  const updateSubscription = useCallback(async (subscriptionId, subscriptionData) => {
    if (!user || !subscriptionId) {
      throw new Error('Parâmetros inválidos para atualizar assinatura');
    }

    try {
      console.log('🔄 Atualizando assinatura:', subscriptionId, subscriptionData);
      
      const updateData = {
        ...subscriptionData,
        updatedAt: new Date().toISOString()
      };

      const result = await subscriptionService.update(subscriptionId, updateData);
      
      if (result.success) {
        console.log('✅ Assinatura atualizada com sucesso:', subscriptionId);
        return true;
      } else {
        console.error('❌ Erro ao atualizar assinatura:', result.error);
        throw new Error(result.error || 'Erro ao atualizar assinatura');
      }
    } catch (error) {
      console.error('❌ Erro na atualização da assinatura:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  const deleteSubscription = useCallback(async (subscriptionId) => {
    if (!user || !subscriptionId) {
      throw new Error('Parâmetros inválidos para deletar assinatura');
    }

    try {
      console.log('🔄 Deletando assinatura:', subscriptionId);
      
      const result = await subscriptionService.delete(subscriptionId);
      
      if (result.success) {
        console.log('✅ Assinatura deletada com sucesso:', subscriptionId);
        return true;
      } else {
        console.error('❌ Erro ao deletar assinatura:', result.error);
        throw new Error(result.error || 'Erro ao deletar assinatura');
      }
    } catch (error) {
      console.error('❌ Erro ao deletar assinatura:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  // ===== OPERAÇÕES DE FATURAS =====
  const updateInvoice = useCallback(async (invoiceId, invoiceData) => {
    if (!user || !invoiceId) {
      throw new Error('Parâmetros inválidos para atualizar fatura');
    }

    try {
      console.log('🔄 Atualizando fatura:', invoiceId, invoiceData);
      
      const updateData = {
        ...invoiceData,
        updatedAt: new Date().toISOString()
      };

      // Se está marcando como pago, adicionar data de pagamento
      if (invoiceData.status === 'paid' && !invoiceData.paidDate) {
        updateData.paidDate = new Date().toISOString().split('T')[0];
      }

      const result = await invoiceService.update(invoiceId, updateData);
      
      if (result.success) {
        console.log('✅ Fatura atualizada com sucesso:', invoiceId);
        return true;
      } else {
        console.error('❌ Erro ao atualizar fatura:', result.error);
        throw new Error(result.error || 'Erro ao atualizar fatura');
      }
    } catch (error) {
      console.error('❌ Erro na atualização da fatura:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  const generateInvoices = useCallback(async () => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('🔄 Gerando faturas das assinaturas ativas...');
      
      const count = await invoiceService.generateFromSubscriptions();
      
      console.log(`✅ ${count} faturas geradas com sucesso!`);
      return count;
    } catch (error) {
      console.error('❌ Erro ao gerar faturas:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  // ===== FUNÇÃO PARA CRIAR DADOS DE EXEMPLO =====
  const createExampleData = useCallback(async () => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('🔄 Criando dados de exemplo...');
      
      // Verificar se já existem clientes
      if (clients.length > 0) {
        throw new Error('Já existem clientes cadastrados. Limpe os dados primeiro.');
      }

      setLoading(true);

      // Clientes de exemplo
      const exampleClients = [
        {
          name: 'Ana Silva',
          email: 'ana@exemplo.com',
          phone: '11999999999',
          cpf: '12345678901',
          pix: 'ana@exemplo.com'
        },
        {
          name: 'João Santos',
          email: 'joao@exemplo.com',
          phone: '11888888888',
          cpf: '98765432109',
          pix: 'joao@exemplo.com'
        },
        {
          name: 'Maria Costa',
          email: 'maria@exemplo.com',
          phone: '11777777777',
          cpf: '11122233344',
          pix: 'maria@exemplo.com'
        }
      ];

      // Criar clientes primeiro
      const createdClients = [];
      for (const clientData of exampleClients) {
        const clientId = await createClient(clientData);
        createdClients.push({ ...clientData, id: clientId });
        console.log('✅ Cliente exemplo criado:', clientData.name);
      }

      // Aguardar um pouco para sincronização
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Criar assinaturas para os clientes
      const today = new Date().toISOString().split('T')[0];
      
      const exampleSubscriptions = [
        {
          clientId: createdClients[0].id,
          clientName: createdClients[0].name,
          name: 'Delivery Diário',
          amount: 25.00,
          recurrenceType: 'daily',
          startDate: today
        },
        {
          clientId: createdClients[1].id,
          clientName: createdClients[1].name,
          name: 'Plano Semanal',
          amount: 150.00,
          recurrenceType: 'weekly',
          dayOfWeek: 'friday',
          startDate: today
        },
        {
          clientId: createdClients[2].id,
          clientName: createdClients[2].name,
          name: 'Mensalidade',
          amount: 300.00,
          recurrenceType: 'monthly',
          dayOfMonth: 15,
          startDate: today
        }
      ];

      for (const subData of exampleSubscriptions) {
        await createSubscription(subData);
        console.log('✅ Assinatura exemplo criada:', subData.name);
      }

      // Gerar algumas faturas
      await generateInvoices();

      setLoading(false);
      console.log('🎉 Dados de exemplo criados com sucesso!');
      
      return { success: true, message: 'Dados de exemplo criados com sucesso!' };
    } catch (error) {
      console.error('❌ Erro ao criar dados de exemplo:', error);
      setLoading(false);
      setError(error.message);
      throw error;
    }
  }, [user, clients.length, createClient, createSubscription, generateInvoices]);

  // ===== FUNÇÃO PARA LIMPAR TODOS OS DADOS =====
  const clearAllData = useCallback(async () => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('🔄 Limpando todos os dados...');
      setLoading(true);

      // Deletar todos os clientes (cascata deletará assinaturas e faturas)
      const deletePromises = clients.map(client => deleteClient(client.id));
      await Promise.all(deletePromises);

      console.log('✅ Todos os dados foram limpos!');
      return { success: true, message: 'Dados limpos com sucesso!' };
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, clients, deleteClient]);

  // Debug info
  const debugInfo = {
    user: user ? { email: user.email, uid: user.uid } : null,
    clientsCount: clients.length,
    subscriptionsCount: subscriptions.length,
    invoicesCount: invoices.length,
    loading,
    error
  };

  console.log('🐛 Debug useFirestore:', debugInfo);

  return {
    // Estados
    clients,
    subscriptions,
    invoices,
    loading,
    error,

    // Operações de clientes
    createClient,
    updateClient,
    deleteClient,

    // Operações de assinaturas
    createSubscription,
    updateSubscription,
    deleteSubscription,

    // Operações de faturas
    updateInvoice,
    generateInvoices,

    // Utilitários
    createExampleData,
    clearAllData,
    
    // Debug
    debugInfo
  };
};