-- Fix companies table structure
USE cs60_recruitment;

-- Drop and recreate companies table with correct structure
DROP TABLE IF EXISTS companies;

CREATE TABLE companies (
  company_id INT AUTO_INCREMENT PRIMARY KEY,
  companyName VARCHAR(200) NOT NULL UNIQUE,
  companyCode VARCHAR(50) UNIQUE,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(200),
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_name (companyName),
  INDEX idx_company_code (companyCode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample companies
INSERT INTO companies (companyName, companyCode, email, description) VALUES
('CS60 Company', 'CS60', 'contact@cs60.com', 'Công ty CS60 - Test Company'),
('Recruitment Agency', 'RECRUIT', 'hr@recruitment.com', 'Công ty tuyển dụng nhân sự'),
('Digital Solutions', 'DIGITAL', 'info@digitalsolutions.com', 'Công ty giải pháp công nghệ');

SELECT 'Companies table recreated successfully!' AS status;
SELECT * FROM companies;
