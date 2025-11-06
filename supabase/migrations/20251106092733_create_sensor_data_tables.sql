/*
  # Create Sensor Data Tables for Smart Irrigation Dashboard

  1. New Tables
    - `sensor_readings` - Stores real-time sensor measurements
      - `id` (uuid, primary key)
      - `water_pump` (integer: 1=ON, 0=OFF)
      - `soil_moisture` (numeric: 0-100%)
      - `temperature` (numeric: Celsius)
      - `humidity` (numeric: 0-100%)
      - `ph_level` (numeric: pH value)
      - `flow_rate` (numeric: L/min, optional)
      - `created_at` (timestamp)
    
    - `alert_thresholds` - Stores user-defined alert thresholds
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `sensor_type` (text)
      - `min_value` (numeric)
      - `max_value` (numeric)
      - `enabled` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their data
    - Public read access for sensor readings (demo purposes)

  3. Indexes
    - Index on `created_at` for efficient time-range queries
    - Index on `user_id` for threshold lookups
*/

CREATE TABLE IF NOT EXISTS sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  water_pump integer DEFAULT 0,
  soil_moisture numeric DEFAULT 0,
  temperature numeric DEFAULT 0,
  humidity numeric DEFAULT 0,
  ph_level numeric DEFAULT 7.0,
  flow_rate numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sensor_type text NOT NULL,
  min_value numeric,
  max_value numeric,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to sensor readings"
  ON sensor_readings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can read own thresholds"
  ON alert_thresholds FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own thresholds"
  ON alert_thresholds FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own thresholds"
  ON alert_thresholds FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own thresholds"
  ON alert_thresholds FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_created_at 
  ON sensor_readings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_thresholds_user_id 
  ON alert_thresholds(user_id);
