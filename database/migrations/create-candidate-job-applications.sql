-- Create candidate_job_applications table
CREATE TABLE IF NOT EXISTS candidate_job_applications (
    application_id INT PRIMARY KEY AUTO_INCREMENT,
    candidate_id INT NOT NULL,
    position_id INT NOT NULL,
    status ENUM('pending', 'reviewed', 'shortlisted', 'rejected', 'accepted') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recruiter_id INT NULL,
    notes TEXT NULL,
    FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    FOREIGN KEY (position_id) REFERENCES job_positions(position_id) ON DELETE CASCADE,
    FOREIGN KEY (recruiter_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_candidate (candidate_id),
    INDEX idx_position (position_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
