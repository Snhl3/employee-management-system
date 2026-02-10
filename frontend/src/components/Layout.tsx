import React from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="d-flex">
            <Sidebar />
            <main className="main-content flex-grow-1 bg-light min-vh-100">
                <div className="container-fluid p-4">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
