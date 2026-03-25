const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    specialization: { type: String, required: true, index: true },
    consultationFee: { type: Number, required: true, default: 500 },
    licenseNumber: { type: String, required: true },
    medicalCouncil: { type: String }, // e.g., 'NMC India'
    experience: { type: String }, // e.g., '5 years'
    address: { type: String, index: true },
    phone: { type: String },
    availability: { type: String }, // e.g. "9:00 AM - 5:00 PM"
    patientsTreated: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doctor', doctorSchema);
