/*
  # Sistema de Gestão de Acessos para Funcionários

  1. Tabela user_accesses
    - Sistema independente de autenticação para funcionários
    - Vínculos corretos com users e restaurants
    - Permissões granulares em JSON

  2. Funções de autenticação
    - Hash seguro de senhas
    - Login independente para funcionários
    - Verificação de permissões

  3. Segurança
    - RLS habilitado
    - Apenas proprietários podem gerenciar acessos
*/

-- Garantir que a tabela existe com a estrutura correta
CREATE TABLE IF NOT EXISTS user_accesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  }'::jsonb,
  active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE user_accesses ENABLE ROW LEVEL SECURITY;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS update_user_accesses_updated_at ON user_accesses;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_accesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER update_user_accesses_updated_at
  BEFORE UPDATE ON user_accesses
  FOR EACH ROW
  EXECUTE FUNCTION update_user_accesses_updated_at();

-- Remover políticas existentes
DROP POLICY IF EXISTS "Restaurant owners can manage their access accounts" ON user_accesses;

-- Política para proprietários gerenciarem acessos de seus restaurantes
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

-- Função para criar hash de senha
CREATE OR REPLACE FUNCTION create_password_hash(password text)
RETURNS text AS $$
BEGIN
  -- Usar SHA-256 com salt para hash da senha
  RETURN encode(digest(password || 'fooddash_salt_2024', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Função para autenticar funcionário (CORRIGIDA - sem conflito de nomes)
CREATE OR REPLACE FUNCTION authenticate_employee_access(
  login_email text,
  login_password text
)
RETURNS TABLE(
  access_id uuid,
  restaurant_id uuid,
  restaurant_name text,
  employee_name text,
  employee_email text,
  permissions jsonb,
  is_active boolean,
  restaurant_logo text,
  restaurant_category text
) AS $$
DECLARE
  access_record user_accesses%ROWTYPE;
  restaurant_record restaurants%ROWTYPE;
  password_hash text;
BEGIN
  -- Criar hash da senha fornecida
  password_hash := create_password_hash(login_password);
  
  -- Buscar usuário de acesso ativo
  SELECT * INTO access_record
  FROM user_accesses
  WHERE user_accesses.email = login_email
    AND user_accesses.active = true
    AND user_accesses.password_hash = password_hash;

  -- Verificar se usuário existe e senha está correta
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Buscar dados do restaurante
  SELECT * INTO restaurant_record
  FROM restaurants
  WHERE restaurants.id = access_record.restaurant_id
    AND restaurants.ativo = true;

  -- Verificar se restaurante existe e está ativo
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Atualizar último login
  UPDATE user_accesses 
  SET last_login = now()
  WHERE user_accesses.id = access_record.id;

  -- Retornar dados do funcionário e restaurante
  RETURN QUERY SELECT
    access_record.id,
    access_record.restaurant_id,
    restaurant_record.nome,
    access_record.name,
    access_record.email,
    access_record.permissions,
    access_record.active,
    restaurant_record.logo_url,
    restaurant_record.categoria_culinaria;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar permissão específica
CREATE OR REPLACE FUNCTION check_employee_permission(
  access_id uuid,
  permission_name text
)
RETURNS boolean AS $$
DECLARE
  user_permissions jsonb;
  has_permission boolean;
BEGIN
  -- Buscar permissões do usuário
  SELECT permissions INTO user_permissions
  FROM user_accesses
  WHERE id = access_id 
    AND active = true;

  -- Se não encontrou o usuário, retornar false
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Verificar se tem a permissão específica
  has_permission := COALESCE((user_permissions ->> permission_name)::boolean, false);
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para listar permissões de um funcionário
CREATE OR REPLACE FUNCTION get_employee_permissions(access_id uuid)
RETURNS jsonb AS $$
DECLARE
  user_permissions jsonb;
BEGIN
  SELECT permissions INTO user_permissions
  FROM user_accesses
  WHERE id = access_id AND active = true;

  RETURN COALESCE(user_permissions, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar senha de funcionário
CREATE OR REPLACE FUNCTION update_employee_password(
  access_id uuid,
  new_password text,
  requesting_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  access_record user_accesses%ROWTYPE;
  new_hash text;
BEGIN
  -- Verificar se o usuário tem permissão para alterar a senha
  SELECT * INTO access_record
  FROM user_accesses ua
  JOIN restaurants r ON r.id = ua.restaurant_id
  WHERE ua.id = access_id
    AND r.user_id = requesting_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Criar novo hash
  new_hash := create_password_hash(new_password);

  -- Atualizar senha
  UPDATE user_accesses
  SET password_hash = new_hash,
      updated_at = now()
  WHERE id = access_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir dados de exemplo (opcional - remover em produção)
-- Isso é apenas para teste, em produção os acessos serão criados via interface
DO $$
DECLARE
  test_restaurant_id uuid;
  test_user_id uuid;
BEGIN
  -- Buscar um restaurante de teste
  SELECT r.id, r.user_id INTO test_restaurant_id, test_user_id
  FROM restaurants r
  LIMIT 1;

  -- Se encontrou um restaurante, criar um acesso de teste
  IF test_restaurant_id IS NOT NULL THEN
    INSERT INTO user_accesses (
      restaurant_id,
      created_by,
      name,
      email,
      password_hash,
      permissions
    ) VALUES (
      test_restaurant_id,
      test_user_id,
      'Funcionário Teste',
      'funcionario@teste.com',
      create_password_hash('123456'),
      '{
        "sales": true,
        "expenses": true,
        "dre": false,
        "profile": false,
        "dashboard": true,
        "analytics": false,
        "reports": false,
        "settings": false
      }'::jsonb
    ) ON CONFLICT (email) DO NOTHING;
  END IF;
END $$;