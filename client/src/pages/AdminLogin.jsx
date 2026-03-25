import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // For demo, allowing hardcoded admin/admin without database seeding if simpler
            // But we implemented endpoint, so use it.
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/login`, {
                email: username, password, type: 'admin'
            });
            sessionStorage.setItem('adminToken', res.data.token);
            sessionStorage.setItem('user', JSON.stringify(res.data.user || { name: 'Super Admin', type: 'admin' })); // Fallback if backend doesn't send user

            const from = sessionStorage.getItem('adminRedirect') || '/admin/dashboard';
            sessionStorage.removeItem('adminRedirect');
            navigate(from, { replace: true });
        } catch (err) {
            alert('Login Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const [btnText, setBtnText] = useState('Access Console');

    useEffect(() => {
        const path = sessionStorage.getItem('adminRedirect');
        if (path && path.includes('appointments')) {
            setBtnText('Access Appointments');
        } else {
            setBtnText('Access Console');
        }
    }, [location]); // Re-run if location changes, though strictly mount is enough

    return (
        <div className="container animate-fade" style={{ paddingTop: '4rem', maxWidth: '400px' }}>
            <h1 className="text-2xl mb-4 text-center">Admin Access</h1>
            <form onSubmit={handleLogin} className="card grid gap-4" style={{ borderColor: 'var(--secondary)' }} autoComplete="off">
                <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="input-field" required autoComplete="off" />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" required autoComplete="new-password" />
                <button type="submit" className="btn btn-primary">{btnText}</button>
            </form>
        </div>
    );
};

export default AdminLogin;

