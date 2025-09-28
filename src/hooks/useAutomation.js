// src/hooks/useAutomation.js
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

export const useAutomation = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ connected: false, details: {} });

  // Configurar axios com base URL e timeout
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 segundos de timeout
  });

  // Função pra buscar status
  const fetchStatus = async () => {
    try {
      const response = await api.get('/automation/health');
      const health = response.data.health || {};
      setIsRunning(health.automationRunning || false);
      setStatus(health);
      return health;
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      return { connected: false, details: { error: error.message } };
    }
  };

  // Iniciar automação
  const startAutomation = async () => {
    setLoading(true);
    try {
      const response = await api.post('/automation/start');
      if (response.data.success) {
        setIsRunning(true);
      }
      return response.data;
    } catch (error) {
      console.error('Erro ao iniciar automação:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Parar automação
  const stopAutomation = async () => {
    setLoading(true);
    try {
      const response = await api.post('/automation/stop');
      if (response.data.success) {
        setIsRunning(false);
      }
      return response.data;
    } catch (error) {
      console.error('Erro ao parar automação:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Executar ciclo manual
  const runManualCycle = async () => {
    setLoading(true);
    try {
      const response = await api.post('/automation/run-cycle');
      return response.data;
    } catch (error) {
      console.error('Erro no ciclo manual:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Testar conexões
  const testConnections = async () => {
    setLoading(true);
    try {
      const response = await api.get('/automation/health');
      return response.data.health;
    } catch (error) {
      console.error('Erro ao testar conexões:', error);
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Obter status
  const getStatus = async () => {
    return await fetchStatus();
  };

  // Efeito inicial pra carregar o status
  useEffect(() => {
    fetchStatus();
    // Opcional: Atualizar status a cada 30 segundos
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isRunning, loading, startAutomation, stopAutomation, runManualCycle, testConnections, getStatus, status };
};