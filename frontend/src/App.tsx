import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProfileSearch from './pages/ProfileSearch';
import LLMSettings from './pages/LLMSettings';
import { MyProfile, UserManagement } from './pages/Placeholders';
import './styles/theme.css';

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/my-profile" element={<MyProfile />} />
                    <Route path="/search" element={<ProfileSearch />} />
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/settings" element={<LLMSettings />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
