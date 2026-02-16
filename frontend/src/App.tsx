import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProfileSearch from './pages/ProfileSearch';
import LLMSettings from './pages/LLMSettings';
import UserManagement from './pages/UserManagement';
import MyProfile from './pages/MyProfile';
import Login from './pages/Login';
import { fetchAuthMe } from './services/api';
import './styles/theme.css';

function App() {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<any>(null);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Sync token state on mount and on storage changes (helpful for multi-tab)
        const checkToken = async () => {
            const currentToken = localStorage.getItem('token');
            if (currentToken === "null" || currentToken === "undefined" || !currentToken) {
                setToken(null);
                setUser(null);
            } else {
                setToken(currentToken);
                try {
                    const userData = await fetchAuthMe();
                    setUser(userData);
                } catch (error) {
                    console.error('App: Failed to fetch user profile:', error);
                    // If fetching user fails with 401, interceptor will handle it
                }
            }
            setIsChecking(false);
        };

        checkToken();

        const handleStorageChange = () => {
            checkToken();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    if (isChecking) {
        return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"></div></div>;
    }

    const isAuthenticated = !!token;

    return (
        <ErrorBoundary>
            <Router>
                <Routes>
                    {/* Redirect based on authentication state */}
                    <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />

                    <Route path="/*" element={
                        isAuthenticated ? (
                            <Layout>
                                <Routes>
                                    <Route path="/" element={<Dashboard />} />
                                    <Route path="/my-profile" element={<MyProfile />} />
                                    <Route path="/profile/:empId" element={<MyProfile />} />
                                    <Route path="/search" element={<ProfileSearch />} />
                                    <Route path="/users" element={user?.role === 'ADMIN' ? <UserManagement /> : <Navigate to="/" />} />
                                    <Route path="/settings" element={user?.role === 'ADMIN' ? <LLMSettings /> : <Navigate to="/" />} />
                                    <Route path="*" element={<Navigate to="/" />} />
                                </Routes>
                            </Layout>
                        ) : (
                            <Navigate to="/login" />
                        )
                    } />
                </Routes>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
