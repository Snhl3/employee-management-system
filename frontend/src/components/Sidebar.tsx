import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { fetchAuthMe } from '../services/api';
import './Sidebar.css';

const Sidebar = () => {
    const navigate = useNavigate();
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await fetchAuthMe();
                setUser(userData);
            } catch (error) {
                console.error('Error fetching user for sidebar:', error);
            }
        };
        loadUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
        window.location.reload();
    };

    return (
        <aside className="sidebar bg-dark text-white d-flex flex-column vh-100 position-fixed">
            <div className="p-4 border-bottom border-secondary mb-3">
                <h2 className="h4 m-0 text-primary fw-bold">EMS</h2>
            </div>
            <nav className="nav flex-column nav-pills px-3 gap-2 flex-grow-1">
                <NavLink to="/" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active bg-primary' : ''}`}>
                    <i className="bi bi-speedometer2"></i> <span>Dashboard</span>
                </NavLink>
                <NavLink to="/my-profile" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active bg-primary' : ''}`}>
                    <i className="bi bi-person"></i> <span>My Profile</span>
                </NavLink>
                <NavLink to="/search" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active bg-primary' : ''}`}>
                    <i className="bi bi-search"></i> <span>Profile Search</span>
                </NavLink>
                {user?.role === 'ADMIN' && (
                    <>
                        <NavLink to="/users" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active bg-primary' : ''}`}>
                            <i className="bi bi-people"></i> <span>User Management</span>
                        </NavLink>
                        <NavLink to="/settings" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active bg-primary' : ''}`}>
                            <i className="bi bi-gear"></i> <span>LLM Setting</span>
                        </NavLink>
                    </>
                )}
            </nav>
            <div className="p-3 border-top border-secondary mt-auto">
                <button
                    onClick={handleLogout}
                    className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 border-0"
                >
                    <i className="bi bi-box-arrow-right"></i> <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
