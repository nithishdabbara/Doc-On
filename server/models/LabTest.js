const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true }, // e.g., 'CBC', 'LIPID'
    name: { type: String, required: true },
    category: { type: String, enum: ['Pathology', 'Radiology', 'Cardiology', 'Other'], default: 'Pathology' },
    specialty: { type: String, required: true }, // New: e.g., 'Cardiologist', 'Dentist'
    description: { type: String },
    standardPrice: { type: Number, required: true }, // Base price

    // Collection Details
    isHomeCollectionAvailable: { type: Boolean, default: false },
    collectionType: { type: String, enum: ['home', 'lab'], default: 'lab' }, // derived from user input

    // Pre-requisites (e.g., "Fasting required")
    prerequisites: { type: String },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LabTest', labTestSchema);
