'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Usuario, UserRole } from '@/lib/types';

interface Props {
  usuario: Usuario;
  onClose: () => void;
  onSuccess: () => void;
}

interface Cliente {
  id: string;
  nome_cliente: string;
}

export default function FormEditarUsuario({ usuario, onClose, onSuccess }: Props) {
  const supabase = createClient();
  
  const [formData, setFormData] = useState({
    nome_completo: usuario.nome_completo || '',
    telefone: usuario.telefone || '',
    role: usuario.role,
    cliente_id: usuario.cliente_id || '',
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Carregar clientes
  useEffect(() => {
    async function loadClientes() {
      const { data } = await supabase
        .from('clientes')
        .select('id, nome_cliente')
        .eq('ativo', true)
        .order('nome_cliente');
      
      if (data) setClientes(data);
    }
    loadClientes();
  }, []);

  function validarFormulario(): string | null {
    if (formData.nome_completo.trim().length < 3) {
      return 'Nome completo deve ter no mínimo 3 caracteres';
    }

    if (formData.role === 'agencia' && formData.cliente_id) {
      return 'Agência não deve estar associada a um cliente';
    }

    if (formData.role === 'cliente' && !formData.cliente_id) {
      return 'Este tipo de usuário precisa estar associado a um cliente';
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const erro = validarFormulario();
    if (erro) {
      setError(erro);
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          nome_completo: formData.nome_completo.trim(),
          telefone: formData.telefone.trim() || null,
          role: formData.role,
          cliente_id: formData.role === 'agencia' ? null : formData.cliente_id,
          atualizado_em: new Date().toISOString(),
          atualizado_por: user.id,
        })
        .eq('id', usuario.id);

      if (updateError) throw updateError;

      await supabase.from('logs_sistema').insert({
        tipo_evento: 'usuario_editado',
        descricao: `Usuário ${formData.nome_completo} foi atualizado`,
        usuario_id: usuario.id,
        metadata: {
          alteracoes: {
            nome_anterior: usuario.nome_completo,
            nome_novo: formData.nome_completo,
            role_anterior: usuario.role,
            role_novo: formData.role,
          },
        },
      });

      onSuccess();
    } catch (err: any) {
      console.error('Erro ao editar usuário:', err);
      setError(err.message || 'Erro ao editar usuário');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                ✏️ Editar Usuário
              </h2>
              <p className="text-blue-100 mt-1">
                Atualize as informações de <span className="font-semibold">{usuario.email}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            
            {/* Erro */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2 duration-200">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Email (não editável) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={usuario.email}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <span className="absolute right-3 top-3 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  não editável
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Nome Completo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nome_completo}
                  onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Ex: João Silva"
                  required
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Telefone <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="(11) 98765-4321"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Usuário <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  required
                >
                  <option value="agencia">🏢 Agência (acesso completo)</option>
                  <option value="cliente">👤 Cliente (apenas seu WhatsApp)</option>
                </select>
              </div>

              {/* Cliente */}
              {formData.role === 'cliente' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cliente <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.cliente_id}
                    onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome_cliente}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Salvando...
                </span>
              ) : (
                '💾 Salvar Alterações'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
