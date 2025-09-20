// src/services/firestore.js
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Constantes das coleções
export const COLLECTIONS = {
  CLIENTS: 'clients',
  SUBSCRIPTIONS: 'subscriptions',
  INVOICES: 'invoices'
};

// ***** CLIENTES *****
export const clientService = {
  // Criar cliente
  async create(clientData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTS), {
        ...clientData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Cliente criado:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      return { success: false, error: error.message };
    }
  },

  // Listar todos os clientes
  async getAll() {
    try {
      const q = query(
        collection(db, COLLECTIONS.CLIENTS),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const clients = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Clientes carregados:', clients.length);
      return clients;
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      return [];
    }
  },

  // Atualizar cliente
  async update(clientId, clientData) {
    try {
      const clientRef = doc(db, COLLECTIONS.CLIENTS, clientId);
      await updateDoc(clientRef, {
        ...clientData,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Cliente atualizado:', clientId);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      return { success: false, error: error.message };
    }
  },

  // Deletar cliente e dados relacionados
  async delete(clientId) {
    try {
      const batch = writeBatch(db);

      // Deletar assinaturas relacionadas
      const subscriptionsQuery = query(
        collection(db, COLLECTIONS.SUBSCRIPTIONS),
        where('clientId', '==', clientId)
      );
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
      subscriptionsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Deletar faturas relacionadas
      const invoicesQuery = query(
        collection(db, COLLECTIONS.INVOICES),
        where('clientId', '==', clientId)
      );
      const invoicesSnapshot = await getDocs(invoicesQuery);
      invoicesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Deletar cliente
      const clientRef = doc(db, COLLECTIONS.CLIENTS, clientId);
      batch.delete(clientRef);
      
      await batch.commit();
      console.log('✅ Cliente deletado:', clientId);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar cliente:', error);
      return { success: false, error: error.message };
    }
  }
};

// ***** ASSINATURAS *****
export const subscriptionService = {
  // Criar assinatura
  async create(subscriptionData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.SUBSCRIPTIONS), {
        ...subscriptionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Assinatura criada:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar assinatura:', error);
      return { success: false, error: error.message };
    }
  },

  // Listar todas as assinaturas
  async getAll() {
    try {
      const q = query(
        collection(db, COLLECTIONS.SUBSCRIPTIONS),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const subscriptions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Assinaturas carregadas:', subscriptions.length);
      return subscriptions;
    } catch (error) {
      console.error('❌ Erro ao buscar assinaturas:', error);
      return [];
    }
  },

  // Atualizar assinatura
  async update(subscriptionId, subscriptionData) {
    try {
      const subscriptionRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, subscriptionId);
      await updateDoc(subscriptionRef, {
        ...subscriptionData,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Assinatura atualizada:', subscriptionId);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar assinatura:', error);
      return { success: false, error: error.message };
    }
  }
};

// ***** FATURAS *****
export const invoiceService = {
  // Criar fatura
  async create(invoiceData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.INVOICES), {
        ...invoiceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Fatura criada:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar fatura:', error);
      return { success: false, error: error.message };
    }
  },

  // Listar todas as faturas
  async getAll() {
    try {
      const q = query(
        collection(db, COLLECTIONS.INVOICES),
        orderBy('generationDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const invoices = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Converter Timestamps do Firebase para Date
          generationDate: data.generationDate?.toDate?.() || data.generationDate,
          dueDate: data.dueDate?.toDate?.() || data.dueDate,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        };
      });
      console.log('✅ Faturas carregadas:', invoices.length);
      return invoices;
    } catch (error) {
      console.error('❌ Erro ao buscar faturas:', error);
      return [];
    }
  },

  // Atualizar fatura
  async update(invoiceId, invoiceData) {
    try {
      const invoiceRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
      await updateDoc(invoiceRef, {
        ...invoiceData,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Fatura atualizada:', invoiceId);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar fatura:', error);
      return { success: false, error: error.message };
    }
  }
};

// ***** DADOS DE EXEMPLO *****
export const seedService = {
  // Criar dados de exemplo
  async createSampleData() {
    try {
      console.log('🌱 Iniciando criação de dados de exemplo...');
      // Clientes de exemplo
      const sampleClients = [
        {
          name: 'João da Silva',
          email: 'joao@email.com',
          phone: '(11) 99999-1111',
          cpf: '123.456.789-00',
          pix: 'joao@email.com'
        },
        {
          name: 'Maria Santos',
          email: 'maria@email.com',
          phone: '(11) 99999-2222',
          cpf: '987.654.321-00',
          pix: 'maria@email.com'
        },
        {
          name: 'Pedro Costa',
          email: 'pedro@email.com',
          phone: '(11) 99999-3333',
          cpf: '456.789.123-00',
          pix: 'pedro@email.com'
        }
      ];

      // Criar clientes
      const createdClients = [];
      for (const client of sampleClients) {
        const result = await clientService.create(client);
        if (result.success) {
          createdClients.push({ id: result.id, ...client });
        }
      }

      // Criar assinaturas para os clientes
      const subscriptions = [
        {
          clientId: createdClients[0].id,
          clientName: createdClients[0].name,
          amount: 150.00,
          dayOfWeek: 'monday',
          startDate: '2024-01-01',
          status: 'active'
        },
        {
          clientId: createdClients[1].id,
          clientName: createdClients[1].name,
          amount: 200.00,
          dayOfWeek: 'wednesday',
          startDate: '2024-01-01',
          status: 'active'
        }
      ];
      for (const subscription of subscriptions) {
        await subscriptionService.create(subscription);
      }

      // Criar algumas faturas de exemplo
      const today = new Date();
      const invoices = [
        {
          clientId: createdClients[0].id,
          clientName: createdClients[0].name,
          amount: 150.00,
          generationDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dueDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'paid'
        },
        {
          clientId: createdClients[1].id,
          clientName: createdClients[1].name,
          amount: 200.00,
          generationDate: today.toISOString().split('T')[0],
          dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending'
        },
        {
          clientId: createdClients[2].id,
          clientName: createdClients[2].name,
          amount: 175.00,
          generationDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dueDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'overdue'
        }
      ];
      for (const invoice of invoices) {
        await invoiceService.create(invoice);
      }

      console.log('✅ Dados de exemplo criados com sucesso!');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao criar dados de exemplo:', error);
      return { success: false, error: error.message };
    }
  }
};