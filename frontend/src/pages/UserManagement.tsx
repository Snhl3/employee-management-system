import React, { useEffect, useState } from 'react';
import { fetchUsers, updateUserRole, updateUserStatus, createUser, updateUser, deleteUser, fetchAuthMe } from '../services/api';
import './UserManagement.css';

interface User {
    id: number;
    email: string;
    name?: string;
    role: string;
    is_active: boolean;
}

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'USER',
        is_active: true
    });

    useEffect(() => {
        loadUsers();
        loadCurrentUser();
    }, []);

    const loadCurrentUser = async () => {
        try {
            const user = await fetchAuthMe();
            setCurrentUser(user);
        } catch (err) {
            console.error('Error fetching current user:', err);
        }
    };

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

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            if (isEditMode && editingUserId) {
                const updatedUser = await updateUser(editingUserId, formData);
                setUsers(users.map(u => u.id === editingUserId ? updatedUser : u));
                setSuccessMessage(`User ${updatedUser.email} updated successfully!`);
            } else {
                const newUser = await createUser({ ...formData, password: 'Neosoft@123' });
                setUsers([newUser, ...users]);
                setSuccessMessage(`User ${newUser.email} created successfully! Default password is Neosoft@123`);
            }
            handleCloseModal();
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err: any) {
            setError(err.message || 'Failed to process request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId: number, email: string) => {
        if (!window.confirm(`Are you sure you want to delete user ${email}?`)) return;

        try {
            await deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
            setSuccessMessage(`User ${email} deleted successfully!`);
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err: any) {
            setError(err.message || 'Failed to delete user');
        }
    };

    const handleOpenAddModal = () => {
        setFormData({ name: '', email: '', role: 'USER', is_active: true });
        setIsEditMode(false);
        setEditingUserId(null);
        setShowModal(true);
        setError(null);
    };

    const handleOpenEditModal = (user: User) => {
        setFormData({
            name: user.name || '',
            email: user.email,
            role: user.role,
            is_active: user.is_active
        });
        setIsEditMode(true);
        setEditingUserId(user.id);
        setShowModal(true);
        setError(null);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setError(null);
    };

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary" role="status"></div></div>;

    return (
        <div className="user-management-page">
            <header className="page-header mb-4 d-flex justify-content-between align-items-center">
                <div>
                    <h1 className="h2 fw-bold text-dark">User Management</h1>
                    <p className="text-muted mb-0">Manage system users, roles, and account status.</p>
                </div>
                <div className="d-flex align-items-center">
                    <button
                        className="btn btn-primary d-flex align-items-center"
                        onClick={handleOpenAddModal}
                    >
                        <i className="bi bi-person-plus-fill me-2"></i>
                        Add User
                    </button>
                    <button
                        className="btn btn-outline-secondary ms-2"
                        onClick={() => { loadUsers(); loadCurrentUser(); }}
                        title="Refresh List"
                    >
                        <i className="bi bi-arrow-clockwise"></i>
                    </button>
                </div>
            </header>

            {error && (
                <div className="alert alert-danger d-flex align-items-center mb-4 border-0 shadow-sm" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>{error}</div>
                </div>
            )}

            {successMessage && (
                <div className="alert alert-success d-flex align-items-center mb-4 border-0 shadow-sm" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    <div>{successMessage}</div>
                </div>
            )}

            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light text-muted small text-uppercase">
                                <tr>
                                    <th className="px-4 py-3">User</th>
                                    <th className="py-3">Role</th>
                                    <th className="py-3">Status</th>
                                    <th className="px-4 py-3 text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-4 py-3">
                                            <div className="fw-medium">{user.name || 'N/A'}</div>
                                            <div className="small text-muted">{user.email}</div>
                                        </td>
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
                                            <div className="d-flex justify-content-end align-items-center gap-2">
                                                <div className="form-check form-switch me-2">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        role="switch"
                                                        checked={user.is_active}
                                                        onChange={() => handleStatusToggle(user.id, user.is_active)}
                                                    />
                                                </div>
                                                {currentUser?.role === 'ADMIN' && (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => handleOpenEditModal(user)}
                                                            title="Edit User"
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleDeleteUser(user.id, user.email)}
                                                            disabled={user.id === currentUser?.id}
                                                            title={user.id === currentUser?.id ? "Cannot delete yourself" : "Delete User"}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </>
                                                )}
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

            {/* Add User Modal */}
            {showModal && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-light border-0 py-3">
                                <h5 className="modal-title fw-bold">{isEditMode ? 'Edit User' : 'Add New User'}</h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal} disabled={submitting}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-control"
                                            placeholder="Enter full name"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            required
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-control"
                                            placeholder="user@example.com"
                                            value={formData.email}
                                            onChange={handleFormChange}
                                            required
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-muted">Role</label>
                                            <select
                                                name="role"
                                                className="form-select text-uppercase"
                                                value={formData.role}
                                                onChange={handleFormChange}
                                                disabled={submitting}
                                            >
                                                <option value="USER">Employee</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6 d-flex align-items-end">
                                            <div className="form-check form-switch mb-2">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    name="is_active"
                                                    role="switch"
                                                    id="activeSwitch"
                                                    checked={formData.is_active}
                                                    onChange={handleFormChange}
                                                    disabled={submitting}
                                                />
                                                <label className="form-check-label small fw-bold text-muted ms-2" htmlFor="activeSwitch">
                                                    Active Account
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    {!isEditMode && (
                                        <div className="alert alert-info small border-0 bg-light-subtle mb-0">
                                            <i className="bi bi-info-circle me-2"></i>
                                            Default password: <strong>Neosoft@123</strong>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button
                                        type="button"
                                        className="btn btn-light px-4"
                                        onClick={handleCloseModal}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary px-4 fw-bold"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            'Save User'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
