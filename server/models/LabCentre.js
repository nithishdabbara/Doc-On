const mongoose = require('mongoose');

const labCentreSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true }, // Important for Search
    state: { type: String },
    contactNumber: { type: String },
    email: { type: String, required: true, unique: true }, // Verified unique for login
    password: { type: String }, // For real auth
    website: { type: String },

    // Capabilities
    availableTestTypes: [{
        testName: { type: String },
        price: { type: Number },
        turnaroundTime: { type: String }
    }],
    isHomeCollectionAvailable: { type: Boolean, default: false },
    rating: { type: Number, default: 4.0 },

    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LabCentre', labCentreSchema);
