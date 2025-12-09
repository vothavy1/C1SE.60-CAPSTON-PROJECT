-- Migration: Add companies table and company_id to users and candidates
USE cs60_recruitment;

-- Drop existing foreign keys if they exist
SET @drop_fk1 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
   WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND CONSTRAINT_NAME='fk_users_company') > 0,
  'ALTER TABLE users DROP FOREIGN KEY fk_users_company;',
  'SELECT 1;'
));
PREPARE stmt1 FROM @drop_fk1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @drop_fk2 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
   WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='candidates' AND CONSTRAINT_NAME='fk_candidates_company') > 0,
  'ALTER TABLE candidates DROP FOREIGN KEY fk_candidates_company;',
  'SELECT 1;'
));
PREPARE stmt2 FROM @drop_fk2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  company_id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(200) NOT NULL UNIQUE,
  company_code VARCHAR(50) UNIQUE,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(200),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_name (company_name),
  INDEX idx_company_code (company_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add company_id to users table if not exists
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=DATABASE()
   AND TABLE_NAME='users'
   AND COLUMN_NAME='company_id') = 0,
  'ALTER TABLE users ADD COLUMN company_id INT NULL AFTER role_id, ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE SET NULL ON UPDATE CASCADE;',
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
  'ALTER TABLE candidates ADD COLUMN company_id INT NULL AFTER user_id, ADD CONSTRAINT fk_candidates_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE SET NULL ON UPDATE CASCADE;',
  'SELECT 1;'
));
PREPARE alterCandidatesStatement FROM @preparedStatement2;
EXECUTE alterCandidatesStatement;
DEALLOCATE PREPARE alterCandidatesStatement;

-- Insert sample companies
INSERT IGNORE INTO companies (company_name, company_code, email, description) VALUES
('FPT Corporation', 'FPT', 'hr@fpt.com.vn', 'Công ty công nghệ hàng đầu Việt Nam'),
('Viettel Group', 'VIETTEL', 'hr@viettel.com.vn', 'Tập đoàn viễn thông quân đội'),
('VNG Corporation', 'VNG', 'hr@vng.com.vn', 'Công ty Internet và giải trí trực tuyến'),
('Grab Vietnam', 'GRAB', 'hr@grab.com', 'Nền tảng siêu ứng dụng'),
('Shopee Vietnam', 'SHOPEE', 'hr@shopee.vn', 'Nền tảng thương mại điện tử');

SELECT 'Migration completed successfully!' AS status;
