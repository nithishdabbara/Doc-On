const mongoose = require('mongoose');

const labAssistantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    labId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabCentre', required: true },
    role: { type: String, default: 'lab_assistant' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LabAssistant', labAssistantSchema);
