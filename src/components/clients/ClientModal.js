// src/components/clients/ClientModal.js
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { formatCPF, formatPhone, removeFormatting } from '../../utils/formatters';

const ClientModal = ({ isOpen, onClose, onSave, client }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    pix: ''
  });
  const [errors, setErrors] = useState({});

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
      setFormData({ name: '', email: '', phone: '', cpf: '', pix: '' });
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
    }
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório.';
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const dataToSave = {
        ...formData,
        phone: removeFormatting(formData.phone),
        cpf: removeFormatting(formData.cpf),
      };
      onSave(dataToSave);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client ? 'Editar Cliente' : 'Novo Cliente'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome Completo *</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Telefone</label>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="(99) 99999-9999" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">CPF</label>
          <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Chave PIX</label>
          <input type="text" name="pix" value={formData.pix} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
        </div>
        <div className="pt-4 flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar</button>
        </div>
      </form>
    </Modal>
  );
};

export default ClientModal;