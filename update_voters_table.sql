-- SQL Script to Add Mobile Number Support to Voters Table
-- For OTP Authentication Feature
-- Database: voter_db

USE voter_db;

-- Add mobile_number column to voters table
ALTER TABLE voters 
ADD COLUMN mobile_number VARCHAR(15) UNIQUE AFTER password;

-- Add index for better query performance
CREATE INDEX idx_mobile_number ON voters(mobile_number);

-- Verify the changes
DESCRIBE voters;

-- Display success message
SELECT 'Mobile number column added successfully!' AS Status;
SELECT 'OTP authentication is now ready to use!' AS Message;
