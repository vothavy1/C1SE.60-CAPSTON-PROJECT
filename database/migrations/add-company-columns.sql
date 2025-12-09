-- Add company_id columns and insert sample data
USE cs60_recruitment;

-- Add company_id to users table if not exists
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=DATABASE()
   AND TABLE_NAME='users'
   AND COLUMN_NAME='company_id') = 0,
  'ALTER TABLE users ADD COLUMN company_id INT NULL AFTER role_id;',
  'SELECT 1;'
));
PREPARE alterUsersStatement FROM @preparedStatement;
EXECUTE alterUsersStatement;
DEALLOCATE PREPARE alterUsersStatement;

-- Add company_id to candidates table if not exists
SET @preparedStatement2 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=DATABASE()
   AND TABLE_NAME='candidates'
   AND COLUMN_NAME='company_id') = 0,
  'ALTER TABLE candidates ADD COLUMN company_id INT NULL AFTER user_id;',
  'SELECT 1;'
));
PREPARE alterCandidatesStatement FROM @preparedStatement2;
EXECUTE alterCandidatesStatement;
DEALLOCATE PREPARE alterCandidatesStatement;

-- Add foreign key constraints
SET @add_fk1 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
   WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND CONSTRAINT_NAME='fk_users_company') = 0,
  'ALTER TABLE users ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE SET NULL ON UPDATE CASCADE;',
  'SELECT 1;'
));
PREPARE stmt1 FROM @add_fk1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @add_fk2 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
   WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='candidates' AND CONSTRAINT_NAME='fk_candidates_company') = 0,
  'ALTER TABLE candidates ADD CONSTRAINT fk_candidates_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE SET NULL ON UPDATE CASCADE;',
  'SELECT 1;'
));
PREPARE stmt2 FROM @add_fk2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Insert sample companies
INSERT IGNORE INTO companies (company_name, company_code, email, description) VALUES
('FPT Corporation', 'FPT', 'hr@fpt.com.vn', 'Công ty công nghệ hàng đầu Việt Nam'),
('Viettel Group', 'VIETTEL', 'hr@viettel.com.vn', 'Tập đoàn viễn thông quân đội'),
('VNG Corporation', 'VNG', 'hr@vng.com.vn', 'Công ty Internet và giải trí trực tuyến'),
('Grab Vietnam', 'GRAB', 'hr@grab.com', 'Nền tảng siêu ứng dụng'),
('Shopee Vietnam', 'SHOPEE', 'hr@shopee.vn', 'Nền tảng thương mại điện tử');

SELECT 'Migration completed successfully!' AS status;
SELECT * FROM companies;
