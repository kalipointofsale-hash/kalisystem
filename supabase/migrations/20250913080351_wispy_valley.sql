/*
  # Create metrics tracking table

  1. New Tables
    - `environment_metrics`
      - `id` (uuid, primary key)
      - `timestamp` (timestamptz)
      - `bot_status` (text)
      - `database_connections` (integer)
      - `active_users` (integer)
      - `total_users` (integer)
      - `api_response_time` (integer)
      - `success_rate` (numeric)
      - `error_count` (integer)
      - `memory_usage` (numeric)
      - `uptime` (text)
      - `telegram_quality` (text)
      - `database_quality` (text)
      - `google_sheets_quality` (text)
      - `mini_app_quality` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `environment_metrics` table
    - Add policy for service role to manage metrics
    - Add policy for authenticated users to read metrics

  3. Indexes
    - Add index on timestamp for efficient querying
    - Add index on created_at for time-based queries
*/

CREATE TABLE IF NOT EXISTS environment_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  bot_status text NOT NULL DEFAULT 'offline',
  database_connections integer DEFAULT 0,
  active_users integer DEFAULT 0,
  total_users integer DEFAULT 0,
  api_response_time integer DEFAULT 0,
  success_rate numeric(5,2) DEFAULT 0.00,
  error_count integer DEFAULT 0,
  memory_usage numeric(5,2) DEFAULT 0.00,
  uptime text DEFAULT '0d 0h 0m',
  telegram_quality text DEFAULT 'offline',
  database_quality text DEFAULT 'offline',
  google_sheets_quality text DEFAULT 'offline',
  mini_app_quality text DEFAULT 'offline',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE environment_metrics ENABLE ROW LEVEL SECURITY;

-- Policy for service role to manage all metrics
CREATE POLICY "Service role can manage environment metrics"
  ON environment_metrics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy for authenticated users to read metrics
CREATE POLICY "Authenticated users can read environment metrics"
  ON environment_metrics
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_environment_metrics_timestamp 
  ON environment_metrics (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_environment_metrics_created_at 
  ON environment_metrics (created_at DESC);

-- Create a function to clean up old metrics (keep only last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM environment_metrics 
  WHERE created_at < now() - interval '30 days';
END;
$$;

-- Create a trigger to automatically update timestamp
CREATE OR REPLACE FUNCTION update_metrics_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.timestamp = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_environment_metrics_timestamp
  BEFORE UPDATE ON environment_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_metrics_timestamp();