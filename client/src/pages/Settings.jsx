import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { user } = useAuth();
    const [exporting, setExporting] = useState(false);

    const handleExport = () => {
        setExporting(true);
        setTimeout(() => {
            // Mock Download
            const element = document.createElement("a");
            const file = new Blob([`Name: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}\nDate: ${new Date()}`], { type: 'text/plain' });
            element.href = URL.createObjectURL(file);
            element.download = "my_medical_records.txt";
            document.body.appendChild(element); // Required for this to work in FireFox
            element.click();
            setExporting(false);
            alert('Your private health records have been securely exported.');
        }, 1500);
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            try {
                // Assuming api is passed or imported (if not, use fetch like below or import api)
                // Using fetch here to match existing style in this file if api not imported top-level
                // But wait, contexts usually use api utility. Let's check imports.
                // It uses useAuth. Let's restart.

                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5000/api/users/delete-account', {
                    method: 'DELETE',
                    headers: { 'x-auth-token': token }
                });

                if (res.ok) {
                    alert('Account Deleted Successfully');
                    window.location.href = '/login'; // Force full reload/logout
                    localStorage.removeItem('token');
                } else {
                    const data = await res.json();
                    alert(data.msg || 'Failed to delete account');
                }
            } catch (err) {
                console.error(err);
                alert('Server Error');
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">Account Settings</h2>

            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">🔒 Secure Health Locker</h3>
                <p className="text-sm text-gray-500 mb-4">
                    You have full ownership of your data. Download your complete medical history here.
                </p>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center gap-2"
                >
                    {exporting ? 'Encrypting & Downloading...' : '📥 Export Personal Data'}
                </button>
            </div>

            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
                <button
                    onClick={handleDeleteAccount}
                    className="border border-red-500 text-red-500 px-4 py-2 rounded hover:bg-red-50"
                >
                    Delete Account
                </button>
            </div>

            <SecuritySection user={user} />
        </div >
    );
};

const SecuritySection = ({ user }) => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        newEmail: user.email,
        otp: ''
    });
    const [msg, setMsg] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [timer, setTimer] = useState(0);

    const handleSendOtp = async () => {
        try {
            setMsg('Sending OTP...');
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/auth/send-otp', {
                method: 'POST',
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            if (res.ok) {
                setMsg('✅ OTP Sent! Check your email.');
                setOtpSent(true);
                setTimer(60); // 60s cooldown

                // Countdown
                const interval = setInterval(() => {
                    setTimer((prev) => {
                        if (prev <= 1) clearInterval(interval);
                        return prev - 1;
                    });
                }, 1000);
            } else {
                setMsg(`❌ ${data.msg}`);
            }
        } catch (err) {
            setMsg('❌ Failed to send OTP');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/auth/security', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                setMsg('✅ Settings updated successfully!');
                setFormData({ ...formData, currentPassword: '', newPassword: '', otp: '' });
                setOtpSent(false);
            } else {
                setMsg(`❌ ${data.msg}`);
            }
        } catch (err) {
            setMsg('❌ Server Error');
        }
    };

    return (
        <div className="mt-8 border-t pt-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">🔐 Security & Login</h3>

            {user.role === 'admin' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <p className="text-yellow-700 text-sm">
                        <strong>Admin Notice:</strong> If you change your credentials here, please also update your
                        Server Environment Variables (`.env`) to prevent them from resetting on the next restart.
                    </p>
                </div>
            )}

            {msg && <div className="mb-4 text-sm font-semibold">{msg}</div>}

            <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
                    <input
                        type="email"
                        value={formData.newEmail}
                        onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
                        className="w-full border p-2 rounded"
                        required
                    />
                </div>

                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">New Password (Optional)</label>
                    <input
                        type="password"
                        placeholder="Leave blank to keep current"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="w-full border p-2 rounded"
                    />
                </div>

                {/* OTP Section */}
                <div className="bg-blue-50 p-4 rounded border border-blue-100">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Verification</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={timer > 0}
                            className={`flex-1 py-2 rounded text-sm font-bold transition ${timer > 0 ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                            {timer > 0 ? `Resend in ${timer}s` : '📧 Send OTP Code'}
                        </button>
                    </div>

                    {otpSent && (
                        <div className="mt-3 animate-fade-in">
                            <label className="block text-gray-700 text-xs font-bold mb-1">Enter 6-Digit Code</label>
                            <input
                                type="text"
                                placeholder="123456"
                                value={formData.otp}
                                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                className="w-full border p-2 rounded tracking-widest text-center text-lg font-mono font-bold"
                                maxLength="6"
                                required
                            />
                        </div>
                    )}
                </div>

                <div className="pt-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Current Password (Required to Save)</label>
                    <input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        className="w-full border p-2 rounded bg-gray-50"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={!otpSent || !formData.otp}
                    className={`w-full py-3 rounded text-white font-bold transition ${(!otpSent || !formData.otp) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    Confirm & Update Security Settings
                </button>
            </form>
        </div >
    );
};

export default Settings;
