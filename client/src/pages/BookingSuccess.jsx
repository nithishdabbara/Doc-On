import { useLocation, useNavigate } from 'react-router-dom';

const BookingSuccess = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    console.log('BookingSuccess Rendered');
    console.log('State received:', state);

    if (!state || !state.appointment) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-red-500 mb-4">No booking details found.</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-blue-600 hover:underline"
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    const { appointment, bill } = state;

    const handleDownloadInvoice = () => {
        // Generate a simple text invoice
        const invoiceContent = `
        === DOC-ON HEALTHCARE INVOICE ===
        
        Invoice ID: ${bill._id}
        Date: ${new Date(bill.createdAt).toLocaleString()}
        Status: ${bill.status.toUpperCase()}
        
        ---------------------------------
        Doctor ID: ${bill.doctor}
        Patient ID: ${bill.patient}
        Service: ${bill.description}
        ---------------------------------
        
        TOTAL AMOUNT MOCK PAID: ₹${bill.amount}
        
        Thank you for choosing DocOn!
        `;

        const blob = new Blob([invoiceContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${bill._id}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">✅</span>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
                <p className="text-gray-600 mb-6">Your appointment has been successfully scheduled.</p>

                <div className="bg-gray-50 p-4 rounded-lg text-left mb-6 text-sm">
                    <p><span className="font-semibold">Type:</span> {appointment.visitType}</p>
                    <p><span className="font-semibold">Date:</span> {new Date(appointment.date).toLocaleString()}</p>
                    <p><span className="font-semibold">Queue Token:</span> #{appointment.queueNumber}</p>
                </div>

                {bill && (
                    <button
                        onClick={handleDownloadInvoice}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 mb-3"
                    >
                        📄 Download Invoice (₹{bill.amount})
                    </button>
                )}

                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default BookingSuccess;
