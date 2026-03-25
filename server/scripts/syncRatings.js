const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from server directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

const syncRatings = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        console.log('Aggregating ratings...');
        const stats = await Appointment.aggregate([
            { $match: { rating: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: "$doctorId",
                    avgRating: { $avg: "$rating" },
                    totalRatings: { $sum: 1 }
                }
            }
        ]);

        console.log(`Found ratings for ${stats.length} doctors.`);

        for (const stat of stats) {
            await Doctor.findByIdAndUpdate(stat._id, {
                averageRating: stat.avgRating.toFixed(1),
                totalRatings: stat.totalRatings
            });
            console.log(`Updated Doctor ${stat._id}: ${stat.avgRating.toFixed(1)} stars (${stat.totalRatings} reviews)`);
        }

        console.log('Sync Complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

syncRatings();
