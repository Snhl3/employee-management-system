import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
    return (
        <aside className="sidebar">
            <div className="logo">
                <h2>EMS</h2>
            </div>
            <nav className="nav-menu">
                <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <span className="icon">📊</span> Dashboard
                </NavLink>
                <NavLink to="/my-profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <span className="icon">👤</span> My Profile
                </NavLink>
                <NavLink to="/search" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <span className="icon">🔍</span> Profile Search
                </NavLink>
                <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <span className="icon">👥</span> User Management
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <span className="icon">⚙️</span> LLM Setting
                </NavLink>
            </nav>
        </aside>
    );
};

export default Sidebar;
