const mongoose = require('mongoose');

const labBookingSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    labId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabCentre', required: true },

    // Tests included in this booking
    // Tests included in this booking
    tests: [{
        testName: { type: String, required: true },
        price: { type: Number, required: true }
    }],

    totalAmount: { type: Number, required: true },
    adminFee: { type: Number, default: 0 }, // 15% Platform Fee
    providerAmount: { type: Number }, // 85% to Lab

    // Booking Details
    collectionType: { type: String, enum: ['home', 'walk_in'], required: true },
    scheduledDate: { type: Date, required: true },
    address: { type: String }, // Required if collectionType is 'home'

    status: {
        type: String,
        enum: ['scheduled', 'sample_collected', 'processing', 'report_generated', 'completed', 'cancelled'],
        default: 'scheduled'
    },

    // Privacy & Reports
    reportUrl: { type: String }, // Link to PDF
    clinicalNotes: { type: String }, // Private to medical staff
    isCritical: { type: Boolean, default: false }, // AUTO-FLAGGED by AI/Rules

    // Payment Info
    paymentId: { type: String },
    orderId: { type: String },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LabBooking', labBookingSchema);
