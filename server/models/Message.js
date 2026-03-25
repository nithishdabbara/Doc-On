const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    roomId: { type: String, require: true }, // Usually Appointment ID or unique pair ID
    senderId: { type: String, required: true },
    senderRole: { type: String, enum: ['doctor', 'patient', 'admin'], required: true },
    receiverId: { type: String, required: true },
    receiverRole: { type: String, enum: ['doctor', 'patient', 'admin'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
