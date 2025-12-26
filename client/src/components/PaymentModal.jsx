import { useState, useEffect } from 'react';

const PaymentModal = ({ amount, onSuccess, onClose }) => {
    const [processing, setProcessing] = useState(false);
    const [method, setMethod] = useState('card'); // 'card' or 'upi'

    // Mock State
    const [card, setCard] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');

    // UPI Simulation State
    // UPI Simulation State
    // const [upiStatus, setUpiStatus] = useState('waiting'); // Removed unused state

    const handlePay = (e) => {
        e.preventDefault();
        setProcessing(true);

        // Simulation
        setTimeout(() => {
            setProcessing(false);
            // Simple validation simulation
            if (card.length >= 10 && cvv.length === 3) {
                onSuccess();
            } else {
                alert('Invalid Card Details (Mock: Enter any 10+ digits)');
            }
        }, 2000);
    };

    // Removed Auto-Payment Timer
    useEffect(() => {
        // Reset state when method changes
        setProcessing(false);
    }, [method]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-96 animate-fade-in relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-3 text-gray-500 hover:text-red-500"
                >
                    ✕
                </button>

                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    💳 Secure Payment
                </h3>

                <div className="bg-blue-50 p-3 rounded mb-4 text-center">
                    <p className="text-gray-600 text-xs">Total Amount</p>
                    <p className="text-2xl font-bold text-blue-700">₹{amount}</p>
                </div>

                {/* Payment Methods Tabs */}
                <div className="flex border-b mb-4">
                    <button
                        className={`flex-1 py-2 text-sm font-semibold ${method === 'card' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                        onClick={() => setMethod('card')}
                    >
                        Credit/Debit Card
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-semibold ${method === 'upi' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                        onClick={() => setMethod('upi')}
                    >
                        UPI / QR Code
                    </button>
                </div>

                {method === 'card' ? (
                    <form onSubmit={handlePay}>
                        <div className="mb-3">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Card Number</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded font-mono"
                                placeholder="0000 0000 0000 0000"
                                value={card}
                                onChange={(e) => setCard(e.target.value)}
                                maxLength="19"
                                required
                            />
                        </div>

                        <div className="flex gap-3 mb-4">
                            <div className="w-1/2">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Expiry</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded font-mono"
                                    placeholder="MM/YY"
                                    value={expiry}
                                    onChange={(e) => setExpiry(e.target.value)}
                                    maxLength="5"
                                    required
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-xs font-bold text-gray-700 mb-1">CVV</label>
                                <input
                                    type="password"
                                    className="w-full p-2 border rounded font-mono"
                                    placeholder="123"
                                    value={cvv}
                                    onChange={(e) => setCvv(e.target.value)}
                                    maxLength="3"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className={`w-full py-2 rounded text-white font-bold transition flex justify-center items-center ${processing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            {processing ? 'Processing...' : `Pay ₹${amount} Now`}
                        </button>

                        <p className="text-xs text-center text-gray-400 mt-3">
                            🔒 Encrypted by MockGateway
                        </p>
                    </form>
                ) : (
                    <div className="text-center py-4">
                        <div className="bg-white p-2 border-2 border-dashed border-gray-300 inline-block rounded-lg mb-4">
                            {/* QR Code Placeholder */}
                            <div className="w-40 h-40 bg-gray-900 flex items-center justify-center text-white text-xs font-mono p-2 text-center">
                                [ QR CODE ]
                                <br />
                                Scan to Pay
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">Scan using any UPI App</p>

                            {/* Manual Confirmation Button */}
                            <button
                                onClick={() => {
                                    setProcessing(true);
                                    setTimeout(() => onSuccess(), 1500);
                                }}
                                disabled={processing}
                                className={`w-full py-2 rounded text-white font-bold transition ${processing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                {processing ? 'Verifying...' : '✅ I Have Paid'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentModal;
