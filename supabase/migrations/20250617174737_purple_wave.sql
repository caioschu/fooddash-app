/*
  # Sistema de Gestão de Acessos - Estrutura Corrigida

  1. Tabela user_accesses
    - Vinculação correta com users (created_by)
    - Sistema de permissões granular
    - Controle de status ativo/inativo

  2. Segurança
    - RLS habilitado
    - Políticas para proprietários de restaurantes
    - Controle de acesso baseado em permissões
*/

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_accesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  permissions jsonb DEFAULT '{
    "sales": false,
    "expenses": false,
    "dre": false,
    "profile": false,
    "dashboard": false,
    "analytics": false,
    "reports": false,
    "settings": false
  }',
  active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_accesses ENABLE ROW LEVEL SECURITY;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_user_accesses_updated_at ON user_accesses;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_user_accesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_user_accesses_updated_at
  BEFORE UPDATE ON user_accesses
  FOR EACH ROW
  EXECUTE FUNCTION update_user_accesses_updated_at();

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Restaurant owners can manage their access accounts" ON user_accesses;

-- Create security policy
CREATE POLICY "Restaurant owners can manage their access accounts"
  ON user_accesses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = user_accesses.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = user_accesses.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- Função para autenticar usuários de acesso
CREATE OR REPLACE FUNCTION authenticate_user_access(
  access_email text,
  access_password text
)
RETURNS TABLE(
  access_id uuid,
  restaurant_id uuid,
  restaurant_name text,
  user_name text,
  user_email text,
  permissions jsonb,
  is_active boolean
) AS $$
DECLARE
  access_record user_accesses%ROWTYPE;
  restaurant_record restaurants%ROWTYPE;
BEGIN
  -- Buscar usuário de acesso ativo
  SELECT * INTO access_record
  FROM user_accesses
  WHERE user_accesses.email = access_email
    AND user_accesses.active = true;

  -- Verificar se usuário existe
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Verificar senha (simplificado para demo - em produção usar hash adequado)
  IF access_record.password_hash != encode(digest(access_password, 'sha256'), 'base64') THEN
    RETURN;
  END IF;

  -- Buscar dados do restaurante
  SELECT * INTO restaurant_record
  FROM restaurants
  WHERE restaurants.id = access_record.restaurant_id;

  -- Atualizar último login
  UPDATE user_accesses 
  SET last_login = now()
  WHERE user_accesses.id = access_record.id;

  -- Retornar dados
  RETURN QUERY SELECT
    access_record.id,
    access_record.restaurant_id,
    restaurant_record.nome,
    access_record.name,
    access_record.email,
    access_record.permissions,
    access_record.active;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar permissões
CREATE OR REPLACE FUNCTION check_user_access_permission(
  access_id uuid,
  permission_name text
)
RETURNS boolean AS $$
DECLARE
  user_permissions jsonb;
BEGIN
  -- Buscar permissões do usuário
  SELECT permissions INTO user_permissions
  FROM user_accesses
  WHERE id = access_id AND active = true;

  -- Se não encontrou o usuário, retornar false
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Verificar se tem a permissão específica
  RETURN COALESCE((user_permissions ->> permission_name)::boolean, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;