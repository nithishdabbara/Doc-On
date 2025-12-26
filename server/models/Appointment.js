const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    visitType: {
        type: String,
        enum: ['General Checkup', 'Urgent', 'Follow-up', 'Consultation'],
        default: 'General Checkup'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    notes: {
        type: String
    },
    queueNumber: {
        type: Number
    },
    videoLink: {
        type: String // For Telemedicine
    }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
