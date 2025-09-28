const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const { dailyTasks } = require('./triggers/dailyTasks');
const { weeklyReports } = require('./triggers/weeklyReports');
const { monthlyAnalytics } = require('./triggers/monthlyAnalytics');
const { processInvoiceGeneration } = require('./automation/invoiceGenerator');
const { checkOverdueInvoices } = require('./automation/overdueChecker');
const { sendEmailNotification } = require('./notifications/emailNotifications');
const { sendWhatsAppNotification } = require('./notifications/whatsappNotifications');
const { generatePDFReport } = require('./reports/pdfGenerator');

exports.dailyTasksScheduled = functions
  .region('southamerica-east1')
  .pubsub.schedule('0 9 * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(dailyTasks);

exports.weeklyReportsScheduled = functions
  .region('southamerica-east1')
  .pubsub.schedule('0 8 * * 1')
  .timeZone('America/Sao_Paulo')
  .onRun(weeklyReports);

exports.monthlyAnalyticsScheduled = functions
  .region('southamerica-east1')
  .pubsub.schedule('0 7 1 * *')
  .timeZone('America/Sao_Paulo')
  .onRun(monthlyAnalytics);

exports.generateInvoices = functions
  .region('southamerica-east1')
  .https.onCall(processInvoiceGeneration);

exports.checkOverdue = functions
  .region('southamerica-east1')
  .https.onCall(checkOverdueInvoices);

exports.sendEmail = functions
  .region('southamerica-east1')
  .https.onCall(sendEmailNotification);

exports.sendWhatsApp = functions
  .region('southamerica-east1')
  .https.onCall(sendWhatsAppNotification);

exports.generatePDF = functions
  .region('southamerica-east1')
  .https.onCall(generatePDFReport);

exports.onInvoiceCreated = functions
  .region('southamerica-east1')
  .firestore.document('invoices/{invoiceId}')
  .onCreate(async (snap, context) => {
    const invoice = snap.data();
    const invoiceId = context.params.invoiceId;
    
    functions.logger.info(`Nova fatura criada: ${invoiceId}`);
    
    try {
      const clientDoc = await admin.firestore()
        .collection('clients')
        .doc(invoice.clientId)
        .get();
      
      if (!clientDoc.exists) {
        functions.logger.error('Cliente não encontrado:', invoice.clientId);
        return;
      }
      
      const client = clientDoc.data();
      
      await sendEmailNotification({
        type: 'new_invoice',
        invoice: { id: invoiceId, ...invoice },
        client: { id: invoice.clientId, ...client }
      });
      
      functions.logger.info('Notificação de nova fatura enviada');
      
    } catch (error) {
      functions.logger.error('Erro no trigger de nova fatura:', error);
    }
  });

exports.onInvoiceUpdated = functions
  .region('southamerica-east1')
  .firestore.document('invoices/{invoiceId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const invoiceId = context.params.invoiceId;
    
    if (before.status !== 'paid' && after.status === 'paid') {
      functions.logger.info(`Fatura paga: ${invoiceId}`);
      
      try {
        const clientDoc = await admin.firestore()
          .collection('clients')
          .doc(after.clientId)
          .get();
        
        if (clientDoc.exists) {
          const client = clientDoc.data();
          
          await sendEmailNotification({
            type: 'payment_confirmation',
            invoice: { id: invoiceId, ...after },
            client: { id: after.clientId, ...client }
          });
          
          functions.logger.info('Confirmação de pagamento enviada');
        }
        
      } catch (error) {
        functions.logger.error('Erro no trigger de fatura paga:', error);
      }
    }
  });

exports.backupDatabase = functions
  .region('southamerica-east1')
  .pubsub.schedule('0 2 * * 0')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    functions.logger.info('Iniciando backup automático...');
    
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
      
      await admin.firestore()
        .collection('backups')
        .doc(new Date().toISOString().split('T')[0])
        .set({
          data: backupData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          collections: collections,
          totalDocuments: Object.values(backupData).reduce((sum, arr) => sum + arr.length, 0)
        });
      
      functions.logger.info('Backup automático concluído');
      
    } catch (error) {
      functions.logger.error('Erro no backup automático:', error);
    }
  });

exports.cleanupLogs = functions
  .region('southamerica-east1')
  .pubsub.schedule('0 3 1 * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    functions.logger.info('Limpando logs antigos...');
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 3);
      
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
          .limit(500)
          .get();
        
        if (!snapshot.empty) {
          const batch = admin.firestore().batch();
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
            totalDeleted++;
          });
          
          await batch.commit();
        }
      }
      
      functions.logger.info(`Limpeza concluída: ${totalDeleted} logs removidos`);
      
    } catch (error) {
      functions.logger.error('Erro na limpeza de logs:', error);
    }
  });