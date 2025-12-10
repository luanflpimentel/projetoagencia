-- Criar tabela de convites
CREATE TABLE IF NOT EXISTS convites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  nome_completo TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('cliente', 'agencia')),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  telefone TEXT,
  token TEXT NOT NULL UNIQUE,
  expira_em TIMESTAMPTZ NOT NULL,
  usado BOOLEAN DEFAULT FALSE,
  usado_em TIMESTAMPTZ,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_convites_token ON convites(token);
CREATE INDEX idx_convites_email ON convites(email);
CREATE INDEX idx_convites_usado ON convites(usado);

-- RLS
ALTER TABLE convites ENABLE ROW LEVEL SECURITY;

-- Política: Agência pode ver todos os convites
CREATE POLICY "Agência pode ver todos os convites"
  ON convites
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.role = 'agencia'
    )
  );

-- Política: Agência pode criar convites
CREATE POLICY "Agência pode criar convites"
  ON convites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.role = 'agencia'
    )
  );

-- Política: Qualquer pessoa pode ler convite pelo token (para aceitar)
CREATE POLICY "Qualquer pessoa pode ler convite pelo token"
  ON convites
  FOR SELECT
  TO anon
  USING (TRUE);

-- Política: Convite pode ser atualizado quando usado
CREATE POLICY "Convite pode ser marcado como usado"
  ON convites
  FOR UPDATE
  TO anon
  USING (usado = FALSE)
  WITH CHECK (usado = TRUE);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_convites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_convites_updated_at
  BEFORE UPDATE ON convites
  FOR EACH ROW
  EXECUTE FUNCTION update_convites_updated_at();
