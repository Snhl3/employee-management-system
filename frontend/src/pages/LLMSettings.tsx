import React, { useEffect, useState } from 'react';
import { fetchLLMSettings, updateLLMSettings } from '../services/api';
import './LLMSettings.css';

const LLMSettings = () => {
    const [provider, setProvider] = useState('OpenAI');
    const [modelName, setModelName] = useState('gpt-4');
    const [apiBase, setApiBase] = useState('http://localhost:11434/v1');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchLLMSettings();
                setProvider(data.provider);
                setModelName(data.model_name);
                if (data.api_base) setApiBase(data.api_base);
            } catch (error) {
                console.error('Failed to load settings');
            }
        };
        load();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateLLMSettings({ provider, model_name: modelName, api_base: apiBase });
            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="llm-settings pb-5">
            <header className="page-header mb-4">
                <h1 className="display-5 fw-bold text-dark">AI Settings</h1>
                <p className="lead text-muted">Configure your AI provider (Cloud or Local)</p>
            </header>

            <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
                <div className="card-body p-4">
                    <form onSubmit={handleSave}>
                        <div className="mb-4">
                            <label className="form-label fw-bold">AI Provider</label>
                            <div className="input-group">
                                <span className="input-group-text"><i className="bi bi-robot"></i></span>
                                <select className="form-select" value={provider} onChange={(e) => setProvider(e.target.value)}>
                                    <option value="OpenAI">OpenAI (Cloud)</option>
                                    <option value="Ollama">Ollama (Local / Free)</option>
                                    <option value="Mock">Mock AI (Demo)</option>
                                </select>
                            </div>
                            <div className="form-text">
                                {provider === 'Ollama' ? 'Requires local Ollama instance running.' : provider === 'Mock' ? 'Generates dummy data for testing.' : 'Requires API Key on server.'}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">Model Name</label>
                            <div className="input-group">
                                <span className="input-group-text"><i className="bi bi-cpu"></i></span>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={modelName}
                                    onChange={(e) => setModelName(e.target.value)}
                                    placeholder={provider === 'Ollama' ? 'llama3:latest' : 'gpt-4'}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">API Base URL</label>
                            <div className="input-group">
                                <span className="input-group-text"><i className="bi bi-link-45deg"></i></span>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={apiBase}
                                    onChange={(e) => setApiBase(e.target.value)}
                                    placeholder="http://localhost:11434/v1"
                                    disabled={provider === 'Mock'}
                                />
                            </div>
                            <div className="form-text">Default for Ollama is <code>http://localhost:11434/v1</code></div>
                        </div>

                        <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={saving}>
                            {saving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-save me-2"></i> Save Configuration
                                </>
                            )}
                        </button>

                        {message && (
                            <div className={`mt-3 alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'} border-0`}>
                                <i className={`bi ${message.includes('successfully') ? 'bi-check-circle' : 'bi-exclamation-circle'} me-2`}></i>
                                {message}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LLMSettings;
