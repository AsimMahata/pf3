// Security Settings Page Component
import { useState } from 'react';
import './Settings.css';

const Security = () => {
    // TODO: Replace with API call to fetch security settings from backend
    const [settings, setSettings] = useState({
        twoFactorAuth: false,
        loginNotifications: true,
        sessionTimeout: '30',
        requireStrongPassword: true,
        biometricAuth: false,
    });

    const handleToggle = (setting: keyof typeof settings) => {
        // TODO: Replace with API call to update security settings on backend
        setSettings(prev => ({
            ...prev,
            [setting]: !prev[setting],
        }));
    };

    const handleSessionTimeoutChange = (value: string) => {
        // TODO: Replace with API call to update session timeout on backend
        setSettings(prev => ({
            ...prev,
            sessionTimeout: value,
        }));
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>Security Settings</h1>
                <p>Manage your security preferences</p>
            </div>

            <div className="settings-section">
                <h2>Authentication</h2>

                <div className="setting-item">
                    <div className="setting-info">
                        <h3>Two-Factor Authentication (2FA)</h3>
                        <p>Add an extra layer of security to your account</p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings.twoFactorAuth}
                            onChange={() => handleToggle('twoFactorAuth')}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="setting-item">
                    <div className="setting-info">
                        <h3>Biometric Authentication</h3>
                        <p>Use fingerprint or face recognition to unlock</p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings.biometricAuth}
                            onChange={() => handleToggle('biometricAuth')}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <p className="helper-text">
                    TODO: Implement real 2FA and biometric authentication
                </p>
            </div>

            <div className="settings-section">
                <h2>Notifications</h2>

                <div className="setting-item">
                    <div className="setting-info">
                        <h3>Login Notifications</h3>
                        <p>Get notified when someone logs into your account</p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings.loginNotifications}
                            onChange={() => handleToggle('loginNotifications')}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>

            <div className="settings-section">
                <h2>Session Management</h2>

                <div className="setting-item">
                    <div className="setting-info">
                        <h3>Session Timeout</h3>
                        <p>Automatically log out after period of inactivity</p>
                    </div>
                    <select
                        className="session-select"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleSessionTimeoutChange(e.target.value)}
                    >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                        <option value="never">Never</option>
                    </select>
                </div>
            </div>

            <div className="settings-section">
                <h2>Password Policy</h2>

                <div className="setting-item">
                    <div className="setting-info">
                        <h3>Require Strong Passwords</h3>
                        <p>Enforce minimum password complexity requirements</p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings.requireStrongPassword}
                            onChange={() => handleToggle('requireStrongPassword')}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="password-policy-info">
                    <h4>Current Password Requirements:</h4>
                    <ul>
                        <li>Minimum 8 characters</li>
                        <li>At least one uppercase letter</li>
                        <li>At least one lowercase letter</li>
                        <li>At least one number</li>
                        <li>At least one special character</li>
                    </ul>
                </div>

                <p className="helper-text">
                    TODO: Implement real password policy enforcement
                </p>
            </div>

            <div className="settings-section danger-zone">
                <h2>Danger Zone</h2>

                <div className="danger-actions">
                    <div className="danger-action">
                        <div>
                            <h3>Clear All Sessions</h3>
                            <p>Log out from all devices except this one</p>
                        </div>
                        <button className="btn-danger" onClick={() => alert('Mock: All sessions cleared')}>
                            Clear Sessions
                        </button>
                    </div>

                    <div className="danger-action">
                        <div>
                            <h3>Delete Account</h3>
                            <p>Permanently delete your account and all data</p>
                        </div>
                        <button className="btn-danger" onClick={() => alert('Mock: Account deletion not implemented')}>
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Security;
