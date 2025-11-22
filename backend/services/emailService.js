const nodemailer = require('nodemailer');

// Create transporter using SMTP configuration from environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, userName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Luna'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email - Luna',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
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
      text: `
        Welcome to Luna!
        
        Hi ${userName},
        
        Thank you for signing up! Please verify your email address by entering the OTP below:
        
        Your verification code is: ${otp}
        
        This code will expire in 10 minutes.
        
        If you didn't create an account, please ignore this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail
};

