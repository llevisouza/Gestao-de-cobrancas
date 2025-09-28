import React, { useState } from 'react';
import { ROUTES } from '../../utils/constants';

const Header = ({ user, onLogout, currentView, onViewChange, onCreateSampleData }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWhatsAppDropdownOpen, setIsWhatsAppDropdownOpen] = useState(false);

  const handleLogout = async () => {
    const result = await onLogout();
    if (!result.success) {
      alert('Erro ao fazer logout: ' + result.error);
    }
  };

  const getNavButtonClass = (view) => {
    const baseClass = "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition duration-200";
    let isActive = currentView === view;
    if (Array.isArray(view) && view.includes(currentView)) {
      isActive = true;
    }
    return `${baseClass} ${isActive ? 'nav-active' : 'nav-inactive'}`;
  };

  const getUserDisplayName = () => {
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split('@')[0];
    return 'Usuário';
  };

  const navItems = [
    { route: ROUTES.DASHBOARD, label: 'Dashboard', icon: '📊' },
    { route: ROUTES.CLIENTS, label: 'Clientes', icon: '👥' },
    { route: ROUTES.REPORTS, label: 'Relatórios', icon: '📈' },
  ];

  // Função para lidar com o clique no dropdown WhatsApp
  const handleWhatsAppDropdown = () => {
    setIsWhatsAppDropdownOpen(!isWhatsAppDropdownOpen);
  };

  // Função para fechar o dropdown quando clicar fora
  const handleDropdownItemClick = (route) => {
    onViewChange(route);
    setIsWhatsAppDropdownOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="Logo Conexão Delivery"
              className="h-10 w-auto"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div
              className="h-10 w-10 bg-primary-500 rounded-lg flex items-center justify-center"
              style={{ display: 'none' }}
            >
              <span className="text-white font-bold text-sm">CD</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900">
                Conexão Delivery
              </span>
              <span className="text-xs text-gray-500 hidden lg:block">
                Sistema de Cobranças
              </span>
            </div>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex space-x-4">
            {navItems.map(item => (
              <button
                key={item.route}
                onClick={() => onViewChange(item.route)}
                className={getNavButtonClass(item.route)}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}

            {/* WhatsApp Dropdown com controle melhor */}
            <div className="relative">
              <button 
                onClick={handleWhatsAppDropdown}
                className={`${getNavButtonClass([ROUTES.WHATSAPP, ROUTES.WHATSAPP_AUTOMATION])} ${
                  isWhatsAppDropdownOpen ? 'bg-orange-100 text-orange-700' : ''
                }`}
              >
                <span>📱</span>
                <span>WhatsApp</span>
                <svg 
                  className={`w-4 h-4 ml-1 transform transition-transform duration-200 ${
                    isWhatsAppDropdownOpen ? 'rotate-180' : ''
                  }`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {isWhatsAppDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg border border-gray-200 z-50 animate-fadeIn">
                  <div className="py-2">
                    <button
                      onClick={() => handleDropdownItemClick(ROUTES.WHATSAPP)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-colors flex items-center gap-3"
                    >
                      <span className="text-lg">📱</span>
                      <div>
                        <div className="font-medium">Gerenciar Cobranças</div>
                        <div className="text-xs text-gray-500">Enviar cobranças via WhatsApp</div>
                      </div>
                    </button>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => handleDropdownItemClick(ROUTES.WHATSAPP_AUTOMATION)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-colors flex items-center gap-3"
                    >
                      <span className="text-lg">🤖</span>
                      <div>
                        <div className="font-medium">Automação</div>
                        <div className="text-xs text-gray-500">Configurar cobranças automáticas</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-gray-500">
                  {user.email}
                </p>
              </div>
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {getUserDisplayName().charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-danger text-xs sm:text-sm"
                title="Sair do sistema"
              >
                <svg className="w-4 h-4 sm:mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 animate-fadeIn">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map(item => (
              <button
                key={item.route}
                onClick={() => {
                  onViewChange(item.route);
                  setIsMobileMenuOpen(false);
                }}
                className={`${getNavButtonClass(item.route)} w-full justify-start`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
            
            {/* WhatsApp mobile menu */}
            <div className="border-t pt-2 mt-2">
              <button
                onClick={() => {
                  onViewChange(ROUTES.WHATSAPP);
                  setIsMobileMenuOpen(false);
                }}
                className={`${getNavButtonClass(ROUTES.WHATSAPP)} w-full justify-start`}
              >
                <span>📱</span>
                <span>Gerenciar Cobranças</span>
              </button>
              <button
                onClick={() => {
                  onViewChange(ROUTES.WHATSAPP_AUTOMATION);
                  setIsMobileMenuOpen(false);
                }}
                className={`${getNavButtonClass(ROUTES.WHATSAPP_AUTOMATION)} w-full justify-start`}
              >
                <span>🤖</span>
                <span>Automação</span>
              </button>
            </div>
            
            {/* Mobile user info */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center px-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-800">{getUserDisplayName()}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 w-full flex items-center justify-center px-2 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-md"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para fechar dropdown quando clicar fora */}
      {isWhatsAppDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsWhatsAppDropdownOpen(false)}
        />
      )}

      {/* CSS adicional para animações */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
};

export default Header;