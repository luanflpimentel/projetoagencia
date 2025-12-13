-- Execute este SQL no Supabase para verificar se a migration foi aplicada corretamente

-- 1. Verificar se as colunas do Chatwoot existem na tabela clientes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clientes'
  AND column_name LIKE 'chatwoot%'
ORDER BY column_name;

-- 2. Verificar se o ENUM chatwoot_status_enum existe
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'chatwoot_status_enum'::regtype
ORDER BY enumlabel;

-- 3. Verificar os tipos de evento disponíveis
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'tipo_evento_enum'::regtype
  AND enumlabel LIKE 'chatwoot%'
ORDER BY enumlabel;

-- 4. Ver se há clientes na tabela
SELECT id, nome_cliente, chatwoot_status
FROM clientes
LIMIT 5;
