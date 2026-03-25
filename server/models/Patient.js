const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isGoogleAuth: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
    isEmailVerified: { type: Boolean, default: false },
    verificationToken: { type: String }, // For Email Link
    tokenExpires: { type: Date }, // For Email Link
    // Expanded Profile
    profilePhoto: { type: String, default: '' },
    dob: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''] },
    bloodGroup: { type: String },
    timezone: { type: String, default: '(UTC+05:30) Asia/Kolkata' },

    // Subscription
    subscription: {
        tier: { type: String, enum: ['free', 'silver', 'gold'], default: 'free' },
        expiresAt: { type: Date }
    },

    // Contact Info
    phone: { type: String },
    extraPhone: { type: String },

    // Detailed Address
    address: {
        houseNumber: { type: String },
        colony: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String, default: 'India' },
        pincode: { type: String }
    },

    // Other
    // Other
    languages: { type: [String], default: ['English'] },

    // Timestamps (Explicit)
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
