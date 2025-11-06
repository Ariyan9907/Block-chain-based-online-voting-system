// Password strength validation
// register.js

let otpVerified = false;
let otpTimer = null;

// Send OTP to mobile number (Console Mode - No API Key Required)
async function sendOTP() {
  const mobileNumber = document.getElementById('mobile_number').value;
  
  if (!mobileNumber || !/^[0-9]{10}$/.test(mobileNumber)) {
    alert('Please enter a valid 10-digit mobile number');
    return;
  }

  try {
    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile_number: mobileNumber })
    });

    const data = await response.json();
    
    if (response.ok) {
      alert('OTP generated successfully! Check the server console for the OTP code.');
      console.log('%c========================================', 'color: green; font-weight: bold;');
      console.log('%cOTP for ' + mobileNumber + ': ' + data.otp, 'color: green; font-size: 16px; font-weight: bold;');
      console.log('%c========================================', 'color: green; font-weight: bold;');
      document.getElementById('otp-section').style.display = 'block';
      startOTPTimer();
    } else {
      alert(data.message || 'Failed to generate OTP');
    }
  } catch (error) {
    console.error('Error generating OTP:', error);
    alert('Error generating OTP. Please try again.');
  }
}
document.getElementById('send-otp-btn').addEventListener('click', async function() {
    const mobile_number = document.getElementById('mobile-number').value;
    
    if (!mobile_number || mobile_number.length !== 10) {
        alert('Please enter a valid 10-digit mobile number.');
        return;
    }
    
    try {
        const sendOtpBtn = document.getElementById('send-otp-btn');
        sendOtpBtn.disabled = true;
        sendOtpBtn.innerHTML = '<b>Sending...</b>';
        
        const response = await fetch('http://localhost:8080/api/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mobile_number })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Console Mode - Show OTP in alert for easy testing
            // alert('✅ OTP Generated Successfully!\n\n' + 
            //       '📱 Mobile: ' + mobile_number + '\n' +
            //       '🔐 Your OTP: ' + data.otp + '\n\n' +
            //       '⏰ Valid for 5 minutes\n\n' +
            //       '💡 Also check server console for details');
            
            // Also log to browser console
            console.log('%c' + '='.repeat(50), 'color: green; font-weight: bold;');
            console.log('%c📱 OTP for ' + mobile_number + ': ' + data.otp, 'color: green; font-size: 18px; font-weight: bold;');
            console.log('%c⏰ Valid for 5 minutes', 'color: orange; font-size: 14px;');
            console.log('%c' + '='.repeat(50), 'color: green; font-weight: bold;');
            
            document.getElementById('otp-section').style.display = 'block';
            document.getElementById('mobile-number').disabled = true;
            
            // Start OTP timer (5 minutes)
            startOtpTimer(300);
            
            // Change button to resend after 30 seconds
            setTimeout(() => {
                sendOtpBtn.disabled = false;
                sendOtpBtn.innerHTML = '<b>Resend OTP</b>';
            }, 30000);
        } else {
            alert('Failed to send OTP: ' + (data.message || 'Unknown error'));
            sendOtpBtn.disabled = false;
            sendOtpBtn.innerHTML = '<b>Send OTP</b>';
        }
    } catch (error) {
        alert('Error sending OTP: ' + error.message);
        document.getElementById('send-otp-btn').disabled = false;
        document.getElementById('send-otp-btn').innerHTML = '<b>Send OTP</b>';
    }
});

// OTP input handler - auto verify when 6 digits entered
document.getElementById('otp').addEventListener('input', async function() {
    const otp = this.value;
    if (otp.length === 6) {
        await verifyOtp();
    }
});

// Verify OTP function
async function verifyOtp() {
    const mobile_number = document.getElementById('mobile-number').value;
    const otp = document.getElementById('otp').value;
    
    try {
        const response = await fetch('http://localhost:8080/api/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mobile_number, otp })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            otpVerified = true;
            document.getElementById('otp').style.borderColor = '#4CAF50';
            document.getElementById('otp').disabled = true;
            document.getElementById('register-btn').disabled = false;
            document.getElementById('send-otp-btn').disabled = true;
            clearInterval(otpTimer);
            document.getElementById('otp-timer').textContent = '✓ OTP Verified Successfully';
            document.getElementById('otp-timer').style.color = '#4CAF50';
            alert('OTP verified successfully! You can now complete registration.');
        } else {
            otpVerified = false;
            document.getElementById('otp').style.borderColor = '#f44336';
            alert('Invalid OTP: ' + (data.message || 'Please try again'));
            document.getElementById('otp').value = '';
        }
    } catch (error) {
        alert('Error verifying OTP: ' + error.message);
    }
}

// OTP Timer
function startOtpTimer(duration) {
    let timer = duration;
    const timerElement = document.getElementById('otp-timer');
    
    otpTimer = setInterval(() => {
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        
        timerElement.textContent = `OTP valid for ${minutes}:${seconds.toString().padStart(2, '0')}`;
        timerElement.style.color = '#4CAF50';
        
        if (--timer < 0) {
            clearInterval(otpTimer);
            timerElement.textContent = 'OTP expired. Please request a new one.';
            timerElement.style.color = '#f44336';
            document.getElementById('otp').disabled = true;
            document.getElementById('send-otp-btn').disabled = false;
            document.getElementById('send-otp-btn').innerHTML = '<b>Resend OTP</b>';
        }
    }, 1000);
}

// Registration form submit handler
document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    if (!otpVerified) {
        alert('Please verify your mobile number with OTP first.');
        return;
    }
    
    const full_name = document.getElementById('full-name').value;
    const mobile_number = document.getElementById('mobile-number').value;
    const password = document.getElementById('password').value;
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
        alert('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
        return;
    }
    
    try {
        const registerBtn = document.getElementById('register-btn');
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<b>Registering...</b>';
        
        const response = await fetch('http://localhost:8080/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ full_name, mobile_number, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            alert('Registration successful! Your Voter ID is: ' + data.voter_id + '. Please login.');
            window.location.href = 'login.html';
        } else {
            const data = await response.json();
            alert('Registration failed: ' + (data.message || 'Unknown error'));
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<b>Register</b>';
        }
    } catch (error) {
        alert('Registration failed: ' + error.message);
        document.getElementById('register-btn').disabled = false;
        document.getElementById('register-btn').innerHTML = '<b>Register</b>';
    }
});