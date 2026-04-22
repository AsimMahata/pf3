// Document Detail Page Component
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './Documents.css';

const API_URL = 'http://localhost:3000/api';

interface Vault {
    _id: string;
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

const DocumentDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string>('');

    // Delete confirmation modal
    const [confirmModal, setConfirmModal] = useState(false);

    useEffect(() => {
        console.log('frontend / DocumentDetail / useEffect / Fetching document:', id);
        fetchDocument();
        return () => {
            // Cleanup preview URL on unmount
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [id]);

    const fetchDocument = async () => {
        console.log('frontend / DocumentDetail / fetchDocument / Starting');
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/documents/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('frontend / DocumentDetail / fetchDocument / Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('frontend / DocumentDetail / fetchDocument / Document received:', data.document.name);
                setDocument(data.document);

                // Fetch preview
                await fetchPreview(token);
            } else {
                const data = await response.json();
                console.log('frontend / DocumentDetail / fetchDocument / Error:', data.message);
                setError(data.message || 'Document not found');
            }
        } catch (err) {
            console.error('frontend / DocumentDetail / fetchDocument / Error:', err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPreview = async (token: string | null) => {
        console.log('frontend / DocumentDetail / fetchPreview / Fetching preview');
        try {
            const response = await fetch(`${API_URL}/documents/${id}/preview`, {
                headers: {
                    'Authorization': `Bearer ${token || ''}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                console.log('frontend / DocumentDetail / fetchPreview / Preview URL created');
                setPreviewUrl(url);
            } else {
                console.log('frontend / DocumentDetail / fetchPreview / Failed to fetch preview');
            }
        } catch (err) {
            console.error('frontend / DocumentDetail / fetchPreview / Error:', err);
        }
    };

    const handleDelete = async () => {
        console.log('frontend / DocumentDetail / handleDelete / Deleting document');
        setConfirmModal(false);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/documents/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('frontend / DocumentDetail / handleDelete / Response status:', response.status);

            if (response.ok) {
                console.log('frontend / DocumentDetail / handleDelete / Success, navigating back');
                navigate('/documents');
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to delete document');
            }
        } catch (err) {
            console.error('frontend / DocumentDetail / handleDelete / Error:', err);
            setError('Network error. Please try again.');
        }
    };

    const handleDownload = async () => {
        if (!document) return;

        console.log('frontend / DocumentDetail / handleDownload / Downloading:', document.originalName);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_URL}/documents/${id}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = window.document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = document.originalName || document.name;
                window.document.body.appendChild(a);
                a.click();

                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    window.document.body.removeChild(a);
                }, 100);

                console.log('frontend / DocumentDetail / handleDownload / Download triggered');
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to download document');
            }
        } catch (err) {
            console.error('frontend / DocumentDetail / handleDownload / Error:', err);
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
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
        return 'Unknown Vault';
    };

    const isImage = (type: string): boolean => {
        return type.startsWith('image/');
    };

    const isPdf = (type: string): boolean => {
        return type === 'application/pdf';
    };

    if (loading) {
        return (
            <div className="document-detail-page">
                <div className="loading-state">Loading document...</div>
            </div>
        );
    }

    if (error || !document) {
        return (
            <div className="document-detail-page">
                <div className="empty-state">
                    <h3>{error || 'Document not found'}</h3>
                    <Link to="/documents" className="btn-primary">Back to Documents</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="document-detail-page">
            <div className="page-header">
                <div>
                    <Link to="/documents" className="breadcrumb">← Back to Documents</Link>
                    <h1>{document.name}</h1>
                </div>
                <div className="header-actions-group">
                    <button onClick={handleDownload} className="btn-primary">
                        ⬇️ Download
                    </button>
                    <button onClick={() => setConfirmModal(true)} className="btn-delete-large">
                        🗑️ Delete
                    </button>
                </div>
            </div>

            <div className="document-detail-card">
                <div className="document-preview">
                    {previewUrl && isImage(document.type) ? (
                        <div className="preview-image-container">
                            <img
                                src={previewUrl}
                                alt={document.name}
                                className="preview-image"
                            />
                        </div>
                    ) : previewUrl && isPdf(document.type) ? (
                        <div className="preview-pdf-container">
                            <iframe
                                src={previewUrl}
                                title={document.name}
                                className="preview-pdf"
                            />
                        </div>
                    ) : (
                        <div className="preview-placeholder">
                            <div className="preview-icon">{getFileIcon(document.type)}</div>
                            <p className="preview-text">Preview not available</p>
                            <p className="preview-subtext">
                                Click download to view this file
                            </p>
                        </div>
                    )}
                </div>

                <div className="document-metadata">
                    <h3>Document Information</h3>

                    <div className="metadata-grid">
                        <div className="metadata-item">
                            <span className="metadata-label">File Name</span>
                            <span className="metadata-value">{document.name}</span>
                        </div>

                        <div className="metadata-item">
                            <span className="metadata-label">Original Name</span>
                            <span className="metadata-value">{document.originalName}</span>
                        </div>

                        <div className="metadata-item">
                            <span className="metadata-label">Vault</span>
                            <span className="metadata-value vault-badge" style={{ display: 'inline-block' }}>
                                📁 {getVaultName(document.vaultId)}
                            </span>
                        </div>

                        <div className="metadata-item">
                            <span className="metadata-label">File Type</span>
                            <span className="metadata-value">{document.type}</span>
                        </div>

                        <div className="metadata-item">
                            <span className="metadata-label">File Size</span>
                            <span className="metadata-value">{formatFileSize(document.size)}</span>
                        </div>

                        <div className="metadata-item">
                            <span className="metadata-label">Upload Date</span>
                            <span className="metadata-value">{formatDate(document.uploadDate)}</span>
                        </div>

                        <div className="metadata-item">
                            <span className="metadata-label">Document ID</span>
                            <span className="metadata-value" style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
                                {document.id}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal}
                title="Delete Document"
                message={`Are you sure you want to delete "${document.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                onCancel={() => setConfirmModal(false)}
                variant="danger"
            />
        </div>
    );
};

export default DocumentDetail;
