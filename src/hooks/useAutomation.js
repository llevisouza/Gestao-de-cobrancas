// src/hooks/useAutomation.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export const useAutomation = () => {
  const [isRunning, setIsRunning] = useState(null); // null indica "não carregado"
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [logs, setLogs] = useState([]);

  // Função para fetchar o status com retry
  const fetchStatus = async (retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`📡 [useAutomation] Tentativa ${i + 1} de fetch do status...`);
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/automation/status`, {
          timeout: 10000 // Timeout de 10s
        });
        console.log('✅ [useAutomation] Status recebido:', response.data);
        setIsRunning(response.data.isRunning);
        setConfig(response.data.config || {});
        setLoading(false);
        setError(null);
        return response.data;
      } catch (err) {
        console.error(`❌ [useAutomation] Erro ao buscar status (tentativa ${i + 1}):`, err.message);
        if (i < retries - 1) {
          console.log(`⏳ [useAutomation] Tentando novamente em ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          setError(err.message || 'Falha ao conectar ao servidor');
          setLoading(false);
        }
      }
    }
  };

  const getAutomationStats = async () => {
    try {
      console.log('📊 [useAutomation] Buscando stats...');
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/automation/stats`);
      setStats(response.data);
      console.log('✅ [useAutomation] Stats recebidos:', response.data);
      return response.data;
    } catch (err) {
      console.error('❌ [useAutomation] Erro ao buscar stats:', err.message);
      setError(err.message);
    }
  };

  const getLogs = async () => {
    try {
      console.log('📜 [useAutomation] Buscando logs...');
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/automation/logs`);
      setLogs(response.data.logs || []);
      console.log('✅ [useAutomation] Logs recebidos:', response.data.logs);
      return response.data.logs;
    } catch (err) {
      console.error('❌ [useAutomation] Erro ao buscar logs:', err.message);
      setError(err.message);
    }
  };

  const startAutomation = async () => {
    try {
      console.log('🚀 [useAutomation] Iniciando automação...');
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/automation/start`);
      console.log('✅ [useAutomation] Automação iniciada:', response.data);
      await fetchStatus();
      return response.data;
    } catch (err) {
      console.error('❌ [useAutomation] Erro ao iniciar automação:', err.message);
      setError(err.message);
    }
  };

  const stopAutomation = async () => {
    try {
      console.log('🛑 [useAutomation] Parando automação...');
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/automation/stop`);
      console.log('✅ [useAutomation] Automação parada:', response.data);
      await fetchStatus();
      return response.data;
    } catch (err) {
      console.error('❌ [useAutomation] Erro ao parar automação:', err.message);
      setError(err.message);
    }
  };

  const runManualCycle = async () => {
    try {
      console.log('🔄 [useAutomation] Executando ciclo manual...');
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/automation/manual-cycle`);
      console.log('✅ [useAutomation] Ciclo manual executado:', response.data);
      await fetchStatus();
      return response.data;
    } catch (err) {
      console.error('❌ [useAutomation] Erro no ciclo manual:', err.message);
      setError(err.message);
    }
  };

  const updateConfig = async (newConfig) => {
    try {
      console.log('⚙️ [useAutomation] Atualizando configuração:', newConfig);
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/automation/config`, newConfig);
      setConfig(response.data.config);
      console.log('✅ [useAutomation] Configuração atualizada:', response.data);
      return response.data;
    } catch (err) {
      console.error('❌ [useAutomation] Erro ao atualizar configuração:', err.message);
      setError(err.message);
    }
  };

  const testConnections = async () => {
    try {
      console.log('🔍 [useAutomation] Testando conexões...');
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/automation/test-connections`);
      console.log('✅ [useAutomation] Conexões testadas:', response.data);
      return response.data;
    } catch (err) {
      console.error('❌ [useAutomation] Erro ao testar conexões:', err.message);
      setError(err.message);
    }
  };

  useEffect(() => {
    console.log('🛠️ [useAutomation] Iniciando hook, verificando status...');
    fetchStatus();
    const interval = setInterval(() => {
      console.log('🔄 [useAutomation] Polling status...');
      fetchStatus(1); // Apenas 1 tentativa no polling
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log('📡 [useAutomation] Iniciando conexão SSE...');
    const eventSource = new EventSource(`${process.env.REACT_APP_BACKEND_URL}/automation/events`);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 [useAutomation] SSE update recebido:', data);
        setIsRunning(data.isRunning);
        setConfig(data.config || {});
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('❌ [useAutomation] Erro ao processar SSE:', err.message);
        setError('Falha na conexão em tempo real');
      }
    };
    eventSource.onerror = () => {
      console.error('❌ [useAutomation] Erro na conexão SSE, usando polling...');
      setError('Erro na conexão em tempo real, usando polling...');
    };
    return () => {
      console.log('🛑 [useAutomation] Fechando conexão SSE');
      eventSource.close();
    };
  }, []);

  return {
    isRunning,
    config,
    loading,
    error,
    startAutomation,
    stopAutomation,
    runManualCycle,
    updateConfig,
    getAutomationStats,
    getLogs,
    getStatus: fetchStatus,
    testConnections,
  };
};