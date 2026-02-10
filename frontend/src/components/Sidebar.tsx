import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
    return (
        <aside className="sidebar bg-dark text-white d-flex flex-column vh-100 position-fixed">
            <div className="p-4 border-bottom border-secondary mb-3">
                <h2 className="h4 m-0 text-primary fw-bold">EMS</h2>
            </div>
            <nav className="nav flex-column nav-pills px-3 gap-2">
                <NavLink to="/" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active bg-primary' : ''}`}>
                    <i className="bi bi-speedometer2"></i> <span>Dashboard</span>
                </NavLink>
                <NavLink to="/my-profile" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active bg-primary' : ''}`}>
                    <i className="bi bi-person"></i> <span>My Profile</span>
                </NavLink>
                <NavLink to="/search" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active bg-primary' : ''}`}>
                    <i className="bi bi-search"></i> <span>Profile Search</span>
                </NavLink>
                <NavLink to="/users" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active bg-primary' : ''}`}>
                    <i className="bi bi-people"></i> <span>User Management</span>
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active bg-primary' : ''}`}>
                    <i className="bi bi-gear"></i> <span>LLM Setting</span>
                </NavLink>
            </nav>
        </aside>
    );
};

export default Sidebar;
