-- Migration: Add poll expiration feature
-- This migration adds an expires_at column to the polls table to support poll expiration

-- Add expires_at column to polls table
ALTER TABLE polls 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE NULL;

-- Add index for efficient querying of expired polls
CREATE INDEX idx_polls_expires_at ON polls(expires_at) WHERE expires_at IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN polls.expires_at IS 'Optional expiration date for the poll. When set, the poll will automatically close at this time.';
