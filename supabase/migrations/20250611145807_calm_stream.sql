/*
  # Adicionar campo PDV/ERP ao perfil do restaurante

  1. Alterações na tabela
    - Adicionar campo `pdv_erp` na tabela restaurants
    - Campo opcional para armazenar qual sistema o restaurante usa

  2. Dados
    - Lista dos principais PDVs/ERPs do mercado brasileiro
*/

-- Adicionar campo PDV/ERP na tabela restaurants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'pdv_erp'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN pdv_erp text;
  END IF;
END $$;