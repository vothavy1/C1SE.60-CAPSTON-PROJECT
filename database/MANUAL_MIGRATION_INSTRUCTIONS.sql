-- Hướng dẫn chạy migration thủ công
-- 1. Mở phpMyAdmin hoặc MySQL Workbench
-- 2. Chọn database cs60_recruitment  
-- 3. Chạy các câu lệnh SQL sau:

-- Thêm cột status
ALTER TABLE users 
ADD COLUMN status ENUM('ACTIVE', 'PENDING', 'INACTIVE') 
NOT NULL DEFAULT 'ACTIVE' 
COMMENT 'ACTIVE: Có thể đăng nhập, PENDING: Chờ phê duyệt, INACTIVE: Vô hiệu hóa';

-- Cập nhật tất cả user hiện tại thành ACTIVE
UPDATE users SET status = 'ACTIVE';

-- Tạo index để tối ưu query
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_company_role ON users(company_id, role_id);

-- Kiểm tra kết quả
SELECT user_id, username, email, role_id, company_id, is_active, status FROM users LIMIT 5;