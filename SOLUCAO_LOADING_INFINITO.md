# Solução Definitiva: Loading Infinito ao Trocar de Abas

## 🔍 Problema Identificado

Quando o usuário trocava de abas do navegador e voltava para o sistema, a página ficava eternamente em loading ("Carregando...") sem mostrar o conteúdo.

### Diagnóstico Realizado

Através de logs detalhados, identificamos que:

1. **Evento SIGNED_IN disparado indevidamente**: Quando a aba voltava a ficar visível, o Supabase disparava o evento `SIGNED_IN`
2. **Chamada getUser() travando**: Isso triggava `loadUsuario()` que chamava `supabase.auth.getUser()`, que **nunca retornava**
3. **Loading state preso**: Com `loadingRef: true` permanentemente, a página ficava eternamente carregando

## ✅ Correções Implementadas

### 1. Ignorar Eventos Desnecessários

**Arquivo**: `providers/AuthProvider.tsx`

```typescript
// Ignorar eventos de TOKEN_REFRESHED e INITIAL_SESSION
if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
  console.log('⏭️ [AUTH PROVIDER] Ignorando', event);
  return;
}
```

**Por quê**: Esses eventos não requerem recarregar os dados do usuário.

### 2. Verificar Usuário Já Carregado (usando Ref)

```typescript
// Criar ref para rastrear usuário carregado
const usuarioLoadedRef = useRef(false);

// No callback do onAuthStateChange
if (event === 'SIGNED_IN' && session) {
  // Só recarregar se ainda não temos um usuário carregado
  // Usa ref ao invés de state pois o state pode estar desatualizado no callback
  if (!usuarioLoadedRef.current) {
    console.log('✅ [AUTH PROVIDER] SIGNED_IN (novo login) - carregando usuário');
    await loadUsuario();
  } else {
    console.log('⏭️ [AUTH PROVIDER] SIGNED_IN ignorado - usuário já carregado');
  }
}

// Quando usuário é carregado com sucesso
usuarioLoadedRef.current = true;

// Quando usuário é deslogado ou há erro
usuarioLoadedRef.current = false;
```

**Por quê**:
- Evita recarregar desnecessariamente quando o usuário JÁ está autenticado e a aba volta a ficar visível
- **Usa `ref` ao invés de `state`** porque o state pode estar desatualizado no closure do callback
- A ref garante que sempre teremos o valor mais atual, independente de quando o callback foi criado

### 3. Timeout em getUser()

```typescript
const getUserPromise = supabase.auth.getUser();
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout ao buscar usuário')), 10000)
);

const { data: { user: authUser }, error: sessionError } = await Promise.race([
  getUserPromise,
  timeoutPromise
]) as Awaited<ReturnType<typeof supabase.auth.getUser>>;
```

**Por quê**: Se `getUser()` travar por algum motivo, o timeout de 10 segundos garante que não ficará preso para sempre.

### 4. Proteção contra React Strict Mode

```typescript
const isMountedRef = useRef(true);

// No cleanup:
return () => {
  isMountedRef.current = false;
  loadingRef.current = false;
};

// Antes de qualquer setState:
if (isMountedRef.current) {
  setLoading(false);
}
```

**Por quê**: React 18 Strict Mode monta/desmonta componentes duas vezes. Isso previne chamadas de setState em componentes desmontados.

### 5. Garantir setLoading(false) em Todos os Caminhos

```typescript
if (!authUser) {
  if (isMountedRef.current) {
    setUser(null);
    setUsuario(null);
    setPermissoes(null);
    setLoading(false);  // ✅ CRÍTICO
  }
  loadingRef.current = false;  // ✅ CRÍTICO
  return;
}
```

**Por quê**: Early returns anteriormente NÃO resetavam o loading, deixando a página presa.

## 🎯 Fluxo Correto Agora

### Primeiro Acesso
1. ✅ Componente monta
2. ✅ `loadUsuario()` executa
3. ✅ `getUser()` retorna os dados
4. ✅ Usuário carregado
5. ✅ `setLoading(false)` - conteúdo aparece

### Troca de Aba
1. ✅ Usuário troca de aba (página fica oculta)
2. ✅ Usuário volta para a aba do sistema
3. ✅ Supabase dispara evento `SIGNED_IN`
4. ✅ AuthProvider verifica: "já tenho usuário carregado?"
5. ✅ Como SIM, **ignora o evento** e NÃO recarrega
6. ✅ Página continua funcionando normalmente

### Login Real
1. ✅ Usuário faz login
2. ✅ Supabase dispara `SIGNED_IN`
3. ✅ AuthProvider verifica: "já tenho usuário?"
4. ✅ Como NÃO, **executa loadUsuario()**
5. ✅ Dados carregados corretamente

## 🧪 Como Testar

1. **Reload a página** e aguarde o loading inicial
2. **Troque para outra aba** do navegador
3. **Aguarde 10 segundos**
4. **Volte para a aba do sistema**
5. ✅ **Resultado esperado**: Conteúdo aparece normalmente, SEM loading infinito

## 📊 Logs Importantes

### ✅ Comportamento CORRETO (esperado):
```
👁️ [AUTH PROVIDER] Visibilidade mudou: VISÍVEL
🔔 [AUTH PROVIDER] Auth event: SIGNED_IN
⏭️ [AUTH PROVIDER] SIGNED_IN ignorado - usuário já carregado
```

### ❌ Comportamento INCORRETO (antigo - NÃO deve mais acontecer):
```
👁️ [AUTH PROVIDER] Visibilidade mudou: VISÍVEL
🔔 [AUTH PROVIDER] Auth event: SIGNED_IN
✅ [AUTH PROVIDER] SIGNED_IN - recarregando usuário
🔄 [AUTH PROVIDER] Iniciando loadUsuario...
🔍 [AUTH PROVIDER] Chamando supabase.auth.getUser()...
[TRAVA AQUI - NUNCA RETORNA]
```

## 🔧 Arquivos Modificados

- ✅ `providers/AuthProvider.tsx` - Correções principais
- ✅ `components/auth/ProtegerRota.tsx` - Logs de diagnóstico
- ✅ `app/dashboard/clientes/page.tsx` - Migrado para useAuth
- ✅ `app/dashboard/usuarios/page.tsx` - Migrado para useAuth
- ✅ `components/layout/DashboardHeader.tsx` - Migrado para useAuth
- ✅ `components/layout/DashboardSidebar.tsx` - Migrado para useAuth
- ✅ `app/dashboard/page.tsx` - Corrigido query de logs

## 📝 Próximos Passos

Após confirmar que o problema está resolvido:

1. **Remover logs de diagnóstico** - Os console.logs detalhados podem ser reduzidos
2. **Monitorar produção** - Verificar se não há outros casos de edge
3. **Documentar no código** - Adicionar comentários sobre os eventos do Supabase

## 💡 Lições Aprendidas

1. **Supabase auth events** disparam em situações além de login/logout (ex: visibilidade da aba)
2. **Promise.race** é útil para adicionar timeouts em chamadas que podem travar
3. **Loading state management** precisa ser gerenciado em TODOS os caminhos (success, error, early return)
4. **React Strict Mode** requer proteção com refs para evitar setState em componentes desmontados
5. **Diagnóstico sistemático** com logs detalhados é essencial para problemas complexos
