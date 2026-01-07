# 📝 Estrutura da Geração de Prompt

## Como Funciona

A geração do prompt acontece em **3 etapas**:

### 1️⃣ Usuário Seleciona Templates
Na tela de configuração (`/dashboard/clientes/[id]/configurar`), o usuário:
- Preenche nome do escritório
- Preenche nome do agente
- Seleciona os templates (áreas de atuação)

### 2️⃣ Frontend Chama API
Quando clica em "Gerar Prompt":
- **[components/clientes/prompt-editor.tsx](components/clientes/prompt-editor.tsx#L49-L108)** - Função `handleGerarPrompt()`
- Chama `POST /api/clientes/[id]/gerar-prompt`

### 3️⃣ API Executa Function do Banco
- **[app/api/clientes/[id]/gerar-prompt/route.ts](app/api/clientes/[id]/gerar-prompt/route.ts#L44-L48)**
- Chama `promptQueries.gerar(clienteId, nome_escritorio, nome_agente)`
- **[lib/supabase-queries.ts](lib/supabase-queries.ts#L638-L648)** - Faz RPC para function SQL

---

## 🗃️ Campos Usados na Montagem

Baseado nos tipos TypeScript, a function `gerar_prompt_cliente` usa os seguintes dados:

### Tabela `clientes`
```typescript
{
  id: string,                    // ID do cliente
  nome_escritorio: string,       // Ex: "Silva & Associados"
  nome_agente: string,           // Ex: "Julia"
  // Estes são PASSADOS como parâmetros para a function
}
```

### Tabela `templates` (via `clientes_templates`)
Para cada template selecionado pelo cliente, usa:

```typescript
{
  nome_template: string,              // Ex: "FGTS"
  area_atuacao: string,              // Ex: "Direito Trabalhista"
  descricao: string | null,          // Descrição do template
  keywords: string,                  // Keywords separadas por \n
  pitch_inicial: string,             // Mensagem inicial do bot
  perguntas_qualificacao: string,    // Perguntas separadas por \n
  validacao_proposta: string,        // Como validar o caso
  mensagem_desqualificacao: string | null, // O que dizer quando desqualificar
}
```

---

## 📋 Estrutura Provável do Prompt Gerado

Baseado nos campos disponíveis, a function provavelmente monta um prompt assim:

```
Você é [nome_agente], assistente virtual do [nome_escritorio].

Sua função é atender potenciais clientes via WhatsApp de forma profissional, cordial e eficiente.

ÁREAS DE ATUAÇÃO:
[Para cada template selecionado:]
- [area_atuacao]: [nome_template]
  [descricao]

KEYWORDS A IDENTIFICAR:
[Todos os keywords de todos os templates, separados por vírgula ou linha]

INSTRUÇÕES DE ATENDIMENTO:

1. PITCH INICIAL:
[Para cada template:]
   - [nome_template]: [pitch_inicial]

2. PERGUNTAS DE QUALIFICAÇÃO:
[Para cada template:]
   [nome_template]:
   [perguntas_qualificacao - cada uma em uma linha]

3. VALIDAÇÃO DA PROPOSTA:
[Para cada template:]
   - [nome_template]: [validacao_proposta]

4. MENSAGENS DE DESQUALIFICAÇÃO:
[Para cada template que tenha mensagem_desqualificacao:]
   - [nome_template]: [mensagem_desqualificacao]

IMPORTANTE:
- Seja sempre educado e profissional
- Use linguagem clara e acessível
- Não dê orientações jurídicas específicas
- Foque em entender e qualificar o caso
- Mantenha o tom acolhedor do [nome_escritorio]
```

---

## 🔍 Como Verificar o Prompt Real

Para ver exatamente como a function monta o prompt, você precisa:

### Opção 1: Via Supabase Dashboard
1. Acesse: https://supabase.com/dashboard/project/[seu-projeto]
2. Vá em **Database** → **Functions**
3. Procure por: `gerar_prompt_cliente`
4. Veja o código SQL

### Opção 2: Via SQL Editor
Execute no SQL Editor do Supabase:

```sql
-- Ver definição da function
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'gerar_prompt_cliente';
```

### Opção 3: Testar e Ver Resultado
No Supabase SQL Editor:

```sql
-- Testar a function com um cliente existente
SELECT gerar_prompt_cliente(
  '[UUID_DO_CLIENTE]'::uuid,
  'Meu Escritório Teste',
  'Maria'
);
```

---

## 📊 Relação entre Tabelas

```
clientes
  ├── id (usado como p_cliente_id)
  ├── nome_escritorio (parâmetro p_nome_escritorio)
  └── nome_agente (parâmetro p_nome_agente)

clientes_templates
  ├── cliente_id (FK → clientes.id)
  └── template_id (FK → templates.id)

templates
  ├── id
  ├── nome_template
  ├── area_atuacao
  ├── descricao
  ├── keywords
  ├── pitch_inicial
  ├── perguntas_qualificacao
  ├── validacao_proposta
  └── mensagem_desqualificacao
```

A function faz um JOIN entre estas tabelas para pegar todos os templates do cliente e montar o prompt.

---

## 🛠️ Para Modificar a Geração

Se você quiser mudar **como** o prompt é montado:

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Encontre e edite a function `gerar_prompt_cliente`
4. Ou crie uma nova function com outro nome

**Exemplo de alteração**:
```sql
CREATE OR REPLACE FUNCTION gerar_prompt_cliente_v2(
  p_cliente_id uuid,
  p_nome_escritorio text,
  p_nome_agente text
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_prompt text;
  v_template record;
BEGIN
  -- Montar cabeçalho
  v_prompt := format('Você é %s, assistente do %s.\n\n', p_nome_agente, p_nome_escritorio);

  -- Adicionar cada template
  FOR v_template IN
    SELECT t.*
    FROM templates t
    INNER JOIN clientes_templates ct ON t.id = ct.template_id
    WHERE ct.cliente_id = p_cliente_id
    AND t.ativo = true
  LOOP
    v_prompt := v_prompt || format('\n--- %s ---\n', v_template.nome_template);
    v_prompt := v_prompt || v_template.pitch_inicial || '\n';
    -- etc...
  END LOOP;

  RETURN v_prompt;
END;
$$;
```

---

**Data**: 2025-12-20
**Arquivos relacionados**:
- [lib/types.ts](lib/types.ts#L93-L107) - Definição do tipo Template
- [lib/supabase-queries.ts](lib/supabase-queries.ts#L638-L648) - Query que chama a function
- [app/api/clientes/[id]/gerar-prompt/route.ts](app/api/clientes/[id]/gerar-prompt/route.ts) - Endpoint da API
