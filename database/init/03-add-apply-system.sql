-- =====================================================
-- Migration: Add Apply System
-- Description: Add status column to candidates table
-- Date: 2025-11-06
-- =====================================================

USE cs60_recruitment;

-- Check and add columns to candidates table
-- Add phone column if not exists
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'cs60_recruitment' AND TABLE_NAME = 'candidates' AND COLUMN_NAME = 'phone');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE candidates ADD COLUMN phone VARCHAR(20) AFTER email', 
    'SELECT "Column phone already exists" as Info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add company_name column if not exists
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'cs60_recruitment' AND TABLE_NAME = 'candidates' AND COLUMN_NAME = 'company_name');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE candidates ADD COLUMN company_name VARCHAR(255) AFTER phone', 
    'SELECT "Column company_name already exists" as Info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add status column if not exists
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'cs60_recruitment' AND TABLE_NAME = 'candidates' AND COLUMN_NAME = 'status');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE candidates ADD COLUMN status ENUM(''Pending'', ''Passed'', ''Failed'') DEFAULT ''Pending'' AFTER company_name', 
    'SELECT "Column status already exists" as Info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for status filtering
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = 'cs60_recruitment' AND TABLE_NAME = 'candidates' AND INDEX_NAME = 'idx_candidate_status');
SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_candidate_status ON candidates(status)', 
    'SELECT "Index idx_candidate_status already exists" as Info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing candidates to Pending if NULL
UPDATE candidates SET status = 'Pending' WHERE status IS NULL;

-- Add updated_at column if not exists
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'cs60_recruitment' AND TABLE_NAME = 'candidates' AND COLUMN_NAME = 'updated_at');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE candidates ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at', 
    'SELECT "Column updated_at already exists" as Info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Show updated structure
DESCRIBE candidates;

SELECT 'Apply System Migration Completed Successfully!' as Status;
