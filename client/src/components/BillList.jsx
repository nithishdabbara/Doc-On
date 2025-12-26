import { useState, useEffect } from 'react';
import api from '../utils/api';
import PaymentModal from './PaymentModal';

const BillList = () => {
    const [bills, setBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);

    const fetchBills = async () => {
        try {
            const res = await api.get('/bills');
            setBills(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchBills();
    }, []);

    const handlePay = async (billId) => {
        try {
            await api.put(`/bills/${billId}/pay`);
            fetchBills();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-4">
            {bills.length === 0 ? (
                <p className="text-gray-500">No medical bills found.</p>
            ) : (
                bills.map(bill => (
                    <div key={bill._id} className="bg-white p-4 rounded-lg shadow border border-gray-100 flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-gray-800">{bill.description}</p>
                            <p className="text-sm text-gray-500">
                                Doctor: {bill.doctor.name} | Date: {new Date(bill.date).toLocaleDateString()}
                            </p>
                            <p className={`text-sm font-bold mt-1 ${bill.status === 'paid' ? 'text-green-600' : 'text-red-500'}`}>
                                Status: {bill.status.toUpperCase()}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xl font-bold text-gray-800">${bill.amount}</span>
                            {bill.status === 'unpaid' && (
                                <button
                                    onClick={() => setSelectedBill(bill)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Pay Now
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}

            {selectedBill && (
                <PaymentModal
                    bill={selectedBill}
                    onClose={() => setSelectedBill(null)}
                    onPay={handlePay}
                />
            )}
        </div>
    );
};

export default BillList;
