import React, { useEffect, useState } from 'react';
import { fetchUsers, updateUserRole, updateUserStatus } from '../services/api';
import './UserManagement.css';

interface User {
    id: number;
    email: string;
    role: string;
    is_active: boolean;
}

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await fetchUsers();
            setUsers(data);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching users:', err);
            setError(err.response?.data?.detail || 'Failed to load users. Are you logged in as Admin?');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: number, newRole: string) => {
        try {
            await updateUserRole(userId, newRole);
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to update role');
        }
    };

    const handleStatusToggle = async (userId: number, currentStatus: boolean) => {
        try {
            await updateUserStatus(userId, !currentStatus);
            setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to update status');
        }
    };

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary" role="status"></div></div>;

    return (
        <div className="user-management-page">
            <header className="page-header mb-4">
                <h1 className="h2 fw-bold text-dark">User Management</h1>
                <p className="text-muted">Manage system users, roles, and account status.</p>
            </header>

            {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>{error}</div>
                </div>
            )}

            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light text-muted small text-uppercase">
                                <tr>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="py-3">Role</th>
                                    <th className="py-3">Status</th>
                                    <th className="px-4 py-3 text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-4 py-3 fw-medium">{user.email}</td>
                                        <td className="py-3">
                                            <select
                                                className="form-select form-select-sm border-0 bg-light w-auto"
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            >
                                                <option value="ADMIN">ADMIN</option>
                                                <option value="USER">USER</option>
                                            </select>
                                        </td>
                                        <td className="py-3">
                                            <span className={`badge rounded-pill ${user.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="form-check form-switch d-inline-block">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    role="switch"
                                                    checked={user.is_active}
                                                    onChange={() => handleStatusToggle(user.id, user.is_active)}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && !error && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-5 text-muted">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
