-- Corrigir usuários ausentes na tabela users
-- Esta migração verifica usuários na tabela auth.users que não existem na tabela users
-- e os adiciona automaticamente

-- Primeiro, vamos garantir que o usuário caioschu@hotmail.com exista na tabela users
DO $$
DECLARE
  user_id uuid;
  user_email text := 'caioschu@hotmail.com';
  user_exists boolean;
BEGIN
  -- Verificar se o usuário existe na tabela auth.users
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NOT NULL THEN
    -- Verificar se o usuário já existe na tabela users
    SELECT EXISTS(SELECT 1 FROM users WHERE id = user_id) INTO user_exists;
    
    IF NOT user_exists THEN
      -- Inserir o usuário na tabela users
      INSERT INTO users (id, email, tipo_usuario, created_at, updated_at)
      VALUES (
        user_id,
        user_email,
        'restaurante',
        now(),
        now()
      );
      RAISE NOTICE 'Usuário % adicionado à tabela users', user_email;
    ELSE
      RAISE NOTICE 'Usuário % já existe na tabela users', user_email;
    END IF;
  ELSE
    RAISE NOTICE 'Usuário % não encontrado na tabela auth.users', user_email;
  END IF;
END $$;

-- Agora, vamos verificar e corrigir todos os outros usuários que possam estar faltando
DO $$
DECLARE
  auth_user RECORD;
  user_exists boolean;
BEGIN
  FOR auth_user IN 
    SELECT id, email, created_at FROM auth.users
  LOOP
    -- Verificar se o usuário já existe na tabela users
    SELECT EXISTS(SELECT 1 FROM users WHERE id = auth_user.id) INTO user_exists;
    
    IF NOT user_exists THEN
      -- Inserir o usuário na tabela users
      INSERT INTO users (id, email, tipo_usuario, created_at, updated_at)
      VALUES (
        auth_user.id,
        auth_user.email,
        'restaurante',
        auth_user.created_at,
        now()
      );
      RAISE NOTICE 'Usuário % adicionado à tabela users', auth_user.email;
    END IF;
  END LOOP;
END $$;

-- Melhorar o trigger para evitar problemas futuros
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger AS $$
DECLARE
  user_type text;
  user_exists boolean;
BEGIN
  -- Verificar se o usuário já existe na tabela users
  SELECT EXISTS(SELECT 1 FROM users WHERE id = new.id) INTO user_exists;
  
  IF NOT user_exists THEN
    -- Get user type from metadata, default to 'restaurante'
    user_type := COALESCE(new.raw_user_meta_data->>'tipo_usuario', 'restaurante');
    
    -- Insert into users table
    INSERT INTO users (id, email, tipo_usuario, created_at, updated_at)
    VALUES (
      new.id, 
      new.email, 
      user_type,
      COALESCE(new.created_at, now()),
      now()
    );
    
    RAISE LOG 'Novo usuário criado na tabela users: %', new.email;
  ELSE
    RAISE LOG 'Usuário já existe na tabela users: %', new.email;
  END IF;
  
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the auth process
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();