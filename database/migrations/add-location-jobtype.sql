-- Add location and job_type columns to job_positions table
ALTER TABLE job_positions 
ADD COLUMN location VARCHAR(255) DEFAULT NULL AFTER requirements,
ADD COLUMN job_type VARCHAR(50) DEFAULT 'Full-time' AFTER location;
