/*
  # Create user sessions table for Telegram bot

  1. New Tables
    - `user_sessions`
      - `user_id` (bigint, primary key) - Telegram user ID
      - `chat_id` (bigint) - Telegram chat ID
      - `username` (text) - Telegram username
      - `first_name` (text) - User's first name
      - `last_name` (text) - User's last name
      - `created_at` (timestamp) - Session creation time
      - `updated_at` (timestamp) - Last activity time

  2. Security
    - Enable RLS on `user_sessions` table
    - Add policy for service role access (bot operations)
*/

CREATE TABLE IF NOT EXISTS user_sessions (
  user_id bigint PRIMARY KEY,
  chat_id bigint NOT NULL,
  username text,
  first_name text NOT NULL,
  last_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role (bot) to manage user sessions
CREATE POLICY "Service role can manage user sessions"
  ON user_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();