import React from 'react';

const PlaceholderPage = ({ title }: { title: string }) => (
    <div className="placeholder-page">
        <header className="page-header">
            <h1>{title}</h1>
            <p>This section is under development.</p>
        </header>
        <div style={{
            padding: '4rem',
            textAlign: 'center',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius)',
            border: '2px dashed var(--border)',
            color: 'var(--text-muted)'
        }}>
            🏗️ Implementation coming soon.
        </div>
    </div>
);

export const MyProfile = () => <PlaceholderPage title="My Profile" />;
