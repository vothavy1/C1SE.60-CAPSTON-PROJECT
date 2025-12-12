-- Add deadline column to job_positions table
ALTER TABLE job_positions 
ADD COLUMN deadline DATE NULL COMMENT 'Thời hạn nộp CV';

-- Update existing records with a default deadline (30 days from created_at)
UPDATE job_positions 
SET deadline = DATE_ADD(created_at, INTERVAL 30 DAY)
WHERE deadline IS NULL;
