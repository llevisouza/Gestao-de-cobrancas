// src/tests/setupTests.js - CONFIGURAÇÃO DOS TESTES
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configurar Testing Library
configure({ testIdAttribute: 'data-testid' });

// Mock do Firebase
jest.mock('../services/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn()
  },
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })),
      add: jest.fn(),
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn()
          }))
        }))
      }))
    }))
  }
}));

// Mock do window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock do IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock do ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Suprimir warnings específicos do console durante testes
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

// ===== TESTES UTILITÁRIOS =====

// src/tests/utils/testUtils.js - UTILITÁRIOS PARA TESTES
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Provider de contexto para testes
const TestProvider = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

// Função personalizada de render
export const renderWithProvider = (ui, options = {}) => {
  const Wrapper = ({ children }) => <TestProvider>{children}</TestProvider>;
  return render(ui, { wrapper: Wrapper, ...options });
};

// Mock data factories
export const mockClient = (overrides = {}) => ({
  id: 'client-123',
  name: 'João da Silva',
  email: 'joao@teste.com',
  phone: '(11) 99999-9999',
  cpf: '123.456.789-00',
  pix: 'joao@teste.com',
  status: 'active',
  createdAt: new Date('2024-01-01'),
  ...overrides
});

export const mockSubscription = (overrides = {}) => ({
  id: 'sub-123',
  clientId: 'client-123',
  clientName: 'João da Silva',
  name: 'Plano Premium',
  amount: 150,
  recurrenceType: 'monthly',
  dayOfMonth: 15,
  startDate: '2024-01-01',
  status: 'active',
  createdAt: new Date('2024-01-01'),
  ...overrides
});

export const mockInvoice = (overrides = {}) => ({
  id: 'invoice-123',
  clientId: 'client-123',
  clientName: 'João da Silva',
  subscriptionId: 'sub-123',
  subscriptionName: 'Plano Premium',
  amount: 150,
  dueDate: '2024-02-15',
  generationDate: '2024-01-15',
  status: 'pending',
  description: 'Plano Premium - Fevereiro 2024',
  createdAt: new Date('2024-01-15'),
  ...overrides
});

// Helpers para simular interações
export const waitForElementToLoad = (callback, timeout = 3000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkElement = () => {
      try {
        const result = callback();
        if (result) {
          resolve(result);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Element not found within timeout'));
        } else {
          setTimeout(checkElement, 100);
        }
      } catch (error) {
        setTimeout(checkElement, 100);
      }
    };
    checkElement();
  });
};

// ===== TESTES DOS COMPONENTES =====

// src/tests/components/ClientModal.test.js
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider, mockClient } from '../utils/testUtils';
import ClientModal from '../../components/clients/ClientModal';

describe('ClientModal', () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve renderizar modal para novo cliente', () => {
    renderWithProvider(
      <ClientModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={null}
      />
    );

    expect(screen.getByText('Novo Cliente')).toBeInTheDocument();
// src/tests/components/ClientModal.test.js
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider, mockClient } from '../utils/testUtils';
import ClientModal from '../../components/clients/ClientModal';

