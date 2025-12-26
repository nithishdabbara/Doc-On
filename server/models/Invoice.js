const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['Consultation', 'Medicine', 'Lab Test', 'X-Ray'],
        required: true
    },
    description: {
        type: String // e.g. "Paracetamol x10, Syrup x1"
    },
    status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    },
    paidAt: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);
