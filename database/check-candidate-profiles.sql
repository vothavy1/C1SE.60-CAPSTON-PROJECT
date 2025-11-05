-- Kiểm tra user và candidate trong database

-- 1. Kiểm tra user tồn tại
SELECT 
    u.user_id,
    u.username,
    u.email,
    u.full_name,
    r.role_name,
    u.is_active,
    u.created_at
FROM users u
LEFT JOIN roles r ON u.role_id = r.role_id
ORDER BY u.created_at DESC
LIMIT 10;

-- 2. Kiểm tra candidate profiles
SELECT 
    c.candidate_id,
    c.user_id,
    c.first_name,
    c.last_name,
    c.email,
    c.status,
    c.created_at
FROM candidates c
ORDER BY c.created_at DESC
LIMIT 10;

-- 3. Kiểm tra user nào CHƯA có candidate profile
SELECT 
    u.user_id,
    u.username,
    u.email,
    r.role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.role_id
LEFT JOIN candidates c ON u.user_id = c.user_id
WHERE c.candidate_id IS NULL
AND r.role_name = 'CANDIDATE';

-- 4. Tạo candidate profile cho user_id = 1 (nếu chưa có)
-- Uncomment để chạy:
/*
INSERT INTO candidates (user_id, first_name, last_name, email, status, created_at)
SELECT 
    u.user_id,
    COALESCE(u.full_name, u.username, 'User') as first_name,
    '' as last_name,
    u.email,
    'ACTIVE' as status,
    NOW() as created_at
FROM users u
WHERE u.user_id = 1
AND NOT EXISTS (
    SELECT 1 FROM candidates WHERE user_id = 1
);
*/

-- 5. Xem kết quả
SELECT 
    u.user_id,
    u.username,
    c.candidate_id,
    c.first_name,
    c.status
FROM users u
LEFT JOIN candidates c ON u.user_id = c.user_id
WHERE u.user_id = 1;
