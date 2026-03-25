const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

// Initialize Razorpay
// Note: In a real app, use process.env.RAZORPAY_KEY_ID and SECRET
// For this demo agent environment, we might default to test keys if env is missing, 
// BUT simply using process.env is the correct implementation way.
// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET'
});

// 0. Get Config (Key ID)
router.get('/key', (req, res) => {
    res.json({ key: process.env.RAZORPAY_KEY_ID });
});

// 1. Create Order
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR' } = req.body;

        const options = {
            amount: amount * 100, // Amount in paise
            currency,
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Razorpay Create Order Error:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
});

// 2. Verify Payment
router.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET')
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            res.json({ status: 'success', message: 'Payment Verified', paymentId: razorpay_payment_id });
        } else {
            res.status(400).json({ status: 'failure', message: 'Invalid Signature' });
        }
    } catch (error) {
        console.error("Razorpay Verify Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
