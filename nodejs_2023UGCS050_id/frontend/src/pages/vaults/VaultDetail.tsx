// Vault Detail Page Component
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Vault, Credential } from '../../mock/types';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './Vaults.css';

const API_URL = 'http://localhost:3000/api';

const VaultDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [vault, setVault] = useState<Vault | null>(null);
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        console.log('frontend / VaultDetail / useEffect / Fetching vault:', id);
        fetchVault();
    }, [id]);

    const fetchVault = async () => {
        console.log('frontend / VaultDetail / fetchVault / Starting');
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${API_URL}/vaults/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('frontend / VaultDetail / fetchVault / Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('frontend / VaultDetail / fetchVault / Vault received:', data.vault);
                setVault(data.vault);
                // TODO: Fetch credentials when credential API is implemented
                setCredentials([]);
            } else if (response.status === 404) {
                setVault(null);
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to fetch vault');
            }
        } catch (err) {
            console.error('frontend / VaultDetail / fetchVault / Error:', err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteVault = async () => {
        console.log('frontend / VaultDetail / handleDeleteVault / Deleting vault:', id);
        setShowDeleteConfirm(false);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/vaults/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok || response.status === 404) {
                console.log('frontend / VaultDetail / handleDeleteVault / Success');
                navigate('/vaults');
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to delete vault');
            }
        } catch (err) {
            console.error('frontend / VaultDetail / handleDeleteVault / Error:', err);
            setError('Network error. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="vault-detail">
                <div className="loading-state">Loading vault...</div>
            </div>
        );
    }

    if (!vault) {
        return (
            <div className="vault-detail">
                <div className="empty-state">
                    <h3>Vault not found</h3>
                    <Link to="/vaults" className="btn-primary">Back to Vaults</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="vault-detail">
            <div className="page-header">
                <div>
                    <Link to="/vaults" className="breadcrumb">← Back to Vaults</Link>
                    <h1>{vault.name}</h1>
                    <p>{vault.description}</p>
                </div>
                <button onClick={() => setShowDeleteConfirm(true)} className="btn-delete">
                    Delete Vault
                </button>
            </div>

            {error && (
                <div className="error-message" style={{ marginBottom: '1rem' }}>
                    {error}
                    <button onClick={() => setError('')} style={{ marginLeft: '1rem' }}>✕</button>
                </div>
            )}

            <div className="vault-info-card">
                <div className="info-item">
                    <span className="info-label">Created</span>
                    <span className="info-value">
                        {new Date(vault.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <div className="info-item">
                    <span className="info-label">Total Credentials</span>
                    <span className="info-value">{credentials.length}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Vault ID</span>
                    <span className="info-value">{vault.id}</span>
                </div>
            </div>

            <div className="credentials-section">
                <div className="section-header">
                    <h2>Credentials in this Vault</h2>
                    <Link to="/passwords" className="btn-primary">+ Add Credential</Link>
                </div>

                {credentials.length > 0 ? (
                    <div className="credentials-list">
                        {credentials.map((credential) => (
                            <div key={credential.id} className="credential-item">
                                <div className="credential-icon">🔑</div>
                                <div className="credential-info">
                                    <h4>{credential.title}</h4>
                                    <p>{credential.username}</p>
                                    {credential.url && (
                                        <a href={credential.url} target="_blank" rel="noopener noreferrer" className="credential-url">
                                            {credential.url}
                                        </a>
                                    )}
                                </div>
                                <div className="credential-actions">
                                    <Link to="/passwords" className="btn-small">Edit</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state small">
                        <p>No credentials in this vault yet</p>
                        <Link to="/passwords" className="btn-primary">Add First Credential</Link>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Delete Vault"
                message={`Are you sure you want to delete "${vault.name}"? This action cannot be undone and will remove all credentials in this vault.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteVault}
                onCancel={() => setShowDeleteConfirm(false)}
                variant="danger"
            />
        </div>
    );
};

export default VaultDetail;
