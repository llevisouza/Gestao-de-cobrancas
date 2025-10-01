import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { formatCPF, formatPhone, removeFormatting, isValidEmail, isValidCPF } from '../../utils/formatters';

const ClientModal = ({ isOpen, onClose, onSave, client }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', cpf: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone ? formatPhone(client.phone) : '',
        cpf: client.cpf ? formatCPF(client.cpf) : ''
      });
    } else {
      setFormData({ name: '', email: '', phone: '', cpf: '' });
    }
    setErrors({});
  }, [client, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    if (name === 'phone') {
      formattedValue = formatPhone(value);
    } else if (name === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (name === 'name') {
      formattedValue = value.replace(/\b\w/g, l => l.toUpperCase());
    } else if (name === 'email') {
      formattedValue = value.toLowerCase();
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // Validação de CPF: apenas valida se foi preenchido
    const cpfClean = removeFormatting(formData.cpf);
    if (cpfClean && cpfClean.length > 0 && !isValidCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }
    
    // Validação de telefone: apenas valida se foi preenchido
    const phoneClean = removeFormatting(formData.phone);
    if (phoneClean && phoneClean.length > 0 && phoneClean.length < 10) {
      newErrors.phone = 'Telefone deve ter pelo menos 10 dígitos';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    
    try {
      const dataToSave = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: removeFormatting(formData.phone),
        cpf: removeFormatting(formData.cpf)
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Erro geral */}
        {errors.general && (
          <div className="alert alert-error">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {errors.general}
          </div>
        )}

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo *
          </label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange}
            className={`form-input ${errors.name ? 'form-input-error' : ''}`}
            placeholder="Digite o nome completo"
            disabled={loading}
          />
          {errors.name && (
            <p className="form-error">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <div className="input-group">
            <div className="input-group-text">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange}
              className={`form-input input-group-input ${errors.email ? 'form-input-error' : ''}`}
              placeholder="exemplo@email.com"
              disabled={loading}
            />
          </div>
          {errors.email && (
            <p className="form-error">{errors.email}</p>
          )}
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <div className="input-group">
            <div className="input-group-text">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <input 
              type="text" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange}
              className={`form-input input-group-input ${errors.phone ? 'form-input-error' : ''}`}
              placeholder="(11) 99999-9999"
              disabled={loading}
            />
          </div>
          {errors.phone && (
            <p className="form-error">{errors.phone}</p>
          )}
        </div>

        {/* CPF */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CPF
          </label>
          <div className="input-group">
            <div className="input-group-text">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            </div>
            <input 
              type="text" 
              name="cpf" 
              value={formData.cpf} 
              onChange={handleChange}
              className={`form-input input-group-input ${errors.cpf ? 'form-input-error' : ''}`}
              placeholder="000.000.000-00"
              disabled={loading}
            />
          </div>
          {errors.cpf && (
            <p className="form-error">{errors.cpf}</p>
          )}
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-3 pt-6">
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
                <div className="loading-spinner w-4 h-4 mr-2"></div>
                Salvando...
              </div>
            ) : (
              client ? 'Atualizar Cliente' : 'Salvar Cliente'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ClientModal;