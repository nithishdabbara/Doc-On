const notificationService = require('../services/notificationService');

const sendOTP = async (email, otp) => {
    const subject = 'DocOn - Verify Your Email';
    const text = `Your Verification OTP is: ${otp}. It is valid for 10 minutes.`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Verify Your Email</h2>
            <p>Your One-Time Password (OTP) is:</p>
            <h1 style="color: #2563eb; letter-spacing: 5px;">${otp}</h1>
            <p>This code expires in 10 minutes.</p>
        </div>
    `;
    await notificationService.sendEmail(email, subject, html);
    // Console log for easier local development
    console.log(`\x1b[33m[DEV] OTP for ${email}: ${otp}\x1b[0m`);
};

const sendVerificationEmail = async (email, token) => {
    const link = `http://localhost:5173/verify-email?token=${token}`;
    const subject = 'DocOn - Confirm your Account';
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to DocOn!</h2>
            <p>Please click the button below to verify your email address:</p>
            <a href="${link}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">If the button doesn't work, verify here: ${link}</p>
        </div>
    `;
    await notificationService.sendEmail(email, subject, html);
};

module.exports = { sendOTP, sendVerificationEmail };
