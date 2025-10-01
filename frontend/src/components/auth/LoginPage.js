// src/components/auth/LoginPage.js - VERSÃO MELHORADA
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [animationLoaded, setAnimationLoaded] = useState(false);

  // Carregar dados salvos
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
    
    // Animação de entrada
    setTimeout(() => setAnimationLoaded(true), 100);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro quando usuário começar a digitar
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setError('Email deve ser válido');
      return false;
    }
    
    if (!formData.password.trim()) {
      setError('Senha é obrigatória');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const result = await onLogin(formData.email.trim(), formData.password);
      
      if (result.success) {
        // Salvar email se "Lembrar de mim" estiver marcado
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
      } else {
        // Melhor tratamento de erros
        const errorMessages = {
          'auth/user-not-found': 'Usuário não encontrado',
          'auth/wrong-password': 'Senha incorreta',
          'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos',
          'auth/invalid-email': 'Email inválido',
          'auth/user-disabled': 'Conta desabilitada'
        };
        
        setError(errorMessages[result.error] || result.error || 'Erro ao fazer login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro inesperado. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!formData.email.trim()) {
      setError('Digite seu email primeiro para recuperar a senha');
      return;
    }
    
    alert('🚀 Em breve: Recuperação de senha por email!');
  };

  const handleDemoLogin = async () => {
    setFormData({
      email: 'demo@conexaodelivery.com',
      password: 'demo123'
    });
    
    // Auto-submit após 500ms
    setTimeout(() => {
      document.querySelector('form').requestSubmit();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Container Principal */}
      <div className={`sm:mx-auto sm:w-full sm:max-w-md relative z-10 transform transition-all duration-700 ${
        animationLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img 
                className="h-20 w-auto drop-shadow-lg transition-transform duration-300 hover:scale-105" 
                src="/WhatsApp_Image_2025-09-20_at_14.40.27-removebg-preview.png" 
                alt="Conexão Delivery" 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              {/* Fallback Logo */}
              <div 
                className="hidden h-20 w-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl"
                style={{ display: 'none' }}
              >
                <span className="text-white font-bold text-2xl">CD</span>
              </div>
              
              {/* Pulse ring */}
              <div className="absolute -inset-2 bg-orange-400 rounded-full opacity-30 animate-ping"></div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema de Cobranças
          </h2>
          <p className="text-gray-600 mb-4">
            Entre com suas credenciais para acessar o sistema
          </p>
          
          {/* Stats rápidos */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">99%</div>
              <div className="text-xs text-gray-500">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">24/7</div>
              <div className="text-xs text-gray-500">Suporte</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">🔐</div>
              <div className="text-xs text-gray-500">Seguro</div>
            </div>
          </div>
        </div>

        {/* Card de Login */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/50 shadow-2xl rounded-2xl px-8 py-10 transform hover:scale-[1.01] transition-transform duration-300">
          
          {/* Demo Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-orange-300 rounded-xl text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Testar com Conta Demo
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou entre com sua conta</span>
            </div>
          </div>

          <form className="space-y-6 mt-6" onSubmit={handleSubmit}>
            {/* Erro geral */}
            {error && (
              <div className="alert alert-error animate-shake">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="input-group">
                <div className="input-group-text">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input input-group-input focus:ring-orange-500 focus:border-orange-500"
                  placeholder="seu@email.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="input-group">
                <div className="input-group-text">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input input-group-input focus:ring-orange-500 focus:border-orange-500 pr-10"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Opções */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Lembrar de mim
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-medium text-orange-600 hover:text-orange-500 focus:outline-none focus:underline transition duration-150 ease-in-out"
                >
                  Esqueci minha senha
                </button>
              </div>
            </div>

            {/* Botão de login */}
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Entrando...</span>
                  </div>
                ) : (
                  <>
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <svg className="h-5 w-5 text-orange-300 group-hover:text-orange-200 transition duration-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Entrar no Sistema
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer do card */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600 font-medium">
                🚀 Sistema de gerenciamento de cobranças
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <span>✅ 100% Seguro</span>
                <span>•</span>
                <span>⚡ Tempo real</span>
                <span>•</span>
                <span>📱 Responsivo</span>
              </div>
              <p className="text-xs text-gray-400">
                Versão 2.0 - Conexão Delivery © 2024
              </p>
            </div>
          </div>
        </div>

        {/* Links adicionais */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex justify-center space-x-6 text-sm">
            <button className="text-orange-600 hover:text-orange-500 font-medium transition duration-150">
              📧 Suporte
            </button>
            <button className="text-orange-600 hover:text-orange-500 font-medium transition duration-150">
              📖 Documentação
            </button>
            <button className="text-orange-600 hover:text-orange-500 font-medium transition duration-150">
              🎥 Tutorial
            </button>
          </div>
          
          <div className="bg-white/60 rounded-xl p-4 border border-white/50">
            <p className="text-sm text-gray-600">
              <strong>Primeira vez aqui?</strong> Use a conta demo para explorar todas as funcionalidades!
            </p>
          </div>
        </div>
      </div>

      {/* Animações CSS customizadas */}
      <style jsx>{`
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .input-group {
          position: relative;
        }
        
        .form-input {
          transition: all 0.2s ease-in-out;
        }
        
        .form-input:focus {
          transform: translateY(-1px);
          box-shadow: 0 10px 25px rgba(249, 115, 22, 0.15);
        }
      `}</style>
    </div>
  );
};

export default LoginPage;