import React, { useState } from 'react';
import { searchEmployees } from '../services/api';
import './ProfileSearch.css';

const ProfileSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        try {
            const data = await searchEmployees(query);
            setResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-search pb-5">
            <header className="page-header mb-4">
                <h1 className="display-5 fw-bold text-dark">Profile Search</h1>
                <p className="lead text-muted">Search for employees by name or technical expertise</p>
            </header>

            <form className="mb-5" onSubmit={handleSearch}>
                <div className="input-group input-group-lg shadow-sm">
                    <span className="input-group-text bg-white border-end-0">
                        <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                        type="text"
                        className="form-control border-start-0 ps-0"
                        placeholder="Search by name, tech (e.g. React, Python), or keywords..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button className="btn btn-primary px-4" type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Searching...
                            </>
                        ) : 'Search'}
                    </button>
                </div>
            </form>

            <div className="search-results">
                {results.length > 0 ? (
                    <div className="row g-4">
                        {results.map((p) => (
                            <div key={p.id} className="col-md-6 col-lg-4">
                                <div className="card h-100 border-0 shadow-sm">
                                    <div className="card-body">
                                        <h5 className="card-title fw-bold mb-1">{p.name}</h5>
                                        <p className="text-primary small fw-semibold mb-3">{p.tech}</p>
                                        <div className="d-flex gap-3 mb-3 text-muted small">
                                            <span><i className="bi bi-geo-alt me-1"></i>{p.location || 'Remote'}</span>
                                            <span><i className="bi bi-clock me-1"></i>{p.experience} Years</span>
                                        </div>
                                        <div className="d-flex flex-wrap gap-2">
                                            {p.expertise?.split(',').map((tag: string) => (
                                                <span key={tag} className="badge bg-light text-dark border fw-normal">{tag.trim()}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-5 bg-white rounded shadow-sm">
                        <i className="bi bi-search fs-1 text-light mb-3 d-block"></i>
                        <p className="text-muted">{query && !loading ? 'No results found.' : 'Enter a query to start searching.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSearch;
