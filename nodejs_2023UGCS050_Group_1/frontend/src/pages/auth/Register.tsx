// Register Page Component
import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Auth.css';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        console.log('frontend / Register / handleSubmit / Form submitted');
        console.log('frontend / Register / handleSubmit / Name:', name);
        console.log('frontend / Register / handleSubmit / Email:', email);
        setError('');

        // Client-side validation
        if (password !== confirmPassword) {
            console.log('frontend / Register / handleSubmit / Validation failed: passwords dont match');
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            console.log('frontend / Register / handleSubmit / Validation failed: password too short');
            setError('Password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);
        console.log('frontend / Register / handleSubmit / Validation passed, calling register()');

        try {
            const result = await register(name, email, password);
            console.log('frontend / Register / handleSubmit / Register result:', result);

            if (result.success) {
                console.log('frontend / Register / handleSubmit / Success, navigating to /dashboard');
                navigate('/dashboard');
            } else {
                console.log('frontend / Register / handleSubmit / Failed:', result.message);
                setError(result.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            console.error('frontend / Register / handleSubmit / Error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>🔐 SecureVault</h1>
                    <h2>Create Account</h2>
                    <p>Join us to secure your credentials</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimum 8 characters"
                            required
                            minLength={8}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={isLoading}>
                        {isLoading ? 'Creating account...' : 'Create Account'}
                    </button>

                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" className="link">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
