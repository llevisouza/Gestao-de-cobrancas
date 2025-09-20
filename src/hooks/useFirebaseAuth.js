// src/hooks/useFirebaseAuth.js
import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../services/firebase';

export const useFirebaseAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        console.log('✅ Usuário autenticado:', user.email);
      } else {
        console.log('🔐 Usuário não autenticado');
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return { 
        success: false, 
        error: getErrorMessage(error.code) 
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password) => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro no cadastro:', error);
      return { 
        success: false, 
        error: getErrorMessage(error.code) 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      console.log('👋 Usuário deslogado');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    logout
  };
};

// Função para traduzir códigos de erro do Firebase
const getErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/email-already-in-use': 'Este email já está em uso',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres',
    'auth/invalid-email': 'Email inválido',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
    'auth/user-disabled': 'Esta conta foi desabilitada',
    'auth/invalid-credential': 'Credenciais inválidas'
  };

  return errorMessages[errorCode] || 'Erro desconhecido. Tente novamente';
};