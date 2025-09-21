// src/components/reports/pdfGenerator.js
import { formatCurrency, formatDate } from '../../utils/formatters';
import { INVOICE_STATUS_LABELS } from '../../utils/constants';

/**
 * Gerador de PDF para relatórios
 * Nota: Esta é uma implementação mockada. Para produção, usar bibliotecas como:
 * - jsPDF + html2canvas
 * - @react-pdf/renderer
 * - Puppeteer (backend)
 */
export class PDFGenerator {
  constructor(data) {
    this.data = data;
  }

  /**
   * Gerar PDF de relatório executivo
   */
  async generateExecutiveReport(analytics) {
    // Mock implementation - substituir por biblioteca real
    const pdfContent = this.buildExecutiveReportHTML(analytics);
    
    // Simular geração de PDF
    return new Promise((resolve) => {
      setTimeout(() => {
        this.downloadMockPDF(pdfContent, 'relatorio-executivo.pdf');
        resolve(true);
      }, 1500);
    });
  }

  /**
   * Gerar PDF detalhado com todas as faturas
   */
  async generateDetailedReport(invoices, clients, filters) {
    const pdfContent = this.buildDetailedReportHTML(invoices, clients, filters);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        this.downloadMockPDF(pdfContent, `relatorio-detalhado-${filters.startDate}-${filters.endDate}.pdf`);
        resolve(true);
      }, 2000);
    });
  }

  /**
   * Gerar PDF com análise de clientes
   */
  async generateClientAnalysisReport(clientsData) {
    const pdfContent = this.buildClientAnalysisHTML(clientsData);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        this.downloadMockPDF(pdfContent, 'analise-clientes.pdf');
        resolve(true);
      }, 1500);
    });
  }

  /**
   * Construir HTML do relatório executivo
   */
  buildExecutiveReportHTML(analytics) {
    const { summary, clientAnalysis, projections } = analytics;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório Executivo</title>
        <style>
          ${this.getBaseStyles()}
          .executive-summary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
          .metric-card { background: white; border-radius: 8px; padding: 20px; margin: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .growth-positive { color: #22c55e; }
          .growth-negative { color: #ef4444; }
          .alert-danger { background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 8px 0; }
          .alert-warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 8px 0; }
          .chart-placeholder { background: #f3f4f6; height: 200px; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="header executive-summary">
          <h1>📊 Relatório Executivo</h1>
          <p>Período: ${summary.period.start} - ${summary.period.end}</p>
          <p>Gerado em: ${formatDate(new Date().toISOString().split('T')[0])}</p>
        </div>

        <div class="content">
          <!-- Métricas Principais -->
          <section>
            <h2>📈 Métricas Principais</h2>
            <div style="display: flex; flex-wrap: wrap;">
              <div class="metric-card">
                <h3>Faturamento Total</h3>
                <div class="metric-value">${formatCurrency(summary.totals.revenue)}</div>
                <div class="metric-growth ${summary.metrics.revenueGrowth >= 0 ? 'growth-positive' : 'growth-negative'}">
                  ${summary.metrics.revenueGrowth >= 0 ? '↗' : '↘'} ${Math.abs(summary.metrics.revenueGrowth).toFixed(1)}%
                </div>
              </div>
              
              <div class="metric-card">
                <h3>Taxa de Pagamento</h3>
                <div class="metric-value">${summary.metrics.paymentRate.toFixed(1)}%</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${summary.metrics.paymentRate}%;"></div>
                </div>
              </div>
              
              <div class="metric-card">
                <h3>Ticket Médio</h3>
                <div class="metric-value">${formatCurrency(summary.metrics.averageAmount)}</div>
              </div>
              
              <div class="metric-card">
                <h3>Faturas Geradas</h3>
                <div class="metric-value">${summary.totals.invoices}</div>
              </div>
            </div>
          </section>

          <!-- Alertas -->
          ${summary.alerts.length > 0 ? `
            <section>
              <h2>⚠️ Alertas</h2>
              ${summary.alerts.map(alert => `
                <div class="alert-${alert.type}">${alert.message}</div>
              `).join('')}
            </section>
          ` : ''}

          <!-- Distribuição por Status -->
          <section>
            <h2>📊 Distribuição por Status</h2>
            <div style="display: flex; align-items: center; gap: 20px;">
              <div class="chart-placeholder">
                <div>Gráfico de Pizza<br>Status das Faturas</div>
              </div>
              <div>
                <div class="legend-item">
                  <span class="legend-color" style="background: #22c55e;"></span>
                  Pagas: ${formatCurrency(summary.totals.paidRevenue)}
                </div>
                <div class="legend-item">
                  <span class="legend-color" style="background: #f59e0b;"></span>
                  Pendentes: ${formatCurrency(summary.totals.pendingRevenue)}
                </div>
                <div class="legend-item">
                  <span class="legend-color" style="background: #ef4444;"></span>
                  Vencidas: ${formatCurrency(summary.totals.overdueRevenue)}
                </div>
              </div>
            </div>
          </section>

          <!-- Top Clientes -->
          <section>
            <h2>🏆 Top Clientes</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Faturamento</th>
                  <th>Taxa Pagamento</th>
                  <th>Risco</th>
                </tr>
              </thead>
              <tbody>
                ${clientAnalysis.slice(0, 10).map(client => `
                  <tr>
                    <td>${client.name}</td>
                    <td>${formatCurrency(client.totalAmount)}</td>
                    <td>${client.paymentRate.toFixed(1)}%</td>
                    <td class="${client.riskScore > 70 ? 'high-risk' : client.riskScore > 40 ? 'medium-risk' : 'low-risk'}">
                      ${client.riskScore.toFixed(0)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </section>

          <!-- Projeções -->
          <section>
            <h2>🔮 Projeções (3 meses)</h2>
            <div class="chart-placeholder">
              <div>Gráfico de Evolução<br>Projeções de Receita</div>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Receita Estimada</th>
                  <th>Confiança</th>
                </tr>
              </thead>
              <tbody>
                ${projections.projections.map(proj => `
                  <tr>
                    <td>${proj.monthName}</td>
                    <td>${formatCurrency(proj.estimatedRevenue)}</td>
                    <td>${(proj.confidence * 100).toFixed(0)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </section>

          <!-- Recomendações -->
          <section>
            <h2>💡 Recomendações</h2>
            <ul>
              ${summary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </section>
        </div>

        <div class="footer">
          <p>Relatório gerado automaticamente pelo sistema de gestão de faturas</p>
          <p>Para mais informações, acesse o dashboard completo</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Construir HTML do relatório detalhado
   */
  buildDetailedReportHTML(invoices, clients, filters) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório Detalhado de Faturas</title>
        <style>${this.getBaseStyles()}</style>
      </head>
      <body>
        <div class="header">
          <h1>📋 Relatório Detalhado de Faturas</h1>
          <p>Período: ${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}</p>
          <p>Status: ${filters.status === 'all' ? 'Todos' : INVOICE_STATUS_LABELS[filters.status] || filters.status}</p>
          <p>Gerado em: ${formatDate(new Date().toISOString().split('T')[0])}</p>
        </div>

        <div class="content">
          <!-- Resumo -->
          <section>
            <h2>📊 Resumo</h2>
            <div class="summary-grid">
              <div>Total de Faturas: <strong>${invoices.length}</strong></div>
              <div>Valor Total: <strong>${formatCurrency(invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0))}</strong></div>
            </div>
          </section>

          <!-- Tabela de Faturas -->
          <section>
            <h2>📝 Faturas Encontradas</h2>
            <table class="data-table full-width">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th>Pagamento</th>
                </tr>
              </thead>
              <tbody>
                ${invoices.map(invoice => {
                  const client = clients.find(c => c.id === invoice.clientId);
                  return `
                    <tr>
                      <td>${client ? client.name : 'Cliente não encontrado'}</td>
                      <td class="description">${invoice.description || 'Sem descrição'}</td>
                      <td class="amount">${formatCurrency(invoice.amount)}</td>
                      <td>${formatDate(invoice.dueDate)}</td>
                      <td>
                        <span class="status-${invoice.status}">${INVOICE_STATUS_LABELS[invoice.status] || invoice.status}</span>
                      </td>
                      <td>${invoice.paidDate ? formatDate(invoice.paidDate) : '-'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </section>
        </div>

        <div class="footer">
          <p>Total de ${invoices.length} faturas listadas</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Construir HTML da análise de clientes
   */
  buildClientAnalysisHTML(clientsData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Análise de Clientes</title>
        <style>
          ${this.getBaseStyles()}
          .risk-low { color: #22c55e; font-weight: bold; }
          .risk-medium { color: #f59e0b; font-weight: bold; }
          .risk-high { color: #ef4444; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>👥 Análise de Clientes</h1>
          <p>Gerado em: ${formatDate(new Date().toISOString().split('T')[0])}</p>
        </div>

        <div class="content">
          <section>
            <h2>📈 Ranking de Clientes</h2>
            <table class="data-table full-width">
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Cliente</th>
                  <th>Faturas</th>
                  <th>Faturamento</th>
                  <th>Recebido</th>
                  <th>Taxa Pagamento</th>
                  <th>Risco</th>
                </tr>
              </thead>
              <tbody>
                ${clientsData.map((client, index) => `
                  <tr>
                    <td>${index + 1}º</td>
                    <td><strong>${client.name}</strong></td>
                    <td>${client.totalInvoices}</td>
                    <td class="amount">${formatCurrency(client.totalAmount)}</td>
                    <td class="amount">${formatCurrency(client.paidAmount)}</td>
                    <td>${client.paymentRate.toFixed(1)}%</td>
                    <td class="risk-${client.riskScore > 70 ? 'high' : client.riskScore > 40 ? 'medium' : 'low'}">
                      ${client.riskScore.toFixed(0)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </section>

          <section>
            <h2>⚠️ Clientes de Alto Risco</h2>
            ${clientsData.filter(c => c.riskScore > 70).length > 0 ? `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Valor em Atraso</th>
                    <th>Dias Último Pagamento</th>
                    <th>Score de Risco</th>
                  </tr>
                </thead>
                <tbody>
                  ${clientsData.filter(c => c.riskScore > 70).map(client => `
                    <tr>
                      <td>${client.name}</td>
                      <td class="amount">${formatCurrency(client.overdueAmount || 0)}</td>
                      <td>${client.daysSinceLastPayment || 'N/A'}</td>
                      <td class="risk-high">${client.riskScore.toFixed(0)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : `
              <p class="success-message">🎉 Nenhum cliente de alto risco identificado!</p>
            `}
          </section>
        </div>

        <div class="footer">
          <p>Análise baseada em ${clientsData.length} clientes ativos</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Estilos base para PDF
   */
  getBaseStyles() {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #374151;
        background: #f9fafb;
        max-width: 210mm;
        margin: 0 auto;
        padding: 20px;
      }
      
      .header {
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        color: white;
        padding: 30px;
        border-radius: 12px;
        margin-bottom: 30px;
        text-align: center;
      }
      
      .header h1 { font-size: 28px; margin-bottom: 10px; }
      .header p { font-size: 14px; opacity: 0.9; margin: 5px 0; }
      
      .content { margin: 30px 0; }
      
      section {
        background: white;
        padding: 25px;
        border-radius: 12px;
        margin-bottom: 25px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      h2 {
        color: #1f2937;
        font-size: 20px;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #f3f4f6;
      }
      
      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
      }
      
      .data-table th {
        background: #f9fafb;
        padding: 12px 8px;
        text-align: left;
        font-weight: 600;
        font-size: 13px;
        color: #374151;
        border-bottom: 2px solid #e5e7eb;
      }
      
      .data-table td {
        padding: 10px 8px;
        border-bottom: 1px solid #f3f4f6;
        font-size: 13px;
      }
      
      .data-table tr:hover { background: #f9fafb; }
      
      .amount { 
        text-align: right; 
        font-weight: 600; 
        font-family: 'Monaco', monospace;
      }
      
      .description { max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
      
      .status-paid { 
        background: #dcfce7; 
        color: #166534; 
        padding: 4px 8px; 
        border-radius: 6px; 
        font-size: 12px;
        font-weight: 500;
      }
      
      .status-pending { 
        background: #fef3c7; 
        color: #92400e; 
        padding: 4px 8px; 
        border-radius: 6px; 
        font-size: 12px;
        font-weight: 500;
      }
      
      .status-overdue { 
        background: #fee2e2; 
        color: #991b1b; 
        padding: 4px 8px; 
        border-radius: 6px; 
        font-size: 12px;
        font-weight: 500;
      }
      
      .metric-value {
        font-size: 32px;
        font-weight: bold;
        color: #1f2937;
        margin: 10px 0;
      }
      
      .metric-growth {
        font-size: 14px;
        font-weight: 600;
        margin-top: 8px;
      }
      
      .progress-bar {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        margin-top: 8px;
        overflow: hidden;
      }
      
      .progress-fill {
        height: 100%;
        background: #22c55e;
        border-radius: 4px;
        transition: width 0.3s ease;
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        margin: 8px 0;
        font-size: 14px;
      }
      
      .legend-color {
        width: 16px;
        height: 16px;
        border-radius: 4px;
        margin-right: 10px;
      }
      
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin: 15px 0;
        font-size: 14px;
      }
      
      .success-message {
        background: #d1fae5;
        color: #065f46;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        font-weight: 500;
      }
      
      .high-risk { background: #fee2e2; }
      .medium-risk { background: #fef3c7; }
      .low-risk { background: #d1fae5; }
      
      .footer {
        background: #f3f4f6;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        font-size: 12px;
        color: #6b7280;
        margin-top: 30px;
      }
      
      .full-width { width: 100%; }
      
      @media print {
        body { background: white; padding: 0; }
        .header { background: #f97316 !important; }
        section { box-shadow: none; border: 1px solid #e5e7eb; }
      }
    `;
  }

  /**
   * Download simulado de PDF (mockado)
   */
  downloadMockPDF(htmlContent, filename) {
    // Em produção, usar biblioteca real de PDF
    console.log('📄 Gerando PDF:', filename);
    
    // Criar blob com HTML para preview
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Abrir em nova janela para preview
    const newWindow = window.open(url, '_blank');
    
    // Simular download após preview
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.replace('.pdf', '.html'); // Temporário
      link.click();
      URL.revokeObjectURL(url);
    }, 1000);
  }

  /**
   * Configurações para diferentes tipos de relatório
   */
  getReportConfig(type) {
    const configs = {
      executive: {
        title: 'Relatório Executivo',
        subtitle: 'Visão estratégica do negócio',
        sections: ['metrics', 'alerts', 'trends', 'recommendations'],
        pageOrientation: 'portrait'
      },
      detailed: {
        title: 'Relatório Detalhado',
        subtitle: 'Listagem completa de faturas',
        sections: ['summary', 'invoices', 'breakdown'],
        pageOrientation: 'landscape'
      },
      clients: {
        title: 'Análise de Clientes',
        subtitle: 'Performance e comportamento dos clientes',
        sections: ['ranking', 'risk', 'trends'],
        pageOrientation: 'portrait'
      }
    };

    return configs[type] || configs.detailed;
  }

  /**
   * Validar dados antes da geração
   */
  validateData(data, type) {
    const errors = [];

    if (!data || typeof data !== 'object') {
      errors.push('Dados inválidos fornecidos');
    }

    switch (type) {
      case 'executive':
        if (!data.summary) errors.push('Dados do resumo executivo ausentes');
        if (!data.clientAnalysis) errors.push('Análise de clientes ausente');
        break;
      
      case 'detailed':
        if (!Array.isArray(data.invoices)) errors.push('Lista de faturas inválida');
        if (!Array.isArray(data.clients)) errors.push('Lista de clientes inválida');
        break;
      
      case 'clients':
        if (!Array.isArray(data.clientsData)) errors.push('Dados de clientes ausentes');
        break;
    }

    return errors;
  }

  /**
   * Método principal para gerar PDF
   */
  async generate(type, data) {
    // Validar dados
    const errors = this.validateData(data, type);
    if (errors.length > 0) {
      throw new Error(`Erro na validação: ${errors.join(', ')}`);
    }

    // Notificar início da geração
    console.log(`🔄 Iniciando geração do PDF: ${type}`);

    try {
      switch (type) {
        case 'executive':
          return await this.generateExecutiveReport(data);
        case 'detailed':
          return await this.generateDetailedReport(data.invoices, data.clients, data.filters);
        case 'clients':
          return await this.generateClientAnalysisReport(data.clientsData);
        default:
          throw new Error(`Tipo de relatório desconhecido: ${type}`);
      }
    } catch (error) {
      console.error('❌ Erro na geração do PDF:', error);
      throw error;
    }
  }
}

/**
 * Função utilitária para uso simples
 */
export const generateReport = async (type, data) => {
  const generator = new PDFGenerator(data);
  return await generator.generate(type, data);
};

/**
 * Hook React para usar o gerador de PDF
 */
export const usePDFGenerator = () => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const generatePDF = async (type, data) => {
    setIsGenerating(true);
    setProgress(0);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 20, 90));
      }, 300);

      const result = await generateReport(type, data);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 1000);

      return result;
    } catch (error) {
      setIsGenerating(false);
      setProgress(0);
      throw error;
    }
  };

  return {
    generatePDF,
    isGenerating,
    progress
  };
};

// Exportações
export default PDFGenerator;