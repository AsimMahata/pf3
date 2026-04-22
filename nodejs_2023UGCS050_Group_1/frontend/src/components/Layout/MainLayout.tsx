// Main Layout Component
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="layout">
            <Sidebar isOpen={sidebarOpen} />
            <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                <Header onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
                <main className="content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
