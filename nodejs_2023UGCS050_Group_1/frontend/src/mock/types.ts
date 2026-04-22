// Type definitions for the application

export interface User {
    id: string;
    name: string;
    email: string;
    createdAt: string;
}

export interface Vault {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    credentialCount: number;
    color?: string;
}

export interface Credential {
    id: string;
    vaultId: string;
    title: string;
    username: string;
    password: string; // TODO: This should be encrypted in real implementation
    url?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Document {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadDate: string;
    url?: string;
}

export interface VaultStats {
    totalVaults: number;
    totalCredentials: number;
    totalDocuments: number;
    lastAccessed?: string;
}

export interface RecentActivity {
    id: string;
    type: 'vault' | 'credential' | 'document';
    action: string;
    timestamp: string;
    itemName: string;
}
