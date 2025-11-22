-- Migration: Create admin_notifications table
-- Created: 2025-11-23
-- Description: Bảng lưu thông báo cho admin về các sự kiện bất thường

CREATE TABLE IF NOT EXISTS admin_notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('RECRUITER_NO_COMPANY', 'SYSTEM_ALERT') NOT NULL COMMENT 'Loại thông báo',
  title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề thông báo',
  message TEXT NOT NULL COMMENT 'Nội dung thông báo',
  related_user_id INT NULL COMMENT 'ID user liên quan',
  related_data JSON NULL COMMENT 'Dữ liệu bổ sung (username, email, ip...)',
  is_read BOOLEAN DEFAULT FALSE COMMENT 'Đã đọc chưa',
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM' COMMENT 'Mức độ ưu tiên',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_is_read (is_read),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at),
  INDEX idx_priority (priority),
  FOREIGN KEY (related_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data for testing
-- INSERT INTO admin_notifications (type, title, message, priority) 
-- VALUES ('SYSTEM_ALERT', 'Hệ thống khởi động', 'Hệ thống thông báo admin đã được kích hoạt', 'LOW');
