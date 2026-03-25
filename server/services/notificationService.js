const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Log directory
const LOG_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}
const LOG_FILE = path.join(LOG_DIR, 'notifications.log');

class NotificationService {
    constructor() {
        this.emailEnabled = process.env.EMAIL_USER && process.env.EMAIL_PASS;
        this.smsEnabled = process.env.TWILIO_SID && process.env.TWILIO_TOKEN;

        if (this.emailEnabled) {
            console.log('NotificationService: Real Email Configured (Nodemailer)');
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        } else {
            console.log('NotificationService: Dev Mode - Simulating Emails');
        }
    }

    async logNotification(type, to, content) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${type}] To: ${to} | Content: ${content}\n`;

        // Write to file
        fs.appendFile(LOG_FILE, logEntry, (err) => {
            if (err) console.error('Failed to write notification log', err);
        });

        // Console visual
        console.log(`\n📨 --- MOCK ${type} SENT ---`);
        console.log(`To: \x1b[36m${to}\x1b[0m`);
        console.log(`Content: ${content.substring(0, 100)}...`);
        console.log(`-------------------------\n`);
    }

    async sendEmail(to, subject, htmlContent) {
        if (this.emailEnabled) {
            try {
                console.log(`Attempting real email to ${to}...`);
                const info = await this.transporter.sendMail({
                    from: `"DocOn Health" <${process.env.EMAIL_USER}>`,
                    to: to,
                    subject: subject,
                    html: htmlContent
                });
                console.log(`✅ Email sent: ${info.messageId}`);
            } catch (error) {
                console.error("❌ Failed to send email:", error);
                // Fallback to log if real email fails
                await this.logNotification('EMAIL_FAIL', to, error.message);
            }
        } else {
            // Simulate Network Delay
            await new Promise(r => setTimeout(r, 800));
            await this.logNotification('EMAIL', to, `Subject: ${subject} | Body: ${htmlContent}`);
        }
    }

    async sendSMS(to, message) {
        if (this.smsEnabled) {
            // Real implementation would go here
        } else {
            // Simulate Network Delay
            await new Promise(r => setTimeout(r, 500));
            await this.logNotification('SMS', to, message);
        }
    }
}

module.exports = new NotificationService();
