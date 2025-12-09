-- Migration: Add RECRUITER_REQUEST_NEW_COMPANY to admin_notifications type enum
-- Date: 2025-11-23
-- Description: Thêm type mới để xử lý trường hợp recruiter yêu cầu thêm công ty mới

USE cs60_recruitment;

-- Cập nhật ENUM type trong bảng admin_notifications
ALTER TABLE admin_notifications 
MODIFY COLUMN type ENUM(
  'RECRUITER_NO_COMPANY', 
  'RECRUITER_REQUEST_NEW_COMPANY',
  'SYSTEM_ALERT'
) NOT NULL COMMENT 'Loại thông báo';

-- Kiểm tra kết quả
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'cs60'
  AND TABLE_NAME = 'admin_notifications'
  AND COLUMN_NAME = 'type';

-- Hiển thị thông báo thành công
SELECT '✅ Migration completed: RECRUITER_REQUEST_NEW_COMPANY added to admin_notifications.type' AS status;
