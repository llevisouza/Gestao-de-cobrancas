// functions/index.js - ENTRY POINT DAS CLOUD FUNCTIONS
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Firebase Admin
admin.initializeApp();

// Importar todas as functions
const { dailyTasks } = require('./triggers/dailyTasks');
const { weeklyReports } = require('./triggers/weeklyReports');
const { monthlyAnalytics } = require('./triggers/monthlyAnalytics');
const { processInvoiceGeneration } = require('./automation/invoiceGenerator');
const { checkOverdueInvoices } = require('./automation/overdueChecker');
const { sendEmailNotification } = require('./notifications/emailNotifications');
const { sendWhatsAppNotification } = require('./notifications/whatsappNotifications');
const { generatePDFReport } = require('./reports/pdfGenerator');

// ===== TRIGGERS AUTOMÁTICOS (CRON JOBS) =====

// Executar tarefas diárias às 9h (horário de Brasília)
exports.dailyTasksScheduled = functions
  .region('southamerica-east1')
  .pubsub.schedule('0 9 * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(dailyTasks);

// Executar relatórios semanais (Segunda-feira 8h)
exports.weeklyReportsScheduled = functions
  .region('southamerica-east1')
  .pubsub.schedule('0 8 * * 1')
  .timeZone('America/Sao_Paulo')
  .onRun(weeklyReports);

// Executar analytics mensais (Primeiro dia do mês 7h)
exports.monthlyAnalyticsScheduled = functions
  .region('southamerica-east1')
  .pubsub.schedule('0 7 1 * *')
  .timeZone('America/Sao_Paulo')
  .onRun(monthlyAnalytics);

// ===== FUNCTIONS DE AUTOMAÇÃO =====

// Gerar faturas (pode ser chamada manualmente ou por trigger)
exports.generateInvoices = functions
  .region('southamerica-east1')
  .https.onCall(processInvoiceGeneration);

// Verificar faturas vencidas
exports.checkOverdue = functions
  .region('southamerica-east1')
  .https.onCall(checkOverdueInvoices);

// ===== FUNCTIONS DE NOTIFICAÇÃO =====

// Enviar email (chamada de outros serviços)
exports.sendEmail = functions
  .region('southamerica-east1')
  .https.onCall(sendEmailNotification);

// Enviar WhatsApp
exports.sendWhatsApp = functions
  .region('southamerica-east1')
  .https.onCall(sendWhatsAppNotification);

// ===== FUNCTIONS DE RELATÓRIOS =====

// Gerar PDF
exports.generatePDF = functions
  .region('southamerica-east1')
  .https.onCall(generatePDFReport);

// ===== TRIGGERS DE BANCO DE DADOS =====

// Trigger quando nova fatura é criada
exports.onInvoiceCreated = functions
  .region('southamerica-east1')
  .firestore.document('invoices/{invoiceId}')
  .onCreate(async (snap, context) => {
    const invoice = snap.data();
    const invoiceId = context.params.invoiceId;
    
    console.log(`Nova fatura criada: ${invoiceId}`);
    
    try {
      // Buscar dados do cliente
      const clientDoc = await admin.firestore()
        .collection('clients')
        .doc(invoice.clientId)
        .get();
      
      if (!clientDoc.exists) {
        console.error('Cliente não encontrado:', invoice.clientId);
        return;
      }
      
      const client = clientDoc.data();
      
      // Enviar notificação de nova fatura
      await sendEmailNotification({
        type: 'new_invoice',
        invoice: { id: invoiceId, ...invoice },
        client: { id: invoice.clientId, ...client }
      });
      
      console.log('Notificação de nova fatura enviada');
      
    } catch (error) {
      console.error('Erro no trigger de nova fatura:', error);
    }
  });

// Trigger quando fatura é atualizada (ex: pago)
exports.onInvoiceUpdated = functions
  .region('southamerica-east1')
  .firestore.document('invoices/{invoiceId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const invoiceId = context.params.invoiceId;
    
    // Se status mudou para 'paid'
    if (before.status !== 'paid' && after.status === 'paid') {
      console.log(`Fatura paga: ${invoiceId}`);
      
      try {
        // Buscar dados do cliente
        const clientDoc = await admin.firestore()
          .collection('clients')
          .doc(after.clientId)
          .get();
        
        if (clientDoc.exists) {
          const client = clientDoc.data();
          
          // Enviar confirmação de pagamento
          await sendEmailNotification({
            type: 'payment_confirmation',
            invoice: { id: invoiceId, ...after },
            client: { id: after.clientId, ...client }
          });
          
          console.log('Confirmação de pagamento enviada');
        }
        
      } catch (error) {
        console.error('Erro no trigger de fatura paga:', error);
      }
    }
  });

