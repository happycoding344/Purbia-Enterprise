import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/axios';

interface User {
    id: number;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 15 minutes in milliseconds
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

    const logout = useCallback(async () => {
        try {
            if (token) {
                await api.post('/logout');
            }
        } catch (error) {
            console.error('Error logging out API', error);
        } finally {
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');

            // Clear inactivity timer on logout
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
                inactivityTimerRef.current = null;
            }
        }
    }, [token]);

    // Reset inactivity timer
    const resetInactivityTimer = useCallback(() => {
        // Clear existing timer
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        // Only set timer if user is logged in
        if (token && user) {
            inactivityTimerRef.current = setTimeout(() => {
                console.log('User inactive for 15 minutes. Logging out...');
                logout();
                alert('You have been logged out due to inactivity.');
            }, INACTIVITY_TIMEOUT);
        }
    }, [token, user, logout]);

    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                try {
                    const response = await api.get('/user');
                    setUser(response.data);
                } catch (error) {
                    console.error('Failed to fetch user', error);
                    logout();
                }
            }
            setIsLoading(false);
        };

        fetchUser();
    }, [token, logout]);

    // Set up inactivity tracking when user logs in
    useEffect(() => {
        if (token && user) {
            // Start inactivity timer
            resetInactivityTimer();

            // Track user activity
            const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

            const handleActivity = () => {
                resetInactivityTimer();
            };

            // Add event listeners
            events.forEach(event => {
                document.addEventListener(event, handleActivity);
            });

            // Cleanup function
            return () => {
                events.forEach(event => {
                    document.removeEventListener(event, handleActivity);
                });

                if (inactivityTimerRef.current) {
                    clearTimeout(inactivityTimerRef.current);
                }
            };
        }
    }, [token, user, resetInactivityTimer]);

    const login = (newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
