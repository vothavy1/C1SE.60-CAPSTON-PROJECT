-- Add company_id to tests and questions tables
USE cs60_recruitment;

-- Add company_id to tests table
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tests' AND COLUMN_NAME='company_id') = 0,
    'ALTER TABLE tests ADD COLUMN company_id INT NULL AFTER created_by',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add company_id to questions table
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='questions' AND COLUMN_NAME='company_id') = 0,
    'ALTER TABLE questions ADD COLUMN company_id INT NULL AFTER created_by',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing tests to assign to CS60 Company (company_id = 1)
UPDATE tests SET company_id = 1 WHERE company_id IS NULL;

-- Update existing questions to assign to CS60 Company (company_id = 1)
UPDATE questions SET company_id = 1 WHERE company_id IS NULL;

SELECT 'Company columns added to tests and questions!' AS status;
SELECT COUNT(*) as total_tests, company_id FROM tests GROUP BY company_id;
SELECT COUNT(*) as total_questions, company_id FROM questions GROUP BY company_id;
