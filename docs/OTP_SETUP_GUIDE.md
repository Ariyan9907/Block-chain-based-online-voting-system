# OTP Authentication Setup Guide

## Overview
This voting system now includes **OTP (One-Time Password) authentication** for mobile number verification during voter registration. This adds an extra layer of security to ensure only legitimate voters can register.

## Features Implemented

### 1. **Mobile Number Verification**
- 10-digit mobile number required during registration
- OTP sent to mobile number for verification
- OTP valid for 5 minutes
- Resend OTP functionality after 30 seconds

### 2. **Security Features**
- OTP is 6-digit random number
- Each voter_id can only have one active OTP at a time
- Mobile numbers are unique (no duplicates allowed)
- Password strength validation maintained
- OTP data cleared after successful registration

### 3. **User Experience**
- Real-time OTP timer display
- Visual feedback for OTP verification status
- Auto-verification when 6 digits entered
- Disabled fields after verification to prevent tampering

---

## Database Changes

### Required SQL Update
Run the following SQL command in your MySQL database:

```sql
USE voter_db;

ALTER TABLE voters 
ADD COLUMN mobile_number VARCHAR(10) AFTER voter_id;

ALTER TABLE voters 
ADD UNIQUE INDEX idx_mobile_number (mobile_number);
```

Or simply run the provided `database_update.sql` file:
```bash
mysql -u root -p < database_update.sql
```

### Updated Table Structure
```sql
+---------------+-------------------------+------+-----+---------+-------+
| Field         | Type                    | Null | Key | Default | Extra |
+---------------+-------------------------+------+-----+---------+-------+
| voter_id      | varchar(36)             | NO   | PRI | NULL    |       |
| mobile_number | varchar(10)             | YES  | UNI | NULL    |       |
| role          | enum('admin','user')    | NO   |     | NULL    |       |
| password      | varchar(255)            | NO   |     | NULL    |       |
+---------------+-------------------------+------+-----+---------+-------+
```

---

## How It Works

### Registration Flow

1. **User enters Voter ID and Mobile Number**
   - Voter ID: Any unique identifier
   - Mobile Number: 10-digit Indian mobile number

2. **Click "Send OTP"**
   - System generates 6-digit random OTP
   - Checks if voter_id already exists
   - Checks if mobile_number already registered
   - Sends OTP via SMS (currently mock implementation)
   - OTP valid for 5 minutes

3. **User enters OTP**
   - System auto-verifies when 6 digits entered
   - Shows success/error message
   - Enables registration button on success

4. **User enters Password and Registers**
   - Password validation applied
   - User data saved to database with mobile number
   - OTP data cleared from memory

---

## SMS Gateway Integration

### Current Implementation
Currently using **MOCK implementation** - OTP is printed to console for testing.

### Production Setup Options

#### Option 1: Twilio (Recommended)
```bash
npm install twilio
```

Add to `.env`:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

Update `sendOTPviaSMS` function in `index.js`:
```javascript
async function sendOTPviaSMS(mobile_number, otp) {
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  await client.messages.create({
    body: `Your OTP for voter registration is: ${otp}. Valid for 5 minutes. Do not share this with anyone.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+91${mobile_number}` // +91 for India
  });
  
  return true;
}
```

#### Option 2: MSG91 (Popular in India)
```bash
npm install msg91-sms
```

Add to `.env`:
```env
MSG91_AUTH_KEY=your_auth_key
MSG91_SENDER_ID=your_sender_id
MSG91_ROUTE=4
```

Update `sendOTPviaSMS` function:
```javascript
async function sendOTPviaSMS(mobile_number, otp) {
  const msg91 = require('msg91-sms');
  
  const message = `Your OTP for voter registration is: ${otp}. Valid for 5 minutes.`;
  
  await msg91.send(
    mobile_number,
    message,
    process.env.MSG91_SENDER_ID,
    process.env.MSG91_ROUTE,
    process.env.MSG91_AUTH_KEY
  );
  
  return true;
}
```

#### Option 3: AWS SNS
```bash
npm install aws-sdk
```

