-- Create valuations table if it doesn't exist
CREATE TABLE IF NOT EXISTS valuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  valuation_data jsonb NOT NULL,
  result jsonb NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on valuations table
ALTER TABLE valuations ENABLE ROW LEVEL SECURITY;

-- Drop the policy if it already exists to avoid the error
DROP POLICY IF EXISTS "Restaurants can manage own valuations" ON valuations;

-- Create the policy
CREATE POLICY "Restaurants can manage own valuations"
  ON valuations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = valuations.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = valuations.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Create trigger for updating the updated_at column
DROP TRIGGER IF EXISTS update_valuations_updated_at ON valuations;
CREATE TRIGGER update_valuations_updated_at
  BEFORE UPDATE ON valuations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();