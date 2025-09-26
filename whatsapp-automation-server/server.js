// server.js - SERVIDOR PRINCIPAL PARA VM
const express = require('express');
const cors = require('cors');
const { WhatsAppAutomationService } = require('./automationService');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://your-frontend-domain.com' // Adicione seu domínio do frontend
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

// Iniciar servidor
app.listen(port, async () => {
  console.log('🚀 ======================================');
  console.log('🚀 SERVIDOR WHATSAPP AUTOMATION INICIADO');
  console.log('🚀 ======================================');
  console.log(`🌐 Porta: ${port}`);
  console.log(`🔗 URL: http://localhost:${port}`);
  console.log(`🏥 Health: http://localhost:${port}/api/health`);
  console.log(`📊 Status: http://localhost:${port}/api/automation/status`);
  console.log('🚀 ======================================');
  
  // Log das variáveis de ambiente importantes
  console.log('⚙️  CONFIGURAÇÕES:');
  console.log(`    Firebase Project: ${process.env.FIREBASE_PROJECT_ID || '❌ NÃO DEFINIDO'}`);
  console.log(`    WhatsApp API: ${process.env.WHATSAPP_API_URL || '❌ NÃO DEFINIDO'}`);
  console.log(`    WhatsApp Instance: ${process.env.WHATSAPP_INSTANCE || '❌ NÃO DEFINIDO'}`);
  console.log('🚀 ======================================');
  
  // Verificar configuração e tentar inicializar
  try {
    const health = await automationService.checkHealth();
    
    console.log('💚 HEALTH CHECK:');
    console.log(`    Database: ${health.database ? '✅' : '❌'}`);
    console.log(`    WhatsApp: ${health.whatsapp.connected ? '✅' : '❌'}`);
    console.log(`    Business Hours: ${health.businessHours ? '✅ Horário comercial' : '⏰ Fora do horário'}`);
    
    if (health.database && health.whatsapp.connected) {
      console.log('🤖 Sistema pronto para automação!');
      console.log('📋 Use POST /api/automation/start para iniciar');
    } else {
      console.log('⚠️  Sistema parcialmente configurado');
      console.log('🔧 Verifique as configurações antes de iniciar');
    }
    
  } catch (error) {
    console.error('❌ Erro no health check inicial:', error.message);
  }
  
  console.log('🚀 ======================================');
});

module.exports = app;