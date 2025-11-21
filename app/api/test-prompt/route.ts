// app/api/test-prompt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { clienteId, mensagem } = await request.json();

    // Validações
    if (!clienteId || !mensagem) {
      return NextResponse.json(
        { error: 'clienteId e mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar cliente no banco
    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .single();

    if (error || !cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Gerar resposta mockada (simulando IA)
    const resposta = await gerarRespostaMock(mensagem, cliente.prompt_sistema);

    // Retornar resposta
    return NextResponse.json({
      success: true,
      resposta,
      metadata: {
        modelo: 'mock-gpt-4',
        temperatura: 0.7,
        tokens: Math.floor(Math.random() * 200) + 50,
        tempo_ms: Math.floor(Math.random() * 1000) + 500,
      },
    });
  } catch (error: any) {
    console.error('Erro ao processar teste:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar teste' },
      { status: 500 }
    );
  }
}

// Função que simula resposta de IA
async function gerarRespostaMock(mensagem: string, prompt: string): Promise<string> {
  // Simula delay de API (500ms - 1.5s)
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500));

  const mensagemLower = mensagem.toLowerCase();

  // Respostas contextuais baseadas na mensagem
  if (mensagemLower.includes('olá') || mensagemLower.includes('oi') || mensagemLower.includes('bom dia')) {
    return 'Olá! Bem-vindo ao nosso escritório. Como posso ajudá-lo hoje? Estou aqui para responder suas dúvidas jurídicas e agendar consultas.';
  }

  if (mensagemLower.includes('preço') || mensagemLower.includes('custo') || mensagemLower.includes('quanto custa')) {
    return 'Os valores variam conforme a complexidade do caso. Para uma análise precisa e orçamento personalizado, recomendo agendar uma consulta inicial. Posso te ajudar com isso agora mesmo!';
  }

  if (mensagemLower.includes('horário') || mensagemLower.includes('funciona')) {
    return 'Nosso escritório funciona de segunda a sexta, das 9h às 18h. Atendemos também por agendamento. Gostaria de marcar um horário?';
  }

  if (mensagemLower.includes('agendar') || mensagemLower.includes('consulta') || mensagemLower.includes('reunião')) {
    return 'Ótimo! Para agendar uma consulta, preciso de algumas informações: Qual seria sua disponibilidade de horário? E poderia me contar brevemente sobre seu caso?';
  }

  if (mensagemLower.includes('trabalhista') || mensagemLower.includes('trabalho')) {
    return 'Sim, temos expertise em Direito Trabalhista. Atendemos casos de rescisão, horas extras, danos morais, acidentes de trabalho e muito mais. Gostaria de agendar uma análise do seu caso?';
  }

  if (mensagemLower.includes('família') || mensagemLower.includes('divórcio') || mensagemLower.includes('pensão')) {
    return 'Atuamos em Direito de Família, incluindo divórcios, pensão alimentícia, guarda de filhos e partilha de bens. Nosso objetivo é resolver seu caso com rapidez e segurança jurídica. Posso agendar uma conversa?';
  }

  if (mensagemLower.includes('civil') || mensagemLower.includes('contrato')) {
    return 'Atendemos diversas questões de Direito Civil, como contratos, indenizações, questões imobiliárias e mais. Para avaliar seu caso específico, recomendo uma consulta. Posso te ajudar a agendar?';
  }

  if (mensagemLower.includes('criminal') || mensagemLower.includes('penal')) {
    return 'Prestamos assistência em Direito Criminal/Penal, defendendo seus direitos em todas as fases do processo. Cada caso requer análise específica. Vamos agendar uma consulta?';
  }

  if (mensagemLower.includes('obrigado') || mensagemLower.includes('obrigada')) {
    return 'Por nada! Fico feliz em ajudar. Se precisar de mais alguma coisa ou quiser agendar uma consulta, é só me chamar. Estamos à disposição!';
  }

  // Resposta genérica
  return `Entendo sua questão sobre "${mensagem}". Para te ajudar da melhor forma possível, recomendo que agendemos uma consulta para analisarmos seu caso detalhadamente. Nosso escritório está à disposição para esclarecer todas suas dúvidas. Posso te ajudar a marcar um horário?`;
}