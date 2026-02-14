import React, { useEffect, useState, useRef } from 'react';
import { fetchMyProfile, updateMyProfile, autofillProfile, generateProfileSummary, parseResume } from '../services/api';
import './MyProfile.css';

interface TechExperience {
    tech: string;
    experience_years: number;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

interface WorkHistory {
    company: string;
    role: string;
    start_date: string;
    end_date: string | null;
    project?: string;
    description: string;
}

interface Education {
    institution: string;
    degree: string;
    field_of_study: string;
    graduation_year?: number;
}

interface ProfileData {
    id?: number;
    emp_id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    tech: TechExperience[];  // Structured tech array
    level: number;
    experience_years: number;
    work_mode: 'REMOTE' | 'OFFICE' | 'HYBRID';
    status: 'ON_BENCH' | 'ON_CLIENT';
    bandwidth: number;
    career_summary: string;
    search_phrase: string;
    work_history: WorkHistory[];
    education: Education[];
}

const MyProfile = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [autofilling, setAutofilling] = useState(false);
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [message, setMessage] = useState('');
    const [showAIPreview, setShowAIPreview] = useState(false);
    const [aiGeneratedData, setAiGeneratedData] = useState<ProfileData | null>(null);
    const [showParseModal, setShowParseModal] = useState(false);
    const [parseText, setParseText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [parsingResume, setParsingResume] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await fetchMyProfile();
                // Ensure tech is always an array
                if (!data.tech || !Array.isArray(data.tech)) {
                    data.tech = [];
                }
                // Ensure work_history and education are arrays
                if (!data.work_history) data.work_history = [];
                if (!data.education) data.education = [];
                setProfile(data);
            } catch (error) {
                console.error('Failed to load profile', error);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (profile) {
            setProfile({ ...profile, [name]: value });
        }
    };

