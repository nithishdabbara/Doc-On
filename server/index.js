require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const passport = require('passport');

// Passport Config
require('./config/passport')(passport);

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*', // Allow all origins for dev
    allowedHeaders: ['Content-Type', 'x-auth-token']
}));
// app.use(passport.initialize()); // Uncomment if using session, but we use JWT so mainly for the route logic

// Debug Middleware: Log ALL requests
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/records', require('./routes/records'));
app.use('/api/payments', require('./routes/payments'));

// Make uploads folder static
app.use('/uploads', express.static('uploads'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reviews', require('./routes/reviews'));

// Basic Route
app.get('/', (req, res) => {
    res.send('Healthcare Appointment System API is running');
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');
        // Auto-Seed Admin
        const seedAdmin = require('./utils/seedAdmin');
        await seedAdmin();
    })
    .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
