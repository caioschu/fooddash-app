/*
  # Fix benchmark data calculation

  1. Changes
    - Add new fields to simulated_benchmarks table
    - Update get_benchmark_data function to include new fields
    - Ensure proper fallback values for calculations
*/

-- First, add the missing columns to simulated_benchmarks if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulated_benchmarks' AND column_name = 'faturamento_medio_mensal'
  ) THEN
    ALTER TABLE simulated_benchmarks ADD COLUMN faturamento_medio_mensal numeric(12,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulated_benchmarks' AND column_name = 'pedidos_medio_mensal'
  ) THEN
    ALTER TABLE simulated_benchmarks ADD COLUMN pedidos_medio_mensal integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulated_benchmarks' AND column_name = 'ocupacao_media'
  ) THEN
    ALTER TABLE simulated_benchmarks ADD COLUMN ocupacao_media numeric(5,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulated_benchmarks' AND column_name = 'rotatividade_media'
  ) THEN
    ALTER TABLE simulated_benchmarks ADD COLUMN rotatividade_media numeric(5,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulated_benchmarks' AND column_name = 'taxa_conversao_media'
  ) THEN
    ALTER TABLE simulated_benchmarks ADD COLUMN taxa_conversao_media numeric(5,2) DEFAULT 0;
  END IF;
END $$;

-- Update existing records with default values
UPDATE simulated_benchmarks
SET 
  faturamento_medio_mensal = ticket_medio * 1000,
  pedidos_medio_mensal = 1000,
  ocupacao_media = 65.0,
  rotatividade_media = 2.5,
  taxa_conversao_media = 75.0
WHERE faturamento_medio_mensal = 0 OR faturamento_medio_mensal IS NULL;

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_benchmark_data(text, text, text);

-- Then recreate the function with the new return type
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
  fonte text,
  faturamento_medio_mensal numeric,
  pedidos_medio_mensal integer,
  ocupacao_media numeric,
  rotatividade_media numeric,
  taxa_conversao_media numeric
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
      'real'::text as fonte,
      b.ticket_medio * 1000 as faturamento_medio_mensal,
      1000 as pedidos_medio_mensal,
      65.0 as ocupacao_media,
      2.5 as rotatividade_media,
      75.0 as taxa_conversao_media
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
        'simulado_fallback'::text as fonte,
        COALESCE(sb.faturamento_medio_mensal, sb.ticket_medio * 1000) as faturamento_medio_mensal,
        COALESCE(sb.pedidos_medio_mensal, 1000) as pedidos_medio_mensal,
        COALESCE(sb.ocupacao_media, 65.0) as ocupacao_media,
        COALESCE(sb.rotatividade_media, 2.5) as rotatividade_media,
        COALESCE(sb.taxa_conversao_media, 75.0) as taxa_conversao_media
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
      'simulado'::text as fonte,
      COALESCE(sb.faturamento_medio_mensal, sb.ticket_medio * 1000) as faturamento_medio_mensal,
      COALESCE(sb.pedidos_medio_mensal, 1000) as pedidos_medio_mensal,
      COALESCE(sb.ocupacao_media, 65.0) as ocupacao_media,
      COALESCE(sb.rotatividade_media, 2.5) as rotatividade_media,
      COALESCE(sb.taxa_conversao_media, 75.0) as taxa_conversao_media
    FROM simulated_benchmarks sb
    WHERE sb.regiao = regiao_nome 
    AND sb.categoria_culinaria = restaurant_categoria
    AND sb.ativo = true
    LIMIT 1;
  END IF;
  
  -- Se não encontrou nada, retornar valores padrão
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      35.0 as ticket_medio,
      15.0 as margem_media,
      30.0 as cmv_medio,
      25.0 as gasto_fixo_medio,
      10000.0 as ponto_equilibrio_medio,
      15.0 as taxa_media_venda,
      5.0 as gasto_marketing_medio,
      100 as total_restaurantes,
      'simulado_default'::text as fonte,
      35000.0 as faturamento_medio_mensal,
      1000 as pedidos_medio_mensal,
      65.0 as ocupacao_media,
      2.5 as rotatividade_media,
      75.0 as taxa_conversao_media;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;