-- Add progress tracking columns to exports table
ALTER TABLE exports 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress_message TEXT DEFAULT '';

-- Add comment to progress column
COMMENT ON COLUMN exports.progress IS 'Progress percentage from 0-100';
COMMENT ON COLUMN exports.progress_message IS 'Current stage description for user display';
