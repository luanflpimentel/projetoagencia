# 🚨 EXECUTAR MIGRATION AGORA

## ⚠️ IMPORTANTE: Execute isso ANTES de testar as features!

As features de IA não funcionarão até você executar esta migration no Supabase.

---

## 📋 Passo 1: Copiar SQL

Copie o SQL abaixo:

```sql
-- Adicionar campo para controlar se IA está ativa
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS ia_ativa BOOLEAN DEFAULT true;

-- Adicionar campo para armazenar ID do grupo de avisos (criado na primeira conexão)
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS grupo_avisos_id TEXT;

-- Comentários para documentação
COMMENT ON COLUMN clientes.ia_ativa IS 'Indica se a IA está ativa para responder mensagens (pode ser pausada sem desconectar WhatsApp)';
COMMENT ON COLUMN clientes.grupo_avisos_id IS 'ID do grupo de avisos criado automaticamente na primeira conexão (formato: 120363XXXXX@g.us)';

-- Índice para consultas rápidas de clientes com IA ativa
CREATE INDEX IF NOT EXISTS idx_clientes_ia_ativa ON clientes(ia_ativa) WHERE ia_ativa = true;
```

---

## 📋 Passo 2: Executar no Supabase

### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Cole o SQL acima
6. Clique em **Run** (ou pressione `Ctrl+Enter`)
7. ✅ Deve aparecer "Success. No rows returned"

### Opção B: Via Supabase CLI (Se tiver instalado)

```bash
npx supabase migration up
```

---

## ✅ Como Verificar se Funcionou

### Verificar Colunas Criadas:

Execute esse SQL no Supabase:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clientes'
AND column_name IN ('ia_ativa', 'grupo_avisos_id');
```

**Resultado esperado**:
```
column_name       | data_type | column_default
------------------|-----------|----------------
ia_ativa          | boolean   | true
grupo_avisos_id   | text      | null
```

### Verificar Índice Criado:

```sql
SELECT indexname
FROM pg_indexes
WHERE tablename = 'clientes'
AND indexname = 'idx_clientes_ia_ativa';
```

**Resultado esperado**:
```
indexname
-------------------------
idx_clientes_ia_ativa
```

---

## 🔄 Atualizar Clientes Existentes (Opcional)

Se você já tem clientes criados e quer garantir que todos têm `ia_ativa = true`:

```sql
UPDATE clientes
SET ia_ativa = true
WHERE ia_ativa IS NULL;
```

---

## 🧪 Após Executar a Migration

Agora você pode testar:

1. **Recarregar a página de Clientes**
2. **Conectar um WhatsApp** (para testar criação de grupo)
3. **Clicar no botão de toggle da IA** (deve funcionar sem erro 500)

---

## ❌ Se Der Erro

### Erro: "column 'ia_ativa' already exists"

Isso significa que a migration já foi executada antes. Tudo ok!

### Erro: "permission denied"

Você precisa de permissões de admin no Supabase. Verifique se está logado como owner do projeto.

### Erro: "relation 'clientes' does not exist"

A tabela `clientes` não existe. Verifique se você está no schema correto (`public`).

---

**Status**: ⏳ Aguardando execução
**Após executar**: ✅ Tudo funcionará!
