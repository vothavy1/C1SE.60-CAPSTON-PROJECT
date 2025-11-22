-- Cập nhật ENUM nhanh cho admin_notifications
USE cs60_recruitment;

ALTER TABLE admin_notifications 
MODIFY COLUMN type ENUM(
  'RECRUITER_NO_COMPANY', 
  'RECRUITER_REQUEST_NEW_COMPANY',
  'SYSTEM_ALERT'
) NOT NULL COMMENT 'Loại thông báo';

SELECT 'ENUM updated successfully!' AS Status;
