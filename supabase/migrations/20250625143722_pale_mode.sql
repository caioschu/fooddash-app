/*
  # Add missing benchmark columns

  1. New Fields
    - `faturamento_medio_mensal` - Average monthly revenue (numeric with 2 decimal places)
    - `pedidos_medio_mensal` - Average monthly orders (integer)
    - `ocupacao_media` - Average occupancy percentage
    - `rotatividade_media` - Average turnover rate  
    - `taxa_conversao_media` - Average conversion rate

  2. Changes
    - Add new columns to simulated_benchmarks table
    - Update existing records with calculated values
    - Ensure backward compatibility
*/

-- Add new columns to simulated_benchmarks table
DO $$
BEGIN
  -- Add faturamento_medio_mensal column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulated_benchmarks' AND column_name = 'faturamento_medio_mensal'
  ) THEN
    ALTER TABLE simulated_benchmarks ADD COLUMN faturamento_medio_mensal numeric(12,2) DEFAULT 0;
  END IF;

  -- Add pedidos_medio_mensal column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulated_benchmarks' AND column_name = 'pedidos_medio_mensal'
  ) THEN
    ALTER TABLE simulated_benchmarks ADD COLUMN pedidos_medio_mensal integer DEFAULT 0;
  END IF;

  -- Add ocupacao_media column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulated_benchmarks' AND column_name = 'ocupacao_media'
  ) THEN
    ALTER TABLE simulated_benchmarks ADD COLUMN ocupacao_media numeric(5,2) DEFAULT 0;
  END IF;

  -- Add rotatividade_media column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulated_benchmarks' AND column_name = 'rotatividade_media'
  ) THEN
    ALTER TABLE simulated_benchmarks ADD COLUMN rotatividade_media numeric(5,2) DEFAULT 0;
  END IF;

  -- Add taxa_conversao_media column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'simulated_benchmarks' AND column_name = 'taxa_conversao_media'
  ) THEN
    ALTER TABLE simulated_benchmarks ADD COLUMN taxa_conversao_media numeric(5,2) DEFAULT 0;
  END IF;
END $$;

-- Update existing records with calculated values based on ticket_medio
UPDATE simulated_benchmarks 
SET 
  faturamento_medio_mensal = CASE 
    WHEN ticket_medio > 0 THEN ticket_medio * 1000 
    ELSE 30000 
  END,
  pedidos_medio_mensal = CASE 
    WHEN ticket_medio > 0 THEN 1000 
    ELSE 1000 
  END,
  ocupacao_media = 65,
  rotatividade_media = 2.5,
  taxa_conversao_media = 75
WHERE faturamento_medio_mensal = 0 OR faturamento_medio_mensal IS NULL;