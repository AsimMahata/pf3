// Authentication Context
// Real JWT-based authentication with backend API

import { createContext, useState, type ReactNode, useEffect } from 'react';

const API_URL = 'http://localhost:3000/api';

interface User {
    id: string;
    name: string;
    email: string;
    createdAt: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        console.log('frontend / AuthContext / useEffect / Checking for existing session');
        const validateToken = async () => {
            const token = localStorage.getItem('authToken');
            console.log('frontend / AuthContext / validateToken / Token from localStorage:', token ? 'EXISTS' : 'NOT FOUND');

            if (!token) {
                console.log('frontend / AuthContext / validateToken / No token, skipping validation');
                setIsLoading(false);
                return;
            }

            try {
                console.log('frontend / AuthContext / validateToken / Calling /api/auth/me');
                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                console.log('frontend / AuthContext / validateToken / Response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('frontend / AuthContext / validateToken / User validated:', data.user);
                    setUser(data.user);
                } else {
                    console.log('frontend / AuthContext / validateToken / Token invalid, removing');
                    localStorage.removeItem('authToken');
                }
            } catch (error) {
                console.error('frontend / AuthContext / validateToken / Error:', error);
                localStorage.removeItem('authToken');
            } finally {
                setIsLoading(false);
            }
        };

        validateToken();
    }, []);

    const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
        console.log('frontend / AuthContext / login / Starting login for:', email);
        setIsLoading(true);

        try {
            console.log('frontend / AuthContext / login / Calling /api/auth/login');
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('frontend / AuthContext / login / Response status:', response.status);
            console.log('frontend / AuthContext / login / Response data:', data);

            if (response.ok) {
                console.log('frontend / AuthContext / login / Success, storing token');
                localStorage.setItem('authToken', data.token);
                setUser(data.user);
                setIsLoading(false);
                return { success: true };
            } else {
                console.log('frontend / AuthContext / login / Failed:', data.message);
                setIsLoading(false);
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error('frontend / AuthContext / login / Error:', error);
            setIsLoading(false);
            return { success: false, message: 'Network error. Please try again.' };
        }
    };

    const register = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
        console.log('frontend / AuthContext / register / Starting registration for:', email);
        setIsLoading(true);

        try {
            console.log('frontend / AuthContext / register / Calling /api/auth/register');
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            console.log('frontend / AuthContext / register / Response status:', response.status);
            console.log('frontend / AuthContext / register / Response data:', data);

            if (response.ok) {
                console.log('frontend / AuthContext / register / Success, storing token');
                localStorage.setItem('authToken', data.token);
                setUser(data.user);
                setIsLoading(false);
                return { success: true };
            } else {
                console.log('frontend / AuthContext / register / Failed:', data.message);
                setIsLoading(false);
                return { success: false, message: data.message || 'Registration failed' };
            }
        } catch (error) {
            console.error('frontend / AuthContext / register / Error:', error);
            setIsLoading(false);
            return { success: false, message: 'Network error. Please try again.' };
        }
    };

    const logout = () => {
        console.log('frontend / AuthContext / logout / Logging out user');
        fetch(`${API_URL}/auth/logout`, { method: 'POST' }).catch(() => { });

        setUser(null);
        localStorage.removeItem('authToken');
        console.log('frontend / AuthContext / logout / Token removed, user cleared');
    };

    const value = {
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        isLoading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
