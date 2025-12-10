# Correção: Loading Infinito ao Trocar de Abas

## Problema Identificado

Ao trocar entre abas do navegador ou alternar entre aplicações, a página ficava em estado de "Carregando..." infinitamente.

## Causa Raiz

O problema estava em **2 lugares principais:**

### 1. Hook `useAuthWithPermissions` ([hooks/useAuthWithPermissions.ts](hooks/useAuthWithPermissions.ts))

**Problema:** O Supabase Auth dispara o evento `TOKEN_REFRESHED` automaticamente quando a aba volta a ficar ativa. Isso fazia o hook executar `loadUsuario()` novamente, colocando a aplicação em estado de loading.

**Solução:**
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event: any, session: any) => {
    // Ignorar eventos de TOKEN_REFRESHED para evitar re-loads desnecessários
    if (event === 'TOKEN_REFRESHED') {
      return;
    }

    if (event === 'SIGNED_IN' && session) {
      await loadUsuario();
    } else if (event === 'SIGNED_OUT') {
      setUser(null);
      setUsuario(null);
      setPermissoes(null);
    }
  }
);
```

### 2. Dashboard Page ([app/dashboard/page.tsx](app/dashboard/page.tsx))

**Problema:** O handler de `visibilitychange` verificava `!loading` antes de chamar `loadDashboardData()`. Isso criava uma condição de corrida onde o estado de loading poderia impedir a atualização.

**Solução:**
```typescript
const handleVisibilityChange = () => {
  // Página ficou ativa - atualizar dados (sem verificar loading)
  if (!document.hidden) {
    loadDashboardData();
  }
};
```

## Melhorias Adicionais

### Proteção contra chamadas simultâneas

No `useAuthWithPermissions`, já existia uma proteção com `loadingRef`, mas adicionamos um log para debug:

```typescript
async function loadUsuario() {
  // Evitar múltiplas chamadas simultâneas
  if (loadingRef.current) {
    console.log('⏸️ [AUTH] loadUsuario já está em execução, ignorando');
    return;
  }
  // ...
}
```

## Comportamento Esperado Após Correção

✅ **Trocar de aba:** Aplicação deve atualizar dados automaticamente quando volta a ficar ativa, **sem** ficar em loading infinito

✅ **Minimizar/Maximizar janela:** Mesmo comportamento - atualização automática sem travamento

✅ **Token refresh do Supabase:** Acontece silenciosamente em background sem causar re-render ou loading

✅ **Login/Logout:** Continua funcionando normalmente

## Arquivos Modificados

1. **hooks/useAuthWithPermissions.ts** (linha 26-29)
   - Adiciona ignorar evento `TOKEN_REFRESHED`

2. **app/dashboard/page.tsx** (linha 47-52)
   - Remove verificação de `!loading` no handler de visibilitychange

## Como Testar

1. **Teste básico:**
   - Faça login no sistema
   - Navegue até o Dashboard
   - Troque para outra aba do navegador
   - Volte para a aba do sistema
   - **Esperado:** Dashboard deve atualizar os dados e mostrar o conteúdo normalmente

2. **Teste de clientes:**
   - Navegue até a página de Clientes
   - Troque de aba
   - Volte
   - **Esperado:** Lista de clientes deve estar visível (não em loading infinito)

3. **Teste de QR Code:**
   - Abra um cliente específico
   - Clique em "Conectar WhatsApp"
   - QR Code aparece
   - Troque de aba (polling é pausado)
   - Volte (polling é retomado)
   - **Esperado:** QR Code continua visível e polling funciona normalmente

## Eventos do Supabase Auth

Para referência, os eventos que o Supabase Auth pode disparar:

- `SIGNED_IN` - Quando faz login
- `SIGNED_OUT` - Quando faz logout
- `TOKEN_REFRESHED` - Quando o token é renovado (automaticamente a cada ~1 hora ou quando aba volta a ficar ativa)
- `USER_UPDATED` - Quando dados do usuário são atualizados
- `PASSWORD_RECOVERY` - Quando inicia recuperação de senha

**Importante:** Agora ignoramos `TOKEN_REFRESHED` para evitar re-loads desnecessários.

## Debug

Se o problema voltar, verifique o console para:

```
⏸️ [AUTH] loadUsuario já está em execução, ignorando
```

Se essa mensagem aparecer múltiplas vezes seguidas, significa que há múltiplas tentativas de carregar o usuário simultaneamente.

## Outros Hooks com Detecção de Visibilidade

O hook `useInstanceConnection` também usa detecção de visibilidade, mas está implementado corretamente:
- Pausa o polling quando a página fica inativa (economia de recursos)
- Retoma o polling apenas se estiver em estado `waiting` ou `connecting`
- **Não causa loading infinito** porque não mexe no estado de loading da página

## Conclusão

As correções implementadas resolvem o problema de loading infinito ao trocar de abas, mantendo a funcionalidade de atualização automática quando a aba volta a ficar ativa.
