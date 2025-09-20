// src/services/pdfService.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate } from '../utils/formatters';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

class PDFService {
  constructor() {
    this.companyInfo = {
      name: 'Conexão Delivery',
      address: 'Rua Exemplo, 123 - São Paulo/SP',
      phone: '(11) 99999-9999',
      email: 'contato@conexaodelivery.com',
      website: 'www.conexaodelivery.com',
      cnpj: '12.345.678/0001-90'
    };
  }

  // Configurar informações da empresa
  setCompanyInfo(info) {
    this.companyInfo = { ...this.companyInfo, ...info };
  }

  // Gerar fatura individual em PDF
  async generateInvoicePDF(invoice, client) {
    try {
      const doc = new jsPDF();
      
      // Configurações
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 30;

      // Header da empresa
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(this.companyInfo.name, margin, yPosition);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(this.companyInfo.address, margin, yPosition + 10);
      doc.text(`Tel: ${this.companyInfo.phone} | Email: ${this.companyInfo.email}`, margin, yPosition + 20);
      doc.text(`CNPJ: ${this.companyInfo.cnpj}`, margin, yPosition + 30);

      // Linha separadora
      yPosition += 45;
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);

      // Título da fatura
      yPosition += 20;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FATURA', margin, yPosition);
      
      // Número e data da fatura
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nº: ${invoice.id}`, pageWidth - 80, yPosition - 15);
      doc.text(`Data: ${formatDate(invoice.generationDate)}`, pageWidth - 80, yPosition);
      doc.text(`Vencimento: ${formatDate(invoice.dueDate)}`, pageWidth - 80, yPosition + 15);

      // Informações do cliente
      yPosition += 30;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DO CLIENTE', margin, yPosition);
      
      yPosition += 15;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nome: ${client.name}`, margin, yPosition);
      doc.text(`Email: ${client.email}`, margin, yPosition + 12);
      if (client.phone) {
        doc.text(`Telefone: ${client.phone}`, margin, yPosition + 24);
      }
      if (client.cpf) {
        doc.text(`CPF: ${client.cpf}`, margin, yPosition + 36);
      }

      // Detalhes da fatura
      yPosition += 60;
      const tableData = [
        ['Descrição', 'Valor'],
        [invoice.description || 'Serviço de delivery', formatCurrency(invoice.amount)]
      ];

      doc.autoTable({
        startY: yPosition,
        head: [tableData[0]],
        body: [tableData[1]],
        theme: 'grid',
        styles: {
          fontSize: 11,
          cellPadding: 8
        },
        headStyles: {
          fillColor: [241, 116, 22], // Cor laranja
          textColor: [255, 255, 255]
        }
      });

      // Total
      yPosition = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL: ${formatCurrency(invoice.amount)}`, pageWidth - 80, yPosition, { align: 'right' });

      // Status da fatura
      yPosition += 20;
      const statusColor = this.getStatusColor(invoice.status);
      doc.setTextColor(statusColor.r, statusColor.g, statusColor.b);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const statusText = this.getStatusText(invoice.status);
      doc.text(`STATUS: ${statusText}`, margin, yPosition);
      
      // Reset cor
      doc.setTextColor(0, 0, 0);

      // Informações de pagamento
      if (invoice.status !== 'paid') {
        yPosition += 30;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMAÇÕES PARA PAGAMENTO', margin, yPosition);
        
        yPosition += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('PIX:', margin, yPosition);
        doc.text(client.pix || this.companyInfo.email, margin + 20, yPosition);
        
        yPosition += 15;
        doc.text('Após o pagamento, envie o comprovante para:', margin, yPosition);
        doc.text(this.companyInfo.email, margin, yPosition + 10);
      } else if (invoice.paidDate) {
        yPosition += 30;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(34, 197, 94); // Verde
        doc.text(`✓ PAGO EM: ${formatDate(invoice.paidDate)}`, margin, yPosition);
        doc.setTextColor(0, 0, 0);
      }

      // Footer
      yPosition = doc.internal.pageSize.height - 40;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(128, 128, 128);
      doc.text('Este documento foi gerado automaticamente pelo Sistema de Cobranças Conexão Delivery', 
               pageWidth / 2, yPosition, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 
               pageWidth / 2, yPosition + 10, { align: 'center' });

      // Salvar log
      await this.logPDFGeneration('invoice', invoice.id, client.id);

      return {
        success: true,
        pdf: doc,
        filename: `Fatura_${invoice.id}_${client.name.replace(/\s/g, '_')}.pdf`
      };

    } catch (error) {
      console.error('Erro ao gerar PDF da fatura:', error);
      return { success: false, error: error.message };
    }
  }

  // Gerar relatório de faturas em PDF
  async generateInvoicesReportPDF(invoices, clients, filters = {}) {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 30;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO DE FATURAS', pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(this.companyInfo.name, pageWidth / 2, yPosition, { align: 'center' });

      // Filtros aplicados
      yPosition += 25;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('FILTROS APLICADOS:', margin, yPosition);
      
      yPosition += 12;
      doc.setFont('helvetica', 'normal');
      if (filters.startDate && filters.endDate) {
        doc.text(`Período: ${formatDate(filters.startDate)} a ${formatDate(filters.endDate)}`, margin, yPosition);
        yPosition += 10;
      }
      if (filters.status && filters.status !== 'all') {
        doc.text(`Status: ${this.getStatusText(filters.status)}`, margin, yPosition);
        yPosition += 10;
      }
      doc.text(`Total de faturas: ${invoices.length}`, margin, yPosition);

      // Resumo
      yPosition += 20;
      const summary = this.calculateSummary(invoices);
      
      const summaryData = [
        ['Status', 'Quantidade', 'Valor Total'],
        ['Pagas', summary.paid.count.toString(), formatCurrency(summary.paid.amount)],
        ['Pendentes', summary.pending.count.toString(), formatCurrency(summary.pending.amount)],
        ['Vencidas', summary.overdue.count.toString(), formatCurrency(summary.overdue.amount)],
        ['TOTAL', summary.total.count.toString(), formatCurrency(summary.total.amount)]
      ];

      doc.autoTable({
        startY: yPosition,
        head: [summaryData[0]],
        body: summaryData.slice(1),
        theme: 'striped',
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        headStyles: {
          fillColor: [241, 116, 22],
          textColor: [255, 255, 255]
        }
      });

      // Lista detalhada de faturas
      yPosition = doc.lastAutoTable.finalY + 25;
      
      // Verificar se precisa de nova página
      if (yPosition > doc.internal.pageSize.height - 100) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALHES DAS FATURAS', margin, yPosition);

      yPosition += 10;
      const tableData = invoices.slice(0, 50).map(invoice => { // Limitar a 50 para não ficar muito grande
        const client = clients.find(c => c.id === invoice.clientId);
        return [
          invoice.id.substring(0, 8),
          client ? client.name : 'N/A',
          formatCurrency(invoice.amount),
          formatDate(invoice.dueDate),
          this.getStatusText(invoice.status),
          invoice.paidDate ? formatDate(invoice.paidDate) : '-'
        ];
      });

      doc.autoTable({
        startY: yPosition + 10,
        head: [['ID', 'Cliente', 'Valor', 'Vencimento', 'Status', 'Pago em']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [241, 116, 22],
          textColor: [255, 255, 255]
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 40 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 }
        }
      });

      // Aviso se houver mais faturas
      if (invoices.length > 50) {
        yPosition = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`* Exibindo apenas as primeiras 50 faturas de ${invoices.length} total`, margin, yPosition);
      }