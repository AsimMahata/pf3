// Header Component
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Layout.css';

interface HeaderProps {
    onToggleSidebar: () => void;
    sidebarOpen: boolean;
}

const Header = ({ onToggleSidebar, sidebarOpen }: HeaderProps) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleProfileClick = () => {
        navigate('/settings/profile');
    };

    return (
        <header className="header">
            <div className="header-content">
                <div className="header-left">
                    <button
                        className="hamburger-btn"
                        onClick={onToggleSidebar}
                        aria-label="Toggle sidebar"
                        title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                    >
                        <span className="hamburger-icon">
                            {sidebarOpen ? '✕' : '☰'}
                        </span>
                    </button>
                    <h2 className="page-title">Welcome back, {user?.name || 'User'}!</h2>
                </div>

                <div className="header-actions">
                    <div
                        className="user-info"
                        onClick={handleProfileClick}
                        role="button"
                        tabIndex={0}
                        title="Go to profile settings"
                    >
                        <div className="user-avatar">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-email">{user?.email}</span>
                        </div>
                    </div>

                    <button onClick={logout} className="btn-logout">
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
