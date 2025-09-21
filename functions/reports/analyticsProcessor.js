// src/components/reports/analyticsProcessor.js
import { getDaysDifference } from '../../utils/dateUtils';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * Processador de análises avançadas para relatórios
 */
export class AnalyticsProcessor {
  constructor(invoices, clients, subscriptions = []) {
    this.invoices = invoices || [];
    this.clients = clients || [];
    this.subscriptions = subscriptions || [];
  }

  /**
   * Corrige o status das faturas considerando vencimento
   */
  getCorrectedInvoices() {
    return this.invoices.map(invoice => ({
      ...invoice,
      actualStatus: this.getActualStatus(invoice)
    }));
  }

  /**
   * Determina o status real da fatura
   */
  getActualStatus(invoice) {
    if (invoice.status === 'paid') return 'paid';
    if (invoice.status === 'pending' && getDaysDifference(invoice.dueDate) < 0) {
      return 'overdue';
    }
    return invoice.status;
  }

  /**
   * Análise de tendências temporais
   */
  getTimeSeriesAnalysis(startDate, endDate, period = 'monthly') {
    const filteredInvoices = this.filterByDateRange(startDate, endDate);
    const groupedData = this.groupByPeriod(filteredInvoices, period);
    
    return Object.entries(groupedData).map(([key, invoices]) => {
      const correctedInvoices = invoices.map(inv => ({
        ...inv,
        actualStatus: this.getActualStatus(inv)
      }));

      return {
        period: key,
        total: correctedInvoices.length,
        paid: correctedInvoices.filter(inv => inv.actualStatus === 'paid').length,
        pending: correctedInvoices.filter(inv => inv.actualStatus === 'pending').length,
        overdue: correctedInvoices.filter(inv => inv.actualStatus === 'overdue').length,
        totalRevenue: this.calculateRevenue(correctedInvoices, 'paid'),
        pendingRevenue: this.calculateRevenue(correctedInvoices, 'pending'),
        overdueRevenue: this.calculateRevenue(correctedInvoices, 'overdue'),
        paymentRate: this.calculatePaymentRate(correctedInvoices)
      };
    });
  }

