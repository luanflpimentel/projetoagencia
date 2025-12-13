# 🤖 Implementação de Features da IA

## 🎯 Objetivos

### Feature 1: Criar Grupo de Avisos Automaticamente
Quando o cliente conecta o WhatsApp pela primeira vez, criar automaticamente um grupo chamado **"IA - [nome do escritório] - AVISOS"**.

- ✅ Só cria na primeira conexão
- ✅ Se já foi criado, não cria novamente
- ✅ ID do grupo é salvo no banco de dados

### Feature 2: Toggle para Ativar/Desativar IA
Permitir pausar a IA sem desconectar o WhatsApp, para que o cliente possa fazer ajustes.

- ✅ Botão visível no card do cliente
- ✅ Só aparece quando WhatsApp está conectado
- ✅ Estado salvo no banco de dados

---

## 📊 Mudanças no Banco de Dados

### Migration SQL

**Arquivo**: `supabase/migrations/add_ia_fields_to_clientes.sql`

```sql
-- Adicionar campo para controlar se IA está ativa
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS ia_ativa BOOLEAN DEFAULT true;

-- Adicionar campo para armazenar ID do grupo de avisos
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS grupo_avisos_id TEXT;
```

**Como Executar**:
1. Abra o Supabase Dashboard
2. Vá em SQL Editor
3. Cole e execute a migration
4. Ou use: `npx supabase migration up` (se estiver usando CLI)

### Novos Campos

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `ia_ativa` | BOOLEAN | `true` | Controla se a IA responde mensagens |
| `grupo_avisos_id` | TEXT | `null` | ID do grupo de avisos criado (formato: `120363XXXXX@g.us`) |

---

## 🔧 Arquivos Criados

### 1. API para Criar Grupo

**Arquivo**: `app/api/uazapi/instances/[name]/create-group/route.ts`

**Funcionalidade**:
- Verifica se grupo já foi criado (checando `grupo_avisos_id`)
- Se não foi criado, chama UAZAPI para criar grupo
- Salva `grupo_avisos_id` no banco
- Retorna sucesso com informações do grupo

**Endpoint**: `POST /api/uazapi/instances/{instanceName}/create-group`

**Resposta de Sucesso**:
```json
{
  "success": true,
  "groupId": "120363XXXXX@g.us",
  "groupName": "IA - Nome do Escritório - AVISOS",
  "message": "Grupo de avisos criado com sucesso"
}
```

**Resposta se Já Existe**:
```json
{
  "success": true,
  "groupId": "120363XXXXX@g.us",
  "message": "Grupo já foi criado anteriormente",
  "alreadyExists": true
}
```

### 2. API para Toggle da IA

**Arquivo**: `app/api/clientes/[id]/toggle-ia/route.ts`

**Funcionalidade**:
- Atualiza campo `ia_ativa` no banco
- Registra log da ação
- Retorna novo estado

**Endpoint**: `PATCH /api/clientes/{clienteId}/toggle-ia`

**Payload**:
```json
{
  "ia_ativa": true // ou false
}
```

**Resposta**:
```json
{
  "success": true,
  "ia_ativa": true,
  "message": "IA ativada com sucesso"
}
```

---

## 🎨 Modificações na UI

### Cliente Card

**Arquivo**: `components/clientes/cliente-card.tsx`

**Mudanças**:
1. ✅ Adicionado estado local `iaAtiva`
2. ✅ Adicionada função `handleToggleIA` para chamar a API
3. ✅ Adicionado botão de toggle ao lado do badge de status
4. ✅ Botão só aparece quando WhatsApp está conectado
5. ✅ Visual diferente para IA ativa (azul) vs pausada (cinza)

**Visual do Botão**:
```tsx
{/* IA Ativa */}
<button className="bg-blue-100 text-blue-700">
  <Bot className="h-3.5 w-3.5" />
  <span>IA Ativa</span>
</button>

{/* IA Pausada */}
<button className="bg-gray-100 text-gray-600">
  <BotOff className="h-3.5 w-3.5" />
  <span>IA Pausada</span>
</button>
```

---

## 🔄 Hook de Conexão WhatsApp

### useInstanceConnection

**Arquivo**: `components/whatsapp/hooks/useInstanceConnection.ts`

**Mudanças**:
1. ✅ Adicionada função `createGroupIfNeeded()`
2. ✅ Função chamada automaticamente quando conexão é estabelecida
3. ✅ Proteção: se grupo já existe, não cria novamente
4. ✅ Não falha a conexão se criação do grupo der erro

**Fluxo**:
```
Usuário escaneia QR Code
         ↓
Estado muda para 'connected'
         ↓
createGroupIfNeeded() é chamada
         ↓
API verifica se grupo_avisos_id existe
         ↓
    ├─→ SIM: Retorna "already exists"
    └─→ NÃO: Chama UAZAPI e cria grupo
         ↓
Salva grupo_avisos_id no banco
```

---

## 📝 Tipos TypeScript Atualizados

### Cliente Interface

**Arquivo**: `lib/types.ts`

```typescript
export interface Cliente {
  // ... campos existentes ...
  ia_ativa: boolean; // ✅ NOVO
  grupo_avisos_id?: string | null; // ✅ NOVO
}

export interface VwClienteLista {
  // ... campos existentes ...
  ia_ativa: boolean; // ✅ NOVO
}
```

