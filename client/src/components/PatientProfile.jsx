import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PatientProfileForm from './PatientProfileForm';

const PatientProfile = () => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);

    if (!user) return null;

    if (isEditing) {
        return (
            <div className="mb-6">
                <div className="flex justify-end mb-2">
                    <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
                <PatientProfileForm user={user} onComplete={() => setIsEditing(false)} />
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 flex flex-col items-center md:items-start md:flex-row gap-6">
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl text-gray-500">
                {/* Placeholder Photo */}
                📷
            </div>
            <div className="flex-1 w-full">
                <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold border border-blue-600 px-3 py-1 rounded"
                    >
                        Edit Profile
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <p className="text-sm text-gray-500">Age / Gender</p>
                        <p className="font-semibold">
                            {user.profile?.age ? `${user.profile.age} Years` : 'N/A'}
                            {' / '}
                            {user.profile?.gender || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-semibold">{user.profile?.phone || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-semibold">{user.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-semibold">{user.profile?.address || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientProfile;
