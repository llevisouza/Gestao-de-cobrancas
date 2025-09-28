# Frontend Documentation - Sistema de Cobranças v2.1

## Visão Geral do Frontend

O frontend é uma Single Page Application (SPA) construída em React 18+ com Tailwind CSS, utilizando Firebase para autenticação e banco de dados em tempo real. A aplicação segue arquitetura baseada em componentes funcionais e hooks customizados.

## Estrutura do Frontend

```
src/
├── components/                   # Componentes React organizados por funcionalidade
│   ├── auth/                    # Autenticação e Setup
│   ├── clients/                 # Gestão de Clientes
│   ├── dashboard/               # Dashboard Principal
│   ├── reports/                 # Relatórios e Analytics
│   ├── notifications/           # Sistema de Notificações
│   ├── automation/              # Automação Avançada
│   └── common/                  # Componentes Reutilizáveis
├── hooks/                       # Custom Hooks para lógica reutilizável
├── services/                    # Integrações e APIs externas
├── utils/                       # Utilitários e helpers
├── styles/                      # Estilos CSS customizados
├── App.js                       # Componente principal
├── index.js                     # Entry point
└── index.css                    # Estilos globais
```

## Componentes por Módulo

### auth/ - Autenticação e Setup

#### LoginPage.js
```javascript
import { useState } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';

function LoginPage() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const { signIn, loading, error } = useFirebaseAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await signIn(credentials.email, credentials.password);
    if (!result.success) {
      console.error('Login failed:', result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form fields */}
          </form>
        </div>
      </div>
    </div>
  );
}
```

**Funcionalidades:**
- ✅ Autenticação email/senha
- ✅ Validação de credenciais
- ✅ Redirecionamento automático
- ✅ Estados de loading e erro
- ✅ Design responsivo

#### FirebaseSetup.js
```javascript
import { useState, useEffect } from 'react';
import { checkFirebaseConfig } from '../services/firebase';

function FirebaseSetup() {
  const [configStatus, setConfigStatus] = useState({
    isConfigured: false,
    missingVars: []
  });

  useEffect(() => {
    const status = checkFirebaseConfig();
    setConfigStatus(status);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Configuração Firebase</h2>
      {/* Configuration guide */}
    </div>
  );
}
```

### clients/ - Gestão de Clientes

#### ClientsPage.js
```javascript
import { useState } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import ClientTable from './ClientTable';
import ClientModal from './ClientModal';
import SubscriptionModal from './SubscriptionModal';

function ClientsPage() {
  const { clients, createClient, updateClient, deleteClient } = useFirestore();
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('client'); // 'client' | 'subscription'

  const handleCreateClient = async (clientData) => {
    const result = await createClient(clientData);
    if (result) {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-600">Gerencie seus clientes e assinaturas</p>
      </div>

      <ClientTable
        clients={clients}
        onEdit={(client) => {
          setSelectedClient(client);
          setModalType('client');
          setIsModalOpen(true);
        }}
        onDelete={deleteClient}
        onAddSubscription={(client) => {
          setSelectedClient(client);
          setModalType('subscription');
          setIsModalOpen(true);
        }}
      />

      {/* Modals */}
    </div>
  );
}
```

#### ClientModal.js
```javascript
import { useState } from 'react';
import { validateCPF, formatCPF, formatPhone } from '../utils/formatters';
import Modal from '../common/Modal';

function ClientModal({ isOpen, onClose, onSubmit, client = null }) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    cpf: client?.cpf || '',
    pix: client?.pix || ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.email.includes('@')) newErrors.email = 'Email inválido';
    if (!validateCPF(formData.cpf)) newErrors.cpf = 'CPF inválido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={client ? 'Editar Cliente' : 'Novo Cliente'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>
        
        {/* Other form fields */}
        
        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            {client ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

#### SubscriptionModal.js
```javascript
import { useState } from 'react';
import Modal from '../common/Modal';

