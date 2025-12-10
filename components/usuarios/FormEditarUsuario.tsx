// components/usuarios/FormEditarUsuario.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useToast } from '@/components/ui/toast';
import { Usuario, UserRole } from '@/lib/types';
import { X, AlertCircle } from 'lucide-react';

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
  const toast = useToast();

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

      toast.success('Usuário atualizado com sucesso!');
      onSuccess();
    } catch (err: any) {
      console.error('Erro ao editar usuário:', err);
      setError(err.message || 'Erro ao editar usuário');
      toast.error(err.message || 'Erro ao editar usuário');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-border">

        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Editar Usuário
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Atualize as informações de <span className="font-medium">{usuario.email}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-lg"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">

            {/* Erro */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}

            {/* Email (não editável) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={usuario.email}
                  disabled
                  className="w-full px-4 py-2.5 border border-input rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                  não editável
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Nome Completo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome Completo <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nome_completo}
                  onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-all"
                  placeholder="Ex: João Silva"
                  required
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Telefone <span className="text-muted-foreground text-xs">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-all"
                  placeholder="(11) 98765-4321"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo de Usuário <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-all"
                  required
                >
                  <option value="agencia">Agência (acesso completo)</option>
                  <option value="cliente">Cliente (apenas seu WhatsApp)</option>
                </select>
              </div>

              {/* Cliente */}
              {formData.role === 'cliente' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Cliente <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formData.cliente_id}
                    onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-all"
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
          <div className="flex gap-3 mt-8 pt-6 border-t-2 border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 border-2 border-input text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-all font-semibold"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                'Salvar Alterações'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
