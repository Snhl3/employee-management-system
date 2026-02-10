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
        <div className="dashboard pb-5">
            <header className="page-header mb-4">
                <h1 className="display-5 fw-bold text-dark">Dashboard</h1>
                <p className="lead text-muted">Overview of the Employee Management System</p>
            </header>

            <div className="row g-4 mb-5">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                                <i className="bi bi-people text-primary fs-3"></i>
                            </div>
                            <div>
                                <h6 className="card-subtitle mb-1 text-muted">Total Employee</h6>
                                <h2 className="card-title mb-0 fw-bold">{metrics?.total_employees || 0}</h2>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex align-items-center">
                            <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
                                <i className="bi bi-person-x text-warning fs-3"></i>
                            </div>
                            <div>
                                <h6 className="card-subtitle mb-1 text-muted">On Bench</h6>
                                <h2 className="card-title mb-0 fw-bold">{metrics?.on_bench || 0}</h2>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex align-items-center">
                            <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3">
                                <i className="bi bi-cash-stack text-success fs-3"></i>
                            </div>
                            <div>
                                <h6 className="card-subtitle mb-1 text-muted">Billable</h6>
                                <h2 className="card-title mb-0 fw-bold">{metrics?.billable || 0}</h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <section className="recent-section">
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white py-3">
                        <h5 className="mb-0 fw-bold">Recently Updated Profiles</h5>
                    </div>
                    <div className="card-body p-0">
                        <div className="list-group list-group-flush">
                            {recentProfiles.length > 0 ? recentProfiles.map((p: any) => (
                                <div key={p.id} className="list-group-item list-group-item-action py-3 d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                        <div className="bg-light rounded-circle p-2 me-3">
                                            <i className="bi bi-person-badge text-secondary"></i>
                                        </div>
                                        <div>
                                            <h6 className="mb-0 fw-bold">{p.name}</h6>
                                            <small className="text-muted">{p.tech} • {p.level}</small>
                                        </div>
                                    </div>
                                    <span className={`badge rounded-pill ${p.status === 'on_bench' ? 'bg-warning' : 'bg-success'}`}>
                                        {p.status.replace('_', ' ')}
                                    </span>
                                </div>
                            )) : <div className="p-4 text-center text-muted">No profiles updated recently.</div>}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
