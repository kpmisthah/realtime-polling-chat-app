import React, { useState } from 'react';
import { Disc, User, Lock, ArrowRight, Loader2, Mail } from 'lucide-react';
import './Auth.css';
import api from '../api/client';

interface AuthProps {
    onLogin: (username: string, token: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(''); // New Email State
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const endpoint = isLogin ? '/auth/login' : '/auth/signup';
        const payload = isLogin ? { username, password } : { username, email, password };

        try {
            const response = await api.post(endpoint, payload);
            const data = response.data;

            // Success
            onLogin(data.user.username, data.accessToken);

        } catch (err: any) {
            console.error('Authentication Error:', err);
            let message = 'Authentication failed. Please try again.';

            if (err.response) {
                // Server responded with a status code out of the 2xx range
                message = err.response.data?.message || 'Server error occurred.';
            } else if (err.request) {
                // The request was made but no response was received
                message = 'No response from server. Check your connection.';
            } else {
                // Something happened in setting up the request
                message = err.message;
            }
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Animated Background Blobs */}
            <div className="auth-bg-blob blob-1"></div>
            <div className="auth-bg-blob blob-2"></div>

            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon-wrapper">
                        <Disc size={32} color="var(--primary)" />
                    </div>
                    <div>
                        <h1 className="auth-title">{isLogin ? 'Welcome Back' : 'Get Started'}</h1>
                        <p className="auth-subtitle">
                            {isLogin ? 'Sign in to access your polls and chats' : 'Create an account to join the conversation'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    <div className="input-group">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="auth-input"
                            placeholder=" " /* Space required for floating label trick */
                            required
                        />
                        <label className="input-label">{isLogin ? 'Email Address' : 'Username'}</label>
                        {isLogin ? <Mail className="input-icon" size={18} /> : <User className="input-icon" size={18} />}
                    </div>

                    {!isLogin && (
                        <div className="input-group">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="auth-input"
                                placeholder=" "
                                required
                            />
                            <label className="input-label">Email Address</label>
                            <Mail className="input-icon" size={18} />
                        </div>
                    )}

                    <div className="input-group">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-input"
                            placeholder=" "
                            minLength={6}
                            required
                        />
                        <label className="input-label">Password</label>
                        <Lock className="input-icon" size={18} />
                    </div>

                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                {isLogin ? 'Sign In' : 'Create Account'}
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    <div className="auth-toggle">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="auth-link"
                        >
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <span>{isLogin ? 'Sign up' : 'Sign in'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Auth;
