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
        <div className="profile-search">
            <header className="page-header">
                <h1>Profile Search</h1>
                <p>Search for employees by name or technical expertise</p>
            </header>

            <form className="search-box" onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search by name, tech (e.g. React, Python), or keywords..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            <div className="search-results">
                {results.length > 0 ? (
                    <div className="results-grid">
                        {results.map((p) => (
                            <div key={p.id} className="result-card">
                                <h3>{p.name}</h3>
                                <p className="tech-stack">{p.tech}</p>
                                <div className="result-meta">
                                    <span>📍 {p.location || 'Remote'}</span>
                                    <span>⏳ {p.experience} Years</span>
                                </div>
                                <div className="expertise">
                                    {p.expertise?.split(',').map((tag: string) => (
                                        <span key={tag} className="tag">{tag.trim()}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="search-placeholder">
                        <p>{query && !loading ? 'No results found.' : 'Enter a query to start searching.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSearch;
