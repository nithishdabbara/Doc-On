const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'], // Credit = Add Money, Debit = Pay Bill
        required: true
    },
    description: {
        type: String,
        required: true
    },
    relatedInvoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
