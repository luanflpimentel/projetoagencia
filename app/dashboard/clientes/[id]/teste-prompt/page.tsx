'use client';

// app/dashboard/clientes/[id]/teste-prompt/page.tsx
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Send, Trash2, Bot, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface Cliente {
  id: string;
  nome_cliente: string;
  nome_escritorio: string;
  nome_agente: string;
  prompt_sistema: string;
}

export default function TestePromptPage() {
  const router = useRouter();
  const params = useParams(); // CORRIGIDO: useParams() em vez de receber params
  const clienteId = params.id as string; // CORRIGIDO: Extrair id dos params
  
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [promptExpanded, setPromptExpanded] = useState(false);

  // Buscar dados do cliente
  useEffect(() => {
    async function buscarCliente() {
      try {
        console.log('Buscando cliente com ID:', clienteId); // Debug
        
        const response = await fetch(`/api/clientes/${clienteId}`);
        if (!response.ok) throw new Error('Cliente não encontrado');
        
        const data = await response.json();
        setCliente(data);

        // Adicionar mensagem inicial do sistema
        setMensagens([
          {
            id: '0',
            role: 'system',
            content: `Olá! Sou o ${data.nome_agente}, assistente virtual do ${data.nome_escritorio}. Como posso ajudar você hoje?`,
            timestamp: new Date(),
          },
        ]);
      } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        alert('Erro ao carregar dados do cliente');
      } finally {
        setLoading(false);
      }
    }

    if (clienteId) {
      buscarCliente();
    }
  }, [clienteId]);

  // Enviar mensagem
  async function enviarMensagem() {
    if (!mensagem.trim() || enviando || !cliente) return;

    const novaMensagemUser: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: mensagem,
      timestamp: new Date(),
    };

    setMensagens((prev) => [...prev, novaMensagemUser]);
    setMensagem('');
    setEnviando(true);

    try {
      const response = await fetch('/api/test-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: cliente.id,
          mensagem: mensagem,
        }),
      });

      if (!response.ok) throw new Error('Erro ao enviar mensagem');

      const data = await response.json();

      const novaMensagemAssistant: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.resposta,
        timestamp: new Date(),
      };

      setMensagens((prev) => [...prev, novaMensagemAssistant]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao processar mensagem');
    } finally {
      setEnviando(false);
    }
  }

  // Limpar conversa
  function limparConversa() {
    if (!cliente) return;
    setMensagens([
      {
        id: '0',
        role: 'system',
        content: `Olá! Sou o ${cliente.nome_agente}, assistente virtual do ${cliente.nome_escritorio}. Como posso ajudar você hoje?`,
        timestamp: new Date(),
      },
    ]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Cliente não encontrado</CardTitle>
            <CardDescription>Não foi possível carregar os dados do cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard/clientes')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/clientes')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Teste de Prompt</h1>
            <p className="text-gray-600 mt-1">
              Cliente: {cliente.nome_cliente} ({cliente.nome_escritorio})
            </p>
          </div>
          <Button variant="outline" onClick={limparConversa}>
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Conversa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Prompt */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Prompt do Sistema</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPromptExpanded(!promptExpanded)}
                >
                  {promptExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CardTitle>
              <CardDescription>Instruções para o assistente</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`text-sm text-gray-700 whitespace-pre-wrap ${
                  promptExpanded ? '' : 'line-clamp-6'
                }`}
              >
                {cliente.prompt_sistema}
              </div>
            </CardContent>
          </Card>

          {/* Info do Agente */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Nome do Agente:</span>
                <p className="text-gray-700">{cliente.nome_agente}</p>
              </div>
              <div>
                <span className="font-semibold">Escritório:</span>
                <p className="text-gray-700">{cliente.nome_escritorio}</p>
              </div>
              <div>
                <span className="font-semibold">Modelo:</span>
                <p className="text-gray-700 text-xs">Mock GPT-4 (simulado)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Chat */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle>Conversa de Teste</CardTitle>
              <CardDescription>
                Teste diferentes mensagens para validar o comportamento do assistente
              </CardDescription>
            </CardHeader>

            {/* Área de Mensagens */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {mensagens.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex items-start gap-3 max-w-[80%] ${
                        msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          msg.role === 'user'
                            ? 'bg-blue-600'
                            : msg.role === 'assistant'
                            ? 'bg-green-600'
                            : 'bg-gray-600'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <User className="w-5 h-5 text-white" />
                        ) : (
                          <Bot className="w-5 h-5 text-white" />
                        )}
                      </div>

                      {/* Mensagem */}
                      <div>
                        <div
                          className={`rounded-lg p-3 ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : msg.role === 'assistant'
                              ? 'bg-gray-100 text-gray-900'
                              : 'bg-green-50 text-gray-900 border border-green-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 px-1">
                          {msg.timestamp.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Indicador de digitação */}
                {enviando && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-3 max-w-[80%]">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: '0.2s' }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: '0.4s' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input de Mensagem */}
            <CardContent className="border-t pt-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  enviarMensagem();
                }}
                className="flex gap-2"
              >
                <Input
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  disabled={enviando}
                  className="flex-1"
                />
                <Button type="submit" disabled={enviando || !mensagem.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}