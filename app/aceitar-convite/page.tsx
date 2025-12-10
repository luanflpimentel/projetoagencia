// app/aceitar-convite/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ConviteData {
  email: string;
  nome_completo: string;
  role: string;
  telefone?: string;
  expira_em: string;
  cliente?: {
    nome_cliente: string;
    nome_instancia: string;
  };
}

function AceitarConviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [convite, setConvite] = useState<ConviteData | null>(null);
  const [error, setError] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (token) {
      verificarConvite();
    } else {
      setError('Token de convite não fornecido');
      setLoading(false);
    }
  }, [token]);

  async function verificarConvite() {
    try {
      setLoading(true);
      const response = await fetch(`/api/convites/verificar?token=${token}`);
      const data = await response.json();

      if (!data.valid) {
        setError(data.error || 'Convite inválido');
        return;
      }

      setConvite(data.convite);
    } catch (err) {
      console.error('Erro ao verificar convite:', err);
      setError('Erro ao verificar convite');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validações
    if (senha.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/convites/aceitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aceitar convite');
      }

      setSucesso(true);

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      console.error('Erro ao aceitar convite:', err);
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando convite...</p>
        </div>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-8 text-center border border-border">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Conta criada com sucesso!
          </h2>
          <p className="text-muted-foreground mb-6">
            Você será redirecionado para a página de login...
          </p>
          <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (error && !convite) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-8 text-center border-2 border-destructive">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Convite Inválido
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full overflow-hidden border-2 border-border">
        {/* Header */}
        <div className="bg-primary p-6 text-center">
          <h1 className="text-2xl font-bold text-primary-foreground mb-2">
            Bem-vindo!
          </h1>
          <p className="text-primary-foreground/80">
            Complete seu cadastro para acessar o sistema
          </p>
        </div>

        {/* Informações do Convite */}
        <div className="p-6 bg-muted/50 border-b border-border">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium text-foreground">{convite?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome:</span>
              <span className="font-medium text-foreground">{convite?.nome_completo}</span>
            </div>
            {convite?.cliente && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium text-foreground">{convite.cliente.nome_cliente}</span>
              </div>
            )}
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Senha */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Criar Senha <span className="text-destructive font-bold">*</span>
            </label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full border border-input rounded-lg px-4 py-2.5 pr-12 focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-all"
                placeholder="Digite sua senha"
                required
                minLength={8}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={submitting}
              >
                {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Mínimo de 8 caracteres
            </p>
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Confirmar Senha <span className="text-destructive font-bold">*</span>
            </label>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full border border-input rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-all"
              placeholder="Digite sua senha novamente"
              required
              minLength={8}
              disabled={submitting}
            />
          </div>

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-semibold"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Criando conta...
              </span>
            ) : (
              'Criar Conta'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AceitarConvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    }>
      <AceitarConviteContent />
    </Suspense>
  );
}
