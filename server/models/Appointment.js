const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }, // Link to real user
    patientName: { type: String, required: true }, // Snapshot of name
    date: { type: Date, required: true },
    amount: { type: Number },
    adminFee: { type: Number, default: 0 }, // 15% Platform Fee
    providerAmount: { type: Number }, // 85% to Doctor
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paymentId: { type: String }, // Razorpay Payment ID
    orderId: { type: String }, // Razorpay Order ID
    status: { type: String, enum: ['scheduled', 'arrived', 'in_progress', 'no_show', 'completed', 'cancelled'], default: 'scheduled' },

    // Appointment Type (New)
    type: { type: String, enum: ['in-person', 'video'], default: 'in-person' },
    meetingLink: { type: String }, // For video calls

    // New Fields for Advanced Features
    reasonForVisit: { type: String }, // Patient's purpose
    patientAttachments: [{ type: String }], // URLs of files uploaded by patient (Private to Doctor)
    doctorAttachments: [{ type: String }], // URLs of prescriptions/reports by Doctor

    treatmentNotes: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },

    // Cancellation Details
    cancellationReason: { type: String },
    cancelledBy: { type: String, enum: ['patient', 'doctor'] },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
