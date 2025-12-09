-- Migration: Thêm cột status vào bảng users
-- Date: 2025-12-03

-- Thêm cột status với ENUM values
ALTER TABLE users 
ADD COLUMN status ENUM('ACTIVE', 'PENDING', 'INACTIVE') 
NOT NULL DEFAULT 'ACTIVE' 
COMMENT 'ACTIVE: Có thể đăng nhập, PENDING: Chờ phê duyệt, INACTIVE: Vô hiệu hóa';

-- Cập nhật tất cả user hiện tại thành ACTIVE
UPDATE users SET status = 'ACTIVE' WHERE status IS NULL;

-- Tạo index để tối ưu query
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_company_role ON users(company_id, role_id);