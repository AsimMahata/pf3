// Profile Settings Page Component
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './Settings.css';

const Profile = () => {
    const { user } = useAuth();

    // TODO: Replace with API call to fetch user profile from backend
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();

        // TODO: Replace with API call to update user profile on backend
        setMessage({ type: 'success', text: 'Profile updated successfully!' });

        setTimeout(() => setMessage(null), 3000);
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match!' });
            return;
        }

        if (formData.newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters long!' });
            return;
        }

        // TODO: Replace with API call to change password on backend
        console.log('Mock password change for:', user?.email);

        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setFormData({
            ...formData,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });

        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>Profile Settings</h1>
                <p>Manage your account information</p>
            </div>

            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="settings-section">
                <h2>Personal Information</h2>
                <form onSubmit={handleProfileUpdate} className="settings-form">
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Account Created</label>
                        <div className="readonly-field">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>

                    <button type="submit" className="btn-primary">
                        Save Changes
                    </button>

                    <p className="helper-text">
                        TODO: Connect to backend API to persist changes
                    </p>
                </form>
            </div>

            <div className="settings-section">
                <h2>Change Password</h2>
                <form onSubmit={handlePasswordChange} className="settings-form">
                    <div className="form-group">
                        <label htmlFor="currentPassword">Current Password</label>
                        <input
                            id="currentPassword"
                            type="password"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                            id="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            minLength={8}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary">
                        Change Password
                    </button>

                    <p className="helper-text">
                        TODO: Implement real password validation and update
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Profile;