Add to `.env`:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
```

Update `sendOTPviaSMS` function:
```javascript
async function sendOTPviaSMS(mobile_number, otp) {
  const AWS = require('aws-sdk');
  AWS.config.update({ region: process.env.AWS_REGION });
  
  const sns = new AWS.SNS();
  const params = {
    Message: `Your OTP for voter registration is: ${otp}. Valid for 5 minutes.`,
    PhoneNumber: `+91${mobile_number}`
  };
  
  await sns.publish(params).promise();
  return true;
}
```

#### Option 4: Fast2SMS (Indian Service)
```bash
npm install axios
```

Add to `.env`:
```env
FAST2SMS_API_KEY=your_api_key
```

Update `sendOTPviaSMS` function:
```javascript
async function sendOTPviaSMS(mobile_number, otp) {
  const axios = require('axios');
  
  const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
    route: 'v3',
    sender_id: 'TXTIND',
    message: `Your OTP for voter registration is ${otp}. Valid for 5 minutes.`,
    language: 'english',
    flash: 0,
    numbers: mobile_number
  }, {
    headers: {
      'authorization': process.env.FAST2SMS_API_KEY
    }
  });
  
  return response.data.return;
}
```

---

## Testing

### Testing with Mock Implementation (Current)
1. Start the server: `node index.js`
2. Go to registration page: `http://localhost:8080/register.html`
3. Enter voter ID and mobile number
4. Click "Send OTP"
5. Check console/terminal for OTP
6. Enter the OTP shown in console
7. Complete registration

### Testing with Real SMS Gateway
1. Set up one of the SMS gateways above
2. Add credentials to `.env` file
3. Update `sendOTPviaSMS` function
4. Restart server
5. Test with real mobile number
6. You should receive SMS with OTP

---

## API Endpoints

### 1. Send OTP
```
POST /api/send-otp
Content-Type: application/json

{
  "voter_id": "123456",
  "mobile_number": "9876543210"
}

Response (Success):
{
  "message": "OTP sent successfully.",
  "expiresIn": 300
}

Response (Error):
{
  "message": "Voter ID already registered."
}
```

### 2. Verify OTP
```
POST /api/verify-otp
Content-Type: application/json

{
  "voter_id": "123456",
  "mobile_number": "9876543210",
  "otp": "123456"
}

Response (Success):
{
  "message": "OTP verified successfully."
}

Response (Error):
{
  "message": "Invalid OTP. Please try again."
}
```

### 3. Register (Updated)
```
POST /api/register
Content-Type: application/json

{
  "voter_id": "123456",
  "mobile_number": "9876543210",
  "password": "SecurePass@123"
}

Response (Success):
{
  "message": "Registration successful."
}

Response (Error):
{
  "message": "Please verify your mobile number with OTP first."
}
```

---

## Security Considerations

### Current Implementation
- ✅ OTP stored in-memory (Map)
- ✅ 5-minute expiry
- ✅ One OTP per voter_id
- ✅ Mobile number uniqueness
- ✅ Password strength validation

### Production Recommendations
1. **Use Redis for OTP storage** instead of in-memory Map
2. **Implement rate limiting** to prevent OTP spam
3. **Add CAPTCHA** before sending OTP
4. **Hash passwords** before storing (use bcrypt)
5. **Use HTTPS** for all communications
6. **Add request throttling** for OTP endpoints
7. **Log all OTP attempts** for security monitoring
8. **Implement account lockout** after multiple failed OTP attempts

---

## Troubleshooting

### OTP not received
1. Check console for mock OTP (if using mock implementation)
2. Verify SMS gateway credentials in `.env`
3. Check mobile number format (must be 10 digits)
4. Check SMS gateway account balance/credits

### OTP verification fails
1. Ensure OTP is entered within 5 minutes
2. Check that voter_id matches the one used to request OTP
3. Verify mobile number hasn't changed
4. Try requesting a new OTP

### Database errors
1. Ensure `mobile_number` column exists in `voters` table
2. Run `database_update.sql` if not already run
3. Check database connection in `db.js`

---

## Future Enhancements

1. **OTP via Email** as alternative to SMS
2. **Multiple OTP attempts tracking**
3. **Resend OTP cooldown period**
4. **Voice OTP** option
5. **International phone number support**
6. **Admin panel** to view OTP logs
7. **SMS delivery status tracking**

---

## Support

For issues or questions:
1. Check this documentation
2. Review console logs for errors
3. Verify database schema is updated
4. Ensure all dependencies are installed

---

## License
Part of Decentralized Voting System Using Ethereum Blockchain
