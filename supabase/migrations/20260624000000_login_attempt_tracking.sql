-- Migration: Add login attempt tracking for account lockout
-- Purpose: Implement account lockout after 5 failed login attempts (TC-LOG-003)
-- Date: 2026-06-24

-- Add login attempt tracking fields to admin_users table
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Create index for efficient lockout checks
CREATE INDEX IF NOT EXISTS idx_admin_users_locked_until 
ON admin_users(locked_until) 
WHERE locked_until IS NOT NULL;

-- Create customer login attempts tracking table for Supabase Auth users
-- We use a separate table since we cannot directly modify auth.users
CREATE TABLE IF NOT EXISTS customer_login_attempts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  last_failed_attempt TIMESTAMPTZ,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_customer_login_attempts_locked_until 
ON customer_login_attempts(locked_until) 
WHERE locked_until IS NOT NULL;

-- Function to reset admin login attempts on successful login
CREATE OR REPLACE FUNCTION reset_admin_login_attempts(admin_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE admin_users
  SET 
    failed_login_attempts = 0,
    last_failed_login = NULL,
    locked_until = NULL,
    last_login = NOW()
  WHERE email = admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment admin failed login attempts
CREATE OR REPLACE FUNCTION increment_admin_failed_login(admin_email TEXT)
RETURNS TABLE (
  attempts INTEGER,
  is_locked BOOLEAN,
  locked_until_ts TIMESTAMPTZ
) AS $$
DECLARE
  current_attempts INTEGER;
  lockout_duration INTERVAL := '30 minutes';
  max_attempts INTEGER := 5;
  new_locked_until TIMESTAMPTZ;
BEGIN
  -- Get current attempts
  SELECT failed_login_attempts INTO current_attempts
  FROM admin_users
  WHERE email = admin_email;
  
  -- Calculate new attempts count
  current_attempts := COALESCE(current_attempts, 0) + 1;
  
  -- If max attempts reached, set lockout
  IF current_attempts >= max_attempts THEN
    new_locked_until := NOW() + lockout_duration;
  ELSE
    new_locked_until := NULL;
  END IF;
  
  -- Update the record
  UPDATE admin_users
  SET 
    failed_login_attempts = current_attempts,
    last_failed_login = NOW(),
    locked_until = new_locked_until
  WHERE email = admin_email;
  
  -- Return the results
  RETURN QUERY
  SELECT 
    current_attempts,
    (new_locked_until IS NOT NULL AND new_locked_until > NOW()),
    new_locked_until;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if admin account is locked
CREATE OR REPLACE FUNCTION is_admin_account_locked(admin_email TEXT)
RETURNS TABLE (
  is_locked BOOLEAN,
  locked_until_ts TIMESTAMPTZ,
  attempts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (a.locked_until IS NOT NULL AND a.locked_until > NOW()),
    a.locked_until,
    a.failed_login_attempts
  FROM admin_users a
  WHERE a.email = admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset customer login attempts on successful login
CREATE OR REPLACE FUNCTION reset_customer_login_attempts(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NOT NULL THEN
    -- Reset or delete the tracking record
    DELETE FROM customer_login_attempts
    WHERE user_id = target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment customer failed login attempts
CREATE OR REPLACE FUNCTION increment_customer_failed_login(user_email TEXT)
RETURNS TABLE (
  attempts INTEGER,
  is_locked BOOLEAN,
  locked_until_ts TIMESTAMPTZ
) AS $$
DECLARE
  target_user_id UUID;
  current_attempts INTEGER;
  lockout_duration INTERVAL := '30 minutes';
  max_attempts INTEGER := 5;
  new_locked_until TIMESTAMPTZ;
BEGIN
  -- Get user ID from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    -- User doesn't exist, return safe defaults
    RETURN QUERY SELECT 0, FALSE, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Get or initialize current attempts
  SELECT failed_attempts INTO current_attempts
  FROM customer_login_attempts
  WHERE user_id = target_user_id;
  
  current_attempts := COALESCE(current_attempts, 0) + 1;
  
  -- If max attempts reached, set lockout
  IF current_attempts >= max_attempts THEN
    new_locked_until := NOW() + lockout_duration;
  ELSE
    new_locked_until := NULL;
  END IF;
  
  -- Upsert the record
  INSERT INTO customer_login_attempts (user_id, failed_attempts, last_failed_attempt, locked_until, updated_at)
  VALUES (target_user_id, current_attempts, NOW(), new_locked_until, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    failed_attempts = current_attempts,
    last_failed_attempt = NOW(),
    locked_until = new_locked_until,
    updated_at = NOW();
  
  -- Return the results
  RETURN QUERY
  SELECT 
    current_attempts,
    (new_locked_until IS NOT NULL AND new_locked_until > NOW()),
    new_locked_until;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if customer account is locked
CREATE OR REPLACE FUNCTION is_customer_account_locked(user_email TEXT)
RETURNS TABLE (
  is_locked BOOLEAN,
  locked_until_ts TIMESTAMPTZ,
  attempts INTEGER
) AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    -- User doesn't exist, not locked
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, 0;
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    (c.locked_until IS NOT NULL AND c.locked_until > NOW()),
    c.locked_until,
    c.failed_attempts
  FROM customer_login_attempts c
  WHERE c.user_id = target_user_id;
  
  -- If no record exists, account is not locked
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function to remove expired lockouts (can be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_lockouts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Clear expired admin lockouts
  UPDATE admin_users
  SET 
    failed_login_attempts = 0,
    last_failed_login = NULL,
    locked_until = NULL
  WHERE locked_until IS NOT NULL AND locked_until <= NOW();
  
  -- Delete expired customer lockouts
  DELETE FROM customer_login_attempts
  WHERE locked_until IS NOT NULL AND locked_until <= NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON COLUMN admin_users.failed_login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN admin_users.last_failed_login IS 'Timestamp of the last failed login attempt';
COMMENT ON COLUMN admin_users.locked_until IS 'Account is locked until this timestamp (NULL if not locked)';
COMMENT ON TABLE customer_login_attempts IS 'Tracks login attempts for customer accounts (Supabase Auth users)';
COMMENT ON FUNCTION reset_admin_login_attempts IS 'Resets failed login counter for admin users on successful login';
COMMENT ON FUNCTION increment_admin_failed_login IS 'Increments failed login counter and locks account if threshold exceeded';
COMMENT ON FUNCTION is_admin_account_locked IS 'Checks if an admin account is currently locked';
COMMENT ON FUNCTION reset_customer_login_attempts IS 'Resets failed login counter for customers on successful login';
COMMENT ON FUNCTION increment_customer_failed_login IS 'Increments failed login counter and locks customer account if threshold exceeded';
COMMENT ON FUNCTION is_customer_account_locked IS 'Checks if a customer account is currently locked';
COMMENT ON FUNCTION cleanup_expired_lockouts IS 'Removes expired lockout records (for periodic cleanup)';
