// Dashboard Page Component
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Dashboard.css';

const API_URL = 'http://localhost:3000/api';

interface DashboardStats {
    totalVaults: number;
    totalCredentials: number;
    totalDocuments: number;
}

interface Vault {
    id: string;
    name: string;
    color: string;
}

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalVaults: 0,
        totalCredentials: 0,
        totalDocuments: 0
    });
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showVaultModal, setShowVaultModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    // Form data
    const [vaultForm, setVaultForm] = useState({ name: '', color: '#667eea' });
    const [passwordForm, setPasswordForm] = useState({
        title: '', username: '', password: '', url: '', notes: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedVaultId, setSelectedVaultId] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        console.log('frontend / Dashboard / useEffect / Fetching stats');
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('authToken');
            console.log('frontend / Dashboard / fetchStats / Starting');

            const [vaultsRes, credentialsRes, documentsRes] = await Promise.all([
                fetch(`${API_URL}/vaults`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_URL}/credentials`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_URL}/documents`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            let totalVaults = 0;
            let totalCredentials = 0;
            let totalDocuments = 0;

            if (vaultsRes.ok) {
                const data = await vaultsRes.json();
                totalVaults = data.vaults?.length || 0;
                setVaults(data.vaults || []);
                console.log('frontend / Dashboard / fetchStats / Vaults:', totalVaults);
            }

            if (credentialsRes.ok) {
                const data = await credentialsRes.json();
                totalCredentials = data.credentials?.length || 0;
                console.log('frontend / Dashboard / fetchStats / Credentials:', totalCredentials);
            }

            if (documentsRes.ok) {
                const data = await documentsRes.json();
                totalDocuments = data.documents?.length || 0;
                console.log('frontend / Dashboard / fetchStats / Documents:', totalDocuments);
            }

            setStats({ totalVaults, totalCredentials, totalDocuments });
        } catch (err) {
            console.error('frontend / Dashboard / fetchStats / Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Create Vault
    const handleCreateVault = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        console.log('frontend / Dashboard / handleCreateVault / Creating vault:', vaultForm.name);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/vaults`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vaultForm)
            });

            if (response.ok) {
                console.log('frontend / Dashboard / handleCreateVault / Success');
                setFormSuccess('Vault created successfully!');
                setVaultForm({ name: '', color: '#667eea' });
                setShowVaultModal(false);
                fetchStats(); // Refresh stats
                setTimeout(() => setFormSuccess(''), 3000);
            } else {
                const data = await response.json();
                setFormError(data.message || 'Failed to create vault');
            }
        } catch (err) {
            console.error('frontend / Dashboard / handleCreateVault / Error:', err);
            setFormError('Network error. Please try again.');
        }
    };

    // Add Password
    const handleAddPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        console.log('frontend / Dashboard / handleAddPassword / Adding password:', passwordForm.title);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/credentials`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(passwordForm)
            });

            if (response.ok) {
                console.log('frontend / Dashboard / handleAddPassword / Success');
                setFormSuccess('Password added successfully!');
                setPasswordForm({ title: '', username: '', password: '', url: '', notes: '' });
                setShowPasswordModal(false);
                fetchStats();
                setTimeout(() => setFormSuccess(''), 3000);
            } else {
                const data = await response.json();
                setFormError(data.message || 'Failed to add password');
            }
        } catch (err) {
            console.error('frontend / Dashboard / handleAddPassword / Error:', err);
            setFormError('Network error. Please try again.');
        }
    };

    // Upload Document
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log('frontend / Dashboard / handleFileSelect / File selected:', file.name);
            setSelectedFile(file);
            setShowUploadModal(true);
        }
    };

    const handleUploadDocument = async () => {
        if (!selectedFile || !selectedVaultId) {
            setFormError('Please select a vault');
            return;
        }
        setFormError('');
        console.log('frontend / Dashboard / handleUploadDocument / Uploading:', selectedFile.name);

        try {
            const token = localStorage.getItem('authToken');
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('vaultId', selectedVaultId);

            const response = await fetch(`${API_URL}/documents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                console.log('frontend / Dashboard / handleUploadDocument / Success');
                setFormSuccess('Document uploaded successfully!');
                setSelectedFile(null);
                setSelectedVaultId('');
                setShowUploadModal(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
                fetchStats();
                setTimeout(() => setFormSuccess(''), 3000);
            } else {
                const data = await response.json();
                setFormError(data.message || 'Failed to upload document');
            }
        } catch (err) {
            console.error('frontend / Dashboard / handleUploadDocument / Error:', err);
            setFormError('Network error. Please try again.');
        }
    };

    const cancelUpload = () => {
        setShowUploadModal(false);
        setSelectedFile(null);
        setSelectedVaultId('');
        setFormError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <p>Welcome back{user?.name ? `, ${user.name}` : ''}! Here's your vault overview.</p>
            </div>

            {formSuccess && (
                <div className="success-message" style={{ marginBottom: '1rem', padding: '1rem', background: '#c6f6d5', borderRadius: '8px', color: '#22543d' }}>
                    ✓ {formSuccess}
                </div>
            )}

            {/* Statistics Cards */}
            <div className="stats-grid">
                <Link to="/vaults" className="stat-card stat-vaults">
                    <div className="stat-icon">🗄️</div>
                    <div className="stat-content">
                        <h3>Vaults</h3>
                        <p className="stat-number">{loading ? '...' : stats.totalVaults}</p>
                    </div>
                </Link>

                <Link to="/passwords" className="stat-card stat-credentials">
                    <div className="stat-icon">🔑</div>
                    <div className="stat-content">
                        <h3>Passwords</h3>
                        <p className="stat-number">{loading ? '...' : stats.totalCredentials}</p>
                    </div>
                </Link>

                <Link to="/documents" className="stat-card stat-documents">
                    <div className="stat-icon">📁</div>
                    <div className="stat-content">
                        <h3>Documents</h3>
                        <p className="stat-number">{loading ? '...' : stats.totalDocuments}</p>
                    </div>
                </Link>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                    <button onClick={() => setShowVaultModal(true)} className="action-btn">
                        <span className="action-icon">➕</span>
                        <span>Create Vault</span>
                    </button>
                    <button onClick={() => setShowPasswordModal(true)} className="action-btn">
                        <span className="action-icon">🔑</span>
                        <span>Add Password</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="action-btn" disabled={vaults.length === 0}>
                        <span className="action-icon">📤</span>
                        <span>{vaults.length === 0 ? 'Create Vault First' : 'Upload Document'}</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,.pdf"
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            {/* Status Summary */}
            <div className="recent-activity">
                <h2>Status Summary</h2>
                <div className="activity-list">
                    <div className="activity-item">
                        <div className="activity-icon">🗄️</div>
                        <div className="activity-details">
                            <p className="activity-action">Your Vaults</p>
                            <p className="activity-name">
                                {stats.totalVaults === 0
                                    ? 'No vaults yet. Create one to organize your data!'
                                    : `${stats.totalVaults} vault${stats.totalVaults > 1 ? 's' : ''} created`}
                            </p>
                        </div>
                    </div>
                    <div className="activity-item">
                        <div className="activity-icon">🔑</div>
                        <div className="activity-details">
                            <p className="activity-action">Your Passwords</p>
                            <p className="activity-name">
                                {stats.totalCredentials === 0
                                    ? 'No passwords saved yet.'
                                    : `${stats.totalCredentials} password${stats.totalCredentials > 1 ? 's' : ''} secured`}
                            </p>
                        </div>
                    </div>
                    <div className="activity-item">
                        <div className="activity-icon">📁</div>
                        <div className="activity-details">
                            <p className="activity-action">Your Documents</p>
                            <p className="activity-name">
                                {stats.totalDocuments === 0
                                    ? 'No documents uploaded yet.'
                                    : `${stats.totalDocuments} document${stats.totalDocuments > 1 ? 's' : ''} stored`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Vault Modal */}
            {showVaultModal && (
                <div className="modal-overlay open" onClick={() => setShowVaultModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-icon">🗄️</span>
                            <h3>Create New Vault</h3>
                        </div>
                        <form onSubmit={handleCreateVault}>
                            <div className="modal-body">
                                {formError && <div className="error-message">{formError}</div>}
                                <div className="form-group">
                                    <label htmlFor="vaultName">Vault Name *</label>
                                    <input
                                        id="vaultName"
                                        type="text"
                                        value={vaultForm.name}
                                        onChange={(e) => setVaultForm({ ...vaultForm, name: e.target.value })}
                                        placeholder="e.g., Work, Personal, Finance"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="vaultColor">Color</label>
                                    <input
                                        id="vaultColor"
                                        type="color"
                                        value={vaultForm.color}
                                        onChange={(e) => setVaultForm({ ...vaultForm, color: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowVaultModal(false)}>Cancel</button>
                                <button type="submit" className="btn-confirm info">Create Vault</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Password Modal */}
            {showPasswordModal && (
                <div className="modal-overlay open" onClick={() => setShowPasswordModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <span className="modal-icon">🔑</span>
                            <h3>Add New Password</h3>
                        </div>
                        <form onSubmit={handleAddPassword}>
                            <div className="modal-body">
                                {formError && <div className="error-message">{formError}</div>}
                                <div className="form-group">
                                    <label htmlFor="pwTitle">Title *</label>
                                    <input
                                        id="pwTitle"
                                        type="text"
                                        value={passwordForm.title}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, title: e.target.value })}
                                        placeholder="e.g., Gmail, Netflix"
                                        required
                                    />
                                </div>
                                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label htmlFor="pwUsername">Username *</label>
                                        <input
                                            id="pwUsername"
                                            type="text"
                                            value={passwordForm.username}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, username: e.target.value })}
                                            placeholder="username@email.com"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="pwPassword">Password *</label>
                                        <input
                                            id="pwPassword"
                                            type="text"
                                            value={passwordForm.password}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="pwUrl">URL</label>
                                    <input
                                        id="pwUrl"
                                        type="url"
                                        value={passwordForm.url}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, url: e.target.value })}
                                        placeholder="https://example.com"
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                                <button type="submit" className="btn-confirm info">Add Password</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Upload Document Modal */}
            {showUploadModal && (
                <div className="modal-overlay open" onClick={cancelUpload}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-icon">📤</span>
                            <h3>Upload Document</h3>
                        </div>
                        <div className="modal-body">
                            {formError && <div className="error-message">{formError}</div>}
                            <p style={{ marginBottom: '1rem' }}>
                                <strong>File:</strong> {selectedFile?.name}
                            </p>
                            <div className="form-group">
                                <label htmlFor="uploadVault">Choose a vault to organize this document:</label>
                                <select
                                    id="uploadVault"
                                    value={selectedVaultId}
                                    onChange={(e) => setSelectedVaultId(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '2px solid #e2e8f0',
                                        marginTop: '0.5rem',
                                        fontSize: '1rem'
                                    }}
                                >
                                    <option value="">Select a vault...</option>
                                    {vaults.map(vault => (
                                        <option key={vault.id} value={vault.id}>{vault.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={cancelUpload}>Cancel</button>
                            <button
                                className="btn-confirm info"
                                onClick={handleUploadDocument}
                                disabled={!selectedVaultId}
                            >
                                Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
