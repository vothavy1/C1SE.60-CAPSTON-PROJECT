-- Update recruitment_reports table to support more report types
-- This script updates the existing database schema for improved reporting

-- Check if we need to modify the recruitment_reports table
ALTER TABLE recruitment_reports 
MODIFY COLUMN report_type ENUM(
  'CANDIDATE_PIPELINE', 
  'TEST_PERFORMANCE', 
  'INTERVIEWER_EFFICIENCY', 
  'HIRING_METRICS', 
  'CUSTOM',
  'VIOLATION',
  'STATISTICS',
  'ACTIVITY_LOG',
  'NOTIFICATION'
) NOT NULL
COMMENT 'Type of recruitment report';

-- Add index on report_type for faster queries
CREATE INDEX IF NOT EXISTS idx_report_type ON recruitment_reports(report_type);

-- Add index on created_by for faster queries
CREATE INDEX IF NOT EXISTS idx_created_by ON recruitment_reports(created_by);

-- Add index on created_at for date range queries
CREATE INDEX IF NOT EXISTS idx_created_at ON recruitment_reports(created_at);

-- Update test_fraud_logs table comments
ALTER TABLE test_fraud_logs 
MODIFY COLUMN event_type ENUM('TAB_SWITCH', 'COPY_PASTE', 'MULTIPLE_WINDOWS', 'SCREENSHOT', 'OTHER') NOT NULL
COMMENT 'Type of fraud event detected during test';

ALTER TABLE test_fraud_logs 
MODIFY COLUMN event_count INT DEFAULT 1
COMMENT 'Number of times this event occurred';

ALTER TABLE test_fraud_logs 
MODIFY COLUMN event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
COMMENT 'When the fraud event was detected';

ALTER TABLE test_fraud_logs 
MODIFY COLUMN details TEXT
COMMENT 'Additional details about the fraud event';

-- Add useful indexes for test_fraud_logs
CREATE INDEX IF NOT EXISTS idx_candidate_test_id ON test_fraud_logs(candidate_test_id);
CREATE INDEX IF NOT EXISTS idx_event_type ON test_fraud_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_event_time ON test_fraud_logs(event_time);

-- Add index on candidate_tests for better performance
CREATE INDEX IF NOT EXISTS idx_status ON candidate_tests(status);
CREATE INDEX IF NOT EXISTS idx_end_time ON candidate_tests(end_time);

-- Create a view for easy violation reporting
CREATE OR REPLACE VIEW v_violation_reports AS
SELECT 
  tfl.log_id,
  tfl.candidate_test_id,
  tfl.event_type,
  tfl.event_count,
  tfl.event_time,
  tfl.details,
  ct.candidate_id,
  ct.test_id,
  ct.status AS test_status,
  ct.score AS test_score,
  ct.passing_status,
  c.first_name,
  c.last_name,
  c.email AS candidate_email,
  t.test_name,
  t.duration_minutes,
  ctr.total_score,
  ctr.percentage,
  ctr.passed
FROM test_fraud_logs tfl
INNER JOIN candidate_tests ct ON tfl.candidate_test_id = ct.candidate_test_id
INNER JOIN candidates c ON ct.candidate_id = c.candidate_id
INNER JOIN tests t ON ct.test_id = t.test_id
LEFT JOIN candidate_test_results ctr ON ct.candidate_test_id = ctr.candidate_test_id;

-- Create a view for test statistics
CREATE OR REPLACE VIEW v_test_statistics AS
SELECT 
  ct.candidate_test_id,
  ct.candidate_id,
  ct.test_id,
  ct.status,
  ct.start_time,
  ct.end_time,
  c.first_name,
  c.last_name,
  c.email AS candidate_email,
  t.test_name,
  ctr.total_score,
  ctr.percentage,
  ctr.passed,
  (SELECT COUNT(*) FROM test_fraud_logs WHERE candidate_test_id = ct.candidate_test_id) AS violation_count
FROM candidate_tests ct
INNER JOIN candidates c ON ct.candidate_id = c.candidate_id
INNER JOIN tests t ON ct.test_id = t.test_id
LEFT JOIN candidate_test_results ctr ON ct.candidate_test_id = ctr.candidate_test_id
WHERE ct.status = 'COMPLETED';

-- Insert some sample reports for testing (optional)
-- Uncomment if you want sample data
/*
INSERT INTO recruitment_reports (report_name, report_type, parameters, created_by) 
VALUES 
  ('Daily Violation Summary', 'VIOLATION', '{"date":"2024-01-01"}', 1),
  ('Weekly Test Statistics', 'STATISTICS', '{"week":1,"year":2024}', 1),
  ('Monthly Performance Report', 'TEST_PERFORMANCE', '{"month":1,"year":2024}', 1);
*/

-- Log the migration
INSERT INTO system_logs (user_id, action, description, ip_address) 
VALUES (1, 'DATABASE_MIGRATION', 'Updated recruitment_reports and test_fraud_logs schema with improved indexes and views', 'localhost');

SELECT 'Database schema updated successfully for violation reporting system' AS status;
