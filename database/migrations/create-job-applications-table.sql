-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  application_id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NULL,
  company_id INT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  position VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NULL,
  experience_years INT NULL DEFAULT 0,
  cv_file_name VARCHAR(255) NOT NULL,
  cv_file_path VARCHAR(500) NOT NULL,
  status ENUM('pending', 'reviewing', 'accepted', 'rejected') DEFAULT 'pending',
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (job_id) REFERENCES job_positions(position_id) ON DELETE SET NULL,
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE SET NULL,
  
  INDEX idx_company_id (company_id),
  INDEX idx_job_id (job_id),
  INDEX idx_status (status),
  INDEX idx_applied_at (applied_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
