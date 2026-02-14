import React, { useEffect, useState, useCallback } from 'react';
import { fetchLLMSettings, updateLLMSettings, fetchLLMModels } from '../services/api';
import './LLMSettings.css';

const LLMSettings = () => {
    const [provider, setProvider] = useState('Ollama');
    const [modelName, setModelName] = useState('llama3');
    const [apiBase, setApiBase] = useState('http://localhost:11434/v1');
    const [apiKey, setApiKey] = useState('');
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
                setProvider(data.provider);
                setModelName(data.model_name);
                setApiBase(data.api_base);
                setIsApiKeySet(data.is_api_key_set);
            } catch (error) {
                console.error('Failed to load settings');
            } finally {
                setInitialLoading(false);
            }
        };
        load();
    }, []);

    // Fetch models when provider or apiBase changes
    useEffect(() => {
        if (initialLoading) return;

        const loadModels = async () => {
            setLoadingModels(true);
            try {
                const list = await fetchLLMModels(provider);
                setModels(list || []);
            } catch (error) {
                console.error('Failed to load models');
                setModels([]);
            } finally {
                setLoadingModels(false);
            }
        };

        const timeout = setTimeout(loadModels, provider === 'Ollama' ? 500 : 0);
        return () => clearTimeout(timeout);
    }, [provider, apiBase, initialLoading]);

    // Auto-save logic
    const triggerSave = useCallback(async (updates: any) => {
        setSaving(true);
        try {
            const data = await updateLLMSettings({
                provider: updates.provider || provider,
                model_name: updates.model_name || modelName,
                api_base: updates.api_base || apiBase,
                api_key: updates.api_key || undefined
            });
            setIsApiKeySet(data.is_api_key_set);
            setMessage('Settings auto-saved');
            setTimeout(() => setMessage(''), 2000);
        } catch (error) {
            console.error('Auto-save failed', error);
        } finally {
            setSaving(false);
        }
    }, [provider, modelName, apiBase]);

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const p = e.target.value;
        setProvider(p);
        triggerSave({ provider: p });
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const m = e.target.value;
        setModelName(m);
        triggerSave({ model_name: m });
    };

    const handleApiBaseBlur = () => {
        triggerSave({ api_base: apiBase });
    };

    const handleApiKeyBlur = () => {
        if (apiKey) {
            triggerSave({ api_key: apiKey });
            setApiKey(''); // Clear after save (it's masked on server)
        }
    };

    if (initialLoading) {
        return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;
    }

    return (
        <div className="llm-settings pb-5">
            <header className="page-header mb-4">
                <h1 className="display-5 fw-bold text-dark">AI Settings</h1>
                <p className="lead text-muted">Intelligent system configuration with auto-save.</p>
            </header>

            <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
                <div className="card-body p-4">
                    <div className="mb-4">
                        <label className="form-label fw-bold">AI Provider</label>
                        <div className="input-group input-group-lg">
                            <span className="input-group-text bg-white border-end-0"><i className="bi bi-robot text-primary"></i></span>
                            <select
                                className="form-select border-start-0"
                                value={provider}
                                onChange={handleProviderChange}
                            >
                                <option value="OpenAI">OpenAI (Cloud)</option>
                                <option value="Ollama">Ollama (Local / Free)</option>
                                <option value="Mock">Mock AI (Demo)</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-bold d-flex justify-content-between">
                            Model Selection
                            {loadingModels && <i className="bi bi-arrow-repeat model-loader text-primary"></i>}
                        </label>
                        <div className="input-group input-group-lg">
                            <span className="input-group-text bg-white border-end-0"><i className="bi bi-cpu text-primary"></i></span>
                            {provider === 'Mock' ? (
                                <input type="text" className="form-control border-start-0" value="mock-model" disabled />
                            ) : (
                                <select
                                    className="form-select border-start-0"
                                    value={modelName}
                                    onChange={handleModelChange}
                                    disabled={loadingModels || models.length === 0}
                                >
                                    {models.length > 0 ? (
                                        models.map(m => <option key={m} value={m}>{m}</option>)
                                    ) : (
                                        <option value="">No models found...</option>
                                    )}
                                </select>
                            )}
                        </div>
                        <div className="form-text">
                            {provider === 'Ollama' && 'Make sure Ollama is running locally.'}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-bold">API Key (Optional)</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0"><i className="bi bi-key text-primary"></i></span>
                            <input
                                type="password"
                                className="form-control border-start-0"
                                placeholder={isApiKeySet ? '•••••••••••••••• (Set)' : 'Enter API Key...'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                onBlur={handleApiKeyBlur}
                            />
                        </div>
                        <div className="form-text">Keys are stored securely. Leave blank to use environment default.</div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-bold">API Base URL</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0"><i className="bi bi-link-45deg text-primary"></i></span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                value={apiBase}
                                onChange={(e) => setApiBase(e.target.value)}
                                onBlur={handleApiBaseBlur}
                                placeholder="http://localhost:11434/v1"
                                disabled={provider === 'Mock'}
                            />
                        </div>
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
