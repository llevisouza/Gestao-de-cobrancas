// src/hooks/useAutomation.js
import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api/automation'; // Ajuste para URL da VM em produção, ex.: 'https://gestaodecobrancas.ddns.net:3001/api/automation'

export const useAutomation = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/status`);
      const data = await response.json();
      if (data.success) {
        setIsRunning(data.running);
        setConfig(data.config);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao buscar status:', error);
    }
  };

  const startAutomation = async () => {
    try {
      const response = await fetch(`${API_BASE}/start`, { method: 'POST' });
      const data = await response.json();
      fetchStatus(); // Atualiza o status após a ação
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const stopAutomation = async () => {
    try {
      const response = await fetch(`${API_BASE}/stop`, { method: 'POST' });
      const data = await response.json();
      fetchStatus();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const runManualCycle = async () => {
    try {
      const response = await fetch(`${API_BASE}/run-cycle`, { method: 'POST' });
      const data = await response.json();
      fetchStatus();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const reset = async () => {
    try {
      const response = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      const data = await response.json();
      fetchStatus();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getLogs = async (limit = 50) => {
    try {
      const response = await fetch(`${API_BASE}/logs?limit=${limit}`);
      const data = await response.json();
      return data.logs || [];
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      return [];
    }
  };

  const testConnections = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();
      return data.health;
    } catch (error) {
      return { error: error.message };
    }
  };

  const updateConfig = async (newConfig) => {
    try {
      const response = await fetch(`${API_BASE}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig }),
      });
      const data = await response.json();
      fetchStatus();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchStatus(); // Carrega status inicial
    const interval = setInterval(fetchStatus, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  return {
    isRunning,
    config,
    stats,
    startAutomation,
    stopAutomation,
    runManualCycle,
    reset,
    getLogs,
    testConnections,
    updateConfig,
  };
};