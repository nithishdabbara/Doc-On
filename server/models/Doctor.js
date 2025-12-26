const mongoose = require('mongoose');
const User = require('./User');

const DoctorSchema = new mongoose.Schema({
    specialization: {
        type: String
    },
    medicalLicense: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    clinicAddress: {
        type: String
    },
    hospitalName: {
        type: String
    },
    city: {
        type: String
    },
    // Enhanced Verification
    registrationYear: {
        type: String
    },
    stateMedicalCouncil: {
        type: String
    },
    licenseProof: {
        type: String
    },
    // Financials
    consultationFee: {
        type: Number,
        default: 500
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    availableSlots: [{
        type: Date
    }]
});

module.exports = User.discriminator('doctor', DoctorSchema);
