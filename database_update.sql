-- SQL Script to add mobile_number column to voters table
-- Run this in your MySQL database

USE voter_db;

-- Add mobile_number column to voters table
ALTER TABLE voters 
ADD COLUMN mobile_number VARCHAR(10) AFTER voter_id;

-- Make mobile_number unique to prevent duplicate registrations
ALTER TABLE voters 
ADD UNIQUE INDEX idx_mobile_number (mobile_number);

-- Display updated table structure
DESC voters;

-- Display current data
SELECT * FROM voters;