function SubscriptionModal({ isOpen, onClose, onSubmit, client }) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    recurrenceType: 'monthly',
    dayOfMonth: 1,
    dayOfWeek: 'monday',
    recurrenceDays: 30,
    startDate: new Date().toISOString().split('T')[0]
  });

  const recurrenceTypes = [
    { value: 'daily', label: 'Diário' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'custom', label: 'Personalizado' }
  ];

  const renderRecurrenceFields = () => {
    switch (formData.recurrenceType) {
      case 'monthly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Dia do Mês</label>
            <select
              value={formData.dayOfMonth}
              onChange={(e) => setFormData(prev => ({ ...prev, dayOfMonth: parseInt(e.target.value) }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {Array.from({ length: 28 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Dia {i + 1}</option>
              ))}
            </select>
          </div>
        );
        
      case 'weekly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Dia da Semana</label>
            <select
              value={formData.dayOfWeek}
              onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="monday">Segunda-feira</option>
              <option value="tuesday">Terça-feira</option>
              <option value="wednesday">Quarta-feira</option>
              <option value="thursday">Quinta-feira</option>
              <option value="friday">Sexta-feira</option>
              <option value="saturday">Sábado</option>
              <option value="sunday">Domingo</option>
            </select>
          </div>
        );
        
      case 'custom':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Intervalo (dias)</label>
            <input
              type="number"
              min="1"
              value={formData.recurrenceDays}
              onChange={(e) => setFormData(prev => ({ ...prev, recurrenceDays: parseInt(e.target.value) }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Assinatura">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form fields */}
        {renderRecurrenceFields()}
        {/* Submit buttons */}
      </form>
    </Modal>
  );
}
```

### dashboard/ - Dashboard Principal

#### Dashboard.js
```javascript
import { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import KPICards from './KPICards';
import InvoiceTable from './InvoiceTable';

function Dashboard() {
  const { clients, subscriptions, invoices, generateInvoices } = useFirestore();
  const [kpis, setKpis] = useState({
    totalClients: 0,
    activeSubscriptions: 0,
    pendingInvoices: 0,
    monthlyRevenue: 0,
    overdueInvoices: 0
  });

  useEffect(() => {
    calculateKPIs();
  }, [clients, subscriptions, invoices]);

  const calculateKPIs = () => {
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
    const monthlyRevenue = activeSubscriptions.reduce((total, sub) => total + sub.amount, 0);

    setKpis({
      totalClients: clients.length,
      activeSubscriptions: activeSubscriptions.length,
      pendingInvoices: pendingInvoices.length,
      monthlyRevenue,
      overdueInvoices: overdueInvoices.length
    });
  };

  const handleGenerateInvoices = async () => {
    try {
      const count = await generateInvoices();
      alert(`${count} faturas geradas com sucesso!`);
    } catch (error) {
      alert('Erro ao gerar faturas: ' + error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu negócio</p>
      </div>

      <KPICards kpis={kpis} />

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Faturas Recentes</h2>
          <button
            onClick={handleGenerateInvoices}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Gerar Faturas
          </button>
        </div>
        
        <InvoiceTable 
          invoices={invoices.slice(0, 10)}
          showActions={true}
        />
      </div>
    </div>
  );
}
```

#### KPICards.js
```javascript
import { useState, useEffect } from 'react';

function KPICards({ kpis }) {
  const [animatedValues, setAnimatedValues] = useState({
    totalClients: 0,
    activeSubscriptions: 0,
    pendingInvoices: 0,
    monthlyRevenue: 0,
    overdueInvoices: 0
  });

  useEffect(() => {
    // Animate numbers when KPIs change
    const animateValue = (key, target) => {
      const start = animatedValues[key];
      const increment = (target - start) / 20;
      let current = start;
      
      const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
          current = target;
          clearInterval(timer);
        }
        
        setAnimatedValues(prev => ({ ...prev, [key]: Math.round(current) }));
      }, 50);
    };

    Object.entries(kpis).forEach(([key, value]) => {
      if (animatedValues[key] !== value) {
        animateValue(key, value);
      }
    });
  }, [kpis]);

  const kpiCards = [
    {
      title: 'Total de Clientes',
      value: animatedValues.totalClients,
      icon: '👥',
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Assinaturas Ativas',
      value: animatedValues.activeSubscriptions,
      icon: '📋',
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Faturas Pendentes',
      value: animatedValues.pendingInvoices,
      icon: '⏳',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Receita Mensal',
      value: `R$ ${animatedValues.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: '💰',
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Faturas Vencidas',
      value: animatedValues.overdueInvoices,
      icon: '🚨',
      color: 'bg-red-500',
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {kpiCards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${card.color} text-white text-2xl`}>
              {card.icon}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default KPICards;
```

#### InvoiceTable.js
```javascript
import { formatCurrency, formatDate } from '../utils/formatters';
import { useFirestore } from '../hooks/useFirestore';

function InvoiceTable({ invoices, showActions = true }) {
  const { updateInvoice } = useFirestore();

  const handleMarkAsPaid = async (invoice) => {
    try {
      await updateInvoice(invoice.id, {
        status: 'paid',
        paidDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      alert('Erro ao marcar como pago: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pendente', class: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Pago', class: 'bg-green-100 text-green-800' },
      overdue: { label: 'Vencido', class: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || { label: status, class: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Assinatura
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vencimento
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            {showActions && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {invoice.clientName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{invoice.subscriptionName}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(invoice.amount)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatDate(invoice.dueDate)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(invoice.status)}
              </td>
              {showActions && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {invoice.status === 'pending' || invoice.status === 'overdue' ? (
                    <button
                      onClick={() => handleMarkAsPaid(invoice)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Marcar como Pago
                    </button>
                  ) : (
                    <span className="text-gray-400">Pago</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      {invoices.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhuma fatura encontrada
        </div>
      )}
    </div>
  );
}

export default InvoiceTable;
```

### reports/ - Relatórios e Analytics

#### ReportsPage.js
```javascript
import { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import ReportTable from './ReportTable';
import ReportChart from './ReportChart';
import DateFilter from './DateFilter';

function ReportsPage() {
  const { invoices } = useFirestore();
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
    clientId: 'all'
  });
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    overdueRevenue: 0,
    conversionRate: 0
  });

  useEffect(() => {
    applyFilters();
  }, [invoices, filters]);

  useEffect(() => {
    calculateMetrics();
  }, [filteredInvoices]);

  const applyFilters = () => {
    let filtered = [...invoices];

    // Date filter
    if (filters.startDate) {
      filtered = filtered.filter(inv => inv.dueDate >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(inv => inv.dueDate <= filters.endDate);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(inv => inv.status === filters.status);
    }

    // Client filter
    if (filters.clientId !== 'all') {
      filtered = filtered.filter(inv => inv.clientId === filters.clientId);
    }

    setFilteredInvoices(filtered);
  };

  const calculateMetrics = () => {
    const total = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paid = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
    const pending = filteredInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
    const overdue = filteredInvoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);
    const conversion = total > 0 ? (paid / total) * 100 : 0;

    setMetrics({
      totalRevenue: total,
      paidRevenue: paid,
      pendingRevenue: pending,
      overdueRevenue: overdue,
      conversionRate: conversion
    });
  };

  const exportToCSV = () => {
    const headers = ['Cliente', 'Assinatura', 'Valor', 'Vencimento', 'Status', 'Data Pagamento'];
    const rows = filteredInvoices.map(inv => [
      inv.clientName,
      inv.subscriptionName,
      inv.amount.toFixed(2),
      inv.dueDate,
      inv.status,
      inv.paidDate || ''
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-600">Análise detalhada das suas cobranças</p>
      </div>

      <DateFilter filters={filters} onFiltersChange={setFilters} />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Receita Total</h3>
          <p className="text-2xl font-bold text-blue-600">
            R$ {metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Receita Recebida</h3>
          <p className="text-2xl font-bold text-green-600">
            R$ {metrics.paidRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Em Atraso</h3>
          <p className="text-2xl font-bold text-red-600">
            R$ {metrics.overdueRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Taxa de Conversão</h3>
          <p className="text-2xl font-bold text-purple-600">
            {metrics.conversionRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <ReportChart data={filteredInvoices} />

      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Faturas Filtradas ({filteredInvoices.length})</h2>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Exportar CSV
          </button>
        </div>
        
        <ReportTable invoices={filteredInvoices} />
      </div>
    </div>
  );
}

export default ReportsPage;
```

## Custom Hooks

### useFirestore - Hook Principal do Banco
```javascript
import { useState, useEffect, useCallback } from 'react';
import { clientService, subscriptionService, invoiceService } from '../services/firestore';

export function useFirestore() {
  const [clients, setClients] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribers = [];

    // Real-time listeners
    const clientsUnsub = clientService.subscribe(setClients);
    const subscriptionsUnsub = subscriptionService.subscribe(setSubscriptions);
    const invoicesUnsub = invoiceService.subscribe(setInvoices);

    unsubscribers.push(clientsUnsub, subscriptionsUnsub, invoicesUnsub);

    setLoading(false);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Client operations
  const createClient = useCallback(async (clientData) => {
    try {
      const result = await clientService.create(clientData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.id;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateClient = useCallback(async (clientId, updates) => {
    try {
      await clientService.update(clientId, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteClient = useCallback(async (clientId) => {
    try {
      await clientService.delete(clientId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Subscription operations
  const createSubscription = useCallback(async (subscriptionData) => {
    try {
      const result = await subscriptionService.create(subscriptionData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.id;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateSubscription = useCallback(async (subscriptionId, updates) => {
    try {
      await subscriptionService.update(subscriptionId, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Invoice operations
  const updateInvoice = useCallback(async (invoiceId, updates) => {
    try {
      await invoiceService.update(invoiceId, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const generateInvoices = useCallback(async () => {
    try {
      // Get current month and year
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      const count = await invoiceService.generateForMonth(month, year);
      return count;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    // Data
    clients,
    subscriptions,
    invoices,
    loading,
    error,
    
    // Client operations
    createClient,
    updateClient,
    deleteClient,
    
    // Subscription operations
    createSubscription,
    updateSubscription,
    
    // Invoice operations
    updateInvoice,
    generateInvoices
  };
}
```

### useFirebaseAuth - Hook de Autenticação
```javascript
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

export function useFirebaseAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    loading,
    signIn,
    logout
  };
}
```

## Utilitários

### formatters.js
```javascript
// Currency formatting
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Date formatting
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

// CPF validation and formatting
export const validateCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11) return false;
  
  // Validate CPF algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  
  let checkDigit = (sum * 10) % 11;
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
  if (checkDigit !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  
  checkDigit = (sum * 10) % 11;
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
  if (checkDigit !== parseInt(cpf.charAt(10))) return false;
  
  return true;
};

export const formatCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]/g, '');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Phone formatting
export const formatPhone = (phone) => {
  phone = phone.replace(/[^\d]/g, '');
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (phone.length === 10) {
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

### dateUtils.js
```javascript
// Date utilities for Brazilian format
export const isToday = (dateString) => {
  const today = new Date();
  const date = new Date(dateString);
  return date.toDateString() === today.toDateString();
};

export const isPast = (dateString) => {
  const today = new Date();
  const date = new Date(dateString);
  return date < today && !isToday(dateString);
};

export const isFuture = (dateString) => {
  const today = new Date();
  const date = new Date(dateString);
  return date > today;
};

export const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  return Math.round((secondDate - firstDate) / oneDay);
};

export const addDays = (dateString, days) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const addMonths = (dateString, months) => {
  const date = new Date(dateString);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
};

// Calculate next recurrence date
export const calculateNextRecurrence = (lastDate, recurrenceType, config = {}) => {
  const date = new Date(lastDate);
  
  switch (recurrenceType) {
    case 'daily':
      return addDays(lastDate, 1);
      
    case 'weekly':
      return addDays(lastDate, 7);
      
    case 'monthly':
      return addMonths(lastDate, 1);
      
    case 'custom':
      return addDays(lastDate, config.recurrenceDays || 30);
      
    default:
      return lastDate;
  }
};
```

## Estilos e Tema

### globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer components {
  .btn-primary {
    @apply bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-200 text-gray-900 px-4 py-2 rounded-md font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors;
  }
  
  .btn-danger {
    @apply bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors;
  }
  
  .input-field {
    @apply mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow;
  }
  
  .modal-overlay {
    @apply fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50;
  }
  
  .modal-content {
    @apply relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }
  
  .animate-slide-in {
    animation: slideIn 0.3s ease-out;
  }
  
  .loading-spinner {
    animation: spin 1s linear infinite;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Responsive utilities */
@media (max-width: 640px) {
  .mobile-hidden {
    @apply hidden;
  }
  
  .mobile-full {
    @apply w-full;
  }
}

/* Print styles */
@media print {
  .print-hidden {
    @apply hidden;
  }
  
  .print-break {
    page-break-after: always;
  }
}
```

## Performance e Otimizações

### Bundle Optimization
- **Code Splitting**: Componentes carregados dinamicamente
- **Tree Shaking**: Remoção de código não utilizado
- **Image Optimization**: Lazy loading e compressão
- **CSS Purging**: Tailwind CSS otimizado para produção

### Caching Strategy
```javascript
// Service Worker configuration
const cacheConfig = {
  staticAssets: '1h',
  apiResponses: '5min',
  images: '24h',
  fonts: '7d'
};
```

### Loading States
```javascript
// Consistent loading pattern
const LoadingState = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex justify-center items-center p-4">
      <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full loading-spinner`}></div>
    </div>
  );
};
```

## Deployment

### Build Configuration
```json
{
  "scripts": {
    "build": "react-scripts build",
    "build:analyze": "npm run build && npx source-map-explorer build/static/js/*.js",
    "build:prod": "NODE_ENV=production npm run build"
  }
}
```

### Environment Variables
```env
# Production
REACT_APP_FIREBASE_API_KEY=prod_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=prod_domain
REACT_APP_FIREBASE_PROJECT_ID=prod_project

# Development  
REACT_APP_FIREBASE_API_KEY=dev_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=dev_domain
REACT_APP_FIREBASE_PROJECT_ID=dev_project
```

---

**Documentação Frontend**  
**Última atualização:** Setembro 2025 - v2.1.0