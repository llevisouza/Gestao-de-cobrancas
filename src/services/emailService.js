// src/services/emailService.js
import { collection, addDoc, updateDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { formatCurrency, formatDate } from '../utils/formatters';

class EmailService {
  constructor() {
    this.apiUrl = process.env.REACT_APP_EMAIL_API_URL || 'https://api.emailjs.com/api/v1.0/email/send';
    this.serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    this.templateIds = {
      invoiceOverdue: process.env.REACT_APP_EMAILJS_TEMPLATE_OVERDUE,
      invoiceReminder: process.env.REACT_APP_EMAILJS_TEMPLATE_REMINDER,
      paymentConfirmation: process.env.REACT_APP_EMAILJS_TEMPLATE_PAYMENT,
      newInvoice: process.env.REACT_APP_EMAILJS_TEMPLATE_NEW_INVOICE
    };
    this.publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
  }

  // Enviar email genérico
  async sendEmail(templateData) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: this.serviceId,
          template_id: templateData.templateId,
          user_id: this.publicKey,
          template_params: templateData.params
        })
      });

      if (!response.ok) {
        throw new Error(`Erro no envio: ${response.statusText}`);
      }

      // Salvar log do email enviado
      await this.saveEmailLog({
        type: templateData.type,
        recipient: templateData.params.to_email,
        subject: templateData.params.subject,
        status: 'sent',
        sentAt: new Date(),
        invoiceId: templateData.params.invoice_id,
        clientId: templateData.params.client_id
      });

      return { success: true, message: 'Email enviado com sucesso' };
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      
      // Salvar log do erro
      await this.saveEmailLog({
        type: templateData.type,
        recipient: templateData.params.to_email,
        subject: templateData.params.subject,
        status: 'failed',
        error: error.message,
        sentAt: new Date(),
        invoiceId: templateData.params.invoice_id,
        clientId: templateData.params.client_id
      });

      return { success: false, error: error.message };
    }
  }

  // Notificação de fatura vencida
  async sendOverdueNotification(invoice, client) {
    const daysPastDue = Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
    
    const templateData = {
      type: 'overdue',
      templateId: this.templateIds.invoiceOverdue,
      params: {
        to_email: client.email,
        to_name: client.name,
        client_name: client.name,
        invoice_id: invoice.id,
        client_id: client.id,
        invoice_amount: formatCurrency(invoice.amount),
        due_date: formatDate(invoice.dueDate),
        days_overdue: daysPastDue,
        company_name: 'Conexão Delivery',
        company_phone: '(11) 99999-9999',
        company_email: 'contato@conexaodelivery.com',
        payment_link: this.generatePaymentLink(invoice),
        pix_key: client.pix || 'contato@conexaodelivery.com',
        subject: `⚠️ Fatura Vencida - ${formatCurrency(invoice.amount)} - ${daysPastDue} dias em atraso`
      }
    };

    return await this.sendEmail(templateData);
  }

  // Lembrete de fatura próxima do vencimento
  async sendReminderNotification(invoice, client) {
    const daysUntilDue = Math.floor((new Date(invoice.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    const templateData = {
      type: 'reminder',
      templateId: this.templateIds.invoiceReminder,
      params: {
        to_email: client.email,
        to_name: client.name,
        client_name: client.name,
        invoice_id: invoice.id,
        client_id: client.id,
        invoice_amount: formatCurrency(invoice.amount),
        due_date: formatDate(invoice.dueDate),
        days_until_due: daysUntilDue,
        company_name: 'Conexão Delivery',
        company_phone: '(11) 99999-9999',
        company_email: 'contato@conexaodelivery.com',
        payment_link: this.generatePaymentLink(invoice),
        pix_key: client.pix || 'contato@conexaodelivery.com',
        subject: `🔔 Lembrete: Fatura vence em ${daysUntilDue} dias - ${formatCurrency(invoice.amount)}`
      }
    };

    return await this.sendEmail(templateData);
  }

  // Confirmação de pagamento
  async sendPaymentConfirmation(invoice, client) {
    const templateData = {
      type: 'payment_confirmation',
      templateId: this.templateIds.paymentConfirmation,
      params: {
        to_email: client.email,
        to_name: client.name,
        client_name: client.name,
        invoice_id: invoice.id,
        client_id: client.id,
        invoice_amount: formatCurrency(invoice.amount),
        payment_date: formatDate(invoice.paidDate || new Date()),
        company_name: 'Conexão Delivery',
        company_phone: '(11) 99999-9999',
        company_email: 'contato@conexaodelivery.com',
        subject: `✅ Pagamento Confirmado - ${formatCurrency(invoice.amount)}`
      }
    };

    return await this.sendEmail(templateData);
  }

  // Notificação de nova fatura
  async sendNewInvoiceNotification(invoice, client) {
    const templateData = {
      type: 'new_invoice',
      templateId: this.templateIds.newInvoice,
      params: {
        to_email: client.email,
        to_name: client.name,
        client_name: client.name,
        invoice_id: invoice.id,
        client_id: client.id,
        invoice_amount: formatCurrency(invoice.amount),
        due_date: formatDate(invoice.dueDate),
        generation_date: formatDate(invoice.generationDate),
        company_name: 'Conexão Delivery',
        company_phone: '(11) 99999-9999',
        company_email: 'contato@conexaodelivery.com',
        payment_link: this.generatePaymentLink(invoice),
        pix_key: client.pix || 'contato@conexaodelivery.com',
        subject: `📄 Nova Fatura Gerada - ${formatCurrency(invoice.amount)}`
      }
    };

    return await this.sendEmail(templateData);
  }

  // Gerar link de pagamento (simulado)
  generatePaymentLink(invoice) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/payment/${invoice.id}`;
  }

  // Salvar log de email
  async saveEmailLog(emailData) {
    try {
      const docRef = await addDoc(collection(db, 'emailLogs'), {
        ...emailData,
        createdAt: new Date()
      });
      console.log('Log de email salvo:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao salvar log de email:', error);
    }
  }

  // Obter histórico de emails de um cliente
  async getEmailHistory(clientId, limit = 10) {
    try {
      const q = query(
        collection(db, 'emailLogs'),
        where('clientId', '==', clientId)
      );
      
      const querySnapshot = await getDocs(q);
      const emails = [];
      
      querySnapshot.forEach((doc) => {
        emails.push({ id: doc.id, ...doc.data() });
      });

      return emails
        .sort((a, b) => b.sentAt.toDate() - a.sentAt.toDate())
        .slice(0, limit);
    } catch (error) {
      console.error('Erro ao buscar histórico de emails:', error);
      return [];
    }
  }

  // Verificar se já foi enviado email hoje
  async wasEmailSentToday(clientId, type) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const q = query(
        collection(db, 'emailLogs'),
        where('clientId', '==', clientId),
        where('type', '==', type)
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const sentDate = data.sentAt.toDate();
        if (sentDate >= today && data.status === 'sent') {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao verificar email enviado hoje:', error);
      return false;
    }
  }

  // Enviar lote de emails (com delay para não sobrecarregar)
  async sendBulkEmails(notifications, delayMs = 2000) {
    const results = [];
    
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      
      try {
        console.log(`Enviando email ${i + 1}/${notifications.length}:`, notification.client.email);
        
        let result;
        switch (notification.type) {
          case 'overdue':
            result = await this.sendOverdueNotification(notification.invoice, notification.client);
            break;
          case 'reminder':
            result = await this.sendReminderNotification(notification.invoice, notification.client);
            break;
          case 'payment_confirmation':
            result = await this.sendPaymentConfirmation(notification.invoice, notification.client);
            break;
          case 'new_invoice':
            result = await this.sendNewInvoiceNotification(notification.invoice, notification.client);
            break;
          default:
            result = { success: false, error: 'Tipo de notificação inválido' };
        }
        
        results.push({
          client: notification.client.name,
          email: notification.client.email,
          type: notification.type,
          ...result
        });

        // Delay entre envios
        if (i < notifications.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
      } catch (error) {
        console.error(`Erro ao enviar email para ${notification.client.email}:`, error);
        results.push({
          client: notification.client.name,
          email: notification.client.email,
          type: notification.type,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // Configurar templates personalizados
  async saveCustomTemplate(templateData) {
    try {
      const docRef = await addDoc(collection(db, 'emailTemplates'), {
        ...templateData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter templates salvos
  async getCustomTemplates() {
    try {
      const querySnapshot = await getDocs(collection(db, 'emailTemplates'));
      const templates = [];
      
      querySnapshot.forEach((doc) => {
        templates.push({ id: doc.id, ...doc.data() });
      });

      return templates;
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      return [];
    }
  }
}

export const emailService = new EmailService();