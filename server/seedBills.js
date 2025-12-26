const mongoose = require('mongoose');
const Bill = require('./models/Bill');
const User = require('./models/User');
require('dotenv').config();

const seedBills = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const patients = await User.find({ role: 'patient' });
        const doctors = await User.find({ role: 'doctor' });

        if (patients.length === 0 || doctors.length === 0) {
            console.log('Need patients and doctors to seed bills');
            process.exit();
        }

        const sampleBills = [
            {
                patient: patients[0]._id,
                doctor: doctors[0]._id,
                amount: 150,
                description: 'General Checkup Consultation',
                status: 'unpaid',
                date: new Date()
            },
            {
                patient: patients[0]._id,
                doctor: doctors[0]._id,
                amount: 50,
                description: 'Blood Test Lab Fee',
                status: 'paid',
                date: new Date(Date.now() - 86400000) // Yesterday
            }
        ];

        await Bill.insertMany(sampleBills);
        console.log('Sample bills seeded');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedBills();
