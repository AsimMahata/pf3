// Mock data for development and testing
// TODO: Replace with real API calls in production

import type { User, Vault, Credential, Document, VaultStats, RecentActivity } from './types';

// Hardcoded user for mock authentication
export const MOCK_USER: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date('2024-01-01').toISOString(),
};

// Mock credentials for login (email: john@example.com, password: password123)
export const MOCK_CREDENTIALS = {
    email: 'john@example.com',
    password: 'password123',
};

// Initial mock vaults
export const INITIAL_VAULTS: Vault[] = [
    {
        id: '1',
        name: 'Personal',
        description: 'Personal accounts and credentials',
        createdAt: new Date('2024-01-15').toISOString(),
        credentialCount: 5,
        color: '#4F46E5',
    },
    {
        id: '2',
        name: 'Work',
        description: 'Work-related credentials',
        createdAt: new Date('2024-02-01').toISOString(),
        credentialCount: 3,
        color: '#10B981',
    },
    {
        id: '3',
        name: 'Finance',
        description: 'Banking and financial accounts',
        createdAt: new Date('2024-03-10').toISOString(),
        credentialCount: 2,
        color: '#F59E0B',
    },
];

// Initial mock credentials
export const INITIAL_CREDENTIALS: Credential[] = [
    {
        id: '1',
        vaultId: '1',
        title: 'Gmail',
        username: 'john.doe@gmail.com',
        password: 'mypassword123', // TODO: Should be encrypted
        url: 'https://gmail.com',
        notes: 'Primary email account',
        createdAt: new Date('2024-01-20').toISOString(),
        updatedAt: new Date('2024-01-20').toISOString(),
    },
    {
        id: '2',
        vaultId: '1',
        title: 'Facebook',
        username: 'john.doe',
        password: 'fb_secure_pass',
        url: 'https://facebook.com',
        createdAt: new Date('2024-02-05').toISOString(),
        updatedAt: new Date('2024-02-05').toISOString(),
    },
    {
        id: '3',
        vaultId: '1',
        title: 'Netflix',
        username: 'john@example.com',
        password: 'netflix2024',
        url: 'https://netflix.com',
        createdAt: new Date('2024-02-10').toISOString(),
        updatedAt: new Date('2024-02-10').toISOString(),
    },
    {
        id: '4',
        vaultId: '2',
        title: 'Company Portal',
        username: 'jdoe',
        password: 'work_pass_123',
        url: 'https://portal.company.com',
        notes: 'VPN required',
        createdAt: new Date('2024-02-15').toISOString(),
        updatedAt: new Date('2024-02-15').toISOString(),
    },
    {
        id: '5',
        vaultId: '2',
        title: 'Slack',
        username: 'john.doe@company.com',
        password: 'slack_secure',
        url: 'https://company.slack.com',
        createdAt: new Date('2024-03-01').toISOString(),
        updatedAt: new Date('2024-03-01').toISOString(),
    },
    {
        id: '6',
        vaultId: '3',
        title: 'Bank Account',
        username: 'jdoe2024',
        password: 'bank_secure_123',
        url: 'https://mybank.com',
        notes: 'Main checking account',
        createdAt: new Date('2024-03-15').toISOString(),
        updatedAt: new Date('2024-03-15').toISOString(),
    },
];

// Initial mock documents
export const INITIAL_DOCUMENTS: Document[] = [
    {
        id: '1',
        name: 'passport-scan.pdf',
        type: 'application/pdf',
        size: 2048576,
        uploadDate: new Date('2024-01-25').toISOString(),
    },
    {
        id: '2',
        name: 'tax-return-2023.pdf',
        type: 'application/pdf',
        size: 1536000,
        uploadDate: new Date('2024-02-14').toISOString(),
    },
    {
        id: '3',
        name: 'insurance-policy.pdf',
        type: 'application/pdf',
        size: 3145728,
        uploadDate: new Date('2024-03-05').toISOString(),
    },
    {
        id: '4',
        name: 'birth-certificate.jpg',
        type: 'image/jpeg',
        size: 524288,
        uploadDate: new Date('2024-03-20').toISOString(),
    },
];

// Mock recent activity
export const MOCK_RECENT_ACTIVITY: RecentActivity[] = [
    {
        id: '1',
        type: 'credential',
        action: 'Added new credential',
        timestamp: new Date('2024-03-20T10:30:00').toISOString(),
        itemName: 'Bank Account',
    },
    {
        id: '2',
        type: 'document',
        action: 'Uploaded document',
        timestamp: new Date('2024-03-19T15:45:00').toISOString(),
        itemName: 'birth-certificate.jpg',
    },
    {
        id: '3',
        type: 'vault',
        action: 'Created vault',
        timestamp: new Date('2024-03-10T09:00:00').toISOString(),
        itemName: 'Finance',
    },
    {
        id: '4',
        type: 'credential',
        action: 'Updated credential',
        timestamp: new Date('2024-03-05T14:20:00').toISOString(),
        itemName: 'Slack',
    },
];

// Helper function to calculate stats
export const calculateStats = (
    vaults: Vault[],
    credentials: Credential[],
    documents: Document[]
): VaultStats => {
    return {
        totalVaults: vaults.length,
        totalCredentials: credentials.length,
        totalDocuments: documents.length,
        lastAccessed: new Date().toISOString(),
    };
};

// Helper to format file size
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Helper to format date
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// Helper to format relative time
export const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
};
