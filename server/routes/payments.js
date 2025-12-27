const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const Doctor = require('../models/Doctor');
const Transaction = require('../models/Transaction');

// @route   POST api/payments/create-invoice
// @desc    Doctor creates a bill used for Medicines/X-Ray
// @access  Private (Doctor)
router.post('/create-invoice', auth, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') return res.status(403).json({ msg: 'Access denied' });

        const { patientId, amount, type, description, appointmentId } = req.body;

        const invoice = new Invoice({
            doctor: req.user.id,
            patient: patientId,
            appointment: appointmentId,
            amount,
            type,
            description,
            status: 'pending'
        });

        await invoice.save();
        res.json(invoice);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/payments/my-invoices
// @desc    Get all invoices for logged in user
// @access  Private
router.get('/my-invoices', auth, async (req, res) => {
    try {
        let invoices;
        if (req.user.role === 'doctor') {
            invoices = await Invoice.find({ doctor: req.user.id })
                .populate('patient', 'name')
                .sort({ date: -1 });
        } else {
            invoices = await Invoice.find({ patient: req.user.id })
                .populate('doctor', 'name hospitalName')
                .sort({ date: -1 });
        }
        res.json(invoices);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/payments/pay-invoice
// @desc    Pay an invoice using Mock Gateway
// @access  Private
router.post('/pay-invoice', auth, async (req, res) => {
    const { invoiceId, cardDetails } = req.body; // cardDetails is just for simulation

    try {
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return res.status(404).json({ msg: 'Invoice not found' });
        if (invoice.status === 'paid') return res.status(400).json({ msg: 'Invoice already paid' });

        // User Wallet Check (Optional: For now we assume direct card payment adds money then pays)
        // SIMULATION: Assume Payment Gateway is successful
        const isSuccess = true;

        if (isSuccess) {
            // 1. Mark Invoice Paid
            invoice.status = 'paid';
            invoice.paidAt = Date.now();
            await invoice.save();

            // 2. Revenue Split Logic (10% Platform Fee)
            const PLATFORM_FEE_PERCENT = 0.10;
            const adminShare = invoice.amount * PLATFORM_FEE_PERCENT;
            const doctorShare = invoice.amount - adminShare;

            // 3. Credit Doctor's Wallet
            await Doctor.findOneAndUpdate({ user: invoice.doctor }, {
                $inc: { walletBalance: doctorShare }
            });

            // 4. Create Transaction Record (Patient Debit)
            await new Transaction({
                user: req.user.id,
                amount: invoice.amount,
                type: 'debit', // Money leaving patient
                description: `Paid for ${invoice.type} to Dr. (Ref: ${invoice.doctor})`,
                relatedInvoice: invoice._id
            }).save();

            // 5. Create Transaction Record (Doctor Credit)
            await new Transaction({
                user: invoice.doctor,
                amount: doctorShare,
                type: 'credit', // Money entering doctor account
                description: `Payout for Invoice #${invoice._id.toString().slice(-6)} (10% Platform Fee Deducted)`,
                relatedInvoice: invoice._id
            }).save();

            res.json({ msg: 'Payment Successful', invoice });
        } else {
            res.status(400).json({ msg: 'Payment Failed' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
