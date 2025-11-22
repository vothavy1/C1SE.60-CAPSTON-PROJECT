-- =====================================================
-- RUN THIS SQL TO CREATE NOTIFICATION SYSTEM
-- =====================================================
-- Database: cs60
-- Execute in MySQL Workbench or phpMyAdmin
-- =====================================================

USE cs60_recruitment;

-- Drop table if exists (for clean install)
DROP TABLE IF EXISTS admin_notifications;

-- Create admin_notifications table
CREATE TABLE admin_notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('RECRUITER_NO_COMPANY', 'RECRUITER_REQUEST_NEW_COMPANY', 'SYSTEM_ALERT') NOT NULL COMMENT 'Loại thông báo',
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

-- Insert test notification
INSERT INTO admin_notifications (type, title, message, priority) 
VALUES ('SYSTEM_ALERT', '✅ Hệ thống thông báo đã được kích hoạt', 'Hệ thống thông báo admin đã được cài đặt thành công. Bạn sẽ nhận được thông báo khi:\n\n1. Candidate tự đăng ký từ bên ngoài\n2. Recruiter đăng nhập nhưng chưa có công ty\n3. Các sự kiện hệ thống khác', 'LOW');

-- Success message
SELECT '✅ Notification system installed successfully!' AS Status;
SELECT COUNT(*) AS 'Total Notifications' FROM admin_notifications;
