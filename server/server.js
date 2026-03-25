const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Payment Routes (Razorpay)
app.use('/api/payment', require('./routes/paymentRoutes'));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Start Cron Jobs (Auto No-Show)
require('./jobs/appointmentScheduler')();

// Routes (Placeholders)
app.get('/', (req, res) => {
    res.send('DocOn API Running');
});

// Health Check (For Render monitoring)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const patientRoutes = require('./routes/patientRoutes');
const aiRoutes = require('./routes/aiRoutes');
const recordRoutes = require('./routes/recordRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/ai', aiRoutes);
// app.use('/api/records', recordRoutes);
// app.use('/api/labs', require('./routes/labRoutes'));
// app.use('/api/admin/analytics', require('./routes/analyticsRoutes')); // Phase 1 Advanced AI
// app.use('/api/ocr', require('./routes/ocrRoutes')); // Phase 2 Advanced AI
// app.use('/api/admin/risk', require('./routes/riskRoutes')); // Phase 3 Advanced AI
app.use('/api/upload', require('./routes/uploadRoutes'));
// app.use('/api/chat', require('./routes/chatRoutes'));

// Serve Uploads Static Folder
app.use('/uploads', express.static('uploads'));

// Socket.io (Disabled for Production Stability on Free Tier)
/*
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "https://doc-on-ten.vercel.app"
        ],
        methods: ["GET", "POST"]
    }
});

// Share io instance with routes
app.set('io', io);

const Message = require('./models/Message');

io.on('connection', (socket) => {
    // console.log(`User Connected: ${ socket.id } `);

    socket.on('join_room', (room) => {
        socket.join(room);
        // console.log(`User joined room: ${ room } `);
    });

    socket.on('send_message', async (data) => {
        // data: { roomId, senderId, senderRole, receiverId, receiverRole, message }
        try {
            // Save to DB
            const newMessage = new Message({
                roomId: data.roomId,
                senderId: data.senderId,
                senderRole: data.senderRole,
                receiverId: data.receiverId,
                receiverRole: data.receiverRole,
                message: data.message
            });
            await newMessage.save();

            // Boardcast to room (including sender if needed, but usually sender adds optimistically)
            // socket.to(data.roomId) sends to everyone BUT sender
            // io.in(data.roomId) sends to everyone INCLUDING sender
            // Let's use socket.to for now and let frontend handle own message, or IO for sync.
            socket.to(data.roomId).emit('receive_message', data);
        } catch (err) {
            console.error("Error saving message:", err);
        }
    });

    socket.on('disconnect', () => {
        // console.log("User Disconnected", socket.id);
    });
});
*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT} [Basic Mode]`));