// ===== FUNCTIONS UTILITÁRIAS =====

// Função para backup automático
exports.backupDatabase = functions
  .region('southamerica-east1')
  .pubsub.schedule('0 2 * * 0') // Domingo 2h
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    console.log('Iniciando backup automático...');
    
    try {
      const collections = ['clients', 'subscriptions', 'invoices'];
      const backupData = {};
      
      for (const collectionName of collections) {
        const snapshot = await admin.firestore()
          .collection(collectionName)
          .get();
        
        backupData[collectionName] = [];
        snapshot.docs.forEach(doc => {
          backupData[collectionName].push({
            id: doc.id,
            data: doc.data()
          });
        });
      }
      
      // Salvar backup em uma coleção especial
      await admin.firestore()
        .collection('backups')
        .doc(new Date().toISOString().split('T')[0])
        .set({
          data: backupData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          collections: collections,
          totalDocuments: Object.values(backupData).reduce((sum, arr) => sum + arr.length, 0)
        });
      
      console.log('Backup automático concluído');
      
    } catch (error) {
      console.error('Erro no backup automático:', error);
    }
  });

// Function de limpeza de logs antigos
exports.cleanupLogs = functions
  .region('southamerica-east1')
  .pubsub.schedule('0 3 1 * *') // Primeiro dia do mês às 3h
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    console.log('Limpando logs antigos...');
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 3); // 3 meses atrás
      
      const logCollections = [
        'emailLogs', 
        'whatsappLogs', 
        'automationLogs', 
        'pdfLogs'
      ];
      
      let totalDeleted = 0;
      
      for (const collection of logCollections) {
        const snapshot = await admin.firestore()
          .collection(collection)
          .where('createdAt', '<', cutoffDate)
          .limit(500) // Processar em batches
          .get();
        
        if (!snapshot.empty) {
          const batch = admin.firestore().batch();
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          
          await batch.commit();
          totalDeleted += snapshot.docs.length;
        }
      }
      
      console.log(`Limpeza concluída: ${totalDeleted} logs removidos`);
      
    } catch (error) {
      console.error('Erro na limpeza de logs:', error);
    }
  });

// ===== FUNCTIONS DE DESENVOLVIMENTO/DEBUG =====

