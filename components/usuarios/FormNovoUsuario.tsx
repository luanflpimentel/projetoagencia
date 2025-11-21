// components/usuarios/FormNovoUsuario.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { UserRole } from '@/lib/types';

interface FormNovoUsuarioProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Cliente {
  id: string;
  nome_cliente: string;
}

const ROLE_LABELS = {
  super_admin: '👑 Super Admin',
  admin_cliente: '🔑 Admin Cliente',
  usuario_cliente: '👤 Usuário Cliente',
};

const ROLE_DESCRIPTIONS = {
  super_admin: 'Acesso total ao sistema (Agência)',
  admin_cliente: 'Administrador do cliente (gerencia usuários)',
  usuario_cliente: 'Usuário comum (acesso limitado)',
};

export default function FormNovoUsuario({ onClose, onSuccess }: FormNovoUsuarioProps) {
  const [formData, setFormData] = useState({
    email: '',
    nome_completo: '',
    role: 'usuario_cliente' as UserRole,
    cliente_id: '',
    telefone: '',
    senha: gerarSenha(),
  });
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [error, setError] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadClientes();
  }, []);

  async function loadClientes() {
    try {
      setLoadingClientes(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome_cliente')
        .eq('ativo', true)
        .order('nome_cliente');
      
      if (error) throw error;
      setClientes(data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    } finally {
      setLoadingClientes(false);
    }
  }

  function gerarSenha(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let senha = '';
    for (let i = 0; i < 12; i++) {
      senha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return senha;
  }

  function validarFormulario(): string | null {
    // Validar email
    if (!formData.email || !formData.email.includes('@')) {
      return 'Email inválido';
    }

    // Validar nome
    if (!formData.nome_completo || formData.nome_completo.length < 3) {
      return 'Nome deve ter pelo menos 3 caracteres';
    }

    // Validar cliente para roles que não são super_admin
    if (formData.role !== 'super_admin' && !formData.cliente_id) {
      return 'Selecione um cliente para este usuário';
    }

    // Super admin não pode ter cliente
    if (formData.role === 'super_admin' && formData.cliente_id) {
      return 'Super Admin não pode ter cliente associado';
    }

    // Validar senha
    if (formData.senha.length < 8) {
      return 'Senha deve ter pelo menos 8 caracteres';
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const erroValidacao = validarFormulario();
    if (erroValidacao) {
      setError(erroValidacao);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Usuário não criado no Auth');

      // 2. Criar registro na tabela usuarios
      const { error: dbError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email: formData.email,
          nome_completo: formData.nome_completo,
          role: formData.role,
          cliente_id: formData.role === 'super_admin' ? null : formData.cliente_id,
          telefone: formData.telefone || null,
          ativo: true,
          email_verificado: false,
          primeiro_acesso: true,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        });

      if (dbError) {
        // Se falhar ao criar na tabela, tentar deletar do Auth
        console.error('Erro ao criar usuário na tabela:', dbError);
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw dbError;
      }

      // 3. Registrar log
      await supabase
        .from('logs_sistema')
        .insert({
          tipo_evento: 'cliente_criado',
          descricao: `Usuário ${formData.nome_completo} (${formData.email}) criado com role ${formData.role}`,
          metadata: {
            usuario_id: authData.user.id,
            role: formData.role,
            cliente_id: formData.cliente_id || null,
          },
        });

      // Sucesso!
      alert(
        `✅ Usuário criado com sucesso!\n\n` +
        `📧 Email: ${formData.email}\n` +
        `🔑 Senha temporária: ${formData.senha}\n\n` +
        `⚠️ IMPORTANTE: Anote esta senha e envie para o usuário!`
      );
      
      onSuccess();

    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      setError(err.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  }

  function copiarSenha() {
    navigator.clipboard.writeText(formData.senha);
    alert('Senha copiada para a área de transferência!');
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Novo Usuário</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="usuario@exemplo.com"
              disabled={loading}
            />
          </div>

          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nome_completo}
              onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="João Silva"
              disabled={loading}
            />
          </div>

          {/* Telefone (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="(00) 00000-0000"
              disabled={loading}
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Usuário <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole, cliente_id: '' })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="usuario_cliente">{ROLE_LABELS.usuario_cliente}</option>
              <option value="admin_cliente">{ROLE_LABELS.admin_cliente}</option>
              <option value="super_admin">{ROLE_LABELS.super_admin}</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {ROLE_DESCRIPTIONS[formData.role]}
            </p>
          </div>

          {/* Cliente (apenas se não for super_admin) */}
          {formData.role !== 'super_admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente <span className="text-red-500">*</span>
              </label>
              {loadingClientes ? (
                <div className="text-sm text-gray-500">Carregando clientes...</div>
              ) : (
                <select
                  required
                  value={formData.cliente_id}
                  onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">Selecione um cliente...</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome_cliente}
                    </option>
                  ))}
                </select>
              )}
              {clientes.length === 0 && !loadingClientes && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ Nenhum cliente ativo encontrado
                </p>
              )}
            </div>
          )}

          {/* Senha Temporária */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha Temporária
            </label>
            <div className="flex items-center space-x-2">
              <input
                type={mostrarSenha ? "text" : "password"}
                readOnly
                value={formData.senha}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? '🙈' : '👁️'}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, senha: gerarSenha() })}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                title="Gerar nova senha"
              >
                🔄
              </button>
              <button
                type="button"
                onClick={copiarSenha}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                title="Copiar senha"
              >
                📋
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ⚠️ Anote esta senha e envie para o usuário. Ele deverá alterá-la no primeiro acesso.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (formData.role !== 'super_admin' && clientes.length === 0)}
              className={`
                px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors
                ${loading || (formData.role !== 'super_admin' && clientes.length === 0)
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-blue-700'}
              `}
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Criando...</span>
                </span>
              ) : (
                '✓ Criar Usuário'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}