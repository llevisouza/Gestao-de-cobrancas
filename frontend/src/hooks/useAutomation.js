// src/hooks/useAutomation.js - VERSÃO CORRIGIDA COMPLETA
import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'http://34.11.181.1:3001/api'
  : 'http://localhost:3001/api';

export const useAutomation = () => {
  // ✅ Estados principais
  const [isRunning, setIsRunning] = useState(null); // null = loading, true/false = estado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [config, setConfig] = useState({});
  const [connectionStatus, setConnectionStatus] = useState(null);
  
  // ✅ Refs para controle
  const pollingRef = useRef(null);
  const sseRef = useRef(null);
  const mountedRef = useRef(true);
  const retryTimeoutRef = useRef(null);
  const lastStatusRef = useRef(null);

  // ✅ Função para fazer requests
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const requestOptions = {
      headers: { 'Content-Type': 'application/json' },
      ...options
    };

    try {
      console.log(`🌐 [useAutomation] Fazendo request: ${options.method || 'GET'} ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ [useAutomation] Response recebida de ${endpoint}:`, data);
      return data;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout na requisição');
      }
      console.error(`❌ [useAutomation] Erro na requisição ${url}:`, error);
      throw error;
    }
  }, []);

  // ✅ Buscar status inicial e configurar polling
  const fetchStatus = useCallback(async (showLoading = true) => {
    if (!mountedRef.current) return;
    
    try {
      if (showLoading && isRunning === null) {
        setLoading(true);
      }
      setError(null);

      console.log('📊 [useAutomation] Buscando status...');
      const data = await apiRequest('/automation/status');
      
      if (!mountedRef.current) return;

      console.log('✅ [useAutomation] Status recebido:', {
        isRunning: data.isRunning,
        enabled: data.config?.enabled
      });

      // ✅ Atualizar estado APENAS se mudou
      if (lastStatusRef.current !== data.isRunning) {
        console.log(`🔄 [useAutomation] Status mudou: ${lastStatusRef.current} -> ${data.isRunning}`);
        setIsRunning(data.isRunning);
        lastStatusRef.current = data.isRunning;
      }
      
      setStats(data.stats || {});
      setConfig(data.config || {});
      setConnectionStatus(data.connectionStatus || null);
      
      // ✅ Se estava carregando, parar loading
      if (showLoading) {
        setLoading(false);
      }

    } catch (error) {
      if (!mountedRef.current) return;
      
      console.error('❌ [useAutomation] Erro ao buscar status:', error);
      setError(`Erro de conexão: ${error.message}`);
      
      if (showLoading) {
        setLoading(false);
      }
      
      // ✅ Tentar reconectar em 5 segundos
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      retryTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          console.log('🔄 [useAutomation] Tentando reconectar...');
          fetchStatus(false);
        }
      }, 5000);
    }
  }, [apiRequest, isRunning]);

  // ✅ Configurar Server-Sent Events
  const setupSSE = useCallback(() => {
    // ✅ Fechar conexão anterior se existir
    if (sseRef.current) {
      console.log('🔌 [useAutomation] Fechando conexão SSE anterior');
      sseRef.current.close();
    }

    try {
      console.log('📡 [useAutomation] Configurando SSE...');
      const eventSource = new EventSource(`${API_BASE}/automation/events`);
      sseRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ [useAutomation] Conexão SSE estabelecida');
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          if (!mountedRef.current) return;
          
          const data = JSON.parse(event.data);
          console.log('📨 [useAutomation] Dados SSE recebidos:', {
            isRunning: data.isRunning,
            enabled: data.config?.enabled
          });

          // ✅ Atualizar estado apenas se mudou
          if (lastStatusRef.current !== data.isRunning) {
            console.log(`🔄 [useAutomation] SSE - Status mudou: ${lastStatusRef.current} -> ${data.isRunning}`);
            setIsRunning(data.isRunning);
            lastStatusRef.current = data.isRunning;
          }
          
          setStats(data.stats || {});
          setConfig(data.config || {});
          setConnectionStatus(data.connectionStatus || null);
          setLoading(false);
          
        } catch (error) {
          console.error('❌ [useAutomation] Erro ao processar dados SSE:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ [useAutomation] Erro na conexão SSE:', error);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('🔄 [useAutomation] SSE fechado, tentando reconectar...');
          
          // ✅ Tentar reconectar após delay
          setTimeout(() => {
            if (mountedRef.current) {
              setupSSE();
            }
          }, 5000);
        }
      };

    } catch (error) {
      console.error('❌ [useAutomation] Erro ao configurar SSE:', error);
      
      // ✅ Fallback para polling se SSE falhar
      startPolling();
    }
  }, []);

  // ✅ Polling de backup
  const startPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    console.log('⏰ [useAutomation] Iniciando polling de backup a cada 30s');
    pollingRef.current = setInterval(() => {
      if (mountedRef.current) {
        fetchStatus(false);
      }
    }, 30000); // 30 segundos
  }, [fetchStatus]);

  // ✅ Inicialização
  useEffect(() => {
    console.log('🚀 [useAutomation] Hook inicializado');
    mountedRef.current = true;
    
    // ✅ Buscar status inicial
    fetchStatus(true);
    
    // ✅ Configurar SSE
    setupSSE();
    
    // ✅ Iniciar polling de backup
    startPolling();

    // ✅ Cleanup
    return () => {
      console.log('🧹 [useAutomation] Cleanup do hook');
      mountedRef.current = false;
      
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      
      if (sseRef.current) {
        sseRef.current.close();
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [fetchStatus, setupSSE, startPolling]);

  // ✅ AÇÕES DA AUTOMAÇÃO
  
  const startAutomation = useCallback(async () => {
    try {
      console.log('🚀 [useAutomation] Iniciando automação...');
      setLoading(true);
      setError(null);

      const result = await apiRequest('/automation/start', {
        method: 'POST'
      });

      if (result.success) {
        console.log('✅ [useAutomation] Automação iniciada com sucesso');
        
        // ✅ Atualizar estado imediatamente
        setIsRunning(true);
        lastStatusRef.current = true;
        
        // ✅ Buscar status atualizado após 1 segundo
        setTimeout(() => {
          if (mountedRef.current) {
            fetchStatus(false);
          }
        }, 1000);
        
        return { success: true, message: 'Automação iniciada com sucesso!' };
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
      
    } catch (error) {
      console.error('❌ [useAutomation] Erro ao iniciar automação:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [apiRequest, fetchStatus]);

  const stopAutomation = useCallback(async () => {
    try {
      console.log('🛑 [useAutomation] Parando automação...');
      setLoading(true);
      setError(null);

      const result = await apiRequest('/automation/stop', {
        method: 'POST'
      });

      if (result.success) {
        console.log('✅ [useAutomation] Automação parada com sucesso');
        
        // ✅ Atualizar estado imediatamente
        setIsRunning(false);
        lastStatusRef.current = false;
        
        // ✅ Buscar status atualizado após 1 segundo
        setTimeout(() => {
          if (mountedRef.current) {
            fetchStatus(false);
          }
        }, 1000);
        
        return { success: true, message: 'Automação parada com sucesso!' };
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
      
    } catch (error) {
      console.error('❌ [useAutomation] Erro ao parar automação:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [apiRequest, fetchStatus]);

  const runManualCycle = useCallback(async () => {
    try {
      console.log('🔄 [useAutomation] Executando ciclo manual...');
      setError(null);

      const result = await apiRequest('/automation/manual-cycle', {
        method: 'POST'
      });

      if (result.success) {
        console.log('✅ [useAutomation] Ciclo manual executado:', result);
        
        // ✅ Atualizar status após ciclo
        setTimeout(() => {
          if (mountedRef.current) {
            fetchStatus(false);
          }
        }, 1000);
        
        return { success: true, result: result.result };
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
      
    } catch (error) {
      console.error('❌ [useAutomation] Erro no ciclo manual:', error);
      return { success: false, error: error.message };
    }
  }, [apiRequest, fetchStatus]);

  const testConnections = useCallback(async () => {
    try {
      console.log('🔍 [useAutomation] Testando conexões...');
      setError(null);

      const result = await apiRequest('/health');
      
      if (result.success) {
        setConnectionStatus(result.health);
        return { success: true, connections: result.health };
      } else {
        throw new Error(result.error || 'Erro no teste de conexão');
      }
      
    } catch (error) {
      console.error('❌ [useAutomation] Erro ao testar conexões:', error);
      return { success: false, error: error.message };
    }
  }, [apiRequest]);

  const resetAutomation = useCallback(async () => {
    try {
      console.log('🔄 [useAutomation] Fazendo reset...');
      setLoading(true);
      setError(null);

      const result = await apiRequest('/automation/reset', {
        method: 'POST'
      });

      if (result.success) {
        console.log('✅ [useAutomation] Reset concluído');
        
        // ✅ Resetar estado local
        setIsRunning(false);
        lastStatusRef.current = false;
        setStats({});
        setLogs([]);
        
        // ✅ Buscar status atualizado
        setTimeout(() => {
          if (mountedRef.current) {
            fetchStatus(false);
          }
        }, 1000);
        
        return { success: true, message: 'Reset concluído!' };
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
      
    } catch (error) {
      console.error('❌ [useAutomation] Erro no reset:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [apiRequest, fetchStatus]);

  const getAutomationStats = useCallback(async () => {
    try {
      console.log('📊 [useAutomation] Buscando estatísticas...');
      const result = await apiRequest('/automation/performance?days=7');
      
      if (result.success) {
        setStats(result.report || {});
        return { success: true, stats: result.report };
      } else {
        throw new Error(result.error || 'Erro ao buscar estatísticas');
      }
      
    } catch (error) {
      console.error('❌ [useAutomation] Erro ao buscar stats:', error);
      return { success: false, error: error.message };
    }
  }, [apiRequest]);

  const getLogs = useCallback(async (limit = 20) => {
    try {
      console.log(`📜 [useAutomation] Buscando logs (${limit})...`);
      const result = await apiRequest(`/automation/logs?limit=${limit}`);
      
      if (result.success) {
        setLogs(result.logs || []);
        return { success: true, logs: result.logs };
      } else {
        throw new Error(result.error || 'Erro ao buscar logs');
      }
      
    } catch (error) {
      console.error('❌ [useAutomation] Erro ao buscar logs:', error);
      return { success: false, error: error.message };
    }
  }, [apiRequest]);

  // ✅ UTILITÁRIOS
  const canStart = !loading && !isRunning;
  const canStop = !loading && isRunning;
  const isConnected = connectionStatus?.database && connectionStatus?.whatsapp?.connected;

  // ✅ Debug em desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 [useAutomation] Estado atual:', {
        isRunning,
        loading,
        error,
        canStart,
        canStop,
        isConnected
      });
    }
  }, [isRunning, loading, error, canStart, canStop, isConnected]);

  return {
    // Estados
    isRunning,
    loading,
    error,
    stats,
    logs,
    config,
    connectionStatus,
    
    // Ações
    startAutomation,
    stopAutomation,
    runManualCycle,
    resetAutomation,
    testConnections,
    getAutomationStats,
    getLogs,
    
    // Utilitários
    canStart,
    canStop,
    isConnected,
    
    // Funções adicionais
    refreshStatus: () => fetchStatus(false)
  };
};
