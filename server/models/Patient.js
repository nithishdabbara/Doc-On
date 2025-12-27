const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isVerified: { type: Boolean, default: true }, // Patients are verified by default
    profile: {
        age: { type: Number },
        gender: { type: String, enum: ['Male', 'Female', 'Other', ''] },
        phone: { type: String },
        address: { type: String }
    }
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);
