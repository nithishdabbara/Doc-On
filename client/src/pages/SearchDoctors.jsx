import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Calendar } from 'lucide-react';
import axios from 'axios';

const SearchDoctors = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);

    // Initialize from URL
    const searchParams = new URLSearchParams(window.location.search);
    const initialQuery = searchParams.get('search') || '';

    // Search States
    const [query, setQuery] = useState(initialQuery);
    const [locationSearch, setLocationSearch] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        minExp: '',
        maxExp: '',
        minFee: '',
        maxFee: '',
    });

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDoctors();
        }, 500);
        return () => clearTimeout(timer);
    }, [query, locationSearch, filters]); // Re-fetch when filters change

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const params = {
                search: query,
                location: locationSearch,
                ...filters // Spread filters into query params
            };
            const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/public`, { params });
            if (Array.isArray(res.data)) {
                setDoctors(res.data);
            } else {
                setDoctors([]);
            }
            setHasSearched(true);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchDoctors();
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }));
    };

    const getPercentageRating = (rating) => {
        return Math.round((rating / 5) * 100);
    };


    const getDoctorImg = (name) => {
        // Using ui-avatars for reliable, lightweight initials-based avatars
        // This avoids the 404/ERR_NAME_NOT_RESOLVED issues with third-party face generators
        const cleanName = String(name).replace('Dr.', '').replace('Dr ', '').trim();
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0D8ABC&color=fff&size=256&bold=true`;
    };

    return (
        <div className="container mx-auto px-4 py-8 flex gap-6 items-start">
            {/* Sidebar */}
            <div className="hidden md:block w-64 flex-shrink-0 bg-white p-4 rounded-lg shadow-sm border h-fit sticky top-24">
                <h3 className="font-bold text-gray-700 mb-4">Filters</h3>

                {/*
                <div className="mb-6">
                    <h4 className="font-semibold text-sm mb-2 text-gray-600">Mode of Consult</h4>
                    ... (Not implemented in backend yet)
                </div>
                */}

                <div className="mb-6">
                    <h4 className="font-semibold text-sm mb-2 text-gray-600">Experience</h4>
                    <label className="flex items-center gap-2 text-sm text-gray-600 mb-1 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.maxExp === '5'}
                            onChange={() => {
                                setFilters(prev => ({ ...prev, minExp: '0', maxExp: prev.maxExp === '5' ? '' : '5' }));
                            }}
                            className="rounded"
                        /> 0-5 Years
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600 mb-1 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.minExp === '5' && filters.maxExp === '10'}
                            onChange={() => {
                                setFilters(prev => ({ ...prev, minExp: prev.minExp === '5' ? '' : '5', maxExp: prev.maxExp === '10' ? '' : '10' }));
                            }}
                            className="rounded"
                        /> 6-10 Years
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600 mb-1 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.minExp === '10'}
                            onChange={() => {
                                setFilters(prev => ({ ...prev, minExp: prev.minExp === '10' ? '' : '10', maxExp: '' }));
                            }}
                            className="rounded"
                        /> 10+ Years
                    </label>
                </div>

                <div className="mb-6">
                    <h4 className="font-semibold text-sm mb-2 text-gray-600">Fees</h4>
                    <label className="flex items-center gap-2 text-sm text-gray-600 mb-1 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.maxFee === '500'}
                            onChange={() => {
                                setFilters(prev => ({ ...prev, minFee: '0', maxFee: prev.maxFee === '500' ? '' : '500' }));
                            }}
                        /> Below ₹500
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.minFee === '500'}
                            onChange={() => {
                                setFilters(prev => ({ ...prev, minFee: prev.minFee === '500' ? '' : '500', maxFee: '' }));
                            }}
                        /> Above ₹500
                    </label>
                </div>


            </div>

            {/* Main Content */}
            <div className="flex-1">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-4">Find a Specialist</h1>
                    <form onSubmit={handleSearch} className="flex gap-4 p-4 bg-white shadow-sm rounded-lg border">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search doctor, clinic, symptom..."
                                className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:border-blue-500"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Location"
                                className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:border-blue-500"
                                value={locationSearch}
                                onChange={(e) => setLocationSearch(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="bg-blue-500 text-white px-8 py-2 rounded hover:bg-blue-600 font-medium">Search</button>
                    </form>
                </div>

                <div className="grid gap-4">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : !hasSearched ? (
                        <div className="bg-white p-12 text-center rounded-lg border">
                            <Search size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl text-gray-500 font-medium">Search specifically for a doctor, symptom, or clinic.</h3>
                            <p className="text-gray-400 mt-2">Example: "Dentist", "Chest Pain", "Apollo Hospital"</p>
                        </div>
                    ) : doctors.length === 0 ? (
                        <div className="bg-white p-8 text-center rounded-lg border">
                            <p className="text-gray-500">No doctors found matching your criteria.</p>
                        </div>
                    ) : (
                        doctors.map(doc => {
                            // Defensive Check: Skip invalid records
                            if (!doc || !doc.name) return null;

                            return (
                                <div key={doc._id} className="bg-white p-6 rounded-lg border hover:shadow-lg transition-shadow flex flex-col md:flex-row gap-6">
                                    {/* Image */}
                                    <div className="flex-shrink-0">
                                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border">
                                            <img
                                                src={getDoctorImg(doc.name)}
                                                alt={doc.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                        </div>
                                        <div className="mt-4 text-center">
                                            <button
                                                onClick={() => navigate(`/doctor/${doc._id}`)}
                                                className="text-cyan-500 text-sm font-semibold hover:underline"
                                            >
                                                View Profile
                                            </button>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <h2
                                            onClick={() => navigate(`/doctor/${doc._id}`)}
                                            className="text-xl font-bold text-blue-500 cursor-pointer hover:underline mb-1"
                                        >
                                            {String(doc.name).toLowerCase().startsWith('dr') ? doc.name : `Dr. ${doc.name}`}
                                        </h2>
                                        <p className="text-sm text-gray-600 mb-1">{doc.specialization || 'General Physician'}</p>
                                        <p className="text-sm text-gray-500 mb-2">
                                            {/* Smartly handle 'Years' suffix from DB to avoid doublification */}
                                            {doc.experience ? (String(doc.experience).toLowerCase().includes('year') ? doc.experience : `${doc.experience} years`) : '10+ years'} experience overall
                                        </p>

                                        <div className="flex items-start gap-1 mb-2">
                                            <MapPin size={16} className="text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-sm text-gray-700">{doc.address || 'Medical Center'}</p>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-700">
                                            <span className="font-bold">₹{doc.consultationFee || 500}</span> Consultation fee at clinic
                                        </p>

                                        <div className="mt-4 flex items-center gap-4">
                                            <span className={`px-2 py-1 rounded text-white text-xs font-bold ${doc.averageRating > 0 ? 'bg-green-600' : 'bg-gray-400'}`}>
                                                {doc.averageRating > 0 ? `👍 ${getPercentageRating(doc.averageRating)}%` : 'New'}
                                            </span>
                                            <span className="text-sm text-gray-600 underline cursor-pointer">
                                                {doc.totalRatings || 0} Patient Stories
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="md:w-64 flex flex-col items-center md:items-end justify-between border-l md:pl-6 border-dashed">
                                        <div className="mb-4 text-center md:text-right">
                                            <p className="text-green-600 text-xs font-semibold flex items-center justify-end gap-1">
                                                <Calendar size={14} /> {doc.availability || 'Available Today'}
                                            </p>
                                        </div>
                                        <div className="w-full space-y-2">
                                            <button
                                                onClick={() => navigate(`/doctor/${doc._id}`)}
                                                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded text-sm transition-colors"
                                            >
                                                Book Appointment
                                            </button>
                                            <button
                                                onClick={() => doc.phone ? window.location.href = `tel:${doc.phone}` : alert('Contact number not available')}
                                                className="w-full border border-cyan-500 text-cyan-600 font-semibold py-2 px-4 rounded text-sm hover:bg-cyan-50 transition-colors"
                                            >
                                                Contact Clinic
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {doctors.length >= 50 && (
                        <div className="text-center mt-6 text-gray-500 italic">
                            Showing top 50 results. Refine your search to find more.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchDoctors;

