-- DIAGNÓSTICO COMPLETO - Execute no Supabase SQL Editor
-- Este script verifica TUDO relacionado ao Chatwoot

-- ============================================
-- 1. VERIFICAR SE ENUM chatwoot_status_enum EXISTE
-- ============================================
SELECT
  'ENUM chatwoot_status_enum' as verificacao,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_type WHERE typname = 'chatwoot_status_enum'
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE'
  END as status;

-- ============================================
-- 2. LISTAR VALORES DO ENUM (se existir)
-- ============================================
SELECT
  enumlabel as valor,
  enumsortorder as ordem
FROM pg_enum
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'chatwoot_status_enum'
)
ORDER BY enumsortorder;

-- ============================================
-- 3. VERIFICAR COLUNAS DO CHATWOOT NA TABELA CLIENTES
-- ============================================
SELECT
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'clientes'
  AND column_name LIKE 'chatwoot%'
ORDER BY ordinal_position;

-- ============================================
-- 4. VERIFICAR SE TIPO_EVENTO_ENUM EXISTE E TEM VALORES CHATWOOT
-- ============================================
SELECT
  enumlabel as tipo_evento
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tipo_evento_enum')
  AND enumlabel LIKE 'chatwoot%'
ORDER BY enumlabel;

-- ============================================
-- 5. CONTAR CLIENTES COM DADOS DO CHATWOOT
-- ============================================
SELECT
  COUNT(*) as total_clientes,
  COUNT(chatwoot_account_id) as com_chatwoot_account,
  COUNT(chatwoot_status) as com_status,
  COUNT(CASE WHEN chatwoot_status = 'active' THEN 1 END) as status_active,
  COUNT(CASE WHEN chatwoot_status = 'pending' THEN 1 END) as status_pending,
  COUNT(CASE WHEN chatwoot_status = 'error' THEN 1 END) as status_error
FROM clientes;

-- ============================================
-- 6. VERIFICAR ÍNDICES CRIADOS
-- ============================================
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'clientes'
  AND indexname LIKE '%chatwoot%'
ORDER BY indexname;

-- ============================================
-- 7. TENTAR SELECT SIMPLES (debug)
-- ============================================
SELECT
  id,
  nome_cliente,
  email,
  chatwoot_status,
  chatwoot_account_id,
  chatwoot_inbox_id
FROM clientes
LIMIT 3;