    // --- Work History Handlers ---
    const handleWorkHistoryChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!profile) return;
        const newHistory = [...profile.work_history];
        newHistory[index] = { ...newHistory[index], [e.target.name]: e.target.value };
        setProfile({ ...profile, work_history: newHistory });
    };

    const addWorkHistory = () => {
        if (!profile) return;
        setProfile({
            ...profile,
            work_history: [...profile.work_history, { company: '', role: '', start_date: '', end_date: null, project: '', description: '' }]
        });
    };

    const removeWorkHistory = (index: number) => {
        if (!profile) return;
        const newHistory = profile.work_history.filter((_, i) => i !== index);
        setProfile({ ...profile, work_history: newHistory });
    };

    // --- Education Handlers ---
    const handleEducationChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!profile) return;
        const newEducation = [...profile.education];
        newEducation[index] = { ...newEducation[index], [e.target.name]: e.target.value };
        setProfile({ ...profile, education: newEducation });
    };

    const addEducation = () => {
        if (!profile) return;
        setProfile({
            ...profile,
            education: [...profile.education, { institution: '', degree: '', field_of_study: '', graduation_year: new Date().getFullYear() }]
        });
    };

    const removeEducation = (index: number) => {
        if (!profile) return;
        const newEducation = profile.education.filter((_, i) => i !== index);
        setProfile({ ...profile, education: newEducation });
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!profile) return;
        setSaving(true);
        try {
            // Sanitize data before sending
            const sanitizedProfile = {
                ...profile,
                work_history: profile.work_history.map(h => ({
                    ...h,
                    start_date: h.start_date || null,
                    end_date: h.end_date || null
                })),
                education: profile.education.map(edu => ({
                    ...edu,
                    graduation_year: edu.graduation_year || null
                }))
            };
            await updateMyProfile(sanitizedProfile);
            setMessage('Profile saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error: any) {
            console.error('Save failed:', error);
            setMessage(error.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Max 10MB
        if (file.size > 10 * 1024 * 1024) {
            setMessage('File is too large (max 10MB).');
            return;
        }

        setParsingResume(true);
        try {
            const data = await parseResume(file);
            setParseText(data.text);
            setShowParseModal(true);
            setMessage('Resume parsed successfully! Review text below.');
            setTimeout(() => setMessage(''), 5000);
        } catch (error: any) {
            setMessage(`Upload/Parse failed: ${error.message}`);
        } finally {
            setParsingResume(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAIAutofill = async () => {
        if (!profile) return;
        setAutofilling(true);
        try {
            const textToParse = parseText.trim() || profile.career_summary || "Please generate a sample profile.";

            const response = await autofillProfile({
                name: profile.name,
                career_summary: textToParse
            });

            // Validate response structure
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid AI response');
            }

            // Show preview modal instead of directly applying
            setAiGeneratedData({ ...profile, ...response });
            setShowAIPreview(true);
            setShowParseModal(false); // Close the input modal
            setParseText(''); // Clear text
            setMessage('');
        } catch (error) {
            console.error('AI autofill error:', error);
            setMessage('AI failed to parse text. Please check LLM settings or try again.');
        } finally {
            setAutofilling(false);
        }
    };

    const handleConfirmAIData = () => {
        if (aiGeneratedData) {
            setProfile(aiGeneratedData);
            setShowAIPreview(false);
            setMessage('AI data applied! Review and save.');
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const handleCancelAIData = () => {
        setShowAIPreview(false);
        setAiGeneratedData(null);
    };

    const handleGenerateSummary = async () => {
        if (!profile) return;
        setGeneratingSummary(true);
        try {
            const result = await generateProfileSummary();
            setProfile({ ...profile, career_summary: result.summary });
            setMessage('Summary generated! Review and save.');
            setTimeout(() => setMessage(''), 5000);
        } catch (error) {
            setMessage('Failed to generate summary.');
        } finally {
            setGeneratingSummary(false);
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"></div></div>;
    if (!profile) return <div className="alert alert-danger">Failed to load profile.</div>;

    return (
        <div className="container-fluid py-4">
            {/* AI CONFIRMATION MODAL */}
            {showAIPreview && aiGeneratedData && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="modal-dialog modal-xl modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title"><i className="bi bi-magic me-2"></i>AI Generated Profile Preview</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={handleCancelAIData}></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Review the AI-generated data below. Click "Confirm & Apply" to populate your profile, or "Cancel" to discard.
                                </div>

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">Name</label>
                                        <input type="text" className="form-control" value={aiGeneratedData.name}
                                            onChange={(e) => setAiGeneratedData({ ...aiGeneratedData, name: e.target.value })} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">Email</label>
                                        <input type="email" className="form-control" value={aiGeneratedData.email} disabled />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">Phone</label>
                                        <input type="text" className="form-control" value={aiGeneratedData.phone}
                                            onChange={(e) => setAiGeneratedData({ ...aiGeneratedData, phone: e.target.value })} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">Location</label>
                                        <input type="text" className="form-control" value={aiGeneratedData.location}
                                            onChange={(e) => setAiGeneratedData({ ...aiGeneratedData, location: e.target.value })} />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label small fw-bold">Primary Technologies</label>
                                        <div className="mt-2">
                                            {aiGeneratedData.tech && aiGeneratedData.tech.map((t, idx) => (
                                                <div key={idx} className="badge bg-secondary me-2 mb-2 p-2 d-inline-flex align-items-center">
                                                    {t.tech} ({t.experience_years}y)
                                                    <button type="button" className="btn-close btn-close-white ms-2" style={{ fontSize: '0.5rem' }}
                                                        onClick={() => {
                                                            const newTech = aiGeneratedData.tech.filter((_, i) => i !== idx);
                                                            setAiGeneratedData({ ...aiGeneratedData, tech: newTech });
                                                        }}></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label small fw-bold">Career Summary</label>
                                        <textarea className="form-control" rows={5} value={aiGeneratedData.career_summary}
                                            onChange={(e) => setAiGeneratedData({ ...aiGeneratedData, career_summary: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleCancelAIData}>
                                    <i className="bi bi-x-circle me-2"></i>Cancel
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleConfirmAIData}>
                                    <i className="bi bi-check-circle me-2"></i>Confirm & Apply to Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 1. TOP HEADER SECTION */}
            <header className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <div>
                    <h1 className="fw-bold text-uppercase mb-0 display-6">{profile.name}</h1>
                    <span className="text-muted fs-5">ID: <strong className="text-dark">{profile.emp_id}</strong></span>
                </div>
                <div className="d-flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="d-none"
                        accept=".pdf,.docx"
                        onChange={handleFileUpload}
                    />
                    <button
                        type="button"
                        className="btn btn-outline-secondary d-flex align-items-center"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={parsingResume || autofilling}
                    >
                        {parsingResume ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-file-earmark-arrow-up me-2"></i>}
                        Upload Resume (PDF/DOCX)
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-primary d-flex align-items-center"
                        onClick={() => setShowParseModal(true)}
                        disabled={autofilling || parsingResume}
                    >
                        {autofilling ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-magic me-2"></i>}
                        Paste Text
                    </button>
                    <button type="button" className="btn btn-success fw-bold px-4" onClick={() => handleSave()} disabled={saving}>
                        {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
                        SAVE
                    </button>
                </div>
            </header>

            {/* Parse Resume Modal */}
            {showParseModal && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Parse Resume or Profile Text</h5>
                                <button type="button" className="btn-close" onClick={() => setShowParseModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted small">Paste your resume, LinkedIn bio, or any raw text description below. The AI will extract structured data to fill your profile.</p>
                                <textarea
                                    className="form-control"
                                    rows={10}
                                    value={parseText}
                                    onChange={(e) => setParseText(e.target.value)}
                                    placeholder="Paste text here..."
                                ></textarea>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowParseModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleAIAutofill} disabled={autofilling || !parseText.trim()}>
                                    {autofilling ? 'Parsing...' : 'Analyze & Fill'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {message && (
                <div className={`alert ${message.includes('successfully') || message.includes('generated') ? 'alert-success' : 'alert-danger'} border-0 shadow-sm text-center mb-4`}>
                    {message}
                </div>
            )}

            <div className="row g-4">
                {/* 2. LEFT COLUMN – IDENTITY SYSTEM */}
                <div className="col-lg-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                            <h5 className="card-title fw-bold text-uppercase text-secondary small ls-1">Identity System</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label text-muted small">Email Address</label>
                                <input type="email" className="form-control" value={profile.email} readOnly disabled />
                            </div>
                            <div className="mb-3">
                                <label className="form-label text-muted small">Phone</label>
                                <input type="text" name="phone" className="form-control" value={profile.phone} onChange={handleChange} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label text-muted small">Location</label>
                                <input type="text" name="location" className="form-control" value={profile.location} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. RIGHT COLUMN – SKILL & LEVEL SUMMARY */}
                <div className="col-lg-8">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                            <h5 className="card-title fw-bold text-uppercase text-secondary small ls-1 mb-0">Primary Technologies</h5>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => {
                                    if (profile) {
                                        setProfile({
                                            ...profile,
                                            tech: [...(profile.tech || []), { tech: '', experience_years: 0, level: 'Beginner' }]
                                        });
                                    }
                                }}
                            >
                                <i className="bi bi-plus-lg"></i> Add Technology
                            </button>
                        </div>
                        <div className="card-body">
                            {profile.tech && profile.tech.length > 0 ? (
                                profile.tech.map((techItem, idx) => (
                                    <div key={idx} className="border rounded p-3 mb-3 bg-light position-relative">
                                        <button
                                            type="button"
                                            className="btn-close position-absolute top-0 end-0 m-2"
                                            onClick={() => {
                                                const newTech = profile.tech.filter((_, i) => i !== idx);
                                                setProfile({ ...profile, tech: newTech });
                                            }}
                                        ></button>
                                        <div className="row g-3">
                                            <div className="col-md-5">
                                                <label className="form-label small text-muted">Technology Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={techItem.tech}
                                                    onChange={(e) => {
                                                        const newTech = [...profile.tech];
                                                        newTech[idx] = { ...newTech[idx], tech: e.target.value };
                                                        setProfile({ ...profile, tech: newTech });
                                                    }}
                                                    placeholder="e.g. Python, React"
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label small text-muted">Experience (Years)</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    step="0.5"
                                                    min="0"
                                                    value={techItem.experience_years}
                                                    onChange={(e) => {
                                                        const newTech = [...profile.tech];
                                                        newTech[idx] = { ...newTech[idx], experience_years: parseFloat(e.target.value) || 0 };
                                                        setProfile({ ...profile, tech: newTech });
                                                    }}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small text-muted">Proficiency Level</label>
                                                <select
                                                    className="form-select"
                                                    value={techItem.level}
                                                    onChange={(e) => {
                                                        const newTech = [...profile.tech];
                                                        newTech[idx] = { ...newTech[idx], level: e.target.value as any };
                                                        setProfile({ ...profile, tech: newTech });
                                                    }}
                                                >
                                                    <option value="Beginner">Beginner</option>
                                                    <option value="Intermediate">Intermediate</option>
                                                    <option value="Advanced">Advanced</option>
                                                    <option value="Expert">Expert</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted text-center py-3">No technologies added. Click "Add Technology" to begin.</p>
                            )}

                            <div className="col-12 mt-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="form-label text-muted small mb-0">Overall Level (1-10)</label>
                                    <span className="badge bg-primary rounded-pill">
                                        {profile.level <= 3 ? 'Junior' : profile.level <= 6 ? 'Mid-Level' : profile.level <= 8 ? 'Senior' : 'Architect/Lead'} ({profile.level})
                                    </span>
                                </div>
                                <input type="range" name="level" className="form-range" min="1" max="10" step="1" value={profile.level} onChange={handleChange} />
                                <div className="d-flex justify-content-between text-muted x-small">
                                    <span>Junior</span>
                                    <span>Mid</span>
                                    <span>Senior</span>
                                    <span>Lead</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. STATUS & AVAILABILITY SECTION */}
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                            <h5 className="card-title fw-bold text-uppercase text-secondary small ls-1">Status & Availability</h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <label className="form-label text-muted small">Current Status</label>
                                    <select name="status" className="form-select" value={profile.status} onChange={handleChange}>
                                        <option value="ON_BENCH">ON_BENCH</option>
                                        <option value="ON_CLIENT">ON_CLIENT</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label text-muted small">Work Mode</label>
                                    <select name="work_mode" className="form-select" value={profile.work_mode} onChange={handleChange}>
                                        <option value="REMOTE">REMOTE</option>
                                        <option value="OFFICE">OFFICE</option>
                                        <option value="HYBRID">HYBRID</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label text-muted small">Experience (Years)</label>
                                    <input type="number" name="experience_years" className="form-control" step="0.5" value={profile.experience_years} onChange={handleChange} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label text-muted small">Bandwidth ({profile.bandwidth}%)</label>
                                    <input type="range" name="bandwidth" className="form-range" min="0" max="100" step="5" value={profile.bandwidth} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 7. CAREER SUMMARY & 8. SEARCH PHRASE */}
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h5 className="card-title fw-bold text-uppercase text-secondary small ls-1 mb-0">Career Summary</h5>
                                <button type="button" className="btn btn-link text-decoration-none btn-sm p-0" onClick={handleGenerateSummary} disabled={generatingSummary}>
                                    {generatingSummary ? 'Generating...' : '✨ Auto-generate'}
                                </button>
                            </div>
                            <textarea name="career_summary" className="form-control mb-4" rows={4} value={profile.career_summary} onChange={handleChange} placeholder="Professional summary..."></textarea>

                            <h5 className="card-title fw-bold text-uppercase text-secondary small ls-1 mb-2">Search Phrase</h5>
                            <input type="text" name="search_phrase" className="form-control" value={profile.search_phrase} onChange={handleChange} placeholder="Short searchable summary..." />
                        </div>
                    </div>
                </div>

                {/* 4. WORK HISTORY SECTION */}
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                            <h5 className="card-title fw-bold text-uppercase text-secondary small ls-1 mb-0">Work History</h5>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addWorkHistory}><i className="bi bi-plus-lg"></i> Add Role</button>
                        </div>
                        <div className="card-body">
                            {profile.work_history.map((work, index) => (
                                <div key={index} className="border rounded p-3 mb-3 bg-light position-relative">
                                    <button type="button" className="btn-close position-absolute top-0 end-0 m-2" aria-label="Remove" onClick={() => removeWorkHistory(index)}></button>
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className="form-label small text-muted">Company</label>
                                            <input type="text" name="company" className="form-control form-control-sm fw-bold" value={work.company} onChange={(e) => handleWorkHistoryChange(index, e)} />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small text-muted">Role</label>
                                            <input type="text" name="role" className="form-control form-control-sm" value={work.role} onChange={(e) => handleWorkHistoryChange(index, e)} />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small text-muted">Project</label>
                                            <input type="text" name="project" className="form-control form-control-sm" value={work.project || ''} onChange={(e) => handleWorkHistoryChange(index, e)} placeholder="Project Name" />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small text-muted">Start Date</label>
                                            <input type="date" name="start_date" className="form-control form-control-sm" value={work.start_date} onChange={(e) => handleWorkHistoryChange(index, e)} />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small text-muted">End Date</label>
                                            <input type="date" name="end_date" className="form-control form-control-sm" value={work.end_date || ''} onChange={(e) => handleWorkHistoryChange(index, e)} />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label small text-muted">Description</label>
                                            <textarea name="description" className="form-control form-control-sm" rows={2} value={work.description} onChange={(e) => handleWorkHistoryChange(index, e)}></textarea>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {profile.work_history.length === 0 && <p className="text-muted text-center py-3">No work history added.</p>}
                        </div>
                    </div>
                </div>

                {/* 5. EDUCATION SECTION */}
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                            <h5 className="card-title fw-bold text-uppercase text-secondary small ls-1 mb-0">Education</h5>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addEducation}><i className="bi bi-plus-lg"></i> Add Education</button>
                        </div>
                        <div className="card-body">
                            {profile.education.map((edu, index) => (
                                <div key={index} className="border rounded p-3 mb-3 bg-light position-relative">
                                    <button type="button" className="btn-close position-absolute top-0 end-0 m-2" aria-label="Remove" onClick={() => removeEducation(index)}></button>
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className="form-label small text-muted">Institution</label>
                                            <input type="text" name="institution" className="form-control form-control-sm fw-bold" value={edu.institution} onChange={(e) => handleEducationChange(index, e)} />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small text-muted">Degree</label>
                                            <input type="text" name="degree" className="form-control form-control-sm" value={edu.degree} onChange={(e) => handleEducationChange(index, e)} />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label small text-muted">Field of Study</label>
                                            <input type="text" name="field_of_study" className="form-control form-control-sm" value={edu.field_of_study} onChange={(e) => handleEducationChange(index, e)} />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label small text-muted">Year</label>
                                            <input type="number" name="graduation_year" className="form-control form-control-sm" value={edu.graduation_year || ''} onChange={(e) => handleEducationChange(index, e)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {profile.education.length === 0 && <p className="text-muted text-center py-3">No education added.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;
