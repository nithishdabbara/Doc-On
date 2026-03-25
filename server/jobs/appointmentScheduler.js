const cron = require('node-cron');
const Appointment = require('../models/Appointment');

const checkNoShows = async () => {
    console.log('[Cron Job] Running Auto No-Show Check...');
    try {
        const now = new Date();
        // Grace Period: 1 Hour (60 minutes) to mark no-shows
        const gracePeriodLimit = new Date(now.getTime() - 1 * 60 * 60 * 1000);

        const result = await Appointment.updateMany(
            {
                status: 'scheduled',
                date: { $lt: gracePeriodLimit }
            },
            {
                $set: { status: 'no_show' }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`[Cron Job] Marked ${result.modifiedCount} appointments as No-Show.`);
        } else {
            console.log('[Cron Job] No expired appointments found.');
        }
    } catch (err) {
        console.error('[Cron Job] Error:', err);
    }
};

// Run every 5 minutes AND immediately on start
const startNoShowJob = () => {
    // Run immediately on server start
    checkNoShows();

    // Schedule for future (Every 5 minutes)
    cron.schedule('*/5 * * * *', () => {
        checkNoShows();
    });
};

module.exports = startNoShowJob;
