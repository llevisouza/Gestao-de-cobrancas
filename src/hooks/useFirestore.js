// src/hooks/useFirestore.js - COM LIMPEZA DE DADOS ÓRFÃOS
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { getCurrentDate, getCurrentDateTime, getNextWeekdayDate, debugDate } from '../utils/dateUtils';

export const useFirestore = () => {
  const [clients, setClients] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para limpar dados órfãos
  const cleanupOrphanedData = useCallback(async (clientsData, subscriptionsData, invoicesData) => {
    try {
      const batch = writeBatch(db);
      const clientIds = new Set(clientsData.map(c => c.id));
      const subscriptionIds = new Set(subscriptionsData.map(s => s.id));
      
      let cleanedCount = 0;

      // Limpar assinaturas de clientes que não existem mais
      const orphanedSubscriptions = subscriptionsData.filter(sub => !clientIds.has(sub.clientId));
      for (const sub of orphanedSubscriptions) {
        console.log('Removendo assinatura órfã:', sub.id, 'do cliente:', sub.clientId);
        batch.delete(doc(db, 'subscriptions', sub.id));
        cleanedCount++;
      }

      // Limpar faturas de assinaturas que não existem mais
      const orphanedInvoices = invoicesData.filter(inv => 
        inv.subscriptionId && !subscriptionIds.has(inv.subscriptionId)
      );
      for (const inv of orphanedInvoices) {
        console.log('Removendo fatura órfã:', inv.id, 'da assinatura:', inv.subscriptionId);
        batch.delete(doc(db, 'invoices', inv.id));
        cleanedCount++;
      }

      // Executar limpeza em batch
      if (cleanedCount > 0) {
        await batch.commit();
        console.log(`${cleanedCount} registros órfãos removidos`);
      }

    } catch (error) {
      console.error('Erro ao limpar dados órfãos:', error);
    }
  }, []);

  // Função para buscar dados com listeners em tempo real
  useEffect(() => {
    setLoading(true);
    let clientsData = [];
    let subscriptionsData = [];
    let invoicesData = [];
    
    // Listener para clientes
    const clientsQuery = query(collection(db, 'clients'), orderBy('name'));
    const unsubscribeClients = onSnapshot(
      clientsQuery,
      (snapshot) => {
        clientsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClients(clientsData);
        console.log('Clientes atualizados:', clientsData.length);
        
        // Limpar dados órfãos quando todos os dados estiverem carregados
        if (subscriptionsData.length >= 0 && invoicesData.length >= 0) {
          cleanupOrphanedData(clientsData, subscriptionsData, invoicesData);
        }
      },
      (error) => {
        console.error('Erro ao buscar clientes:', error);
        setError('Erro ao carregar clientes');
      }
    );

    // Listener para assinaturas
    const subscriptionsQuery = query(collection(db, 'subscriptions'), orderBy('startDate', 'desc'));
    const unsubscribeSubscriptions = onSnapshot(
      subscriptionsQuery,
      (snapshot) => {
        subscriptionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSubscriptions(subscriptionsData);
        console.log('Assinaturas atualizadas:', subscriptionsData.length);
      },
      (error) => {
        console.error('Erro ao buscar assinaturas:', error);
        setError('Erro ao carregar assinaturas');
      }
    );

    // Listener para faturas
    const invoicesQuery = query(collection(db, 'invoices'), orderBy('dueDate', 'desc'));
    const unsubscribeInvoices = onSnapshot(
      invoicesQuery,
      (snapshot) => {
        invoicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInvoices(invoicesData);
        console.log('Faturas atualizadas:', invoicesData.length);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao buscar faturas:', error);
        setError('Erro ao carregar faturas');
        setLoading(false);
      }
    );

    // Cleanup listeners
    return () => {
      unsubscribeClients();
      unsubscribeSubscriptions();
      unsubscribeInvoices();
    };
  }, [cleanupOrphanedData]);

  // CRUD Clientes
  const createClient = useCallback(async (clientData) => {
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        ...clientData,
        createdAt: getCurrentDateTime(),
        status: 'active'
      });
      console.log('Cliente criado:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw new Error('Erro ao criar cliente: ' + error.message);
    }
  }, []);

  const updateClient = useCallback(async (clientId, clientData) => {
    try {
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        ...clientData,
        updatedAt: getCurrentDateTime()
      });
      console.log('Cliente atualizado:', clientId);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw new Error('Erro ao atualizar cliente: ' + error.message);
    }
  }, []);

  const deleteClient = useCallback(async (clientId) => {
    try {
      // Verificar se cliente tem assinaturas ativas
      const clientSubscriptions = subscriptions.filter(
        sub => sub.clientId === clientId && sub.status === 'active'
      );
      
      if (clientSubscriptions.length > 0) {
        throw new Error('Não é possível excluir cliente com assinaturas ativas');
      }

      // Usar batch para excluir cliente e dados relacionados
      const batch = writeBatch(db);
      
      // Excluir cliente
      batch.delete(doc(db, 'clients', clientId));
      
      // Excluir todas as assinaturas do cliente
      const allClientSubscriptions = subscriptions.filter(sub => sub.clientId === clientId);
      for (const sub of allClientSubscriptions) {
        batch.delete(doc(db, 'subscriptions', sub.id));
      }
      
      // Excluir todas as faturas do cliente
      const clientInvoices = invoices.filter(inv => inv.clientId === clientId);
      for (const inv of clientInvoices) {
        batch.delete(doc(db, 'invoices', inv.id));
      }
      
      await batch.commit();
      console.log('Cliente e dados relacionados excluídos:', clientId);
      
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      throw new Error('Erro ao excluir cliente: ' + error.message);
    }
  }, [subscriptions, invoices]);

  // CRUD Assinaturas
  const createSubscription = useCallback(async (subscriptionData) => {
    try {
      const docRef = await addDoc(collection(db, 'subscriptions'), {
        ...subscriptionData,
        createdAt: getCurrentDateTime()
      });
      console.log('Assinatura criada:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      throw new Error('Erro ao criar assinatura: ' + error.message);
    }
  }, []);

  const updateSubscription = useCallback(async (subscriptionId, subscriptionData) => {
    try {
      const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
      await updateDoc(subscriptionRef, {
        ...subscriptionData,
        updatedAt: getCurrentDateTime()
      });
      console.log('Assinatura atualizada:', subscriptionId);
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      throw new Error('Erro ao atualizar assinatura: ' + error.message);
    }
  }, []);

  const deleteSubscription = useCallback(async (subscriptionId) => {
    try {
      // Verificar se assinatura tem faturas pendentes
      const subscriptionInvoices = invoices.filter(
        invoice => invoice.subscriptionId === subscriptionId && 
                  (invoice.status === 'pending' || invoice.status === 'overdue')
      );
      
      if (subscriptionInvoices.length > 0) {
        throw new Error('Não é possível excluir assinatura com faturas pendentes');
      }

      // Usar batch para excluir assinatura e faturas relacionadas
      const batch = writeBatch(db);
      
      // Excluir assinatura
      batch.delete(doc(db, 'subscriptions', subscriptionId));
      
      // Excluir todas as faturas da assinatura
      const allSubscriptionInvoices = invoices.filter(inv => inv.subscriptionId === subscriptionId);
      for (const inv of allSubscriptionInvoices) {
        batch.delete(doc(db, 'invoices', inv.id));
      }
      
      await batch.commit();
      console.log('Assinatura e faturas relacionadas excluídas:', subscriptionId);
      
    } catch (error) {
      console.error('Erro ao excluir assinatura:', error);
      throw new Error('Erro ao excluir assinatura: ' + error.message);
    }
  }, [invoices]);

  // CRUD Faturas
  const updateInvoice = useCallback(async (invoiceId, invoiceData) => {
    try {
      const invoiceRef = doc(db, 'invoices', invoiceId);
      const updateData = {
        ...invoiceData,
        updatedAt: getCurrentDateTime()
      };

      // Se foi marcada como paga, adicionar data de pagamento
      if (invoiceData.status === 'paid') {
        updateData.paidDate = getCurrentDate();
      }

      await updateDoc(invoiceRef, updateData);
      console.log('Fatura atualizada:', invoiceId);
    } catch (error) {
      console.error('Erro ao atualizar fatura:', error);
      throw new Error('Erro ao atualizar fatura: ' + error.message);
    }
  }, []);

  // Gerar faturas mensais COM DATAS CORRIGIDAS
  const generateMonthlyInvoices = useCallback(async (month, year) => {
    try {
      console.log(`Gerando faturas para ${month + 1}/${year}`);
      
      const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
      if (activeSubscriptions.length === 0) {
        throw new Error('Nenhuma assinatura ativa encontrada');
      }

      let generatedCount = 0;
      const currentDate = getCurrentDate();
      
      console.log('[DEBUG] Data atual:', currentDate);
      
      for (const subscription of activeSubscriptions) {
        // Verificar se já existe fatura para este mês/ano
        const existingInvoice = invoices.find(invoice => {
          if (invoice.subscriptionId !== subscription.id) return false;
          
          const invoiceDate = new Date(invoice.dueDate + 'T12:00:00');
          return invoiceDate.getMonth() === month && invoiceDate.getFullYear() === year;
        });

        if (existingInvoice) {
          console.log(`Fatura já existe para assinatura ${subscription.id}`);
          continue;
        }

        // CORREÇÃO: Calcular data de vencimento para o mês específico
        const firstDayOfMonth = new Date(year, month, 1);
        const firstDayString = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        
        console.log('[DEBUG] Calculando vencimento para:', {
          subscription: subscription.id,
          dayOfWeek: subscription.dayOfWeek,
          month,
          year,
          firstDay: firstDayString
        });
        
        // Calcular próximo dia da semana no mês
        const dueDate = getNextWeekdayDate(subscription.dayOfWeek, firstDayString);
        
        console.log('[DEBUG] Data de vencimento calculada:', dueDate);
        debugDate('Vencimento da fatura', dueDate);
        
        const invoiceData = {
          subscriptionId: subscription.id,
          clientId: subscription.clientId,
          clientName: subscription.clientName,
          amount: parseFloat(subscription.amount),
          dueDate: dueDate, // Formato YYYY-MM-DD
          generationDate: currentDate,
          createdAt: getCurrentDateTime(),
          status: 'pending',
          description: `Assinatura - ${new Date(year, month).toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
          })}`
        };

        console.log('[DEBUG] Criando fatura:', invoiceData);

        await addDoc(collection(db, 'invoices'), invoiceData);
        generatedCount++;
      }

      console.log(`${generatedCount} faturas geradas com sucesso`);
      return generatedCount;
    } catch (error) {
      console.error('Erro ao gerar faturas:', error);
      throw new Error('Erro ao gerar faturas: ' + error.message);
    }
  }, [subscriptions, invoices]);

  // Criar dados de exemplo
  const createExampleData = useCallback(async () => {
    try {
      console.log('Criando dados de exemplo...');
      const currentDate = getCurrentDate();
      
      console.log('[DEBUG] Data atual para exemplo:', currentDate);
      
      const exampleClients = [
        {
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '11999999999',
          cpf: '12345678901',
          pix: 'joao@email.com'
        },
        {
          name: 'Maria Santos',
          email: 'maria@email.com',
          phone: '11888888888',
          cpf: '98765432109',
          pix: '11888888888'
        },
        {
          name: 'Pedro Costa',
          email: 'pedro@email.com',
          phone: '11777777777',
          cpf: '45678912345',
          pix: 'pedro@email.com'
        }
      ];

      const createdClients = [];
      for (const clientData of exampleClients) {
        const clientId = await createClient(clientData);
        createdClients.push({ id: clientId, ...clientData });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const subscriptionPromises = createdClients.map((client, index) => {
        const amount = [50, 75, 100][index];
        const dayOfWeek = ['monday', 'wednesday', 'friday'][index];
        
        return createSubscription({
          clientId: client.id,
          clientName: client.name,
          amount: amount,
          dayOfWeek: dayOfWeek,
          startDate: currentDate,
          status: 'active'
        });
      });

      await Promise.all(subscriptionPromises);
      console.log('Dados de exemplo criados com sucesso!');
    } catch (error) {
      console.error('Erro ao criar dados de exemplo:', error);
      throw error;
    }
  }, [createClient, createSubscription]);

  return {
    clients,
    subscriptions,
    invoices,
    loading,
    error,
    
    createClient,
    updateClient,
    deleteClient,
    
    createSubscription,
    updateSubscription,
    deleteSubscription,
    
    updateInvoice,
    
    generateMonthlyInvoices,
    createExampleData
  };
};