import { createContext, useReducer, useEffect, useContext, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: null,
    loading: true, // Start true, ensuring we wait for loadUser
    user: null
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'USER_LOADED':
            return {
                ...state,
                isAuthenticated: true,
                loading: false,
                user: action.payload
            };
        case 'LOGIN_SUCCESS':
        case 'REGISTER_SUCCESS':
            return {
                ...state,
                ...action.payload,
                isAuthenticated: true,
                loading: false
            };
        case 'AUTH_ERROR':
        case 'LOGIN_FAIL':
        case 'LOGOUT':
        case 'REGISTER_FAIL':
            return {
                ...state,
                token: null,
                isAuthenticated: false,
                loading: false,
                user: null
            };
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Load User
    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // console.log('Loading user...');
                const res = await api.get('/auth/user');
                // console.log('User loaded:', res.data);
                dispatch({ type: 'USER_LOADED', payload: res.data });
            } catch (err) {
                console.error('Load user error:', err);
                localStorage.removeItem('token'); // Clear bad token
                dispatch({ type: 'AUTH_ERROR' });
            }
        } else {
            // console.log('No token found');
            dispatch({ type: 'AUTH_ERROR' });
        }
    }, [dispatch]);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    // Register User
    const register = async (formData) => {
        try {
            const res = await api.post('/auth/register', formData);
            localStorage.setItem('token', res.data.token);
            dispatch({ type: 'REGISTER_SUCCESS', payload: res.data });
            await loadUser();
        } catch (err) {
            localStorage.removeItem('token');
            dispatch({ type: 'REGISTER_FAIL' });
            throw err.response.data; // Propagate error for UI handling
        }
    };

    // Login User
    const login = async (formData) => {
        try {
            const res = await api.post('/auth/login', formData);
            localStorage.setItem('token', res.data.token);
            dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
            await loadUser();
        } catch (err) {
            localStorage.removeItem('token');
            dispatch({ type: 'LOGIN_FAIL' });
            throw err.response.data;
        }
    };

    // Logout
    const logout = () => {
        localStorage.removeItem('token');
        dispatch({ type: 'LOGOUT' });
    };

    return (
        <AuthContext.Provider
            value={{
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                loading: state.loading,
                user: state.user,
                register,
                login,
                logout,
                loadUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
