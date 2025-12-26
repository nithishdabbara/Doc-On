const mongoose = require('mongoose');
const User = require('./User');

const PatientSchema = new mongoose.Schema({
    isVerified: { type: Boolean, default: true }, // Patients are verified by default
    profile: {
        age: { type: Number },
        gender: { type: String, enum: ['Male', 'Female', 'Other', ''] },
        phone: { type: String },
        address: { type: String }
    }
});

module.exports = User.discriminator('patient', PatientSchema);
