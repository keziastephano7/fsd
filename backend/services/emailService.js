const nodemailer = require('nodemailer');

// Cache the transporter for better performance
let transporter;

const createTransporter = () => {
  if (transporter) return transporter;
  
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.zoho.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'luna_app@zohomail.in',
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false
    }
  });
  
  return transporter;
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp, userName) => {
  let retries = 3;
  let lastError;
  
  while (retries > 0) {
    try {
      console.log(`📧 Attempting to send OTP to ${email} (${retries} retries left)`);
      
      const transporter = createTransporter();
      
      // Verify connection with timeout
      await Promise.race([
        transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SMTP connection timeout')), 10000)
        )
      ]);
      
      console.log('✅ SMTP connection verified');
      
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Luna'}" <${process.env.SMTP_USER || 'luna_app@zohomail.in'}>`,
        to: email,
        subject: 'Verify Your Email - Luna',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .otp-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
              .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 10px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; padding: 20px; border-top: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Luna!</h1>
              </div>
              <div class="content">
                <p>Hi ${userName},</p>
                <p>Thank you for signing up! Please verify your email address by entering the OTP below:</p>
                <div class="otp-box">
                  <p style="margin: 0 0 10px 0; color: #666;">Your verification code is:</p>
                  <div class="otp-code">${otp}</div>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't create an account, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Luna. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Welcome to Luna!\n\nHi ${userName},\n\nThank you for signing up! Please verify your email address by entering the OTP below:\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't create an account, please ignore this email.`
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ OTP email sent successfully');
      console.log('📧 Message ID:', info.messageId);
      
      // SUCCESS: Email was actually sent
      return { 
        success: true, 
        messageId: info.messageId,
        emailSent: true
      };
      
    } catch (error) {
      console.error(`❌ Attempt ${4 - retries} failed:`, error.message);
      lastError = error;
      retries--;
      
      if (retries > 0) {
        const delay = 2000 * (4 - retries);
        console.log(`⏳ Retrying in ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // FAILURE: All retries exhausted, email was NOT sent
  console.error('❌ All retry attempts failed for email:', email);
  console.log(`🔑 OTP that would have been sent: ${otp}`);
  
  return { 
    success: false, 
    error: lastError?.message || 'Failed to send email',
    emailSent: false,
    developmentOtp: otp // Still provide OTP for development
  };
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (transporter) {
    transporter.close();
    console.log('📧 Email transporter closed gracefully');
  }
});

module.exports = {
  generateOTP,
  sendOTPEmail
};