### TipoEvento

```typescript
export type TipoEvento =
  // ... eventos existentes ...
  | 'grupo_avisos_criado' // ✅ NOVO
  | 'ia_ativada_desativada'; // ✅ NOVO
```

---

## 🧪 Como Testar

### Teste 1: Criar Grupo Automaticamente

1. **Criar novo cliente** ou usar cliente existente sem `grupo_avisos_id`
2. **Desconectar WhatsApp** (se estiver conectado)
3. **Clicar em "Conectar WhatsApp"**
4. **Escanear QR Code**
5. ✅ **Verificar no WhatsApp**: Deve aparecer o grupo "IA - [Nome Escritório] - AVISOS"
6. ✅ **Verificar no console**: Deve mostrar log `"✅ [HOOK] Grupo criado:"`
7. **Desconectar e reconectar novamente**
8. ✅ **Verificar no console**: Deve mostrar `"⏭️ [HOOK] Grupo já existe:"`
9. ✅ **Verificar no WhatsApp**: Não deve criar grupo duplicado

### Teste 2: Toggle da IA

1. **Ir para página de Clientes**
2. **Encontrar cliente conectado**
3. ✅ **Verificar**: Deve aparecer botão "IA Ativa" (azul) ao lado do status
4. **Clicar no botão**
5. ✅ **Verificar**: Botão muda para "IA Pausada" (cinza)
6. ✅ **Recarregar página**
7. ✅ **Verificar**: Estado mantido (continua "IA Pausada")
8. **Clicar novamente**
9. ✅ **Verificar**: Volta para "IA Ativa" (azul)

### Teste 3: Toggle Só Aparece se Conectado

1. **Desconectar WhatsApp** de um cliente
2. ✅ **Verificar**: Botão de toggle da IA **não aparece**
3. **Conectar WhatsApp** novamente
4. ✅ **Verificar**: Botão de toggle da IA **aparece**

---

## 📋 Checklist de Deploy

### Antes do Deploy

- [ ] Executar migration SQL no Supabase
- [ ] Verificar se variáveis de ambiente estão configuradas:
  - `UAZAPI_BASE_URL`
  - `UAZAPI_SECRET_KEY`
- [ ] Testar localmente a criação do grupo
- [ ] Testar localmente o toggle da IA

### Após o Deploy

- [ ] Verificar se migration foi aplicada com sucesso
- [ ] Testar criação de grupo em produção
- [ ] Testar toggle da IA em produção
- [ ] Verificar logs no Supabase para garantir que eventos estão sendo registrados
- [ ] Verificar que grupo não é criado duplicadamente

---

## 🔍 Logs para Monitorar

### Criação de Grupo

```
✅ [HOOK] Grupo criado: IA - Nome Escritório - AVISOS 120363XXXXX@g.us
```

Ou se já existe:
```
⏭️ [HOOK] Grupo já existe: 120363XXXXX@g.us
```

### Toggle IA

```
🤖 [TOGGLE IA] Cliente {id}: ATIVANDO IA
✅ [TOGGLE IA] IA ativada com sucesso
```

```
🤖 [TOGGLE IA] Cliente {id}: DESATIVANDO IA
✅ [TOGGLE IA] IA desativada com sucesso
```

---

## ⚠️ Pontos de Atenção

### 1. Grupo Já Criado Manualmente

Se o cliente já tiver um grupo com o nome "IA - [nome] - AVISOS" criado manualmente, o sistema tentará criar outro.

**Solução**: Se isso acontecer, você pode:
- Deletar o grupo criado automaticamente
- Salvar manualmente o ID do grupo existente no campo `grupo_avisos_id`

### 2. IA Pausada vs WhatsApp Desconectado

- **IA Pausada**: WhatsApp continua conectado, mas IA não responde
- **WhatsApp Desconectado**: Nem WhatsApp nem IA funcionam

Ambos são estados independentes.

### 3. Webhook Deve Respeitar ia_ativa

⚠️ **IMPORTANTE**: O webhook que processa mensagens recebidas deve verificar se `ia_ativa === true` antes de processar com IA.

**Arquivo a modificar**: `app/api/webhooks/uazapi/route.ts`

```typescript
// Verificar se IA está ativa para este cliente
const { data: cliente } = await supabase
  .from('clientes')
  .select('ia_ativa')
  .eq('nome_instancia', instanceName)
  .single();

if (!cliente?.ia_ativa) {
  console.log('⏭️ IA está pausada para este cliente');
  return NextResponse.json({ received: true, processed: false });
}

// Processar com IA...
```

---

## 📚 Documentação da API UAZAPI

### Criar Grupo

**Endpoint**: `POST /instances/{instanceName}/group/create`

**Headers**:
```
Content-Type: application/json
SecretKey: {UAZAPI_SECRET_KEY}
InstanceToken: {instance_token}
```

**Payload**:
```json
{
  "name": "Nome do Grupo",
  "participants": ["5511999999999@s.whatsapp.net"] // Opcional
}
```

**Resposta**:
```json
{
  "groupId": "120363XXXXX@g.us",
  "name": "Nome do Grupo"
}
```

---

**Autor**: Claude Sonnet 4.5
**Data**: 2025-12-10
**Status**: ✅ IMPLEMENTADO - Pendente Teste