  /**
   * Análise de performance por cliente
   */
  getClientAnalysis(startDate, endDate) {
    const filteredInvoices = this.filterByDateRange(startDate, endDate);
    
    return this.clients.map(client => {
      const clientInvoices = filteredInvoices
        .filter(inv => inv.clientId === client.id)
        .map(inv => ({ ...inv, actualStatus: this.getActualStatus(inv) }));

      if (clientInvoices.length === 0) return null;

      const totalAmount = this.calculateRevenue(clientInvoices);
      const paidAmount = this.calculateRevenue(clientInvoices, 'paid');
      const pendingAmount = this.calculateRevenue(clientInvoices, 'pending');
      const overdueAmount = this.calculateRevenue(clientInvoices, 'overdue');

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        totalInvoices: clientInvoices.length,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        paymentRate: this.calculatePaymentRate(clientInvoices),
        averageAmount: totalAmount / clientInvoices.length,
        daysSinceLastPayment: this.getDaysSinceLastPayment(clientInvoices),
        riskScore: this.calculateRiskScore(clientInvoices),
        monthlyRecurrence: this.calculateMonthlyRecurrence(clientInvoices)
      };
    }).filter(Boolean).sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Análise de sazonalidade
   */
  getSeasonalityAnalysis() {
    const monthlyData = {};
    const weekdayData = {};

    this.invoices.forEach(invoice => {
      const date = new Date(invoice.dueDate);
      const month = date.getMonth();
      const weekday = date.getDay();
      
      // Análise mensal
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, revenue: 0 };
      }
      monthlyData[month].count++;
      monthlyData[month].revenue += parseFloat(invoice.amount || 0);

      // Análise por dia da semana
      if (!weekdayData[weekday]) {
        weekdayData[weekday] = { count: 0, revenue: 0 };
      }
      weekdayData[weekday].count++;
      weekdayData[weekday].revenue += parseFloat(invoice.amount || 0);
    });

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const weekdayNames = [
      'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
    ];

    return {
      monthly: Object.entries(monthlyData).map(([month, data]) => ({
        period: monthNames[parseInt(month)],
        count: data.count,
        revenue: data.revenue,
        averageAmount: data.revenue / data.count
      })),
      weekday: Object.entries(weekdayData).map(([day, data]) => ({
        period: weekdayNames[parseInt(day)],
        count: data.count,
        revenue: data.revenue,
        averageAmount: data.revenue / data.count
      }))
    };
  }

  /**
   * Previsões e projeções
   */
  getProjections(months = 3) {
    const recentInvoices = this.invoices
      .filter(inv => {
        const date = new Date(inv.generationDate || inv.dueDate);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return date >= threeMonthsAgo;
      });

    const monthlyAverage = recentInvoices.reduce((sum, inv) => 
      sum + parseFloat(inv.amount || 0), 0) / Math.max(recentInvoices.length, 1);

    const activeSubscriptions = this.subscriptions.filter(sub => sub.status === 'active');
    const recurringRevenue = activeSubscriptions.reduce((sum, sub) => 
      sum + parseFloat(sub.amount || 0), 0);

    const projections = [];
    for (let i = 1; i <= months; i++) {
      const projectedDate = new Date();
      projectedDate.setMonth(projectedDate.getMonth() + i);
      
      projections.push({
        month: projectedDate.toISOString().slice(0, 7),
        monthName: projectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        estimatedRevenue: recurringRevenue * 0.8 + (monthlyAverage * 0.2), // 80% recorrente + 20% variável
        confidence: Math.max(0.6, 0.9 - (i * 0.1)), // Confiança diminui com o tempo
        recurringPortion: recurringRevenue,
        variablePortion: monthlyAverage * 0.2
      });
    }

    return {
      projections,
      recurringRevenue,
      monthlyAverage,
      activeSubscriptions: activeSubscriptions.length,
      totalClients: this.clients.length
    };
  }

  /**
   * Análise de inadimplência
   */
  getDefaultAnalysis() {
    const correctedInvoices = this.getCorrectedInvoices();
    const overdueInvoices = correctedInvoices.filter(inv => inv.actualStatus === 'overdue');
    
    const defaultRanges = {
      '1-7': { count: 0, amount: 0 },
      '8-15': { count: 0, amount: 0 },
      '16-30': { count: 0, amount: 0 },
      '31-60': { count: 0, amount: 0 },
      '60+': { count: 0, amount: 0 }
    };

    overdueInvoices.forEach(invoice => {
      const daysOverdue = Math.abs(getDaysDifference(invoice.dueDate));
      const amount = parseFloat(invoice.amount || 0);

      if (daysOverdue <= 7) {
        defaultRanges['1-7'].count++;
        defaultRanges['1-7'].amount += amount;
      } else if (daysOverdue <= 15) {
        defaultRanges['8-15'].count++;
        defaultRanges['8-15'].amount += amount;
      } else if (daysOverdue <= 30) {
        defaultRanges['16-30'].count++;
        defaultRanges['16-30'].amount += amount;
      } else if (daysOverdue <= 60) {
        defaultRanges['31-60'].count++;
        defaultRanges['31-60'].amount += amount;
      } else {
        defaultRanges['60+'].count++;
        defaultRanges['60+'].amount += amount;
      }
    });

    return {
      totalOverdue: overdueInvoices.length,
      totalOverdueAmount: overdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0),
      defaultRanges: Object.entries(defaultRanges).map(([range, data]) => ({
        range,
        count: data.count,
        amount: data.amount,
        percentage: overdueInvoices.length > 0 ? (data.count / overdueInvoices.length * 100) : 0
      })),
      worstClients: this.getWorstPayingClients(5)
    };
  }

  /**
   * Métodos auxiliares privados
   */
  filterByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return this.invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.dueDate);
      return invoiceDate >= start && invoiceDate <= end;
    });
  }

  groupByPeriod(invoices, period) {
    const grouped = {};

    invoices.forEach(invoice => {
      const date = new Date(invoice.dueDate);
      let key;

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(invoice);
    });

    return grouped;
  }

  calculateRevenue(invoices, status = null) {
    return invoices
      .filter(inv => !status || inv.actualStatus === status)
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  }

  calculatePaymentRate(invoices) {
    if (invoices.length === 0) return 0;
    const paidCount = invoices.filter(inv => inv.actualStatus === 'paid').length;
    return (paidCount / invoices.length) * 100;
  }

  getDaysSinceLastPayment(clientInvoices) {
    const paidInvoices = clientInvoices
      .filter(inv => inv.actualStatus === 'paid' && inv.paidDate)
      .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));

    if (paidInvoices.length === 0) return null;

    const lastPaymentDate = new Date(paidInvoices[0].paidDate);
    const today = new Date();
    return Math.floor((today - lastPaymentDate) / (1000 * 60 * 60 * 24));
  }

  calculateRiskScore(clientInvoices) {
    let score = 0;
    
    const overdueCount = clientInvoices.filter(inv => inv.actualStatus === 'overdue').length;
    const totalCount = clientInvoices.length;
    const paymentRate = this.calculatePaymentRate(clientInvoices);
    
    // Pontuação baseada em atraso
    score += (overdueCount / totalCount) * 40;
    
    // Pontuação baseada em taxa de pagamento
    score += (100 - paymentRate) * 0.3;
    
    // Pontuação baseada em dias desde último pagamento
    const daysSinceLastPayment = this.getDaysSinceLastPayment(clientInvoices);
    if (daysSinceLastPayment !== null) {
      score += Math.min(daysSinceLastPayment / 30, 1) * 20;
    }

    return Math.min(Math.round(score), 100);
  }

  calculateMonthlyRecurrence(clientInvoices) {
    const monthly = {};
    
    clientInvoices.forEach(invoice => {
      const month = new Date(invoice.dueDate).getMonth();
      if (!monthly[month]) monthly[month] = 0;
      monthly[month] += parseFloat(invoice.amount || 0);
    });

    const values = Object.values(monthly);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  getWorstPayingClients(limit = 5) {
    return this.getClientAnalysis(
      new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 meses atrás
      new Date().toISOString().split('T')[0]
    )
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, limit)
    .map(client => ({
      id: client.id,
      name: client.name,
      riskScore: client.riskScore,
      overdueAmount: client.overdueAmount,
      paymentRate: client.paymentRate,
      daysSinceLastPayment: client.daysSinceLastPayment
    }));
  }

  /**
   * Relatório executivo resumido
   */
  getExecutiveSummary(startDate, endDate) {
    const filteredInvoices = this.filterByDateRange(startDate, endDate);
    const correctedInvoices = filteredInvoices.map(inv => ({
      ...inv,
      actualStatus: this.getActualStatus(inv)
    }));

    const totalRevenue = this.calculateRevenue(correctedInvoices);
    const paidRevenue = this.calculateRevenue(correctedInvoices, 'paid');
    const pendingRevenue = this.calculateRevenue(correctedInvoices, 'pending');
    const overdueRevenue = this.calculateRevenue(correctedInvoices, 'overdue');

    const previousPeriodStart = new Date(startDate);
    const currentPeriodStart = new Date(startDate);
    const periodLength = new Date(endDate) - currentPeriodStart;
    previousPeriodStart.setTime(currentPeriodStart.getTime() - periodLength);

    const previousInvoices = this.filterByDateRange(
      previousPeriodStart.toISOString().split('T')[0],
      startDate
    ).map(inv => ({ ...inv, actualStatus: this.getActualStatus(inv) }));

    const previousRevenue = this.calculateRevenue(previousInvoices, 'paid');
    const revenueGrowth = previousRevenue > 0 ? ((paidRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return {
      period: {
        start: formatDate(startDate),
        end: formatDate(endDate)
      },
      totals: {
        invoices: correctedInvoices.length,
        revenue: totalRevenue,
        paidRevenue,
        pendingRevenue,
        overdueRevenue
      },
      metrics: {
        paymentRate: this.calculatePaymentRate(correctedInvoices),
        averageAmount: totalRevenue / Math.max(correctedInvoices.length, 1),
        revenueGrowth,
        clientsWithOverdue: new Set(correctedInvoices.filter(inv => inv.actualStatus === 'overdue').map(inv => inv.clientId)).size
      },
      alerts: this.generateAlerts(correctedInvoices),
      recommendations: this.generateRecommendations(correctedInvoices)
    };
  }

  generateAlerts(invoices) {
    const alerts = [];
    const overdueAmount = this.calculateRevenue(invoices, 'overdue');
    const totalAmount = this.calculateRevenue(invoices);
    
    if (overdueAmount / totalAmount > 0.2) {
      alerts.push({
        type: 'danger',
        message: `Alto valor em atraso: ${formatCurrency(overdueAmount)} (${((overdueAmount / totalAmount) * 100).toFixed(1)}%)`
      });
    }

    const paymentRate = this.calculatePaymentRate(invoices);
    if (paymentRate < 70) {
      alerts.push({
        type: 'warning',
        message: `Taxa de pagamento baixa: ${paymentRate.toFixed(1)}%`
      });
    }

    const veryOverdue = invoices.filter(inv => {
      return inv.actualStatus === 'overdue' && Math.abs(getDaysDifference(inv.dueDate)) > 30;
    });

    if (veryOverdue.length > 0) {
      alerts.push({
        type: 'info',
        message: `${veryOverdue.length} faturas com mais de 30 dias de atraso`
      });
    }

    return alerts;
  }

  generateRecommendations(invoices) {
    const recommendations = [];
    const paymentRate = this.calculatePaymentRate(invoices);
    const overdueCount = invoices.filter(inv => inv.actualStatus === 'overdue').length;

    if (paymentRate < 80) {
      recommendations.push('Implementar sistema de lembretes automáticos para pagamentos');
    }

    if (overdueCount > 5) {
      recommendations.push('Revisar política de cobrança e prazos de pagamento');
    }

    const clientAnalysis = this.getClientAnalysis(
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    const highRiskClients = clientAnalysis.filter(client => client.riskScore > 70);
    if (highRiskClients.length > 0) {
      recommendations.push(`Atenção especial a ${highRiskClients.length} clientes de alto risco`);
    }

    return recommendations;
  }
}