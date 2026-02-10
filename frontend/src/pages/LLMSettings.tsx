import React, { useEffect, useState } from 'react';
import { fetchLLMSettings, updateLLMSettings } from '../services/api';
import './LLMSettings.css';

const LLMSettings = () => {
    const [provider, setProvider] = useState('OpenAI');
    const [modelName, setModelName] = useState('gpt-4');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchLLMSettings();
                setProvider(data.provider);
                setModelName(data.model_name);
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
            await updateLLMSettings({ provider, model_name: modelName });
            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="llm-settings">
            <header className="page-header">
                <h1>LLM Settings</h1>
                <p>Configure AI providers for profile analysis and search enhancement</p>
            </header>

            <form className="settings-form" onSubmit={handleSave}>
                <div className="form-group">
                    <label>AI Provider</label>
                    <select value={provider} onChange={(e) => setProvider(e.target.value)}>
                        <option value="OpenAI">OpenAI</option>
                        <option value="Anthropic">Anthropic</option>
                        <option value="Google Gemini">Google Gemini</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Model Name</label>
                    <input
                        type="text"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        placeholder="e.g. gpt-4, claude-3-opus"
                    />
                </div>

                <button type="submit" className="save-btn" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>

                {message && <p className="status-message">{message}</p>}
            </form>
        </div>
    );
};

export default LLMSettings;
