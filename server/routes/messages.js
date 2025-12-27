const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const upload = require('../middleware/upload'); // Re-using existing middleware

// @route   POST api/messages
// @desc    Send a message (Text + Optional Image)
// @access  Private
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        const { recipientId, content } = req.body;

        const newMessage = new Message({
            sender: req.user.id,
            recipient: recipientId,
            content: content || 'Sent an image',
            attachment: req.file ? `/uploads/${req.file.filename}` : undefined
        });

        const message = await newMessage.save();
        res.json(message);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/messages/contacts
// @desc    Get list of users messaged with
// @access  Private
router.get('/contacts', auth, async (req, res) => {
    try {
        // Find distinct users involved in messages sent or received
        const sentTo = await Message.distinct('recipient', { sender: req.user.id });
        const receivedFrom = await Message.distinct('sender', { recipient: req.user.id });

        const contactIds = [...new Set([...sentTo, ...receivedFrom])];

        const users = await User.find({ _id: { $in: contactIds } }).select('name role email');

        // Enhance with Doctor details (Specialization)
        const contacts = await Promise.all(users.map(async (user) => {
            let extra = {};
            if (user.role === 'doctor') {
                const doc = await Doctor.findOne({ user: user._id }).select('specialization');
                if (doc) extra.specialization = doc.specialization;
            }
            return {
                ...user.toObject(),
                ...extra
            };
        }));

        res.json(contacts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/messages/:userId
// @desc    Get conversation with a user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, recipient: req.params.userId },
                { sender: req.params.userId, recipient: req.user.id }
            ]
        }).sort({ date: 1 });

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
