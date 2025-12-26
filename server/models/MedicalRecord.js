const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId, // Optional, if uploaded by a doctor
        ref: 'user'
    },
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Report', 'Prescription', 'X-Ray', 'Other'],
        default: 'Report'
    },
    fileUrl: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('medicalRecord', MedicalRecordSchema);
