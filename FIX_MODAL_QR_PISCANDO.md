# 🔧 Fix: Modal QR Code Piscando

## 🐛 Problema Reportado

Ao gerar o QR Code para conectar WhatsApp, o modal ficava **piscando** na tela de forma estranha.

## 🔍 Causa Raiz Identificada

O problema tinha **3 causas** principais:

### 1. Listener de Visibilidade Duplicado
**Arquivo**: `components/whatsapp/hooks/useInstanceConnection.ts`

O hook tinha um listener de `visibilitychange` que **recriava o polling** toda vez que a página voltava a ficar visível, mesmo que o polling já estivesse rodando.

```typescript
// ❌ ANTES (linha 294)
} else if (state === 'waiting' || state === 'connecting') {
  // Sempre recriava o polling quando voltava para a aba
  pollingIntervalRef.current = setInterval(async () => {
    // ...
  }, POLLING_INTERVAL);
}

// ✅ DEPOIS
} else if ((state === 'waiting' || state === 'connecting') && !pollingIntervalRef.current) {
  // Só recria se NÃO estiver rodando
  pollingIntervalRef.current = setInterval(async () => {
    // ...
  }, POLLING_INTERVAL);
}
```

### 2. Effect Iniciando Conexão Múltiplas Vezes
**Arquivo**: `components/whatsapp/qrcode-modal.tsx`

O effect que inicia a conexão quando o modal abre podia ser executado múltiplas vezes.

```typescript
// ❌ ANTES (linha 59-64)
useEffect(() => {
  if (isOpen && state === 'idle') {
    console.log('🚀 [MODAL] Modal aberto, iniciando conexão...');
    startConnection(); // Podia executar múltiplas vezes!
  }
}, [isOpen, state, startConnection]);

// ✅ DEPOIS
const hasStartedRef = React.useRef(false);

useEffect(() => {
  if (isOpen && state === 'idle' && !hasStartedRef.current) {
    console.log('🚀 [MODAL] Modal aberto, iniciando conexão...');
    hasStartedRef.current = true;
    startConnection();
  }

  // Reset quando fechar
  if (!isOpen) {
    hasStartedRef.current = false;
  }
}, [isOpen, state, startConnection]);
```

### 3. Re-renderizações Desnecessárias
**Arquivo**: `components/whatsapp/qrcode-modal.tsx`

O componente modal não estava memoizado, causando re-renderizações toda vez que o componente pai atualizava.

```typescript
// ❌ ANTES
export function QRCodeModal({ ... }: QRCodeModalProps) {
  // ...
}

// ✅ DEPOIS
const QRCodeModalComponent = ({ ... }: QRCodeModalProps) => {
  // ...
};

export const QRCodeModal = React.memo(QRCodeModalComponent);
```

## ✅ Correções Implementadas

### Correção 1: Verificar se Polling Já Existe
**Arquivo**: `components/whatsapp/hooks/useInstanceConnection.ts:294`

Adicionada verificação `&& !pollingIntervalRef.current` para evitar criar múltiplos intervals.

### Correção 2: Ref para Controlar Início da Conexão
**Arquivo**: `components/whatsapp/qrcode-modal.tsx:60-73`

Adicionado `hasStartedRef` para garantir que `startConnection()` só é chamado uma vez por abertura do modal.

### Correção 3: Memoização do Componente
**Arquivo**: `components/whatsapp/qrcode-modal.tsx:304`

Componente agora é exportado usando `React.memo()` para evitar re-renderizações desnecessárias.

### Correção 4: Otimização de Performance
**Arquivo**: `components/whatsapp/qrcode-modal.tsx:99-100`

Adicionado `willChange` CSS para otimizar animações do navegador.

## 🎯 Resultado Esperado

Após essas correções, o modal deve:

✅ **Abrir suavemente** sem piscar
✅ **Manter estado estável** durante toda a conexão
✅ **Não re-renderizar** desnecessariamente
✅ **Não criar múltiplos pollings** quando troca de aba
✅ **Performance melhorada** com will-change CSS

## 🧪 Como Testar

1. Acesse a página de Clientes
2. Clique em "Conectar WhatsApp" em algum cliente
3. **Verificar**: Modal deve abrir sem piscar
4. Aguarde o QR Code aparecer
5. **Verificar**: QR Code deve aparecer de forma estável
6. Troque de aba do navegador
7. Volte para a aba do sistema
8. **Verificar**: Modal deve continuar estável, sem piscar ou re-renderizar

## 📊 Arquivos Modificados

- ✅ `components/whatsapp/hooks/useInstanceConnection.ts` - Correção do listener de visibilidade
- ✅ `components/whatsapp/qrcode-modal.tsx` - Ref de controle, memoização e otimizações
- ✅ `FIX_MODAL_QR_PISCANDO.md` - Este arquivo de documentação

## 🔗 Relação com Fix Anterior

Este fix **complementa** o fix anterior de loading infinito:

- **Fix Loading**: Evita reload desnecessário do AuthProvider ao trocar de aba
- **Fix Modal QR**: Evita recreação de polling e re-renderizações do modal ao trocar de aba

Ambos usam o conceito de **refs** para manter valores estáveis que não sofrem de closure issues.

---

**Data**: 2025-12-10
**Status**: ✅ CORRIGIDO
**Testado**: ⏳ Pendente teste do usuário
