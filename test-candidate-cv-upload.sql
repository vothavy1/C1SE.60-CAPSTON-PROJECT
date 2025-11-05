-- Test Script: Candidate Management với CV Upload
-- Kiểm tra dữ liệu sau khi thêm ứng viên

USE cs60_recruitment;

-- 1. Xem tất cả ứng viên vừa tạo
SELECT 
    c.candidate_id,
    c.first_name,
    c.last_name,
    c.email,
    c.source,
    c.status,
    c.created_at,
    COUNT(cr.resume_id) as resume_count
FROM candidates c
LEFT JOIN candidate_resumes cr ON c.candidate_id = cr.candidate_id
GROUP BY c.candidate_id
ORDER BY c.created_at DESC
LIMIT 10;

-- 2. Xem chi tiết CV/Resume đã upload
SELECT 
    cr.resume_id,
    cr.candidate_id,
    c.first_name,
    c.last_name,
    c.email,
    cr.file_name,
    cr.file_path,
    cr.file_type,
    ROUND(cr.file_size / 1024, 2) as file_size_kb,
    cr.is_primary,
    cr.uploaded_at
FROM candidate_resumes cr
JOIN candidates c ON cr.candidate_id = c.candidate_id
ORDER BY cr.uploaded_at DESC
LIMIT 10;

-- 3. Thống kê ứng viên theo nguồn
SELECT 
    source,
    COUNT(*) as total_candidates,
    SUM(CASE WHEN status = 'NEW' THEN 1 ELSE 0 END) as new_count,
    SUM(CASE WHEN status = 'HIRED' THEN 1 ELSE 0 END) as hired_count
FROM candidates
GROUP BY source
ORDER BY total_candidates DESC;

-- 4. Kiểm tra ứng viên có CV
SELECT 
    'With Resume' as category,
    COUNT(DISTINCT c.candidate_id) as count
FROM candidates c
JOIN candidate_resumes cr ON c.candidate_id = cr.candidate_id

UNION ALL

SELECT 
    'Without Resume' as category,
    COUNT(*) as count
FROM candidates c
WHERE NOT EXISTS (
    SELECT 1 FROM candidate_resumes cr 
    WHERE cr.candidate_id = c.candidate_id
);

-- 5. Xem ứng viên mới nhất với thông tin đầy đủ
SELECT 
    c.*,
    cr.file_name as resume_file_name,
    cr.file_path as resume_path,
    cr.uploaded_at as resume_uploaded_at
FROM candidates c
LEFT JOIN candidate_resumes cr ON c.candidate_id = cr.candidate_id AND cr.is_primary = 1
ORDER BY c.created_at DESC
LIMIT 5;

-- 6. Tìm CV file lớn nhất
SELECT 
    c.first_name,
    c.last_name,
    cr.file_name,
    ROUND(cr.file_size / 1024 / 1024, 2) as file_size_mb
FROM candidate_resumes cr
JOIN candidates c ON cr.candidate_id = c.candidate_id
ORDER BY cr.file_size DESC
LIMIT 5;

-- 7. Test query - Ứng viên từ Facebook/TikTok/Workshop
SELECT 
    source,
    first_name,
    last_name,
    email,
    status,
    created_at
FROM candidates
WHERE source IN ('Facebook', 'TikTok', 'Workshop')
ORDER BY created_at DESC;
