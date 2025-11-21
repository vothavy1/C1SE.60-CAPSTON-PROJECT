-- Simple migration: Add company_id columns only
USE cs60_recruitment;

-- Add company_id to users (ignore error if exists)
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='company_id') = 0,
    'ALTER TABLE users ADD COLUMN company_id INT NULL AFTER role_id',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add company_id to candidates (ignore error if exists)
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='candidates' AND COLUMN_NAME='company_id') = 0,
    'ALTER TABLE candidates ADD COLUMN company_id INT NULL AFTER user_id',
    'SELECT 1'
));
PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration completed!' AS status;
SHOW COLUMNS FROM users LIKE 'company_id';
SHOW COLUMNS FROM candidates LIKE 'company_id';
