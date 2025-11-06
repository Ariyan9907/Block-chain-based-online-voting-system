const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json());

// In-memory OTP storage (for production, use Redis or database)
const otpStore = new Map(); // Format: { mobile_number: {otp, expiresAt, verified} }

// Serve register.html
app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/register.html'));
});

// Helper function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to generate a unique Voter ID
function generateVoterId() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 3; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  result += Math.floor(1000000 + Math.random() * 9000000).toString();
  return result;
}

// Helper function to send OTP via SMS (Console Mode - No API Key Required)
async function sendOTPviaSMS(mobile_number, otp) {
  // CONSOLE MODE - Perfect for development and testing
  // OTP will be printed in the server console
  console.log('\n' + '='.repeat(70));
  console.log('📱 OTP GENERATED FOR MOBILE NUMBER: ' + mobile_number);
  console.log('🔐 OTP CODE: ' + otp);
  console.log('⏰ VALID FOR: 5 minutes');
  console.log('📅 GENERATED AT: ' + new Date().toLocaleString());
  console.log('='.repeat(70) + '\n');
  
  // TODO: When ready for production, integrate with SMS gateway

  
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: `Your OTP for voter registration is: ${otp}. Valid for 5 minutes.`, 
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+91${mobile_number}`
  });
  
  
  return otp; // Return OTP for console mode
}

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
  const { mobile_number } = req.body;
  
  if (!mobile_number) {
    return res.status(400).json({ message: 'Mobile number is required.' });
  }
  
  // Validate mobile number format (10 digits)
  if (!/^[0-9]{10}$/.test(mobile_number)) {
    return res.status(400).json({ message: 'Invalid mobile number format. Must be 10 digits.' });
  }
  
  try {
    // Check if mobile number already exists
    db.query('SELECT * FROM voters WHERE mobile_number = ?', [mobile_number], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error.' });
      }
      
      if (results.length > 0) {
        return res.status(409).json({ message: 'Mobile number already registered.' });
      }
      
      // Generate OTP
      const otp = generateOTP();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
      
      // Store OTP in memory with mobile number as key
      otpStore.set(mobile_number, {
        otp,
        expiresAt,
        verified: false
      });
      
      // Send OTP via SMS (Console Mode)
      try {
        const sentOTP = await sendOTPviaSMS(mobile_number, otp);
        return res.status(200).json({
          message: 'OTP generated successfully. Check server console.',
          expiresIn: 300, // seconds
          otp: sentOTP // Return OTP in console mode for easy testing
        });
      } catch (smsError) {
        console.error('SMS sending error:', smsError);
        return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
      }
    });
  } catch (error) {
    console.error('Error in send-otp:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// Verify OTP endpoint
app.post('/api/verify-otp', (req, res) => {
  const { mobile_number, otp } = req.body;
  
  if (!mobile_number || !otp) {
    return res.status(400).json({ message: 'Mobile number and OTP are required.' });
  }
  
  // Check if OTP exists for this mobile number
  const otpData = otpStore.get(mobile_number);
  
  if (!otpData) {
    return res.status(400).json({ message: 'No OTP found. Please request a new OTP.' });
  }
  
  // Check if OTP has expired
  if (Date.now() > otpData.expiresAt) {
    otpStore.delete(mobile_number);
    return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
  }
  
  // Verify OTP
  if (otpData.otp !== otp) {
    console.log('❌ Invalid OTP attempt for Mobile Number: ' + mobile_number);
    console.log('   Expected: ' + otpData.otp + ', Received: ' + otp + '\n');
    return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
  }
  
  // Mark as verified
  otpData.verified = true;
  otpStore.set(mobile_number, otpData);
  
  console.log('✅ OTP VERIFIED SUCCESSFULLY for Mobile Number: ' + mobile_number + '\n');
  
  return res.status(200).json({ message: 'OTP verified successfully.' });
});

// Registration endpoint (with OTP verification)
app.post('/api/register', async (req, res) => {
  const { full_name, mobile_number, password } = req.body;
  
  if (!full_name || !mobile_number || !password) {
    return res.status(400).json({ message: 'Full name, mobile number, and password are required.' });
  }
  
  // Check if OTP was verified
  const otpData = otpStore.get(mobile_number);
  if (!otpData || !otpData.verified) {
    return res.status(400).json({ message: 'Please verify your mobile number with OTP first.' });
  }
  
  // Password strength validation (same as frontend)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/; // Corrected VD to \d, and escaped backslashes
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.' });
  }
  
  try {
    // Check if mobile number already exists
    const [existingMobile] = await db.promise().query('SELECT * FROM voters WHERE mobile_number = ?', [mobile_number]);
    if (existingMobile.length > 0) {
      return res.status(409).json({ message: 'Mobile number already registered.' });
    }

    // Generate a unique Voter ID
    const voter_id = generateVoterId();

    // Hash the password with bcrypt (salt rounds: 10)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user with hashed password, mobile number and default role 'user'
    await db.promise().query('INSERT INTO voters (voter_id, full_name, role, password, mobile_number) VALUES (?, ?, ?, ?, ?)', 
      [voter_id, full_name, 'user', hashedPassword, mobile_number]);
      
    // Clear OTP data after successful registration
    otpStore.delete(mobile_number);
    
    console.log('✅ NEW VOTER REGISTERED:');
    console.log('   Voter ID: ' + voter_id);
    console.log('   Password: ' + password);
    console.log('   Full Name: ' + full_name);
    console.log('   Mobile: ' + mobile_number);
    console.log('   Role: user');
    
    return res.status(201).json({ message: 'Registration successful.', voter_id: voter_id });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Registration failed.' });
  }
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { voter_id, password } = req.body;
  if (!voter_id || !password) {
    return res.status(400).json({ message: 'Voter ID and password are required.' });
  }
  db.query('SELECT * FROM voters WHERE voter_id = ?', [voter_id], async (err, results) => {
    if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error.' });
    }
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid voter ID or password.' });
    }
    const user = results[0];
    
    try {
      // Compare password with hashed password using bcrypt
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid voter ID or password.' });
      }
      
      // Assign role (admin or user)
      const role = user.role || 'user';
      const token = jwt.sign({ voter_id, role }, process.env.SECRET_KEY, { algorithm: 'HS256' });
      
      console.log('✅ LOGIN SUCCESSFUL:');
      console.log('   Voter ID: ' + voter_id);
      console.log('   Role: ' + role + '\n');
      
      res.json({ token, role });
    } catch (compareError) {
      console.error('Password comparison error:', compareError);
      return res.status(500).json({ message: 'Login failed.' });
    }
  });
});

// Authorization middleware
const authorizeUser = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.Authorization && req.query.Authorization.startsWith('Bearer ')) {
    token = req.query.Authorization.split('Bearer ')[1];
  }

  if (!token) {
    return res.status(401).send('<h1 align="center"> Login to Continue </h1>');
  }
  try {
    // Verify and decode the token
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY, { algorithms: ['HS256'] });
    req.user = decodedToken;
    next(); // Proceed to the next middleware
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authorization token' });
  }
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/login.html'));
});

// Add explicit route for login.html
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/login.html'));
});


app.get('/js/login.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/js/login.js'));
});

app.get('/js/register.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/js/register.js'));
});

app.get('/css/login.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/css/login.css'))
});

app.get('/css/index.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/css/index.css'))
});

app.get('/css/admin.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/css/admin.css'))
});

app.get('/assets/eth5.jpg', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/assets/eth5.jpg'))
});

app.get('/js/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/js/app.js'))
});

app.get('/admin.html', authorizeUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/admin.html'));
});

app.get('/index.html', authorizeUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/index.html'));
});

app.get('/session-history.html', authorizeUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/session-history.html'));
});

app.get('/dist/login.bundle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/dist/login.bundle.js'));
});

app.get('/dist/app.bundle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/dist/app.bundle.js'));
});

// Save voting session results before reset
app.post('/api/save-session-results', authorizeUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Only admins can save session results.' });
  }
  const { sessionNumber, startDate, endDate, candidates } = req.body;
  
  if (!sessionNumber || !startDate || !endDate || !candidates) {
    return res.status(400).json({ message: 'Session number, dates, and candidates data are required.' });
  }
  
  try {
    // Calculate total votes and find winner
    let totalVotes = 0;
    let winnerCandidate = null;
    let maxVotes = 0;
    
    candidates.forEach(candidate => {
      totalVotes += candidate.voteCount;
      if (candidate.voteCount > maxVotes) {
        maxVotes = candidate.voteCount;
        winnerCandidate = candidate;
      }
    });
    
    // Convert timestamps to MySQL datetime format
    const startDatetime = new Date(startDate * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const endDatetime = new Date(endDate * 1000).toISOString().slice(0, 19).replace('T', ' ');
    
    // Save session results to database
    const query = `
      INSERT INTO voting_sessions 
      (session_number, start_date, end_date, total_votes, total_candidates, 
       winner_candidate_id, winner_name, winner_party, winner_votes, candidates_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      sessionNumber,
      startDatetime,
      endDatetime,
      totalVotes,
      candidates.length,
      winnerCandidate ? winnerCandidate.id : null,
      winnerCandidate ? winnerCandidate.name : 'No votes cast',
      winnerCandidate ? winnerCandidate.party : 'N/A',
      winnerCandidate ? winnerCandidate.voteCount : 0,
      JSON.stringify(candidates)
    ];
    
    db.query(query, values, (err, result) => {
      if (err) {
        console.error('❌ Error saving session results:', err);
        return res.status(500).json({ message: 'Failed to save session results.' });
      }
      
      console.log('\n' + '='.repeat(70));
      console.log('💾 VOTING SESSION RESULTS SAVED TO DATABASE');
      console.log('📊 Session Number: ' + sessionNumber);
      console.log('📅 Period: ' + startDatetime + ' to ' + endDatetime);
      console.log('🗳️  Total Votes: ' + totalVotes);
      console.log('👥 Total Candidates: ' + candidates.length);
      if (winnerCandidate) {
        console.log('🏆 Winner: ' + winnerCandidate.name + ' (' + winnerCandidate.party + ')');
        console.log('🎯 Winning Votes: ' + winnerCandidate.voteCount);
      }
      console.log('='.repeat(70) + '\n');
      
      return res.status(200).json({
        message: 'Session results saved successfully.',
        sessionId: result.insertId,
        totalVotes,
        winner: winnerCandidate
      });
    });
  } catch (error) {
    console.error('Error in save-session-results:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// Get all past voting session results
app.get('/api/session-results', authorizeUser, (req, res) => {
  const query = `
    SELECT 
      id,
      session_number,
      start_date,
      end_date,
      total_votes,
      total_candidates,
      winner_candidate_id,
      winner_name,
      winner_party,
      winner_votes,
      candidates_data,
      closed_at
    FROM voting_sessions
    ORDER BY session_number DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching session results:', err);
      return res.status(500).json({ message: 'Failed to retrieve session results.' });
    }
    
    // Parse JSON candidates_data for each result (only if it's a string)
    const sessions = results.map(session => ({
      ...session,
      candidates_data: typeof session.candidates_data === 'string' 
        ? JSON.parse(session.candidates_data) 
        : session.candidates_data
    }));
    
    return res.status(200).json({ sessions });
  });
});

// Get specific session result by session number
app.get('/api/session-results/:sessionNumber', authorizeUser, (req, res) => {
  const sessionNumber = parseInt(req.params.sessionNumber);
  
  const query = `
    SELECT 
      id,
      session_number,
      start_date,
      end_date,
      total_votes,
      total_candidates,
      winner_candidate_id,
      winner_name,
      winner_party,
      winner_votes,
      candidates_data,
      closed_at
    FROM voting_sessions
    WHERE session_number = ?
  `;
  
  db.query(query, [sessionNumber], (err, results) => {
    if (err) {
      console.error('Error fetching session result:', err);
      return res.status(500).json({ message: 'Failed to retrieve session result.' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Session not found.' });
    }
    
    const session = {
      ...results[0],
      candidates_data: typeof results[0].candidates_data === 'string'
        ? JSON.parse(results[0].candidates_data)
        : results[0].candidates_data
    };
    
    return res.status(200).json({ session });
  });
});

// Serve the favicon.ico file
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/favicon.ico'));
});

// Start the server
app.listen(8080, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 Server Started Successfully!');
  console.log('📡 Server listening on http://localhost:8080');
  console.log('📱 OTP Mode: CONSOLE (No SMS API required)');
  console.log('💡 OTP will be printed in this console when requested');
  console.log('='.repeat(70) + '\n');
});