// Função para popular dados de teste (apenas desenvolvimento)
exports.seedTestData = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    // Verificar se é ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Função não disponível em produção'
      );
    }
    
    console.log('Criando dados de teste...');
    
    try {
      const batch = admin.firestore().batch();
      
      // Dados de teste
      const testClients = [
        {
          name: 'Cliente Teste 1',
          email: 'teste1@exemplo.com',
          phone: '(11) 99999-1111',
          cpf: '123.456.789-00',
          pix: 'teste1@exemplo.com',
          status: 'active'
        },
        {
          name: 'Cliente Teste 2', 
          email: 'teste2@exemplo.com',
          phone: '(11) 99999-2222',
          cpf: '987.654.321-00',
          pix: 'teste2@exemplo.com',
          status: 'active'
        }
      ];
      
      // Criar clientes de teste
      testClients.forEach((client, index) => {
        const clientRef = admin.firestore()
          .collection('clients')
          .doc(`test_client_${index + 1}`);
        
        batch.set(clientRef, {
          ...client,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      
      return { 
        success: true, 
        message: 'Dados de teste criados com sucesso',
        clients: testClients.length
      };
      
    } catch (error) {
      console.error('Erro ao criar dados de teste:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

// Function de diagnóstico do sistema
exports.systemDiagnostics = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    console.log('Executando diagnóstico do sistema...');
    
    try {
      const diagnostics = {
        timestamp: new Date().toISOString(),
        collections: {},
        functions: {
          region: 'southamerica-east1',
          runtime: process.version,
          memory: process.memoryUsage()
        },
        errors: []
      };
      
      // Verificar coleções principais
      const collections = ['clients', 'subscriptions', 'invoices'];
      
      for (const collectionName of collections) {
        try {
          const snapshot = await admin.firestore()
            .collection(collectionName)
            .limit(1)
            .get();
          
          const totalSnapshot = await admin.firestore()
            .collection(collectionName)
            .get();
          
          diagnostics.collections[collectionName] = {
            exists: true,
            documentCount: totalSnapshot.size,
            readable: !snapshot.empty
          };
          
        } catch (error) {
          diagnostics.collections[collectionName] = {
            exists: false,
            error: error.message
          };
          diagnostics.errors.push(`Collection ${collectionName}: ${error.message}`);
        }
      }
      
      // Verificar conectividade
      try {
        await admin.firestore().runTransaction(async (t) => {
          // Transação de teste (não faz nada)
          return Promise.resolve();
        });
        diagnostics.firestore = { connected: true };
      } catch (error) {
        diagnostics.firestore = { connected: false, error: error.message };
        diagnostics.errors.push(`Firestore: ${error.message}`);
      }
      
      return {
        success: diagnostics.errors.length === 0,
        diagnostics
      };
      
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

// ===== FUNCTIONS DE MÉTRICAS E MONITORING =====

// Function para coletar métricas do sistema
exports.collectMetrics = functions
  .region('southamerica-east1')
  .pubsub.schedule('0 * * * *') // A cada hora
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    console.log('Coletando métricas do sistema...');
    
    try {
      const now = new Date();
      const metrics = {
        timestamp: now.toISOString(),
        hour: now.getHours(),
        collections: {},
        system: {
          memory: process.memoryUsage(),
          uptime: process.uptime()
        }
      };
      
      // Coletar métricas de cada coleção
      const collections = [
        'clients', 'subscriptions', 'invoices', 
        'emailLogs', 'whatsappLogs', 'automationLogs'
      ];
      
      for (const collectionName of collections) {
        const snapshot = await admin.firestore()
          .collection(collectionName)
          .get();
        
        metrics.collections[collectionName] = {
          total: snapshot.size,
          lastHour: snapshot.docs.filter(doc => {
            const data = doc.data();
            const createdAt = data.createdAt || data.sentAt || data.timestamp;
            if (!createdAt) return false;
            
            const docTime = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
            const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            
            return docTime >= hourAgo;
          }).length
        };
      }
      
      // Salvar métricas
      await admin.firestore()
        .collection('systemMetrics')
        .doc(now.toISOString().substring(0, 13)) // YYYY-MM-DDTHH
        .set(metrics);
      
      console.log('Métricas coletadas e salvas');
      
    } catch (error) {
      console.error('Erro ao coletar métricas:', error);
    }
  });

// Function de health check
exports.healthCheck = functions
  .region('southamerica-east1')
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        region: 'southamerica-east1',
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };
      
      // Teste básico de conectividade
      await admin.firestore().collection('health').doc('test').set({
        lastCheck: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.status(200).json(health);
      
    } catch (error) {
      console.error('Health check falhou:', error);
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });