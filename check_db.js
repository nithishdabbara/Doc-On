
const mongoose = require('mongoose');

const Appointment = require('e:/healthcare project/server/models/Appointment');

async function checkData() {
    try {
        await mongoose.connect('mongodb+srv://nithish:nithish@cluster0.p7scb.mongodb.net/docon?retryWrites=true&w=majority');
        console.log('Connected to DB');

        const appointments = await Appointment.find({ paymentStatus: 'paid' }).limit(5);
        console.log('Paid Appointments Found:', appointments.length);
        
        appointments.forEach(appt => {
            console.log(`ID: ${appt._id}, Patient: ${appt.patientName}, PaymentID: ${appt.paymentId}, OrderID: ${appt.orderId}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
