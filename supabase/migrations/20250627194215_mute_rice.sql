/*
  # Create valuations table

  1. New Tables
    - `valuations`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key to restaurants)
      - `valuation_data` (jsonb, stores the form data used for calculation)
      - `result` (jsonb, stores the calculated valuation result)
      - `notes` (text, optional notes about the valuation)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `valuations` table
    - Add policy for restaurants to manage their own valuations
*/

CREATE TABLE IF NOT EXISTS valuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  valuation_data jsonb NOT NULL,
  result jsonb NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE valuations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurants can manage own valuations"
  ON valuations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = valuations.restaurant_id
      AND restaurants.user_id = uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = valuations.restaurant_id
      AND restaurants.user_id = uid()
    )
  );

CREATE TRIGGER update_valuations_updated_at
  BEFORE UPDATE ON valuations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();