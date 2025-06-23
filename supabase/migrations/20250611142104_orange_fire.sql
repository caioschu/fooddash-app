/*
  # Otimização da estrutura do perfil para PLG

  1. Melhorias na estrutura
    - Canais de venda pré-configurados
    - Formas de pagamento com antecipação
    - Campos otimizados para onboarding rápido

  2. Novos campos
    - Antecipação nas formas de pagamento
    - Taxa de antecipação
    - Campos simplificados para reduzir atrito

  3. Dados padrão
    - Canais de venda pré-populados
    - Formas de pagamento padrão
*/

-- Adicionar campos de antecipação nas formas de pagamento
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_methods' AND column_name = 'tem_antecipacao'
  ) THEN
    ALTER TABLE payment_methods ADD COLUMN tem_antecipacao boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_methods' AND column_name = 'taxa_antecipacao'
  ) THEN
    ALTER TABLE payment_methods ADD COLUMN taxa_antecipacao numeric(5,2) DEFAULT 0;
  END IF;
END $$;

-- Função para criar canais padrão para um restaurante
CREATE OR REPLACE FUNCTION create_default_sales_channels(restaurant_id_param uuid)
RETURNS void AS $$
BEGIN
  -- Inserir canais padrão se não existirem
  INSERT INTO sales_channels (restaurant_id, nome, taxa_percentual, ativo)
  SELECT restaurant_id_param, nome, taxa, true
  FROM (VALUES
    ('Salão', 0),
    ('iFood', 12),
    ('WhatsApp', 0),
    ('Telefone', 0),
    ('Retirada (balcão)', 0),
    ('App próprio', 0)
  ) AS default_channels(nome, taxa)
  WHERE NOT EXISTS (
    SELECT 1 FROM sales_channels 
    WHERE restaurant_id = restaurant_id_param 
    AND nome = default_channels.nome
  );
END;
$$ LANGUAGE plpgsql;

-- Função para criar formas de pagamento padrão para um restaurante
CREATE OR REPLACE FUNCTION create_default_payment_methods(restaurant_id_param uuid)
RETURNS void AS $$
BEGIN
  -- Inserir formas de pagamento padrão se não existirem
  INSERT INTO payment_methods (restaurant_id, nome, taxa_percentual, tem_antecipacao, taxa_antecipacao, ativo)
  SELECT restaurant_id_param, nome, taxa, antecipacao, taxa_ant, true
  FROM (VALUES
    ('Cartão de Crédito', 3.5, true, 2.5),
    ('Cartão de Débito', 1.8, false, 0),
    ('Pix', 0.5, false, 0),
    ('Dinheiro', 0, false, 0),
    ('Vale Refeição', 4.2, false, 0),
    ('Pagamento Online iFood', 4.8, false, 0),
    ('Pagamento Online App', 3.2, false, 0)
  ) AS default_methods(nome, taxa, antecipacao, taxa_ant)
  WHERE NOT EXISTS (
    SELECT 1 FROM payment_methods 
    WHERE restaurant_id = restaurant_id_param 
    AND nome = default_methods.nome
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar dados padrão quando um restaurante é criado
CREATE OR REPLACE FUNCTION setup_restaurant_defaults()
RETURNS trigger AS $$
BEGIN
  -- Criar canais de venda padrão
  PERFORM create_default_sales_channels(NEW.id);
  
  -- Criar formas de pagamento padrão
  PERFORM create_default_payment_methods(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS setup_restaurant_defaults_trigger ON restaurants;
CREATE TRIGGER setup_restaurant_defaults_trigger
  AFTER INSERT ON restaurants
  FOR EACH ROW EXECUTE FUNCTION setup_restaurant_defaults();

-- Atualizar restaurantes existentes com dados padrão
DO $$
DECLARE
  restaurant_record RECORD;
BEGIN
  FOR restaurant_record IN SELECT id FROM restaurants LOOP
    PERFORM create_default_sales_channels(restaurant_record.id);
    PERFORM create_default_payment_methods(restaurant_record.id);
  END LOOP;
END $$;