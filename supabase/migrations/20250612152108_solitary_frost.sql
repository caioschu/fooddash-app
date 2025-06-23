/*
  # Sistema de Gerenciamento de Benchmarking

  1. Novas tabelas
    - `benchmark_settings` - Configurações globais do sistema
    - `simulated_benchmarks` - Dados simulados para comparação
    - `regions` - Mapeamento de regiões para agrupamento

  2. Funcionalidades
    - Toggle entre dados simulados e reais
    - Agrupamento por região e culinária
    - Gestão administrativa de dados simulados
*/

-- Tabela de configurações do sistema de benchmarking
CREATE TABLE IF NOT EXISTS benchmark_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  use_real_data boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir configuração padrão (usar dados simulados)
INSERT INTO benchmark_settings (use_real_data) VALUES (false) ON CONFLICT DO NOTHING;

-- Tabela de regiões para agrupamento
CREATE TABLE IF NOT EXISTS regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  estados text[] NOT NULL,
  cidades text[] NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir regiões padrão do Brasil
INSERT INTO regions (nome, estados, cidades) VALUES
('Sudeste', ARRAY['SP', 'RJ', 'MG', 'ES'], ARRAY['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Vitória', 'Campinas', 'Santos', 'Niterói', 'Juiz de Fora']),
('Sul', ARRAY['RS', 'SC', 'PR'], ARRAY['Porto Alegre', 'Curitiba', 'Florianópolis', 'Caxias do Sul', 'Londrina', 'Maringá']),
('Nordeste', ARRAY['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI'], ARRAY['Salvador', 'Recife', 'Fortaleza', 'São Luís', 'João Pessoa', 'Natal', 'Maceió', 'Aracaju']),
('Norte', ARRAY['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'], ARRAY['Manaus', 'Belém', 'Rio Branco', 'Porto Velho', 'Boa Vista', 'Macapá', 'Palmas']),
('Centro-Oeste', ARRAY['GO', 'MT', 'MS', 'DF'], ARRAY['Brasília', 'Goiânia', 'Cuiabá', 'Campo Grande', 'Anápolis'])
ON CONFLICT DO NOTHING;

-- Tabela de benchmarks simulados
CREATE TABLE IF NOT EXISTS simulated_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regiao text NOT NULL,
  categoria_culinaria text NOT NULL,
  ticket_medio numeric(10,2) NOT NULL,
  margem_media numeric(5,2) NOT NULL,
  cmv_medio numeric(5,2) NOT NULL,
  gasto_fixo_medio numeric(5,2) NOT NULL,
  ponto_equilibrio_medio numeric(10,2) NOT NULL,
  taxa_media_venda numeric(5,2) NOT NULL,
  gasto_marketing_medio numeric(5,2) NOT NULL,
  total_restaurantes integer NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(regiao, categoria_culinaria)
);

-- Inserir dados simulados iniciais
INSERT INTO simulated_benchmarks (regiao, categoria_culinaria, ticket_medio, margem_media, cmv_medio, gasto_fixo_medio, ponto_equilibrio_medio, taxa_media_venda, gasto_marketing_medio, total_restaurantes) VALUES
-- Sudeste
('Sudeste', 'Japonesa', 34.60, 16.2, 31, 29, 10900, 14.9, 4, 829),
('Sudeste', 'Italiana', 42.80, 18.5, 28, 32, 15200, 16.2, 5.5, 1247),
('Sudeste', 'Brasileira', 28.90, 15.8, 33, 28, 12500, 15.1, 4.2, 956),
('Sudeste', 'Fast Food', 22.50, 22.1, 35, 25, 8900, 18.5, 6.8, 634),
('Sudeste', 'Pizza', 38.20, 19.3, 29, 31, 14700, 12.8, 3.9, 523),

-- Sul
('Sul', 'Japonesa', 32.40, 15.8, 32, 30, 11200, 15.2, 4.1, 456),
('Sul', 'Italiana', 39.60, 17.9, 29, 33, 14800, 16.8, 5.2, 678),
('Sul', 'Brasileira', 26.80, 15.2, 34, 29, 12100, 15.5, 4.5, 543),
('Sul', 'Fast Food', 21.20, 21.5, 36, 26, 9200, 19.1, 7.2, 389),
('Sul', 'Pizza', 36.50, 18.8, 30, 32, 14200, 13.2, 4.1, 298),

-- Nordeste
('Nordeste', 'Japonesa', 29.80, 14.9, 33, 31, 10500, 16.1, 4.3, 234),
('Nordeste', 'Italiana', 35.20, 16.8, 30, 34, 13900, 17.2, 5.8, 345),
('Nordeste', 'Brasileira', 24.60, 14.5, 35, 30, 11800, 16.2, 4.8, 678),
('Nordeste', 'Fast Food', 19.80, 20.8, 37, 27, 8600, 19.8, 7.5, 456),
('Nordeste', 'Pizza', 33.40, 17.9, 31, 33, 13500, 13.8, 4.4, 189),

-- Norte
('Norte', 'Japonesa', 31.20, 15.1, 32, 30, 10800, 15.8, 4.2, 123),
('Norte', 'Italiana', 37.80, 17.2, 29, 33, 14100, 16.9, 5.4, 156),
('Norte', 'Brasileira', 25.90, 14.8, 34, 29, 12000, 15.9, 4.6, 289),
('Norte', 'Fast Food', 20.50, 21.2, 36, 26, 8800, 19.4, 7.1, 198),
('Norte', 'Pizza', 35.10, 18.2, 30, 32, 13800, 13.5, 4.2, 98),

