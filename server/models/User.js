const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false // Optional for Google Auth users
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows null/undefined values for non-Google users
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin'],
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    // Add profile here to ensure it's not stripped for Google Users handled as base Users
    profile: {
        age: Number,
        gender: String,
        phone: String,
        address: String
    }
}, { discriminatorKey: 'role', timestamps: true });

module.exports = mongoose.model('User', UserSchema);
