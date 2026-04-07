-- Add invite_code column to invite_requests
ALTER TABLE invite_requests ADD COLUMN IF NOT EXISTS invite_code text;
