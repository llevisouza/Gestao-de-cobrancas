// server.js - SERVIDOR PRINCIPAL REFATORADO COM ENDPOINTS DE MESSAGING
const express = require('express');
const cors = require('cors');
const WhatsAppAutomationService = require('./automationService');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://your-frontend-domain.com'
  ],
  credentials: true
}));
app.use(express.json());

// Instância da automação
const automationService = new WhatsAppAutomationService();

// ==================== ROTAS DE STATUS ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Status da automação
app.get('/api/automation/status', (req, res) => {
  try {
    const stats = automationService.getStats();
    res.json({
      success: true,
      running: automationService.isRunning,
      config: automationService.config,
      stats: {
        ...stats,
        uptime: automationService.stats.startTime 
          ? new Date() - automationService.stats.startTime 
          : 0,
        lastRun: stats.lastRun?.toISOString() || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Status WhatsApp
app.get('/api/whatsapp/status', async (req, res) => {
  try {
    const status = await automationService.checkWhatsAppConnection();
    res.json({
      success: true,
      whatsapp: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== ENDPOINTS DE MENSAGENS (NOVOS) ====================

// Verificar conexão WhatsApp
app.get('/api/messages/connection', async (req, res) => {
  try {
    const status = await automationService.checkWhatsAppConnection();
    res.json({
      success: true,
      connection: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obter QR Code para conexão
app.get('/api/messages/qr-code', async (req, res) => {
  try {
    const result = await automationService.getQRCode();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Testar conexão (com envio opcional)
app.post('/api/messages/test', async (req, res) => {
  try {
    const { phone } = req.body;
    const result = await automationService.testConnection(phone);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enviar mensagem individual
app.post('/api/messages/send', async (req, res) => {
  try {
    const { phone, message, type = 'manual' } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'Telefone e mensagem são obrigatórios'
      });
    }

    const result = await automationService.sendWhatsAppMessage(phone, message);
    
    if (result.success) {
      await automationService.saveNotificationLog({
        type: type,
        invoice: { id: 'manual', amount: 0 },
        client: { id: 'manual', name: 'Manual', phone: phone }
      }, result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enviar notificação de fatura vencida
app.post('/api/messages/overdue', async (req, res) => {
  try {
    const { invoice, client, subscription } = req.body;
    
    if (!invoice || !client) {
      return res.status(400).json({
        success: false,
        error: 'Dados da fatura e cliente são obrigatórios'
      });
    }

    const result = await automationService.sendOverdueNotification(invoice, client, subscription);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enviar lembrete de vencimento
app.post('/api/messages/reminder', async (req, res) => {
  try {
    const { invoice, client, subscription } = req.body;
    
    if (!invoice || !client) {
      return res.status(400).json({
        success: false,
        error: 'Dados da fatura e cliente são obrigatórios'
      });
    }

    const result = await automationService.sendReminderNotification(invoice, client, subscription);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enviar notificação de nova fatura
app.post('/api/messages/new-invoice', async (req, res) => {
  try {
    const { invoice, client, subscription } = req.body;
    
    if (!invoice || !client) {
      return res.status(400).json({
        success: false,
        error: 'Dados da fatura e cliente são obrigatórios'
      });
    }

    const result = await automationService.sendNewInvoiceNotification(invoice, client, subscription);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enviar confirmação de pagamento
app.post('/api/messages/payment-confirmed', async (req, res) => {
  try {
    const { invoice, client, subscription } = req.body;
    
    if (!invoice || !client) {
      return res.status(400).json({
        success: false,
        error: 'Dados da fatura e cliente são obrigatórios'
      });
    }

    const result = await automationService.sendPaymentConfirmation(invoice, client, subscription);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enviar mensagens em lote
app.post('/api/messages/bulk', async (req, res) => {
  try {
    const { notifications, delayMs = 3000 } = req.body;
    
    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lista de notificações é obrigatória'
      });
    }

    console.log(`📤 Iniciando envio em lote de ${notifications.length} mensagens...`);
    
    const results = [];
    
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      const { type, invoice, client, subscription } = notification;
      
      console.log(`📤 Enviando ${i + 1}/${notifications.length}: ${type} para ${client.name}`);
      
      try {
        let result;
        
        switch (type) {
          case 'overdue':
            result = await automationService.sendOverdueNotification(invoice, client, subscription);
            break;
          case 'reminder':
            result = await automationService.sendReminderNotification(invoice, client, subscription);
            break;
          case 'new_invoice':
            result = await automationService.sendNewInvoiceNotification(invoice, client, subscription);
            break;
          case 'payment_confirmation':
            result = await automationService.sendPaymentConfirmation(invoice, client, subscription);
            break;
          case 'custom':
            result = await automationService.sendWhatsAppMessage(client.phone, notification.message);
            break;
          default:
            result = { success: false, error: 'Tipo de notificação inválido' };
        }
        
        results.push({
          client: client.name,
          phone: client.phone,
          type,
          amount: invoice.amount,
          hasSubscription: !!subscription,
          ...result
        });
        
      } catch (error) {
        console.error(`❌ Erro ao enviar para ${client.name}:`, error);
        results.push({
          client: client.name,
          phone: client.phone,
          type,
          amount: invoice.amount,
          hasSubscription: !!subscription,
          success: false,
          error: error.message
        });
      }
      
      if (i < notifications.length - 1) {
        console.log(`⏳ Aguardando ${delayMs}ms antes do próximo envio...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Envio em lote concluído: ${successful} sucessos, ${failed} falhas`);
    
    res.json({
      success: true,
      results: results,
      summary: {
        total: results.length,
        successful,
        failed,
        successRate: results.length > 0 ? Math.round((successful / results.length) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obter histórico de mensagens
app.get('/api/messages/history/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { limit = 10 } = req.query;
    
    const history = await automationService.getMessageHistory(clientId, parseInt(limit));
    
    res.json({
      success: true,
      history: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verificar se mensagem foi enviada hoje
app.get('/api/messages/sent-today/:clientId/:type', async (req, res) => {
  try {
    const { clientId, type } = req.params;
    
    const wasSent = await automationService.wasMessageSentToday(clientId, type);
    
    res.json({
      success: true,
      sentToday: wasSent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obter estatísticas de mensagens
app.get('/api/messages/stats', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const stats = await automationService.getMessagingStats(parseInt(days));
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== CONTROLES DE AUTOMAÇÃO ====================

// Iniciar automação
app.post('/api/automation/start', async (req, res) => {
  try {
    console.log('📤 API: Iniciando automação...');
    const result = await automationService.startAutomation();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Automação iniciada com sucesso',
        stats: automationService.getStats()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ API: Erro ao iniciar automação:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Parar automação
app.post('/api/automation/stop', async (req, res) => {
  try {
    console.log('📤 API: Parando automação...');
    const result = await automationService.stopAutomation();
    
    res.json({
      success: true,
      message: 'Automação parada',
      stats: automationService.getStats()
    });
  } catch (error) {
    console.error('❌ API: Erro ao parar automação:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Pausar/Retomar automação
app.post('/api/automation/toggle', (req, res) => {
  try {
    if (automationService.config.enabled) {
      automationService.pause();
      res.json({ success: true, message: 'Automação pausada', status: 'paused' });
    } else {
      automationService.resume();
      res.json({ success: true, message: 'Automação retomada', status: 'running' });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Executar ciclo manual
app.post('/api/automation/run-cycle', async (req, res) => {
  try {
    console.log('📤 API: Executando ciclo manual...');
    const result = await automationService.runManualCycle();
    
    res.json({
      success: true,
      message: 'Ciclo executado',
      result: result
    });
  } catch (error) {
    console.error('❌ API: Erro no ciclo manual:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== CONFIGURAÇÕES ====================

// Obter configuração atual
app.get('/api/automation/config', (req, res) => {
  try {
    const config = automationService.getConfig();
    res.json({
      success: true,
      config: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Atualizar configuração
app.put('/api/automation/config', (req, res) => {
  try {
    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Configuração é obrigatória'
      });
    }

    automationService.updateConfig(config);
    
    res.json({
      success: true,
      message: 'Configuração atualizada',
      config: automationService.getConfig()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== LOGS E RELATÓRIOS ====================

// Obter logs
app.get('/api/automation/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await automationService.getAutomationLogs(limit);
    
    res.json({
      success: true,
      logs: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Relatório de performance
app.get('/api/automation/performance', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const report = await automationService.getPerformanceReport(days);
    
    res.json({
      success: true,
      report: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Teste da automação (dry-run)
app.post('/api/automation/test', async (req, res) => {
  try {
    const testResult = await automationService.testAutomation();
    
    res.json({
      success: true,
      test: testResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verificar saúde do sistema
app.get('/api/automation/health', async (req, res) => {
  try {
    const health = await automationService.checkHealth();
    
    const statusCode = health.whatsapp.connected && health.database ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      health: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== UTILITÁRIOS ====================

// Reset completo da automação
app.post('/api/automation/reset', async (req, res) => {
  try {
    const result = await automationService.reset();
    
    res.json({
      success: true,
      message: 'Automação resetada',
      result: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('❌ Erro na API:', error);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Erro interno do servidor'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// ==================== INICIALIZAÇÃO ====================

// Tratamento de sinais para shutdown graceful
process.on('SIGTERM', async () => {
  console.log('📴 Recebido SIGTERM, parando automação...');
  await automationService.stopAutomation();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📴 Recebido SIGINT (Ctrl+C), parando automação...');
  await automationService.stopAutomation();
  process.exit(0);
});

// Tratamento de exceções não capturadas
process.on('uncaughtException', async (error) => {
  console.error('💥 Exceção não capturada:', error);
  await automationService.stopAutomation();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 Promise rejeitada não tratada:', reason);
  await automationService.stopAutomation();
  process.exit(1);
});

// Função para auto-iniciar a automação
async function autoStartAutomation() {
  console.log('🔄 Verificando auto-start da automação...');

  // Aguardar 30 segundos para estabilizar as conexões
  await new Promise(resolve => setTimeout(resolve, 30000));

  try {
    // Verificar saúde do sistema
    const health = await automationService.checkHealth();

    if (!health.database) {
      console.error('⚠️ Firebase não conectado - automação não iniciada automaticamente');
      return;
    }

    if (!health.whatsapp.connected) {
      console.error('⚠️ WhatsApp não conectado - automação não iniciada automaticamente');
      console.log('💡 Conecte o WhatsApp via QR Code e inicie manualmente via API/site');
      return;
    }

    // Verificar se já está rodando (evitar duplicatas)
    if (automationService.isRunning) {
      console.log('ℹ️ Automação já está rodando');
      return;
    }

    // Iniciar automação automaticamente
    console.log('🚀 Iniciando automação automaticamente...');
    const result = await automationService.startAutomation();

    if (result.success) {
      console.log(`✅ Automação iniciada automaticamente - ciclo a cada ${automationService.config.checkInterval / 60000} minutos`);
      // Executar um ciclo inicial após 5 segundos
      setTimeout(async () => {
        await automationService.runManualCycle();
      }, 5000);
    } else {
      console.error('❌ Falha ao iniciar automação automaticamente:', result.error);
    }
  } catch (error) {
    console.error('❌ Erro no auto-start:', error.message);
    console.log('💡 Inicie manualmente via API/site quando pronto');
  }
}

// Inicializar servidor
app.listen(port, async () => {
  console.log('🚀 ======================================');
  console.log('🚀 SERVIDOR WHATSAPP AUTOMATION INICIADO');
  console.log('🚀 ======================================');
  console.log(`🌐 Porta: ${port}`);
  console.log(`🔗 URL: http://localhost:${port}`);
  console.log(`🏥 Health: http://localhost:${port}/api/health`);
  console.log(`📊 Status: http://localhost:${port}/api/automation/status`);
  console.log(`📱 Messages API: http://localhost:${port}/api/messages/*`);
  console.log('🚀 ======================================');

  // Log das variáveis de ambiente importantes
  console.log('⚙️ CONFIGURAÇÕES:');
  console.log(`    Firebase Project: ${process.env.FIREBASE_PROJECT_ID || '❌ NÃO DEFINIDO'}`);
  console.log(`    WhatsApp API: ${process.env.WHATSAPP_API_URL || '❌ NÃO DEFINIDO'}`);
  console.log(`    WhatsApp Instance: ${process.env.WHATSAPP_INSTANCE || '❌ NÃO DEFINIDO'}`);
  console.log('🚀 ======================================');

  // Verificar saúde inicial
  try {
    const health = await automationService.checkHealth();

    console.log('💚 HEALTH CHECK:');
    console.log(`    Database: ${health.database ? '✅' : '❌'}`);
    console.log(`    WhatsApp: ${health.whatsapp.connected ? '✅' : '❌'}`);
    console.log(`    Business Hours: ${health.businessHours ? '✅ Horário comercial' : '⏰ Fora do horário'}`);

    if (health.database && health.whatsapp.connected) {
      console.log('🤖 Sistema pronto para automação!');
    } else {
      console.log('⚠️ Sistema parcialmente configurado');
      console.log('🔧 Verifique as configurações antes de iniciar');
    }
  } catch (error) {
    console.error('❌ Erro no health check inicial:', error.message);
  }

  console.log('🚀 ======================================');

  // Iniciar auto-start da automação
  autoStartAutomation();
});

module.exports = app;