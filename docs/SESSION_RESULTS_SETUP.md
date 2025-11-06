# Session Results Storage - Setup Guide

## 📋 Overview

This feature automatically saves voting session results to the MySQL database when an admin resets a voting session. The system stores:
- Session number
- Voting period (start/end dates)
- All candidates and their vote counts
- Winner information
- Total votes cast
- Complete candidates data in JSON format

## 🗄️ Database Setup

### Step 1: Create the voting_sessions Table

Run the following SQL script to create the necessary database table:

```bash
mysql -u root -p voter_db < create_sessions_table.sql
```

Or manually execute in MySQL:

```sql
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
);
```

### Step 2: Verify Table Creation

```bash
mysql -u root -p -e "USE voter_db; DESCRIBE voting_sessions;"
```

## 🚀 How It Works

### Automatic Storage Process

1. **Admin clicks "Reset Voting" button** on admin panel
2. **System collects data** from blockchain:
   - Current session number
   - Voting start/end dates
   - All candidate information
   - Vote counts for each candidate
3. **Calculates winner** (candidate with most votes)
4. **Saves to database** via `/api/save-session-results` endpoint
5. **Resets blockchain** voting data
6. **Displays success message**

### Console Output

When a session is saved, you'll see formatted output in the server console:

```
======================================================================
💾 VOTING SESSION RESULTS SAVED TO DATABASE
📊 Session Number: 1
📅 Period: 2025-10-08 10:00:00 to 2025-10-08 18:00:00
🗳️  Total Votes: 150
👥 Total Candidates: 5
🏆 Winner: John Doe (Democratic Party)
🎯 Winning Votes: 75
======================================================================
```

## 📊 Viewing Session History

### Admin Panel Access

1. Go to Admin Panel (http://localhost:8080/admin.html)
2. Scroll to "View Session History" section
3. Click "📊 View Session History" button
4. See all past voting sessions with:
   - Winner information with trophy 🏆
   - Total votes and candidates
   - Voting period dates
   - Detailed candidate rankings
   - Vote percentages

### API Endpoints

#### Get All Sessions
```javascript
GET /api/session-results
```

Response:
```json
{
  "sessions": [
    {
      "id": 1,
      "session_number": 1,
      "start_date": "2025-10-08T10:00:00.000Z",
      "end_date": "2025-10-08T18:00:00.000Z",
      "total_votes": 150,
      "total_candidates": 5,
      "winner_name": "John Doe",
      "winner_party": "Democratic Party",
      "winner_votes": 75,
      "candidates_data": [...],
      "closed_at": "2025-10-08T18:30:15.000Z"
    }
  ]
}
```

#### Get Specific Session
```javascript
GET /api/session-results/:sessionNumber
```

Example: `GET /api/session-results/1`

## 🔧 Code Changes Summary

### Backend (index.js)
- ✅ Added `/api/save-session-results` POST endpoint
- ✅ Added `/api/session-results` GET endpoint
- ✅ Added `/api/session-results/:sessionNumber` GET endpoint
- ✅ Added `/session-history.html` route

### Frontend (app.js)
- ✅ Updated `resetVoting` click handler to:
  1. Fetch all candidate data from blockchain
  2. Save to database via API
  3. Then reset blockchain voting
  4. Show progress messages

### UI (admin.html)
- ✅ Added "View Session History" section with link

### New Files Created
- ✅ `create_sessions_table.sql` - Database schema
- ✅ `src/html/session-history.html` - View past sessions
- ✅ `SESSION_RESULTS_SETUP.md` - This guide

## 📈 Session History Page Features

### Display Elements
- **Session Cards**: Each session shown in a styled card
- **Winner Highlight**: Gold trophy badge for winner
- **Statistics**: Total votes, candidates, winner percentage
- **Rankings**: Top 3 candidates get 🥇🥈🥉 medals
- **Expandable Details**: Click to view all candidates
- **Vote Percentages**: Calculated for each candidate
- **Timestamps**: Session dates and closed time

### Sorting
- Sessions displayed newest first (descending order)
- Candidates within each session ranked by votes

## 🧪 Testing the Feature

### Test Scenario

1. **Start your server**:
   ```bash
   node index.js
   ```

2. **Login as admin** and create a voting session:
   - Add candidates
   - Set voting dates
   - Allow users to vote

3. **After voting period ends**, click "Reset Voting"

4. **Verify in console**:
   - Should see "💾 VOTING SESSION RESULTS SAVED TO DATABASE"
   - Should see winner information

5. **Check database**:
   ```sql
   SELECT * FROM voting_sessions ORDER BY session_number DESC LIMIT 1;
   ```

6. **View in UI**:
   - Go to Admin Panel
   - Click "📊 View Session History"
   - Verify session appears with correct data

## 🎯 Data Stored

For each session, the following is stored:

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT | Auto-increment primary key |
| `session_number` | INT | Blockchain session number |
| `start_date` | DATETIME | Voting start timestamp |
| `end_date` | DATETIME | Voting end timestamp |
| `total_votes` | INT | Total votes cast |
| `total_candidates` | INT | Number of candidates |
| `winner_candidate_id` | INT | ID of winning candidate |
| `winner_name` | VARCHAR | Winner's name |
| `winner_party` | VARCHAR | Winner's party |
| `winner_votes` | INT | Votes received by winner |
| `candidates_data` | JSON | Full candidate data array |
| `closed_at` | DATETIME | When session was closed |

## 🔒 Security Notes

- Session history page requires authentication (admin or user)
- Only admins can reset voting and trigger saves
- Database stores immutable historical records
- JSON data preserves complete voting details

## 📝 Future Enhancements

Potential improvements:
- Export session results to PDF/Excel
- Email notifications when session closes
- Analytics dashboard with charts
- Voter turnout statistics
- Historical trend analysis
- Comparison between sessions

## 🐛 Troubleshooting

### Issue: "Failed to save session results"
**Solution**: Check MySQL connection and ensure table exists

### Issue: No sessions appear in history
**Solution**: Complete at least one voting session and reset it

### Issue: Dates showing incorrectly
**Solution**: Check server timezone settings and database timezone

### Issue: Console shows error during reset
**Solution**: Ensure voting session has ended before resetting

## 📞 Support

For issues or questions:
1. Check server console for error messages
2. Verify database table exists and is accessible
3. Check browser console (F12) for frontend errors
4. Ensure blockchain voting session has ended

---

**Created**: October 2025  
**Version**: 1.0  
**Status**: Production Ready ✅
