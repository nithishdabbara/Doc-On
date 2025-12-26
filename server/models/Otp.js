const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        default: Date.now,
        index: { expires: 300 } // Auto-delete after 300 seconds (5 minutes)
    }
}, { timestamps: true });

module.exports = mongoose.model('Otp', OtpSchema);
