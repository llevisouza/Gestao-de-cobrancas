// src/components/common/Header.js
import React from 'react';
import { ROUTES } from '../../utils/constants';

const Header = ({ user, onLogout, currentView, onViewChange, onCreateSampleData }) => {
  const handleLogout = async () => {
    const result = await onLogout();
    if (!result.success) {
      alert('Erro ao fazer logout: ' + result.error);
    }
  };

  const getNavButtonClass = (view) => {
    const baseClass = "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition";
    const activeClass = "bg-primary-100 text-primary-700"; // Usa a nova cor primária
    const inactiveClass = "text-gray-600 hover:text-gray-900 hover:bg-gray-100";
    
    return `${baseClass} ${currentView === view ? activeClass : inactiveClass}`;
  };

  const getUserDisplayName = () => {
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split('@')[0];
    return 'Usuário';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Título */}
          <div className="flex items-center space-x-3">
            <img src="/WhatsApp_Image_2025-09-20_at_14.40.27-removebg-preview.png" alt="Logo Conexão Delivery" className="h-8" />
            <span className="hidden sm:inline text-xl font-bold text-gray-800">
              Conexão Delivery
            </span>
          </div>
            
          {/* Navegação */}
          <nav className="hidden md:flex space-x-6">
            <button
              onClick={() => onViewChange(ROUTES.DASHBOARD)}
              className={getNavButtonClass(ROUTES.DASHBOARD)}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => onViewChange(ROUTES.CLIENTS)}
              className={getNavButtonClass(ROUTES.CLIENTS)}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              <span>Clientes</span>
            </button>
            
            <button
              onClick={() => onViewChange(ROUTES.REPORTS)}
              className={getNavButtonClass(ROUTES.REPORTS)}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <span>Relatórios</span>
            </button>
          </nav>
          
          {/* Ações do usuário */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onCreateSampleData}
              className="hidden sm:inline-flex items-center bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition duration-200"
              title="Criar dados de exemplo para testar o sistema"
            >
              <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Dados Exemplo
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
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
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition duration-200 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 inline sm:mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Menu mobile */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-4 py-3 space-y-1">
          <button
            onClick={() => onViewChange(ROUTES.DASHBOARD)}
            className={`${getNavButtonClass(ROUTES.DASHBOARD)} w-full justify-start`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => onViewChange(ROUTES.CLIENTS)}
            className={`${getNavButtonClass(ROUTES.CLIENTS)} w-full justify-start`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            <span>Clientes</span>
          </button>
          
          <button
            onClick={() => onViewChange(ROUTES.REPORTS)}
            className={`${getNavButtonClass(ROUTES.REPORTS)} w-full justify-start`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <span>Relatórios</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;