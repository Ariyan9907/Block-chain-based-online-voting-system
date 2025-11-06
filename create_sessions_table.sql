-- Create voting_sessions table to store historical voting session results

CREATE TABLE IF NOT EXISTS voting_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_number INT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    total_votes INT DEFAULT 0,
    total_candidates INT DEFAULT 0,
    winner_candidate_id INT,
    winner_name VARCHAR(255),
    winner_party VARCHAR(255),
    winner_votes INT DEFAULT 0,
    candidates_data JSON,
    closed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_number (session_number),
    INDEX idx_closed_at (closed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Create view for easy querying
CREATE OR REPLACE VIEW v_session_results AS
SELECT 
    id,
    session_number,
    DATE_FORMAT(start_date, '%Y-%m-%d %H:%i') as voting_start,
    DATE_FORMAT(end_date, '%Y-%m-%d %H:%i') as voting_end,
    total_votes,
    total_candidates,
    winner_name,
    winner_party,
    winner_votes,
    DATE_FORMAT(closed_at, '%Y-%m-%d %H:%i:%s') as session_closed
FROM voting_sessions
ORDER BY session_number DESC;
