// Vault List Page Component
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Vault } from '../../mock/types';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './Vaults.css';

const API_URL = 'http://localhost:3000/api';

const VaultList = () => {
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newVaultName, setNewVaultName] = useState('');
    const [newVaultDescription, setNewVaultDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        vaultId: string;
        vaultName: string;
    }>({ isOpen: false, vaultId: '', vaultName: '' });

    // Fetch vaults from API
    useEffect(() => {
        console.log('frontend / VaultList / useEffect / Fetching vaults');
        fetchVaults();
    }, []);

    const fetchVaults = async () => {
        console.log('frontend / VaultList / fetchVaults / Starting');
        try {
            const token = localStorage.getItem('authToken');
            console.log('frontend / VaultList / fetchVaults / Token:', token ? 'EXISTS' : 'NOT FOUND');

            const response = await fetch(`${API_URL}/vaults`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('frontend / VaultList / fetchVaults / Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('frontend / VaultList / fetchVaults / Vaults received:', data.vaults.length);
                setVaults(data.vaults);
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to fetch vaults');
            }
        } catch (err) {
            console.error('frontend / VaultList / fetchVaults / Error:', err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateVault = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('frontend / VaultList / handleCreateVault / Creating vault:', newVaultName);
        setIsCreating(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/vaults`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newVaultName,
                    description: newVaultDescription
                })
            });

            console.log('frontend / VaultList / handleCreateVault / Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('frontend / VaultList / handleCreateVault / Success:', data.vault);
                setVaults([data.vault, ...vaults]);
                setNewVaultName('');
                setNewVaultDescription('');
                setShowCreateForm(false);
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to create vault');
            }
        } catch (err) {
            console.error('frontend / VaultList / handleCreateVault / Error:', err);
            setError('Network error. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const openDeleteConfirm = (id: string, name: string) => {
        console.log('frontend / VaultList / openDeleteConfirm / Opening confirmation for:', name);
        setConfirmModal({ isOpen: true, vaultId: id, vaultName: name });
    };

    const closeDeleteConfirm = () => {
        setConfirmModal({ isOpen: false, vaultId: '', vaultName: '' });
    };

    const handleDeleteVault = async () => {
        const id = confirmModal.vaultId;
        console.log('frontend / VaultList / handleDeleteVault / Deleting vault:', id);
        closeDeleteConfirm();

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/vaults/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('frontend / VaultList / handleDeleteVault / Response status:', response.status);

            if (response.ok) {
                console.log('frontend / VaultList / handleDeleteVault / Success');
                setVaults(vaults.filter(v => String(v.id) !== String(id)));
            } else if (response.status === 404) {
                // Vault doesn't exist in database (ghost vault) - remove from UI anyway
                console.log('frontend / VaultList / handleDeleteVault / Vault not found, removing from UI');
                setVaults(vaults.filter(v => String(v.id) !== String(id)));
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to delete vault');
            }
        } catch (err) {
            console.error('frontend / VaultList / handleDeleteVault / Error:', err);
            setError('Network error. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="vaults-page">
                <div className="loading-state">Loading vaults...</div>
            </div>
        );
    }

    return (
        <div className="vaults-page">
            <div className="page-header">
                <div>
                    <h1>Vaults</h1>
                    <p>Organize your credentials in secure vaults</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    {showCreateForm ? 'Cancel' : '+ Create Vault'}
                </button>
            </div>

            {error && (
                <div className="error-message" style={{ marginBottom: '1rem' }}>
                    {error}
                    <button onClick={() => setError('')} style={{ marginLeft: '1rem' }}>✕</button>
                </div>
            )}

            {showCreateForm && (
                <div className="create-vault-form">
                    <h3>Create New Vault</h3>
                    <form onSubmit={handleCreateVault}>
                        <div className="form-group">
                            <label htmlFor="vaultName">Vault Name</label>
                            <input
                                id="vaultName"
                                type="text"
                                value={newVaultName}
                                onChange={(e) => setNewVaultName(e.target.value)}
                                placeholder="e.g., Personal, Work, Finance"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="vaultDescription">Description</label>
                            <textarea
                                id="vaultDescription"
                                value={newVaultDescription}
                                onChange={(e) => setNewVaultDescription(e.target.value)}
                                placeholder="Brief description of what this vault contains"
                                rows={3}
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={isCreating}>
                            {isCreating ? 'Creating...' : 'Create Vault'}
                        </button>
                    </form>
                </div>
            )}

            <div className="vaults-grid">
                {vaults.map((vault) => (
                    <div key={vault.id} className="vault-card">
                        <div
                            className="vault-header"
                            style={{ backgroundColor: vault.color }}
                        >
                            <h3>{vault.name}</h3>
                        </div>
                        <div className="vault-body">
                            <p className="vault-description">{vault.description}</p>
                            <div className="vault-stats">
                                <span className="vault-stat">
                                    🔑 {vault.credentialCount} credentials
                                </span>
                                <span className="vault-stat">
                                    📅 {new Date(vault.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <div className="vault-actions">
                            <Link to={`/vaults/${vault.id}`} className="btn-view">
                                View Details
                            </Link>
                            <button
                                onClick={() => openDeleteConfirm(vault.id, vault.name)}
                                className="btn-delete"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {vaults.length === 0 && !loading && (
                <div className="empty-state">
                    <div className="empty-icon">🗄️</div>
                    <h3>No vaults yet</h3>
                    <p>Create your first vault to start organizing your credentials</p>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="Delete Vault"
                message={`Are you sure you want to delete "${confirmModal.vaultName}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteVault}
                onCancel={closeDeleteConfirm}
                variant="danger"
            />
        </div>
    );
};

export default VaultList;
