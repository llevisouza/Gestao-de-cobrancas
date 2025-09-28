// src/hooks/useFirebaseAuth.js - VERSÃO SUPER OTIMIZADA
import { useState, useEffect, useRef } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../services/firebase';

export const useFirebaseAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ⚡ OTIMIZAÇÃO: Usar ref para evitar múltiplos listeners
  const authListenerRef = useRef(null);
  const isInitializedRef = useRef(false);

  // ⚡ OTIMIZAÇÃO: Setup do listener uma única vez
  useEffect(() => {
    // Evitar múltiplos listeners
    if (isInitializedRef.current) {
      console.log('⚡ Auth listener já inicializado, ignorando...');
      return;
    }

    console.log('🔐 Configurando listener de autenticação OTIMIZADO...');
    isInitializedRef.current = true;
    
    // ⚡ OTIMIZAÇÃO: Configurar listener com cleanup automático
    authListenerRef.current = onAuthStateChanged(auth, 
      (user) => {
        console.log('🔐 Estado auth mudou:', user ? `Usuário: ${user.email}` : 'Deslogado');
        setUser(user);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('❌ Erro no listener auth:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    // ⚡ OTIMIZAÇÃO: Cleanup robusto
    return () => {
      console.log('🧹 Removendo listener de autenticação otimizado');
      if (authListenerRef.current) {
        try {
          authListenerRef.current();
          authListenerRef.current = null;
        } catch (cleanupError) {
          console.warn('⚠️ Aviso no cleanup auth:', cleanupError);
        }
      }
      isInitializedRef.current = false;
    };
  }, []); // ⚡ OTIMIZAÇÃO: Array vazio - executa apenas uma vez

  // ⚡ OTIMIZAÇÃO: Função de login com error handling melhorado
  const signIn = async (email, password) => {
    if (!email?.trim() || !password?.trim()) {
      const error = 'Email e senha são obrigatórios';
      setError(error);
      return { success: false, error };
    }

    try {
      console.log('🔐 Login otimizado para:', email);
      setLoading(true);
      setError(null);

      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      console.log('✅ Login realizado:', userCredential.user.email);
      
      return { 
        success: true, 
        user: userCredential.user 
      };
    } catch (error) {
      console.error('❌ Erro no login:', error.code);
      
      // ⚡ OTIMIZAÇÃO: Mapeamento otimizado de erros
      const errorMessages = {
        'auth/user-not-found': 'Usuário não encontrado',
        'auth/wrong-password': 'Senha incorreta',
        'auth/invalid-email': 'Email inválido',
        'auth/user-disabled': 'Conta desabilitada',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde um momento',
        'auth/network-request-failed': 'Erro de conexão',
        'auth/invalid-credential': 'Credenciais inválidas'
      };
      
      const errorMessage = errorMessages[error.code] || 'Erro ao fazer login';
      setError(errorMessage);
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // ⚡ OTIMIZAÇÃO: Função de registro otimizada
  const signUp = async (email, password) => {
    if (!email?.trim() || !password?.trim()) {
      const error = 'Email e senha são obrigatórios';
      setError(error);
      return { success: false, error };
    }

    if (password.length < 6) {
      const error = 'Senha deve ter pelo menos 6 caracteres';
      setError(error);
      return { success: false, error };
    }

    try {
      console.log('🔐 Criando conta otimizada:', email);
      setLoading(true);
      setError(null);

      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      console.log('✅ Conta criada:', userCredential.user.email);
      
      return { 
        success: true, 
        user: userCredential.user 
      };
    } catch (error) {
      console.error('❌ Erro ao criar conta:', error.code);
      
      const errorMessages = {
        'auth/email-already-in-use': 'Este email já está em uso',
        'auth/weak-password': 'Senha muito fraca',
        'auth/invalid-email': 'Email inválido',
        'auth/operation-not-allowed': 'Operação não permitida'
      };
      
      const errorMessage = errorMessages[error.code] || 'Erro ao criar conta';
      setError(errorMessage);
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // ⚡ OTIMIZAÇÃO: Função de logout otimizada
  const logout = async () => {
    try {
      console.log('🔐 Logout otimizado...');
      setLoading(true);
      setError(null);
      
      await signOut(auth);
      console.log('✅ Logout realizado');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      const errorMessage = 'Erro ao fazer logout';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // ⚡ OTIMIZAÇÃO: Reset de senha otimizado
  const resetPassword = async (email) => {
    if (!email?.trim()) {
      const error = 'Email é obrigatório';
      setError(error);
      return { success: false, error };
    }

    try {
      console.log('🔐 Reset de senha para:', email);
      setError(null);

      await sendPasswordResetEmail(auth, email.trim());
      console.log('✅ Email de reset enviado');
      
      return { 
        success: true, 
        message: 'Email de recuperação enviado!' 
      };
    } catch (error) {
      console.error('❌ Erro no reset:', error.code);
      
      const errorMessages = {
        'auth/user-not-found': 'Usuário não encontrado',
        'auth/invalid-email': 'Email inválido',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde um momento'
      };
      
      const errorMessage = errorMessages[error.code] || 'Erro ao enviar email';
      setError(errorMessage);
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  // ⚡ OTIMIZAÇÃO: Login demo com fallback inteligente
  const signInDemo = async () => {
    const demoEmail = 'demo@conexaodelivery.com';
    const demoPassword = 'demo123';

    console.log('🎯 Tentando login demo...');

    // Primeiro tenta login
    let result = await signIn(demoEmail, demoPassword);
    
    // Se falhar por usuário não encontrado, cria a conta
    if (!result.success && result.error.includes('não encontrado')) {
      console.log('🔐 Conta demo não existe, criando...');
      
      const signUpResult = await signUp(demoEmail, demoPassword);
      
      if (signUpResult.success) {
        console.log('✅ Conta demo criada, fazendo login...');
        result = await signIn(demoEmail, demoPassword);
      }
    }
    
    return result;
  };

  // ⚡ OTIMIZAÇÃO: Função para limpar erros
  const clearError = () => {
    setError(null);
  };

  // ⚡ OTIMIZAÇÃO: Verificar se usuário está logado
  const isAuthenticated = !!user;
  const isAdmin = user?.email === 'demo@conexaodelivery.com' || user?.email === 'admin@conexaodelivery.com';

  return {
    // Estados
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,

    // Funções principais
    signIn,
    signUp,
    signInDemo,
    logout,
    resetPassword,

    // Utilitários
    clearError
  };
};