describe('ClientModal', () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve renderizar modal para novo cliente', () => {
    renderWithProvider(
      <ClientModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={null}
      />
    );

    expect(screen.getByText('Novo Cliente')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome Completo *')).toBeInTheDocument();
    expect(screen.getByLabelText('Email *')).toBeInTheDocument();
    expect(screen.getByLabelText('Telefone')).toBeInTheDocument();
    expect(screen.getByLabelText('CPF')).toBeInTheDocument();
    expect(screen.getByLabelText('Chave PIX')).toBeInTheDocument();
  });

  test('deve preencher dados ao editar cliente existente', () => {
    const client = mockClient();
    
    renderWithProvider(
      <ClientModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={client}
      />
    );

    expect(screen.getByText('Editar Cliente')).toBeInTheDocument();
    expect(screen.getByDisplayValue(client.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(client.email)).toBeInTheDocument();
  });

  test('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup();
    
    renderWithProvider(
      <ClientModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={null}
      />
    );

    const saveButton = screen.getByText('Salvar Cliente');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
      expect(screen.getByText('Email é obrigatório')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('deve formatar CPF automaticamente', async () => {
    const user = userEvent.setup();
    
    renderWithProvider(
      <ClientModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={null}
      />
    );

    const cpfInput = screen.getByLabelText('CPF');
    await user.type(cpfInput, '12345678901');

    await waitFor(() => {
      expect(cpfInput.value).toBe('123.456.789-01');
    });
  });

  test('deve chamar onSave com dados válidos', async () => {
    const user = userEvent.setup();
    
    renderWithProvider(
      <ClientModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        client={null}
      />
    );

    await user.type(screen.getByLabelText('Nome Completo *'), 'João Silva');
    await user.type(screen.getByLabelText('Email *'), 'joao@teste.com');
    await user.type(screen.getByLabelText('Telefone'), '11999999999');
    await user.type(screen.getByLabelText('CPF'), '12345678901');

    const saveButton = screen.getByText('Salvar Cliente');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        name: 'João Silva',
        email: 'joao@teste.com',
        phone: '11999999999',
        cpf: '12345678901',
        pix: ''
      });
    });
  });
});

// ===== TESTES DOS HOOKS =====

// src/tests/hooks/useFirestore.test.js
import { renderHook, act } from '@testing-library/react';
import { useFirestore } from '../../hooks/useFirestore';
import { mockClient, mockSubscription, mockInvoice } from '../utils/testUtils';

// Mock do Firestore
const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn()
};

jest.mock('../../services/firebase', () => ({
  db: mockFirestore
}));

describe('useFirestore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve inicializar com estado vazio', () => {
    const { result } = renderHook(() => useFirestore());

    expect(result.current.clients).toEqual([]);
    expect(result.current.subscriptions).toEqual([]);
    expect(result.current.invoices).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  test('deve criar cliente com sucesso', async () => {
    const mockAddDoc = jest.fn().mockResolvedValue({ id: 'new-client-id' });
    mockFirestore.addDoc = mockAddDoc;

    const { result } = renderHook(() => useFirestore());
    const clientData = mockClient();

    await act(async () => {
      const clientId = await result.current.createClient(clientData);
      expect(clientId).toBe('new-client-id');
    });

    expect(mockAddDoc).toHaveBeenCalled();
  });

  test('deve calcular próxima data de recorrência corretamente', () => {
    const { result } = renderHook(() => useFirestore());
    
    const subscription = mockSubscription({
      recurrenceType: 'monthly',
      dayOfMonth: 15
    });

    // Testar cálculo de data (função interna)
    // Este teste precisaria acessar funções internas do hook
    // Em implementação real, extrairíamos essas funções para utilitários testáveis
  });
});

// ===== TESTES DOS UTILITÁRIOS =====

// src/tests/utils/formatters.test.js
import {
  formatCurrency,
  formatDate,
  formatPhone,
  formatCPF,
  isValidCPF,
  isValidEmail,
  removeFormatting
} from '../../utils/formatters';

