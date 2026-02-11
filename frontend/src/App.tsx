import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProfileSearch from './pages/ProfileSearch';
import LLMSettings from './pages/LLMSettings';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import { MyProfile } from './pages/Placeholders';
import './styles/theme.css';

function App() {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Sync token state on mount and on storage changes (helpful for multi-tab)
        const checkToken = () => {
            const currentToken = localStorage.getItem('token');
            if (currentToken === "null" || currentToken === "undefined" || !currentToken) {
                setToken(null);
            } else {
                setToken(currentToken);
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
                                <Route path="/search" element={<ProfileSearch />} />
                                <Route path="/users" element={<UserManagement />} />
                                <Route path="/settings" element={<LLMSettings />} />
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        </Layout>
                    ) : (
                        <Navigate to="/login" />
                    )
                } />
            </Routes>
        </Router>
    );
}

export default App;
