-- Add status and error tracking columns to exports table
ALTER TABLE exports
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'processing' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS files JSONB;

-- Add comments
COMMENT ON COLUMN exports.status IS 'Export status: pending, processing, completed, or failed';
COMMENT ON COLUMN exports.error_message IS 'Error message if export failed';
COMMENT ON COLUMN exports.files IS 'JSON array of generated file paths';

-- Update existing exports to completed status (they were created before this column existed)
UPDATE exports
SET status = 'completed'
WHERE status IS NULL;
