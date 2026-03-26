const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs'); // Added fs module

dotenv.config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ✅ FIX: CORS with explicit config
const allowedOrigins = [
    'http://localhost:5173',
    'https://doc-on-ten.vercel.app'
];

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// ✅ FIX: COOP/COEP headers FIRST — before anything else
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Serving static files (Uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io Real-time Chat
const Message = require('./models/Message');
io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('send_message', async (data) => {
        try {
            const { roomId, senderId, senderRole, receiverId, receiverRole, message } = data;
            
            // Save to DB
            const newMessage = new Message({
                roomId,
                senderId,
                senderRole,
                receiverId,
                receiverRole,
                message,
                timestamp: new Date()
            });
            await newMessage.save();

            // Broadcast to room
            io.to(roomId).emit('receive_message', data);
        } catch (err) {
            console.error("Socket send_message error:", err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected:', socket.id);
    });
});

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
const labRoutes = require('./routes/labRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const chatRoutes = require('./routes/chatRoutes'); // Import chat routes

// Enable Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/patients', patientRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes); // Enable chat routes

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [Real-time Chat Enabled]`);
});
