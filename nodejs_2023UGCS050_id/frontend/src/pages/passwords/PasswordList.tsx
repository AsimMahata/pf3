// Password List Page Component
import { useState, useEffect } from 'react';
import type { Credential } from '../../mock/types';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './Passwords.css';

const API_URL = 'http://localhost:3000/api';

const PasswordList = () => {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        username: '',
        password: '',
        url: '',
        notes: '',
    });

    // Delete confirmation modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        credentialId: string;
        credentialTitle: string;
    }>({ isOpen: false, credentialId: '', credentialTitle: '' });

    // Fetch credentials on mount
    useEffect(() => {
        console.log('frontend / PasswordList / useEffect / Mounting component');
        fetchCredentials();
    }, []);

    const fetchCredentials = async () => {
        console.log('frontend / PasswordList / fetchCredentials / Starting');
        try {
            const token = localStorage.getItem('authToken');
            console.log('frontend / PasswordList / fetchCredentials / Token:', token ? 'EXISTS' : 'NOT FOUND');

            const response = await fetch(`${API_URL}/credentials`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('frontend / PasswordList / fetchCredentials / Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('frontend / PasswordList / fetchCredentials / Credentials received:', data.credentials.length);
                setCredentials(data.credentials);
            } else {
                const data = await response.json();
                console.log('frontend / PasswordList / fetchCredentials / Error:', data.message);
                setError(data.message || 'Failed to fetch credentials');
            }
        } catch (err) {
            console.error('frontend / PasswordList / fetchCredentials / Error:', err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePassword = (id: string) => {
        console.log('frontend / PasswordList / handleTogglePassword / Toggling:', id);
        setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const openDeleteConfirm = (id: string, title: string) => {
        console.log('frontend / PasswordList / openDeleteConfirm / Opening for:', title);
        setConfirmModal({ isOpen: true, credentialId: id, credentialTitle: title });
    };

    const closeDeleteConfirm = () => {
        setConfirmModal({ isOpen: false, credentialId: '', credentialTitle: '' });
    };

    const handleDelete = async () => {
        const id = confirmModal.credentialId;
        console.log('frontend / PasswordList / handleDelete / Deleting credential:', id);
        closeDeleteConfirm();

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/credentials/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('frontend / PasswordList / handleDelete / Response status:', response.status);

            if (response.ok || response.status === 404) {
                console.log('frontend / PasswordList / handleDelete / Success');
                setCredentials(credentials.filter(c => String(c.id) !== String(id)));
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to delete credential');
            }
        } catch (err) {
            console.error('frontend / PasswordList / handleDelete / Error:', err);
            setError('Network error. Please try again.');
        }
    };

    const handleEdit = (credential: Credential) => {
        console.log('frontend / PasswordList / handleEdit / Editing:', credential.title);
        setEditingId(credential.id);
        setFormData({
            title: credential.title,
            username: credential.username,
            password: credential.password,
            url: credential.url || '',
            notes: credential.notes || '',
        });
        setShowAddForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('frontend / PasswordList / handleSubmit / Submitting form, editingId:', editingId);
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('authToken');

            if (editingId) {
                // Update existing credential
                console.log('frontend / PasswordList / handleSubmit / Updating credential:', editingId);
                const response = await fetch(`${API_URL}/credentials/${editingId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                console.log('frontend / PasswordList / handleSubmit / Update response:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('frontend / PasswordList / handleSubmit / Update success:', data.credential);
                    setCredentials(credentials.map(c =>
                        c.id === editingId ? data.credential : c
                    ));
                    setEditingId(null);
                } else {
                    const data = await response.json();
                    setError(data.message || 'Failed to update credential');
                    return;
                }
            } else {
                // Create new credential
                console.log('frontend / PasswordList / handleSubmit / Creating new credential');
                const response = await fetch(`${API_URL}/credentials`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                console.log('frontend / PasswordList / handleSubmit / Create response:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('frontend / PasswordList / handleSubmit / Create success:', data.credential);
                    setCredentials([data.credential, ...credentials]);
                } else {
                    const data = await response.json();
                    setError(data.message || 'Failed to create credential');
                    return;
                }
            }

            // Reset form
            setFormData({
                title: '',
                username: '',
                password: '',
                url: '',
                notes: '',
            });
            setShowAddForm(false);
        } catch (err) {
            console.error('frontend / PasswordList / handleSubmit / Error:', err);
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        console.log('frontend / PasswordList / handleCancel / Cancelling form');
        setShowAddForm(false);
        setEditingId(null);
        setFormData({
            title: '',
            username: '',
            password: '',
            url: '',
            notes: '',
        });
    };

    // Filter credentials by search query
    const filteredCredentials = credentials.filter(credential => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            credential.title.toLowerCase().includes(query) ||
            credential.username.toLowerCase().includes(query) ||
            credential.url?.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <div className="passwords-page">
                <div className="loading-state">Loading credentials...</div>
            </div>
        );
    }

    return (
        <div className="passwords-page">
            <div className="page-header">
                <div>
                    <h1>Password Vault</h1>
                    <p>Manage your credentials securely</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    {showAddForm ? 'Cancel' : '+ Add Credential'}
                </button>
            </div>

            {error && (
                <div className="error-message" style={{ marginBottom: '1rem' }}>
                    {error}
                    <button onClick={() => setError('')} style={{ marginLeft: '1rem' }}>✕</button>
                </div>
            )}

            {showAddForm && (
                <div className="credential-form">
                    <h3>{editingId ? 'Edit Credential' : 'Add New Credential'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="title">Title *</label>
                                <input
                                    id="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Gmail, Facebook"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="username">Username *</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="username@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="password">Password *</label>
                                <input
                                    id="password"
                                    type="text"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="url">URL</label>
                                <input
                                    id="url"
                                    type="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    placeholder="https://example.com"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="notes">Notes</label>
                            <textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional notes..."
                                rows={3}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : (editingId ? 'Update' : 'Add')} Credential
                            </button>
                            <button type="button" onClick={handleCancel} className="btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search Bar */}
            {!showAddForm && credentials.length > 0 && (
                <div className="search-bar">
                    <div className="search-group">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search passwords by title, username, or URL..."
                            value={searchQuery}
                            onChange={(e) => {
                                console.log('frontend / PasswordList / search / Query:', e.target.value);
                                setSearchQuery(e.target.value);
                            }}
                        />
                    </div>
                    <span className="results-count">
                        {filteredCredentials.length} {filteredCredentials.length === 1 ? 'password' : 'passwords'}
                    </span>
                </div>
            )}

            <div className="credentials-table">
                {filteredCredentials.map((credential) => (
                    <div key={credential.id} className="credential-row">
                        <div className="credential-main">
                            <div className="credential-icon">🔑</div>
                            <div className="credential-details">
                                <h4>{credential.title}</h4>
                                <p className="credential-username">{credential.username}</p>
                            </div>
                        </div>

                        <div className="credential-password">
                            <span className="password-value">
                                {showPassword[credential.id] ? credential.password : '••••••••'}
                            </span>
                            <button
                                onClick={() => handleTogglePassword(credential.id)}
                                className="btn-icon"
                                title={showPassword[credential.id] ? 'Hide' : 'Show'}
                            >
                                {showPassword[credential.id] ? '🙈' : '👁️'}
                            </button>
                        </div>

                        <div className="credential-row-actions">
                            {credential.url && (
                                <a
                                    href={credential.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-icon"
                                    title="Open URL"
                                >
                                    🔗
                                </a>
                            )}
                            <button
                                onClick={() => handleEdit(credential)}
                                className="btn-icon"
                                title="Edit"
                            >
                                ✏️
                            </button>
                            <button
                                onClick={() => openDeleteConfirm(credential.id, credential.title)}
                                className="btn-icon delete"
                                title="Delete"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredCredentials.length === 0 && !loading && (
                <div className="empty-state">
                    <div className="empty-icon">🔑</div>
                    <h3>No {searchQuery ? 'matching ' : ''}credentials {searchQuery ? 'found' : 'yet'}</h3>
                    <p>{searchQuery ? 'Try a different search term' : 'Add your first credential to get started'}</p>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="Delete Credential"
                message={`Are you sure you want to delete "${confirmModal.credentialTitle}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                onCancel={closeDeleteConfirm}
                variant="danger"
            />
        </div>
    );
};

export default PasswordList;
