-- Add missing updated_at column to exports table
-- This column is required by the Inngest export generation function

ALTER TABLE exports
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add comment explaining the column
COMMENT ON COLUMN exports.updated_at IS 'Timestamp of last update to export record';

-- Create index for performance (often used in ORDER BY queries)
CREATE INDEX IF NOT EXISTS idx_exports_updated_at ON exports(updated_at);

-- Update existing records to have updated_at = created_at
UPDATE exports
SET updated_at = created_at
WHERE updated_at IS NULL;