-- Centro-Oeste
('Centro-Oeste', 'Japonesa', 33.10, 15.9, 31, 29, 11100, 15.1, 4.0, 167),
('Centro-Oeste', 'Italiana', 40.50, 18.1, 28, 32, 14600, 16.5, 5.3, 234),
('Centro-Oeste', 'Brasileira', 27.40, 15.5, 33, 28, 12300, 15.3, 4.4, 345),
('Centro-Oeste', 'Fast Food', 21.80, 21.8, 35, 25, 9100, 18.9, 6.9, 278),
('Centro-Oeste', 'Pizza', 37.20, 18.9, 29, 31, 14400, 13.1, 3.8, 156)
ON CONFLICT (regiao, categoria_culinaria) DO NOTHING;

-- Habilitar RLS
ALTER TABLE benchmark_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulated_benchmarks ENABLE ROW LEVEL SECURITY;

-- Políticas para benchmark_settings
CREATE POLICY "Admin can manage benchmark settings" ON benchmark_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo_usuario = 'admin'
    )
  );

CREATE POLICY "Everyone can read benchmark settings" ON benchmark_settings
  FOR SELECT TO authenticated
  USING (true);

-- Políticas para regions
CREATE POLICY "Everyone can read regions" ON regions
  FOR SELECT TO authenticated
  USING (ativo = true);

CREATE POLICY "Admin can manage regions" ON regions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo_usuario = 'admin'
    )
  );

-- Políticas para simulated_benchmarks
CREATE POLICY "Everyone can read active simulated benchmarks" ON simulated_benchmarks
  FOR SELECT TO authenticated
  USING (ativo = true);

CREATE POLICY "Admin can manage simulated benchmarks" ON simulated_benchmarks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo_usuario = 'admin'
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_benchmark_settings_updated_at BEFORE UPDATE ON benchmark_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulated_benchmarks_updated_at BEFORE UPDATE ON simulated_benchmarks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para obter dados de benchmark (simulados ou reais)
CREATE OR REPLACE FUNCTION get_benchmark_data(
  restaurant_cidade text,
  restaurant_estado text,
  restaurant_categoria text
)
RETURNS TABLE (
  ticket_medio numeric,
  margem_media numeric,
  cmv_medio numeric,
  gasto_fixo_medio numeric,
  ponto_equilibrio_medio numeric,
  taxa_media_venda numeric,
  gasto_marketing_medio numeric,
  total_restaurantes integer,
  fonte text
) AS $$
DECLARE
  use_real boolean;
  regiao_nome text;
BEGIN
  -- Verificar se deve usar dados reais ou simulados
  SELECT use_real_data INTO use_real FROM benchmark_settings LIMIT 1;
  
  -- Encontrar a região do restaurante
  SELECT r.nome INTO regiao_nome 
  FROM regions r 
  WHERE restaurant_estado = ANY(r.estados) 
  AND restaurant_cidade = ANY(r.cidades)
  AND r.ativo = true
  LIMIT 1;
  
  -- Se não encontrou região específica, usar região por estado
  IF regiao_nome IS NULL THEN
    SELECT r.nome INTO regiao_nome 
    FROM regions r 
    WHERE restaurant_estado = ANY(r.estados)
    AND r.ativo = true
    LIMIT 1;
  END IF;
  
  -- Se ainda não encontrou, usar Sudeste como padrão
  IF regiao_nome IS NULL THEN
    regiao_nome := 'Sudeste';
  END IF;
  
  IF use_real THEN
    -- Tentar dados reais primeiro por cidade e categoria
    RETURN QUERY
    SELECT 
      b.ticket_medio,
      b.margem_media,
      b.cmv_medio,
      b.gasto_fixo_medio,
      b.ponto_equilibrio_medio,
      b.taxa_media_venda,
      b.gasto_marketing_medio,
      b.total_restaurantes,
      'real'::text as fonte
    FROM benchmarking b
    WHERE b.cidade = restaurant_cidade 
    AND b.categoria_culinaria = restaurant_categoria
    LIMIT 1;
    
    -- Se não encontrou dados reais, usar simulados
    IF NOT FOUND THEN
      RETURN QUERY
      SELECT 
        sb.ticket_medio,
        sb.margem_media,
        sb.cmv_medio,
        sb.gasto_fixo_medio,
        sb.ponto_equilibrio_medio,
        sb.taxa_media_venda,
        sb.gasto_marketing_medio,
        sb.total_restaurantes,
        'simulado_fallback'::text as fonte
      FROM simulated_benchmarks sb
      WHERE sb.regiao = regiao_nome 
      AND sb.categoria_culinaria = restaurant_categoria
      AND sb.ativo = true
      LIMIT 1;
    END IF;
  ELSE
    -- Usar dados simulados
    RETURN QUERY
    SELECT 
      sb.ticket_medio,
      sb.margem_media,
      sb.cmv_medio,
      sb.gasto_fixo_medio,
      sb.ponto_equilibrio_medio,
      sb.taxa_media_venda,
      sb.gasto_marketing_medio,
      sb.total_restaurantes,
      'simulado'::text as fonte
    FROM simulated_benchmarks sb
    WHERE sb.regiao = regiao_nome 
    AND sb.categoria_culinaria = restaurant_categoria
    AND sb.ativo = true
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;