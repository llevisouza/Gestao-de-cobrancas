// src/hooks/useFirebaseAuth.js - VERSÃO TOTALMENTE CORRIGIDA
import { useState, useEffect } from 'react';
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

  // Monitorar mudanças no estado de autenticação
  useEffect(() => {
    console.log('🔐 Configurando listener de autenticação...');
    
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        console.log('🔐 Estado de autenticação mudou:', user ? `Usuário: ${user.email}` : 'Usuário deslogado');
        setUser(user);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('❌ Erro no listener de autenticação:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => {
      console.log('🧹 Removendo listener de autenticação');
      unsubscribe();
    };
  }, []);

  // Função de login
  const signIn = async (email, password) => {
    try {
      console.log('🔐 Tentando fazer login com:', email);
      setLoading(true);
      setError(null);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login realizado com sucesso:', userCredential.user.email);
      
      return { 
        success: true, 
        user: userCredential.user 
      };
    } catch (error) {
      console.error('❌ Erro no login:', error.code, error.message);
      
      // Mapear erros para português
      let errorMessage = error.message;
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Conta desabilitada';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erro de conexão. Verifique sua internet';
          break;
        default:
          errorMessage = 'Erro ao fazer login. Tente novamente';
      }
      
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // Função de registro (para criar contas de teste)
  const signUp = async (email, password) => {
    try {
      console.log('🔐 Criando nova conta:', email);
      setLoading(true);
      setError(null);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Conta criada com sucesso:', userCredential.user.email);
      
      return { 
        success: true, 
        user: userCredential.user 
      };
    } catch (error) {
      console.error('❌ Erro ao criar conta:', error.code, error.message);
      
      let errorMessage = error.message;
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email já está em uso';
          break;
        case 'auth/weak-password':
          errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        default:
          errorMessage = 'Erro ao criar conta. Tente novamente';
      }
      
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      console.log('🔐 Fazendo logout...');
      setLoading(true);
      
      await signOut(auth);
      console.log('✅ Logout realizado com sucesso');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      setError(error.message);
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setLoading(false);
    }
  };

  // Função para resetar senha
  const resetPassword = async (email) => {
    try {
      console.log('🔐 Enviando reset de senha para:', email);
      setError(null);

      await sendPasswordResetEmail(auth, email);
      console.log('✅ Email de reset enviado');
      
      return { 
        success: true, 
        message: 'Email de recuperação enviado!' 
      };
    } catch (error) {
      console.error('❌ Erro ao enviar reset:', error);
      
      let errorMessage = error.message;
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        default:
          errorMessage = 'Erro ao enviar email de recuperação';
      }
      
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  // Função para login demo (desenvolvimento)
  const signInDemo = async () => {
    // Primeiro tenta fazer login com a conta demo
    let result = await signIn('demo@conexaodelivery.com', 'demo123');
    
    // Se não conseguir (conta não existe), cria a conta demo
    if (!result.success && result.error.includes('não encontrado')) {
      console.log('🔐 Conta demo não existe, criando...');
      const signUpResult = await signUp('demo@conexaodelivery.com', 'demo123');
      
      if (signUpResult.success) {
        console.log('✅ Conta demo criada, fazendo login...');
        result = await signIn('demo@conexaodelivery.com', 'demo123');
      }
    }
    
    return result;
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInDemo,
    logout,
    resetPassword
  };
};