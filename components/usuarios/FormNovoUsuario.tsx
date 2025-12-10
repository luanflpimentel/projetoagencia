// components/usuarios/FormNovoUsuario.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useToast } from '@/components/ui/toast';
import { Eye, EyeOff, RefreshCw, Copy, X, AlertCircle } from 'lucide-react';
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
  agencia: 'Agência',
  cliente: 'Cliente',
};

const ROLE_DESCRIPTIONS = {
  agencia: 'Acesso completo ao sistema (vê e gerencia tudo)',
  cliente: 'Acesso limitado (vê apenas seu WhatsApp)',
};

export default function FormNovoUsuario({ onClose, onSuccess }: FormNovoUsuarioProps) {
  const [formData, setFormData] = useState({
    email: '',
    nome_completo: '',
    role: 'cliente' as UserRole,
    cliente_id: '',
    telefone: '',
    senha: gerarSenha(),
  });
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [error, setError] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const toast = useToast();

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
    if (!formData.email || !formData.email.includes('@')) {
      return 'Email inválido';
    }

    if (!formData.nome_completo || formData.nome_completo.length < 3) {
      return 'Nome deve ter pelo menos 3 caracteres';
    }

    if (formData.role === 'cliente' && !formData.cliente_id) {
      return 'Cliente deve estar associado a um cliente WhatsApp';
    }

    if (formData.role === 'agencia' && formData.cliente_id) {
      return 'Agência não pode ter cliente associado';
    }

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
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          nome_completo: formData.nome_completo,
          role: formData.role,
          cliente_id: formData.cliente_id || null,
          telefone: formData.telefone || null,
          senha: formData.senha
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar usuário');
      }

      // Copiar senha automaticamente
      await navigator.clipboard.writeText(formData.senha);

      toast.success(
        `Usuário criado com sucesso! Senha copiada: ${formData.senha}`
      );

      onSuccess();

    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      setError(err.message || 'Erro ao criar usuário');
      toast.error(err.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  }

  async function copiarSenha() {
    await navigator.clipboard.writeText(formData.senha);
    toast.success('Senha copiada para a área de transferência!');
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-border">
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <h2 className="text-xl font-bold text-foreground">Novo Usuário</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-lg"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Email <span className="text-destructive font-bold">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-input rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-all"
              placeholder="usuario@exemplo.com"
              disabled={loading}
            />
          </div>

          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Nome Completo <span className="text-destructive font-bold">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nome_completo}
              onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
              className="w-full border border-input rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-all"
              placeholder="João Silva"
              disabled={loading}
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Telefone <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
            </label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="w-full border border-input rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-all"
              placeholder="(00) 00000-0000"
              disabled={loading}
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Tipo de Usuário <span className="text-destructive font-bold">*</span>
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole, cliente_id: '' })}
              className="w-full border border-input rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-all"
              disabled={loading}
            >
              <option value="cliente">{ROLE_LABELS.cliente}</option>
              <option value="agencia">{ROLE_LABELS.agencia}</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1.5">
              {ROLE_DESCRIPTIONS[formData.role]}
            </p>
          </div>

          {/* Cliente (apenas se role for cliente) */}
          {formData.role === 'cliente' && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Cliente <span className="text-destructive font-bold">*</span>
              </label>
              {loadingClientes ? (
                <div className="text-sm text-muted-foreground">Carregando clientes...</div>
              ) : (
                <select
                  required
                  value={formData.cliente_id}
                  onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                  className="w-full border border-input rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-all"
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
                <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Nenhum cliente ativo encontrado
                </p>
              )}
            </div>
          )}

          {/* Senha Temporária */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Senha Temporária
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="w-full border border-input rounded-lg px-4 py-2.5 pr-12 focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground font-mono text-sm transition-all"
                  placeholder="Digite ou gere uma senha"
                  disabled={loading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  disabled={loading}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, senha: gerarSenha() })}
                className="px-3 py-2.5 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors border border-input"
                title="Gerar nova senha"
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={copiarSenha}
                className="px-3 py-2.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors border border-primary/20"
                title="Copiar senha"
                disabled={loading}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Anote esta senha e envie para o usuário. Ele deverá alterá-la no primeiro acesso.</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50 font-semibold border-2 border-border"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (formData.role === 'cliente' && clientes.length === 0)}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-semibold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Criando...</span>
                </span>
              ) : (
                'Criar Usuário'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
