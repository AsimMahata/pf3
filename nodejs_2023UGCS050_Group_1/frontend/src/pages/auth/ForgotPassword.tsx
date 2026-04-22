// Forgot Password Page Component
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // TODO: Replace with real password reset API call
        // Example: await fetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('Mock password reset request for:', email);
        setIsSubmitted(true);
        setIsLoading(false);
    };

    if (isSubmitted) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>✉️</h1>
                        <h2>Check Your Email</h2>
                        <p>
                            We've sent password reset instructions to <strong>{email}</strong>
                        </p>
                    </div>

                    <div className="auth-form">
                        <div className="success-message">
                            If an account exists with this email, you will receive a password reset link shortly.
                        </div>

                        <Link to="/login" className="btn-primary">
                            Back to Login
                        </Link>
                    </div>

                    <div className="auth-footer">
                        <p className="helper-text">
                            Note: This is a mock implementation. No email is actually sent.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>🔐 SecureVault</h1>
                    <h2>Forgot Password?</h2>
                    <p>Enter your email to reset your password</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            required
                            autoFocus
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Remember your password?{' '}
                        <Link to="/login" className="link">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
