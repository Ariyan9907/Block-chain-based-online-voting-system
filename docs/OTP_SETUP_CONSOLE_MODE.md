# 📱 OTP Authentication - Console Mode Setup

## ✅ What's Changed?

Your voting system now has **OTP-based mobile authentication** that works **WITHOUT any SMS API keys**!

Perfect for development and testing - OTP codes will appear in:
1. **Server console** (where you run `node index.js`)
2. **Browser alert popup** (easy copy-paste)
3. **Browser console** (press F12)

---

## 🚀 Quick Setup (2 Minutes)

### Step 1: Update Database Schema
Run this SQL command to add mobile number support:

```bash
mysql -u root -p voter_db < update_voters_table.sql
```

Or run this SQL directly:
```sql
USE voter_db;

ALTER TABLE voters 
ADD COLUMN mobile_number VARCHAR(15) UNIQUE AFTER password;

-- Optional: Add index for better performance
CREATE INDEX idx_mobile_number ON voters(mobile_number);
```

### Step 2: Start Your Server
```bash
node index.js
```

You should see:
```
======================================================================
🚀 Server Started Successfully!
📡 Server listening on http://localhost:8080
📱 OTP Mode: CONSOLE (No SMS API required)
💡 OTP will be printed in this console when requested
======================================================================
```

---

## 📝 How to Test Registration

### 1. Open Registration Page
```
http://localhost:8080/register.html
```

### 2. Fill the Form
- **Voter ID**: `test123`
- **Mobile Number**: `9876543210`
- **Password**: `Test@1234` (must have uppercase, lowercase, number, special char)

### 3. Click "Send OTP"

### 4. Check for OTP in Multiple Places:

#### A. Server Console (Terminal):
```
======================================================================
📱 OTP GENERATED FOR MOBILE NUMBER: 9876543210
🔐 OTP CODE: 123456
⏰ VALID FOR: 5 minutes
📅 GENERATED AT: 10/6/2025, 2:30:45 PM
======================================================================
```

#### B. Browser Alert:
```
✅ OTP Generated Successfully!

📱 Mobile: 9876543210
🔐 Your OTP: 123456

⏰ Valid for 5 minutes

💡 Also check server console for details
```

#### C. Browser Console (F12):
```
==================================================
📱 OTP for 9876543210: 123456
⏰ Valid for 5 minutes
==================================================
```

### 5. Enter OTP
Copy the 6-digit code and paste it in the OTP field.

### 6. Complete Registration
Fill in remaining details and click Register!

---

## 🎯 Console Output Examples

### When OTP is Generated:
```
======================================================================
📱 OTP GENERATED FOR MOBILE NUMBER: 9876543210
🔐 OTP CODE: 456789
⏰ VALID FOR: 5 minutes
📅 GENERATED AT: 10/6/2025, 3:15:30 PM
======================================================================
```

### When OTP is Verified:
```
✅ OTP VERIFIED SUCCESSFULLY for Voter ID: test123
```

### When Registration Completes:
```
✅ NEW VOTER REGISTERED:
   Voter ID: test123
   Mobile: 9876543210
   Role: user
```

### When Wrong OTP is Entered:
```
❌ Invalid OTP attempt for Voter ID: test123
   Expected: 456789, Received: 123456
```

---

## 🔧 Features Included

✅ **Mobile Number Validation** - Only 10-digit numbers accepted  
✅ **OTP Generation** - 6-digit random codes  
✅ **OTP Expiry** - Codes expire after 5 minutes  
✅ **Duplicate Check** - Prevents duplicate mobile numbers  
✅ **Console Display** - OTP shown in terminal, browser alert, and console  
✅ **Auto-verification** - OTP verified when 6 digits entered  
✅ **Resend OTP** - Can request new OTP after 30 seconds  
✅ **Secure Storage** - In-memory OTP storage (cleared after use)  

---

## 📂 Database Schema

Your `voters` table now has:
```sql
CREATE TABLE voters (
  voter_id VARCHAR(36) PRIMARY KEY,
  role ENUM('admin', 'user') NOT NULL,
  password VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(15) UNIQUE
);
```

---

## 🔐 Security Features

1. **OTP Expiry**: 5 minutes validity
2. **One-time Use**: OTP deleted after successful verification
3. **Duplicate Prevention**: Mobile number must be unique
4. **Password Strength**: Enforced strong password rules
5. **Rate Limiting**: 30-second cooldown between OTP requests

---

## 🚀 Future Enhancement - Real SMS Integration

When you're ready to send actual SMS messages, you can integrate services like:

### Option 1: Twilio
```javascript
// In index.js, replace the sendOTPviaSMS function:
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendOTPviaSMS(mobile_number, otp) {
  await client.messages.create({
    body: `Your OTP for voter registration is: ${otp}. Valid for 5 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+91${mobile_number}`
  });
  return otp;
}
```

### Option 2: MSG91 (India)
```javascript
const axios = require('axios');

async function sendOTPviaSMS(mobile_number, otp) {
  await axios.get(`https://api.msg91.com/api/v5/otp`, {
    params: {
      authkey: process.env.MSG91_AUTH_KEY,
      mobile: mobile_number,
      otp: otp,
      template_id: process.env.MSG91_TEMPLATE_ID
    }
  });
  return otp;
}
```

---

## 🐛 Troubleshooting

### OTP not showing in console?
- Make sure server is running (`node index.js`)
- Check terminal where you started the server

### Database error?
- Run the SQL update script first
- Verify `voter_db` database exists
- Check MySQL connection in `.env` file

### OTP expired message?
- OTP is valid for 5 minutes only
- Click "Resend OTP" to get a new code

---

## 📞 Support

For issues or questions, check the main `README.md` or `Project_Details.md` file.

---

**🎉 Congratulations! Your voting system now has OTP authentication in Console Mode!**

No SMS API keys needed - perfect for development and testing! 🚀
