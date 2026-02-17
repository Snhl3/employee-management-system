import React, { useEffect, useState, useCallback } from 'react';
import { fetchLLMSettings, updateLLMSettings, fetchLLMModels } from '../services/api';
import './LLMSettings.css';

const LLMSettings = () => {
    const [provider, setProvider] = useState('Ollama');
    const [modelName, setModelName] = useState('llama3');
    const [apiBase, setApiBase] = useState('http://localhost:11434/v1');
    const [apiKey, setApiKey] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [isApiKeySet, setIsApiKeySet] = useState(false);

    const [models, setModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Fetch initial settings
    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchLLMSettings();
                setProvider(data.provider || 'Ollama');
                setModelName(data.model_name || 'llama3');
                setApiBase(data.api_base || 'http://localhost:11434/v1');
                setSystemPrompt(data.system_prompt || '');
                setIsApiKeySet(data.is_api_key_set);
            } catch (error) {
                console.error('Failed to load settings');
            } finally {
                setInitialLoading(false);
            }
        };
        load();
    }, []);

    // Load models when provider or apiBase changes
    useEffect(() => {
        if (initialLoading) return;

        let active = true;
        const loadModels = async () => {
            setLoadingModels(true);
            try {
                const list = await fetchLLMModels(provider);
                if (active) {
                    setModels(list || []);
                    // Auto-select first model if current is not in list
                    if (list && list.length > 0 && !list.includes(modelName)) {
                        // We don't auto-save here to avoid loops, let user choose
                    }
                }
            } catch (error) {
                if (active) setModels([]);
            } finally {
                if (active) setLoadingModels(false);
            }
        };

        const timeout = setTimeout(loadModels, provider === 'Ollama' ? 300 : 0);
        return () => {
            active = false;
            clearTimeout(timeout);
        };
    }, [provider, apiBase, initialLoading]);

    // Atomic Save Function
    const saveSettings = async (overrides: any = {}) => {
        setSaving(true);
        try {
            const payload = {
                provider: overrides.provider || provider,
                model_name: overrides.model_name || modelName,
                api_base: overrides.api_base || apiBase,
                system_prompt: overrides.system_prompt !== undefined ? overrides.system_prompt : systemPrompt,
                api_key: overrides.api_key || undefined
            };
            const data = await updateLLMSettings(payload);
            setIsApiKeySet(data.is_api_key_set);
            setMessage('Changes saved');
            setTimeout(() => setMessage(''), 2000);
        } catch (error) {
            console.error('Save failed', error);
            setMessage('Error saving');
        } finally {
            setSaving(false);
        }
    };

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const p = e.target.value;
        setProvider(p);
        saveSettings({ provider: p });
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const m = e.target.value;
        setModelName(m);
        saveSettings({ model_name: m });
    };

    if (initialLoading) {
        return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;
    }

    return (
        <div className="llm-settings pb-5">
            <header className="page-header mb-4">
                <h1 className="display-5 fw-bold text-dark">AI Settings</h1>
                <p className="lead text-muted">Intelligent system configuration for your profile. Changes are saved automatically.</p>
            </header>

            <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: '800px' }}>
                <div className="card-body p-4">
                    <div className="row">
                        <div className="col-md-6 mb-4">
                            <label className="form-label fw-bold">AI Provider</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0"><i className="bi bi-robot text-primary"></i></span>
                                <select
                                    className="form-select border-start-0"
                                    value={provider}
                                    onChange={handleProviderChange}
                                >
                                    <option value="OpenAI">OpenAI (Cloud)</option>
                                    <option value="Ollama">Ollama (Local)</option>
                                    <option value="Mock">Mock AI (Demo)</option>
                                </select>
                            </div>
                        </div>

                        <div className="col-md-6 mb-4">
                            <label className="form-label fw-bold d-flex justify-content-between">
                                Model Selection
                                <div className="d-flex align-items-center">
                                    {loadingModels && <i className="bi bi-arrow-repeat model-loader text-primary me-2"></i>}
                                    <button
                                        className="btn btn-sm btn-link p-0 text-decoration-none"
                                        onClick={() => window.location.reload()}
                                        title="Refresh models"
                                    >
                                        <i className="bi bi-arrow-clockwise"></i>
                                    </button>
                                </div>
                            </label>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0"><i className="bi bi-cpu text-primary"></i></span>
                                {provider === 'Mock' ? (
                                    <input type="text" className="form-control border-start-0" value="mock-model" disabled />
                                ) : (
                                    <select
                                        className="form-select border-start-0"
                                        value={modelName}
                                        onChange={handleModelChange}
                                        disabled={loadingModels}
                                    >
                                        {models.length > 0 ? (
                                            <>
                                                {!models.includes(modelName) && modelName && (
                                                    <option value={modelName}>{modelName} (Current)</option>
                                                )}
                                                {models.map(m => <option key={m} value={m}>{m}</option>)}
                                            </>
                                        ) : (
                                            <>
                                                {modelName ? (
                                                    <option value={modelName}>{modelName}</option>
                                                ) : (
                                                    <option value="">No models found...</option>
                                                )}
                                            </>
                                        )}
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-bold text-primary d-flex align-items-center">
                            <i className="bi bi-terminal-fill me-2"></i>
                            Custom Extraction Prompt (System Prompt)
                            {saving && <span className="small ms-auto text-muted fw-normal">Saving...</span>}
                        </label>
                        <textarea
                            className="form-control custom-prompt-area"
                            rows={8}
                            placeholder="Example: 'Extract ONLY technology names into tech_stack...'"
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            onBlur={() => saveSettings()}
                        ></textarea>
                        <div className="form-text mt-2 small text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            Use <code>{'{partial_data}'}</code> as a placeholder. Text is saved when you click outside the box.
                        </div>
                    </div>

                    <hr className="my-4" />

                    <div className="row">
                        <div className="col-md-6 mb-4">
                            <label className="form-label fw-bold">API Key (Optional)</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0"><i className="bi bi-key text-primary"></i></span>
                                <input
                                    type="password"
                                    className="form-control border-start-0"
                                    placeholder={isApiKeySet ? '•••••••••••••••• (Set)' : 'Enter API Key...'}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    onBlur={() => {
                                        if (apiKey) {
                                            saveSettings({ api_key: apiKey });
                                            setApiKey('');
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="col-md-6 mb-4">
                            <label className="form-label fw-bold">API Base URL</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0"><i className="bi bi-link-45deg text-primary"></i></span>
                                <input
                                    type="text"
                                    className="form-control border-start-0"
                                    value={apiBase}
                                    onChange={(e) => setApiBase(e.target.value)}
                                    onBlur={() => saveSettings()}
                                    placeholder="http://localhost:11434/v1"
                                    disabled={provider === 'Mock'}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mt-2">
                        <button className="btn btn-primary px-4 fw-bold" onClick={() => saveSettings()} disabled={saving}>
                            {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cloud-check me-2"></i>}
                            FORCE SAVE ALL
                        </button>
                    </div>
                </div>
            </div>

            <div className={`save-indicator ${saving || message ? 'show' : ''} shadow-lg`}>
                {saving ? (
                    <><div className="spinner-border spinner-border-sm text-primary"></div> Saving...</>
                ) : (
                    <><i className="bi bi-check-circle-fill text-success"></i> {message}</>
                )}
            </div>
        </div>
    );
};

export default LLMSettings;
