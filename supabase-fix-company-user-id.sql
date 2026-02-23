-- Fix: Allow NULL user_id in companies table
-- This allows creating companies without assigning a user immediately

-- First, check if the constraint exists and drop it
ALTER TABLE companies ALTER COLUMN user_id DROP NOT NULL;

-- Make user_id nullable
-- Note: Run this in Supabase SQL Editor if the above doesn't work
-- ALTER TABLE companies MODIFY COLUMN user_id VARCHAR NULL;

-- Alternative for PostgreSQL:
-- ALTER TABLE companies ALTER COLUMN user_id SET DEFAULT NULL;
