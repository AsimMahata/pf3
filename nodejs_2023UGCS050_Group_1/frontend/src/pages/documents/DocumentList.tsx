// Document List Page Component
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './Documents.css';

const API_URL = 'http://localhost:3000/api';

interface Vault {
    id: string;
    name: string;
    color: string;
}

interface Document {
    id: string;
    vaultId: Vault | string;
    name: string;
    originalName: string;
    type: string;
    size: number;
    uploadDate: string;
}

const DocumentList = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [selectedVaultId, setSelectedVaultId] = useState<string>('');  // For upload
    const [filterVaultId, setFilterVaultId] = useState<string>('');      // For filtering
    const [searchQuery, setSearchQuery] = useState('');                  // For search
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Delete confirmation modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        documentId: string;
        documentName: string;
    }>({ isOpen: false, documentId: '', documentName: '' });

    // Fetch documents and vaults on mount
    useEffect(() => {
        console.log('frontend / DocumentList / useEffect / Mounting component');
        fetchVaults();
        fetchDocuments();
    }, []);

    const fetchVaults = async () => {
        console.log('frontend / DocumentList / fetchVaults / Starting');
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/vaults`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('frontend / DocumentList / fetchVaults / Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('frontend / DocumentList / fetchVaults / Vaults received:', data.vaults.length);
                setVaults(data.vaults);
            }
        } catch (err) {
            console.error('frontend / DocumentList / fetchVaults / Error:', err);
        }
    };

    const fetchDocuments = async () => {
        console.log('frontend / DocumentList / fetchDocuments / Starting');
        try {
            const token = localStorage.getItem('authToken');
            console.log('frontend / DocumentList / fetchDocuments / Token:', token ? 'EXISTS' : 'NOT FOUND');

            const response = await fetch(`${API_URL}/documents`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('frontend / DocumentList / fetchDocuments / Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('frontend / DocumentList / fetchDocuments / Documents received:', data.documents.length);
                setDocuments(data.documents);
            } else {
                const data = await response.json();
                console.log('frontend / DocumentList / fetchDocuments / Error:', data.message);
                setError(data.message || 'Failed to fetch documents');
            }
        } catch (err) {
            console.error('frontend / DocumentList / fetchDocuments / Error:', err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadClick = () => {
        console.log('frontend / DocumentList / handleUploadClick / Opening file picker');
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            console.log('frontend / DocumentList / handleFileSelect / No file selected');
            return;
        }

        console.log('frontend / DocumentList / handleFileSelect / File selected:', file.name);
        setSelectedFile(file);
        setShowUploadModal(true);
    };

    const handleUploadSubmit = async () => {
        if (!selectedFile || !selectedVaultId) {
            setError('Please select a vault to organize your document');
            return;
        }

        console.log('frontend / DocumentList / handleUploadSubmit / Uploading:', {
            file: selectedFile.name,
            vaultId: selectedVaultId
        });

        setIsUploading(true);
        setUploadStatus('Uploading...');
        setShowUploadModal(false);

        try {
            const token = localStorage.getItem('authToken');
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('vaultId', selectedVaultId);

            console.log('frontend / DocumentList / handleUploadSubmit / Sending request');

            const response = await fetch(`${API_URL}/documents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            console.log('frontend / DocumentList / handleUploadSubmit / Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('frontend / DocumentList / handleUploadSubmit / Upload success:', data.document);
                setDocuments([data.document, ...documents]);
                setUploadStatus('Upload successful!');
                setTimeout(() => setUploadStatus(''), 3000);
            } else {
                const data = await response.json();
                console.log('frontend / DocumentList / handleUploadSubmit / Upload error:', data.message);
                setError(data.message || 'Failed to upload document');
                setUploadStatus('');
            }
        } catch (err) {
            console.error('frontend / DocumentList / handleUploadSubmit / Error:', err);
            setError('Network error. Please try again.');
            setUploadStatus('');
        } finally {
            setIsUploading(false);
            setSelectedFile(null);
            setSelectedVaultId('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const cancelUpload = () => {
        setShowUploadModal(false);
        setSelectedFile(null);
        setSelectedVaultId('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const openDeleteConfirm = (id: string, name: string) => {
        console.log('frontend / DocumentList / openDeleteConfirm / Opening for:', name);
        setConfirmModal({ isOpen: true, documentId: id, documentName: name });
    };

    const closeDeleteConfirm = () => {
        setConfirmModal({ isOpen: false, documentId: '', documentName: '' });
    };

    const handleDelete = async () => {
        const id = confirmModal.documentId;
        console.log('frontend / DocumentList / handleDelete / Deleting document:', id);
        closeDeleteConfirm();

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/documents/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('frontend / DocumentList / handleDelete / Response status:', response.status);

            if (response.ok || response.status === 404) {
                console.log('frontend / DocumentList / handleDelete / Success');
                setDocuments(documents.filter(d => String(d.id) !== String(id)));
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to delete document');
            }
        } catch (err) {
            console.error('frontend / DocumentList / handleDelete / Error:', err);
            setError('Network error. Please try again.');
        }
    };

    const handleDownload = async (id: string, originalName: string) => {
        console.log('frontend / DocumentList / handleDownload / Downloading:', originalName);
        try {
            const token = localStorage.getItem('authToken');

            // Fetch the file as blob
            const response = await fetch(`${API_URL}/documents/${id}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('frontend / DocumentList / handleDownload / Response status:', response.status);

            if (response.ok) {
                // Get the blob and create download link
                const blob = await response.blob();

                // Create a blob URL with proper type
                const url = window.URL.createObjectURL(blob);

                // Create temporary anchor and trigger download
                const a = window.document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = originalName; // Use original filename with extension
                window.document.body.appendChild(a);
                a.click();

                // Cleanup
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    window.document.body.removeChild(a);
                }, 100);

                console.log('frontend / DocumentList / handleDownload / Download triggered for:', originalName);
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to download document');
            }
        } catch (err) {
            console.error('frontend / DocumentList / handleDownload / Error:', err);
            setError('Network error. Please try again.');
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return '📄';
        if (type.includes('image')) return '🖼️';
        if (type.includes('video')) return '🎥';
        if (type.includes('audio')) return '🎵';
        return '📁';
    };

    const getVaultName = (vaultId: Vault | string): string => {
        if (typeof vaultId === 'object' && vaultId?.name) {
            return vaultId.name;
        }
        const vault = vaults.find(v => String(v.id) === String(vaultId));
        return vault?.name || 'Unknown Vault';
    };

    // Filter and search documents
    const filteredDocuments = documents.filter(doc => {
        // Vault filter
        if (filterVaultId) {
            const docVaultId = typeof doc.vaultId === 'object' ? doc.vaultId.id : doc.vaultId;
            if (String(docVaultId) !== String(filterVaultId)) {
                return false;
            }
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesName = doc.name.toLowerCase().includes(query);
            const matchesOriginal = doc.originalName?.toLowerCase().includes(query);
            return matchesName || matchesOriginal;
        }

        return true;
    });

    if (loading) {
        return (
            <div className="documents-page">
                <div className="loading-state">Loading documents...</div>
            </div>
        );
    }

    return (
        <div className="documents-page">
            <div className="page-header">
                <div>
                    <h1>Document Storage</h1>
                    <p>Securely store and manage your important files</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={handleUploadClick}
                    disabled={isUploading || vaults.length === 0}
                >
                    {isUploading ? '⏳ Uploading...' : '📤 Upload Document'}
                </button>
                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                />
            </div>

            {error && (
                <div className="error-message" style={{ marginBottom: '1rem' }}>
                    {error}
                    <button onClick={() => setError('')} style={{ marginLeft: '1rem' }}>✕</button>
                </div>
            )}

            {uploadStatus && uploadStatus !== 'Uploading...' && (
                <div className="upload-status success">
                    ✓ {uploadStatus}
                </div>
            )}

            {vaults.length === 0 && (
                <div className="upload-info" style={{ backgroundColor: '#fed7d7', borderLeftColor: '#e53e3e' }}>
                    <p style={{ color: '#c53030' }}>
                        <strong>⚠️ No vaults found!</strong> Please create a vault first (e.g., "School", "Work", "Personal") to organize your documents.
                        <Link to="/vaults" style={{ marginLeft: '0.5rem' }}>Go to Vaults →</Link>
                    </p>
                </div>
            )}

            {vaults.length > 0 && (
                <>
                    <div className="upload-info">
                        <p>
                            <strong>Supported files:</strong> Images (JPEG, PNG, GIF, WebP) and PDFs. Maximum size: 10MB
                        </p>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="filter-search-bar">
                        <div className="filter-group">
                            <span className="filter-label">📁 Vault:</span>
                            <select
                                className="filter-select"
                                value={filterVaultId}
                                onChange={(e) => {
                                    console.log('frontend / DocumentList / filter / Vault changed:', e.target.value);
                                    setFilterVaultId(e.target.value);
                                }}
                            >
                                <option value="">All Vaults</option>
                                {vaults.map(vault => (
                                    <option key={vault.id} value={vault.id}>{vault.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="search-group">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search documents..."
                                value={searchQuery}
                                onChange={(e) => {
                                    console.log('frontend / DocumentList / search / Query:', e.target.value);
                                    setSearchQuery(e.target.value);
                                }}
                            />
                        </div>

                        <span className="results-count">
                            {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
                        </span>
                    </div>
                </>
            )}

            <div className="documents-grid">
                {filteredDocuments.map((doc) => (
                    <div key={doc.id} className="document-card">
                        <div className="document-icon">
                            {getFileIcon(doc.type)}
                        </div>
                        <div className="document-info">
                            <span className="vault-badge">
                                📁 {getVaultName(doc.vaultId)}
                            </span>
                            <h4 className="document-name">{doc.name}</h4>
                            <div className="document-meta">
                                <span className="document-size">{formatFileSize(doc.size)}</span>
                                <span className="document-date">{formatDate(doc.uploadDate)}</span>
                            </div>
                        </div>
                        <div className="document-actions">
                            <Link to={`/documents/${doc.id}`} className="btn-icon" title="View">
                                👁️
                            </Link>
                            <button
                                className="btn-icon"
                                title="Download"
                                onClick={() => handleDownload(doc.id, doc.originalName || doc.name)}
                            >
                                ⬇️
                            </button>
                            <button
                                onClick={() => openDeleteConfirm(doc.id, doc.name)}
                                className="btn-icon delete"
                                title="Delete"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredDocuments.length === 0 && !loading && (
                <div className="empty-state">
                    <div className="empty-icon">📁</div>
                    <h3>No documents {filterVaultId || searchQuery ? 'found' : 'yet'}</h3>
                    <p>
                        {filterVaultId || searchQuery
                            ? 'Try adjusting your filter or search'
                            : 'Upload your first document to get started'}
                    </p>
                </div>
            )}

            {/* Upload Modal - Select Vault */}
            {showUploadModal && (
                <div className="modal-overlay open" onClick={cancelUpload}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-icon">📤</span>
                            <h3>Select Vault</h3>
                        </div>
                        <div className="modal-body">
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
                                        border: '1px solid #e2e8f0',
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
                            <button className="btn-cancel" onClick={cancelUpload}>
                                Cancel
                            </button>
                            <button
                                className="btn-confirm info"
                                onClick={handleUploadSubmit}
                                disabled={!selectedVaultId}
                            >
                                Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="Delete Document"
                message={`Are you sure you want to delete "${confirmModal.documentName}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                onCancel={closeDeleteConfirm}
                variant="danger"
            />
        </div>
    );
};

export default DocumentList;