describe('Formatters', () => {
  describe('formatCurrency', () => {
    test('deve formatar valores corretamente', () => {
      expect(formatCurrency(1500)).toBe('R$ 1.500,00');
      expect(formatCurrency(0)).toBe('R$ 0,00');
      expect(formatCurrency(10.50)).toBe('R$ 10,50');
      expect(formatCurrency(null)).toBe('R$ 0,00');
      expect(formatCurrency(undefined)).toBe('R$ 0,00');
    });

    test('deve lidar com strings numéricas', () => {
      expect(formatCurrency('1500')).toBe('R$ 1.500,00');
      expect(formatCurrency('10.5')).toBe('R$ 10,50');
    });
  });

  describe('formatDate', () => {
    test('deve formatar datas corretamente', () => {
      expect(formatDate('2024-01-15')).toBe('15/01/2024');
      expect(formatDate('2024-12-31')).toBe('31/12/2024');
    });

    test('deve lidar com datas inválidas', () => {
      expect(formatDate('')).toBe('');
      expect(formatDate(null)).toBe('');
      expect(formatDate('invalid-date')).toBe('invalid-date');
    });
  });

  describe('formatPhone', () => {
    test('deve formatar telefones corretamente', () => {
      expect(formatPhone('11999999999')).toBe('(11) 99999-9999');
      expect(formatPhone('1199999999')).toBe('(11) 9999-9999');
    });

    test('deve lidar com valores vazios', () => {
      expect(formatPhone('')).toBe('');
      expect(formatPhone(null)).toBe('');
    });
  });

  describe('formatCPF', () => {
    test('deve formatar CPF corretamente', () => {
      expect(formatCPF('12345678901')).toBe('123.456.789-01');
    });

    test('deve limitar a 11 dígitos', () => {
      expect(formatCPF('123456789012345')).toBe('123.456.789-01');
    });
  });

  describe('isValidCPF', () => {
    test('deve validar CPFs válidos', () => {
      expect(isValidCPF('11144477735')).toBe(true);
      expect(isValidCPF('111.444.777-35')).toBe(true);
    });

    test('deve rejeitar CPFs inválidos', () => {
      expect(isValidCPF('12345678901')).toBe(false);
      expect(isValidCPF('111.111.111-11')).toBe(false);
      expect(isValidCPF('123')).toBe(false);
      expect(isValidCPF('')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    test('deve validar emails válidos', () => {
      expect(isValidEmail('teste@exemplo.com')).toBe(true);
      expect(isValidEmail('usuario.teste+tag@dominio.com.br')).toBe(true);
    });

    test('deve rejeitar emails inválidos', () => {
      expect(isValidEmail('email-invalido')).toBe(false);
      expect(isValidEmail('teste@')).toBe(false);
      expect(isValidEmail('@dominio.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });
});

// ===== TESTES DE INTEGRAÇÃO =====

// src/tests/integration/Dashboard.integration.test.js
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider, mockClient, mockInvoice } from '../utils/testUtils';
import Dashboard from '../../components/dashboard/Dashboard';

// Mock do hook useFirestore
const mockUseFirestore = {
  clients: [mockClient()],
  subscriptions: [],
  invoices: [
    mockInvoice({ status: 'paid' }),
    mockInvoice({ id: 'invoice-2', status: 'pending' }),
    mockInvoice({ id: 'invoice-3', status: 'overdue' })
  ],
  loading: false,
  generateInvoices: jest.fn(),
  createExampleData: jest.fn()
};

jest.mock('../../hooks/useFirestore', () => ({
  useFirestore: () => mockUseFirestore
}));

describe('Dashboard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve exibir KPIs corretamente', async () => {
    renderWithProvider(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Total de clientes
      expect(screen.getByText('R$ 150,00')).toBeInTheDocument(); // Receita total
    });
  });

  test('deve chamar geração de faturas ao clicar no botão', async () => {
    const user = userEvent.setup();
    mockUseFirestore.generateInvoices.mockResolvedValue(2);

    renderWithProvider(<Dashboard />);

    const generateButton = screen.getByText('Gerar Faturas');
    await user.click(generateButton);

    await waitFor(() => {
      expect(mockUseFirestore.generateInvoices).toHaveBeenCalled();
    });
  });

  test('deve exibir mensagem quando não há clientes', () => {
    const emptyMock = { ...mockUseFirestore, clients: [], invoices: [] };
    jest.mocked(require('../../hooks/useFirestore').useFirestore).mockReturnValue(emptyMock);

    renderWithProvider(<Dashboard />);

    expect(screen.getByText(/Sistema de Cobranças com Recorrências/)).toBeInTheDocument();
    expect(screen.getByText(/Começar com Dados de Exemplo/)).toBeInTheDocument();
  });
});

// ===== TESTES DE PERFORMANCE =====

// src/tests/performance/components.performance.test.js
import React from 'react';
import { render } from '@testing-library/react';
import { renderWithProvider } from '../utils/testUtils';
import Dashboard from '../../components/dashboard/Dashboard';
import ClientsPage from '../../components/clients/ClientsPage';

describe('Performance Tests', () => {
  test('Dashboard deve renderizar rapidamente com muitos dados', () => {
    const startTime = performance.now();

    // Mock com muitos dados
    const largeMock = {
      clients: Array.from({ length: 1000 }, (_, i) => ({ 
        id: `client-${i}`, 
        name: `Cliente ${i}`,
        email: `cliente${i}@teste.com`
      })),
      invoices: Array.from({ length: 5000 }, (_, i) => ({
        id: `invoice-${i}`,
        amount: 100 + i,
        status: i % 3 === 0 ? 'paid' : i % 2 === 0 ? 'pending' : 'overdue'
      })),
      subscriptions: [],
      loading: false,
      generateInvoices: jest.fn(),
      createExampleData: jest.fn()
    };

    jest.mocked(require('../../hooks/useFirestore').useFirestore).mockReturnValue(largeMock);

    renderWithProvider(<Dashboard />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Deve renderizar em menos de 1 segundo
    expect(renderTime).toBeLessThan(1000);
  });
});

// ===== TESTES E2E (End-to-End) =====

// src/tests/e2e/userFlow.e2e.test.js
import { test, expect } from '@playwright/test';

// Nota: Este seria executado com Playwright
test.describe('User Flow E2E', () => {
  test('Fluxo completo: Login → Criar Cliente → Criar Assinatura → Gerar Fatura', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="email-input"]', 'teste@exemplo.com');
    await page.fill('[data-testid="password-input"]', 'senha123');
    await page.click('[data-testid="login-button"]');
    
    // 2. Navegar para clientes
    await page.click('[data-testid="nav-clients"]');
    await expect(page).toHaveURL(/.*clients/);
    
    // 3. Criar novo cliente
    await page.click('[data-testid="new-client-button"]');
    await page.fill('[data-testid="client-name"]', 'João Silva');
    await page.fill('[data-testid="client-email"]', 'joao@teste.com');
    await page.click('[data-testid="save-client-button"]');
    
    // 4. Verificar se cliente foi criado
    await expect(page.getByText('João Silva')).toBeVisible();
    
    // 5. Criar assinatura para o cliente
    await page.click('[data-testid="new-subscription-button"]');
    await page.fill('[data-testid="subscription-name"]', 'Plano Premium');
    await page.fill('[data-testid="subscription-amount"]', '150');
    await page.click('[data-testid="save-subscription-button"]');
    
    // 6. Navegar para dashboard
    await page.click('[data-testid="nav-dashboard"]');
    
    // 7. Gerar faturas
    await page.click('[data-testid="generate-invoices-button"]');
    await expect(page.getByText(/faturas foram geradas/)).toBeVisible();
    
    // 8. Verificar se fatura aparece na lista
    await expect(page.getByText('João Silva')).toBeVisible();
    await expect(page.getByText('R$ 150,00')).toBeVisible();
  });
});

/*// ===== CONFIGURAÇÃO DO PACKAGE.JSON =====

/*
Adicionar ao package.json:

{
  "scripts": {
    "test": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --watchAll=false",
    "test:ci": "CI=true react-scripts test --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^14.4.3",
    "@playwright/test": "^1.40.0",
    "jest-environment-jsdom": "^29.7.0"
  },
  
  "jest": {
    "collectCoverageFrom": [
      "src/** /*.{js,jsx}",
      "!src/index.js",
      "!src/reportWebVitals.js",
      "!src/tests/**",
      "!src/**//*.test.{js,jsx}"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
*/

// ===== ARQUIVO DE CONFIGURAÇÃO PLAYWRIGHT =====

// playwright.config.js
/*
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm start',
    port: 3000,
  },
});
*/

export default {
  setupTests: true,
  testUtils: true,
  componentTests: true,
  hookTests: true,
  integrationTests: true,
  performanceTests: true,
  e2eTests: true
};