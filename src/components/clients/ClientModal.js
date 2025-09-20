// src/components/clients/ClientModal.js
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { formatCPF, formatPhone, removeFormatting, isValidEmail, isValidCPF } from '../../utils/formatters';

const ClientModal = ({ isOpen, onClose, onSave, client }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    pix: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone ? formatPhone(client.phone) : '',
        cpf: client.cpf ? formatCPF(client.cpf) : '',
        pix: client.pix || ''
      });
    } else {
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        cpf: '', 
        pix: '' 
      });
    }
    setErrors({});
  }, [client, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Aplicar formatações específicas
    if (name === 'phone') {
      formattedValue = formatPhone(value);
    } else if (name === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (name === 'name') {
      // Capitalizar primeira letra de cada palavra
      formattedValue = value.replace(/\b\w/g, l => l.toUpperCase());
    } else if (name === 'email') {
      // Email sempre em minúscula
      formattedValue = value.toLowerCase();
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Limpar erro específico quando usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Nome obrigatório e mínimo 2 caracteres
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    // Email obrigatório e válido
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // CPF - se preenchido, deve ser válido
    if (formData.cpf && !isValidCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }
    
    // Telefone - se preenchido, deve ter formato mínimo
    if (formData.phone && removeFormatting(formData.phone).length < 10) {
      newErrors.phone = 'Telefone deve ter pelo menos 10 dígitos';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    
    try {
      const dataToSave = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: removeFormatting(formData.phone),
        cpf: removeFormatting(formData.cpf),
        pix: formData.pix.trim()
      };
      
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      setErrors({ general: 'Erro ao salvar cliente. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client ? 'Editar Cliente' : 'Novo Cliente'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Erro geral */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nome Completo *
          </label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange}
            className={`form-input ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="Digite o nome completo"
            disabled={loading}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email *
          </label>
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange}
            className={`form-input ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="exemplo@email.com"
            disabled={loading}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.email}
            </p>
          )}
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Telefone
          </label>
          <input 
            type="text" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange}
            className={`form-input ${errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="(11) 99999-9999"
            disabled={loading}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.phone}
            </p>
          )}
        </div>

        {/* CPF */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            CPF
          </label>
          <input 
            type="text" 
            name="cpf" 
            value={formData.cpf} 
            onChange={handleChange}
            className={`form-input ${errors.cpf ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="000.000.000-00"
            disabled={loading}
          />
          {errors.cpf && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.cpf}
            </p>
          )}
        </div>

        {/* PIX */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Chave PIX
          </label>
          <input 
            type="text" 
            name="pix" 
            value={formData.pix} 
            onChange={handleChange}
            className="form-input"
            placeholder="Email, telefone, CPF ou chave aleatória"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Pode ser email, telefone, CPF ou chave aleatória
          </p>
        </div>

        {/* Botões */}
        <div className="pt-4 flex justify-end space-x-3">
          <button 
            type="button" 
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </div>
            ) : (
              'Salvar Cliente'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ClientModal;