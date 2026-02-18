import React, { useState } from 'react';
import { searchEmployees, fetchAuthMe } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import './ProfileSearch.css';

const ProfileSearch = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [searchMode, setSearchMode] = useState<'BASIC' | 'JD'>('BASIC');
    const [filters, setFilters] = useState({
        name: '',
        tech: '',
        status: '',
        bandwidth: '',
        experience: '',
        jd: ''
    });
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        fetchAuthMe().then(setCurrentUser).catch(console.error);
    }, []);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const params: any = {};
            if (searchMode === 'BASIC') {
                if (query) params.query = query;
                if (filters.name) params.name = filters.name;
                if (filters.tech) params.tech = filters.tech;
                if (filters.status) params.status = filters.status;
                if (filters.bandwidth) params.bandwidth = filters.bandwidth;
                if (filters.experience) params.experience = filters.experience;
            } else {
                if (filters.jd) params.jd = filters.jd;
            }

            const data = await searchEmployees(params);
            setResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="profile-search pb-5">
            <header className="page-header mb-4">
                <h1 className="display-5 fw-bold text-dark">Profile Search</h1>
                <p className="lead text-muted">Search for employees by name or technical expertise</p>
            </header>

            {/* Search Mode Toggle */}
            <div className="d-flex justify-content-center mb-4">
                <div className="btn-group" role="group">
                    <button
                        type="button"
                        className={`btn ${searchMode === 'BASIC' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setSearchMode('BASIC')}
                    >
                        <i className="bi bi-search me-2"></i>Basic Search
                    </button>
                    <button
                        type="button"
                        className={`btn ${searchMode === 'JD' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setSearchMode('JD')}
                    >
                        <i className="bi bi-file-text me-2"></i>JD Match
                    </button>
                </div>
            </div>

            <div className="card shadow-sm mb-5">
                <div className="card-body p-4">
                    {searchMode === 'BASIC' ? (
                        <form onSubmit={handleSearch}>
                            {/* Global Keyword */}
                            <div className="input-group input-group-lg mb-3">
                                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Global keyword search..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <button className="btn btn-primary px-4" type="submit" disabled={loading}>
                                    {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Search'}
                                </button>
                            </div>

                            <hr className="my-4 text-muted" />
                            <h6 className="fw-bold mb-3 text-secondary text-uppercase small ls-1">Advanced Filters</h6>

                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label small text-muted">Name</label>
                                    <input type="text" name="name" className="form-control" placeholder="Filter by name" value={filters.name} onChange={handleFilterChange} />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small text-muted">Tech Stack</label>
                                    <input type="text" name="tech" className="form-control" placeholder="e.g. Python, React" value={filters.tech} onChange={handleFilterChange} />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small text-muted">Status</label>
                                    <select name="status" className="form-select" value={filters.status} onChange={handleFilterChange}>
                                        <option value="">Any Status</option>
                                        <option value="ON_BENCH">On Bench</option>
                                        <option value="ON_CLIENT">On Client</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small text-muted">Min Experience (Years)</label>
                                    <input type="number" name="experience" className="form-control" placeholder="0" min="0" step="0.5" value={filters.experience} onChange={handleFilterChange} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small text-muted">Min Bandwidth (%)</label>
                                    <input type="number" name="bandwidth" className="form-control" placeholder="0" min="0" max="100" step="5" value={filters.bandwidth} onChange={handleFilterChange} />
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div>
                            <div className="mb-3">
                                <label className="form-label fw-bold">Job Description (JD)</label>
                                <textarea
                                    name="jd"
                                    className="form-control"
                                    rows={8}
                                    placeholder="Paste the Job Description here..."
                                    value={filters.jd}
                                    onChange={handleFilterChange}
                                ></textarea>
                                <div className="form-text">System will analyse keywords from the JD to rank profiles.</div>
                            </div>
                            <button className="btn btn-primary px-4 fw-bold" onClick={() => handleSearch()} disabled={loading || !filters.jd.trim()}>
                                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-stars me-2"></i>}
                                Find Matching Candidates
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="search-results">
                {results.length > 0 ? (
                    <div className="row g-4">
                        {results.map((p) => (
                            <div key={p.id} className="col-md-6 col-lg-4">
                                <div className="card h-100 border-0 shadow-sm position-relative">
                                    {p.match_score !== null && p.match_score !== undefined && (
                                        <div className="position-absolute top-0 end-0 m-3">
                                            <span className={`badge ${p.match_score >= 80 ? 'bg-success' : 'bg-primary'} rounded-pill shadow-sm py-2 px-3`}>
                                                <i className="bi bi-bullseye me-1"></i> {p.match_score}% Match
                                            </span>
                                        </div>
                                    )}
                                    <div className="card-body">
                                        <h5 className="card-title fw-bold mb-1 pe-5">{p.name}</h5>
                                        <div className="mb-3">
                                            {Array.isArray(p.tech) ? p.tech.map((t: any, i: number) => (
                                                <span key={i} className="badge bg-primary-subtle text-primary me-1 mb-1 fw-normal">
                                                    {t.tech} ({t.experience_years}y)
                                                </span>
                                            )) : <span className="text-muted small">No tech specified</span>}
                                        </div>
                                        <div className="d-flex gap-3 mb-3 text-muted small">
                                            <span><i className="bi bi-geo-alt me-1"></i>{p.location || 'Remote'}</span>
                                            <span><i className="bi bi-clock me-1"></i>{p.experience_years} Years</span>
                                        </div>
                                        <div className="card-text small text-muted mb-3" style={{ whiteSpace: 'pre-line' }}>
                                            {p.search_phrase ? (
                                                <div className="bg-light p-2 rounded border">
                                                    <strong>Search Phrase:</strong><br />
                                                    {p.search_phrase}
                                                </div>
                                            ) : (
                                                p.career_summary || 'No summary provided.'
                                            )}
                                        </div>
                                        {currentUser?.role === 'ADMIN' && (
                                            <button
                                                className="btn btn-sm btn-outline-primary w-100"
                                                onClick={() => navigate(`/profile/${p.emp_id}`)}
                                            >
                                                <i className="bi bi-pencil me-1"></i> Edit Profile
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-5 bg-white rounded shadow-sm border">
                        <i className={`bi ${searchMode === 'BASIC' ? 'bi-search' : 'bi-file-earmark-x'} fs-1 text-light mb-3 d-block`}></i>
                        <h4 className="text-dark fw-bold">No results found</h4>
                        <p className="text-muted mx-auto" style={{ maxWidth: '400px' }}>
                            {searchMode === 'BASIC'
                                ? 'We couldn\'t find any profiles matching your search criteria. Try using broader keywords.'
                                : 'No profiles met the 50% matching threshold for this JD. Try refining the JD or checking for relevant profiles in basic search.'
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSearch;
