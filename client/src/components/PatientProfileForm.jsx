import { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const PatientProfileForm = ({ user, onComplete }) => {
    const [formData, setFormData] = useState({
        age: user.profile?.age || '',
        gender: user.profile?.gender || '',
        phone: user.profile?.phone || '',
        address: user.profile?.address || ''
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const { dispatch } = useAuth(); // We might need to expose dispatch or reload user

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/users/profile', formData);
            setMsg('Profile updated successfully!');
            // Reload user to update context immediately without page reload
            if (onComplete) {
                await onComplete(); // This should be loadUser passed from parent
            } else {
                // Fallback if no prop
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            setMsg('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-blue-800">Complete Your Profile</h2>
            <p className="mb-6 text-gray-600">Please provide your details to get better recommendations.</p>

            {msg && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{msg}</div>}

            <form onSubmit={onSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Age</label>
                        <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={onChange}
                            className="w-full p-2 border border-gray-300 rounded"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Gender</label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={onChange}
                            className="w-full p-2 border border-gray-300 rounded"
                            required
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={onChange}
                            className="w-full p-2 border border-gray-300 rounded"
                            required
                        />
                    </div>
                    <div className="mb-4 md:col-span-2">
                        <label className="block text-gray-700 mb-2">Address</label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={onChange}
                            className="w-full p-2 border border-gray-300 rounded"
                            rows="3"
                            required
                        ></textarea>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                    {loading ? 'Saving...' : 'Save Profile'}
                </button>
            </form>
        </div>
    );
};

export default PatientProfileForm;
