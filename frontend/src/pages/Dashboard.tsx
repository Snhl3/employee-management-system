import React, { useEffect, useState } from 'react';
import { fetchMetrics, fetchRecentProfiles } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const [metrics, setMetrics] = useState<any>(null);
    const [recentProfiles, setRecentProfiles] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [m, rp] = await Promise.all([fetchMetrics(), fetchRecentProfiles()]);
                setMetrics(m);
                setRecentProfiles(rp);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            }
        };
        loadData();
    }, []);

    return (
        <div className="dashboard">
            <header className="page-header">
                <h1>Dashboard</h1>
                <p>Overview of the Employee Management System</p>
            </header>

            <div className="metrics-grid">
                <div className="metric-card">
                    <h3>Total Employee</h3>
                    <p className="value">{metrics?.total_employees || 0}</p>
                </div>
                <div className="metric-card warning">
                    <h3>On Bench</h3>
                    <p className="value">{metrics?.on_bench || 0}</p>
                </div>
                <div className="metric-card success">
                    <h3>Billable</h3>
                    <p className="value">{metrics?.billable || 0}</p>
                </div>
            </div>

            <section className="recent-section">
                <h2>Recently Updated Profiles</h2>
                <div className="profiles-list">
                    {recentProfiles.length > 0 ? recentProfiles.map((p: any) => (
                        <div key={p.id} className="profile-item">
                            <div className="profile-info">
                                <strong>{p.name}</strong>
                                <span>{p.tech} • {p.level}</span>
                            </div>
                            <span className="status-badge">{p.status.replace('_', ' ')}</span>
                        </div>
                    )) : <p className="empty-msg">No profiles updated recently.</p>}
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
