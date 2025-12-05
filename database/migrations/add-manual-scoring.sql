-- Migration: Add manual scoring and essay scoring support
-- Date: 2025-12-05
-- Description: Add columns for manual scoring by recruiters and essay question scoring

-- Add manual_score column to candidate_tests table
ALTER TABLE candidate_tests 
ADD COLUMN IF NOT EXISTS manual_score DECIMAL(5,2) DEFAULT 0 
COMMENT 'Manual score given by recruiter for essay questions' 
AFTER score;

-- Add essay_score, selected_option_id, and answer_text columns to candidate_test_answers table
ALTER TABLE candidate_test_answers 
ADD COLUMN IF NOT EXISTS essay_score DECIMAL(5,2) DEFAULT NULL 
COMMENT 'Score for essay questions' 
AFTER score_earned;

ALTER TABLE candidate_test_answers 
ADD COLUMN IF NOT EXISTS selected_option_id INT DEFAULT NULL 
COMMENT 'Selected option ID for multiple choice questions' 
AFTER question_id;

ALTER TABLE candidate_test_answers 
ADD COLUMN IF NOT EXISTS answer_text TEXT DEFAULT NULL 
COMMENT 'Text answer for essay questions' 
AFTER selected_option_id;

-- Add index on selected_option_id for better query performance
ALTER TABLE candidate_test_answers 
ADD INDEX IF NOT EXISTS idx_selected_option_id (selected_option_id);

-- Verify changes
SELECT 'Migration completed successfully' AS status;
