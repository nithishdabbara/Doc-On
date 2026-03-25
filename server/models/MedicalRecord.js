const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    uploadedBy: { type: String, enum: ['patient', 'doctor'], required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }, // Track creator for History Access Rules
    type: { type: String, enum: ['prescription', 'xray', 'report', 'history'], required: true },
    title: { type: String, required: true },
    description: { type: String }, // For extracted OCR text or notes
    fileUrl: { type: String, required: true },
    date: { type: Date, default: Date.now },
    accessList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }] // Doctors who can see this
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
