'use client';

// app/dashboard/clientes/novo/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ConviteModal } from '@/components/clientes/ConviteModal';
import { useToast } from '@/components/ui/toast';

interface ConviteData {
  email: string;
  token: string;
  link: string;
  expira_em: string;
}

export default function NovoClientePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showConviteModal, setShowConviteModal] = useState(false);
  const [conviteData, setConviteData] = useState<ConviteData | null>(null);
  const [formData, setFormData] = useState({
    nome_cliente: '',
    nome_escritorio: '',
    nome_agente: '',
    nome_instancia: '',
    numero_whatsapp: '',
    email: '',
  });

  // Gerar nome_instancia automaticamente quando digitar nome_cliente
  const handleNomeClienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setFormData(prev => ({
      ...prev,
      nome_cliente: valor,
      // Gerar nome_instancia: lowercase, sem espaços, sem acentos
      nome_instancia: valor
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
        .substring(0, 30) // Limita a 30 caracteres
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (!formData.nome_cliente || !formData.nome_instancia || !formData.nome_escritorio || !formData.nome_agente) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar formato do nome_instancia
    if (!/^[a-z0-9-]+$/.test(formData.nome_instancia)) {
      toast.error('Nome da instância deve conter apenas letras minúsculas, números e hífen');
      return;
    }

    setLoading(true);

    try {
      // Gerar prompt sistema padrão
      const promptSistema = `Você é ${formData.nome_agente}, assistente virtual do escritório ${formData.nome_escritorio}.

Sua função é atender potenciais clientes via WhatsApp de forma profissional, cordial e eficiente.

INSTRUÇÕES:
1. Cumprimente o cliente de forma acolhedora
2. Identifique a necessidade jurídica dele
3. Faça perguntas para qualificar o caso
4. Colete dados essenciais: nome completo, telefone, email
5. Explique brevemente como podemos ajudar
6. Encaminhe casos qualificados para a equipe jurídica

IMPORTANTE:
- Seja sempre educado e profissional
- Use linguagem clara e acessível
- Não dê orientações jurídicas específicas
- Foque em entender e qualificar o caso
- Mantenha o tom acolhedor do ${formData.nome_escritorio}`;

      // Criar cliente via API
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_cliente: formData.nome_cliente,
          nome_escritorio: formData.nome_escritorio,
          nome_agente: formData.nome_agente,
          nome_instancia: formData.nome_instancia,
          numero_whatsapp: formData.numero_whatsapp || null,
          email: formData.email || null,
          prompt_sistema: promptSistema,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar cliente');
      }

      const data = await response.json();
      console.log('✅ Cliente criado:', data);

      // Criar instância na UAZAPI
      const responseUazapi = await fetch('/api/uazapi/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: data.cliente.id,
          nomeInstancia: data.cliente.nome_instancia,
        }),
      });

      const dataUazapi = await responseUazapi.json();

      if (!responseUazapi.ok) {
        console.error('❌ Erro na UAZAPI:', dataUazapi);
        toast.warning(`Cliente criado, mas erro ao criar instância na UAZAPI. Você pode tentar conectar manualmente depois.`);
      } else {
        console.log('✅ Instância criada na UAZAPI');
      }

      // Se tiver convite, mostrar modal
      if (data.convite) {
        setConviteData(data.convite);
        setShowConviteModal(true);
        toast.success('Cliente criado com sucesso! Link de convite gerado.');
      } else {
        toast.success('Cliente criado com sucesso!');
        router.push('/dashboard/clientes');
      }

    } catch (error: any) {
      console.error('❌ Erro:', error);
      toast.error(error.message || 'Erro ao criar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowConviteModal(false);
    router.push('/dashboard/clientes');
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Novo Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome do Cliente */}
            <div>
              <Label htmlFor="nome_cliente">
                Nome do Cliente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome_cliente"
                name="nome_cliente"
                value={formData.nome_cliente}
                onChange={handleNomeClienteChange}
                placeholder="Ex: Advocacia Silva Rocha"
                required
                disabled={loading}
              />
            </div>

            {/* Nome da Instância (auto-gerado, editável) */}
            <div>
              <Label htmlFor="nome_instancia">
                Nome da Instância <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome_instancia"
                name="nome_instancia"
                value={formData.nome_instancia}
                onChange={handleChange}
                placeholder="silvarocha (gerado automaticamente)"
                required
                disabled={loading}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Apenas letras minúsculas, números e hífen. Este nome será usado no WhatsApp.
              </p>
            </div>

            {/* Nome do Escritório */}
            <div>
              <Label htmlFor="nome_escritorio">
                Nome do Escritório <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome_escritorio"
                name="nome_escritorio"
                value={formData.nome_escritorio}
                onChange={handleChange}
                placeholder="Ex: Silva Rocha Advogados"
                required
                disabled={loading}
              />
            </div>

            {/* Nome do Agente */}
            <div>
              <Label htmlFor="nome_agente">
                Nome do Agente (IA) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome_agente"
                name="nome_agente"
                value={formData.nome_agente}
                onChange={handleChange}
                placeholder="Ex: Júlia"
                required
                disabled={loading}
              />
            </div>

            {/* WhatsApp (opcional) */}
            <div>
              <Label htmlFor="numero_whatsapp">WhatsApp</Label>
              <Input
                id="numero_whatsapp"
                name="numero_whatsapp"
                value={formData.numero_whatsapp}
                onChange={handleChange}
                placeholder="5511999999999"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Apenas números, com DDI e DDD
              </p>
            </div>

            {/* Email (opcional) */}
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contato@escritorio.com.br"
                disabled={loading}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Cliente'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>

            {/* Aviso de criação */}
            {loading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-medium">Aguarde...</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Criando cliente no banco de dados</li>
                  <li>Criando instância WhatsApp na UAZAPI</li>
                  <li>Configurando webhooks</li>
                </ul>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Modal de Convite */}
      {showConviteModal && conviteData && (
        <ConviteModal
          isOpen={showConviteModal}
          onClose={handleCloseModal}
          convite={conviteData}
          nomeCliente={formData.nome_cliente}
        />
      )}
    </div>
  );
}