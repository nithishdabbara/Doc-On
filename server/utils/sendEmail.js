const sendEmail = (to, subject, text) => {
    // In a real app, this would use nodemailer
    console.log('----------------------------------------------------');
    console.log(`📧 EMAIL SENT to: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    console.log(`📄 Message: ${text}`);
    console.log('----------------------------------------------------');
};

module.exports = sendEmail;
