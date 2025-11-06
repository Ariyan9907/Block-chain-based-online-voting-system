# Quick Start Guide - OTP Authentication

## Step 1: Update Database Schema

Run this command in your MySQL:

```bash
mysql -u root -p < database_update.sql
```

Or manually execute:
```sql
USE voter_db;

ALTER TABLE voters ADD COLUMN mobile_number VARCHAR(10) AFTER voter_id;
ALTER TABLE voters ADD UNIQUE INDEX idx_mobile_number (mobile_number);
```

## Step 2: Install Dependencies (if needed)

```bash
cd Decentralized-Voting-System-Using-Ethereum-Blockchain
npm install
```

## Step 3: Start Server

```bash
node index.js
```

## Step 4: Test Registration

1. Open browser: `http://localhost:8080/register.html`
2. Enter Voter ID
3. Enter 10-digit Mobile Number
4. Click "Send OTP"
5. **Check your terminal/console** - You'll see the OTP printed there
6. Enter the OTP in the form
7. Wait for verification success
8. Enter Password
9. Click Register

## Current Setup

- **OTP Display**: Console/Terminal (Mock Implementation)
- **OTP Validity**: 5 minutes
- **OTP Length**: 6 digits
- **Resend**: Available after 30 seconds

## To Enable Real SMS

See `OTP_SETUP_GUIDE.md` for detailed instructions on integrating:
- Twilio
- MSG91
- AWS SNS
- Fast2SMS

## Important Notes

⚠️ Currently in **TEST MODE** - OTP is printed to console
⚠️ For production, integrate a real SMS gateway
✅ Mobile numbers must be unique
✅ OTP must be verified before registration
✅ Password strength validation is enforced

## Troubleshooting

**Issue**: Can't see OTP  
**Solution**: Check the terminal/console where you ran `node index.js`

**Issue**: Registration fails  
**Solution**: Make sure you verified OTP first (button should be enabled)

**Issue**: Database error  
**Solution**: Run the database update script first

For detailed documentation, see `OTP_SETUP_GUIDE.md`
