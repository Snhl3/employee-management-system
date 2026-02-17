import React, { useEffect, useState, useRef } from 'react';
import { fetchMyProfile, updateMyProfile, autofillProfile, generateProfileSummary, parseResume, fetchEmployeeById, updateEmployee, fetchAuthMe, createEmployee, generateSearchPhrase } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';
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
    const { empId } = useParams<{ empId?: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
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
        const loadInitialData = async () => {
            try {
                const user = await fetchAuthMe();
                setCurrentUser(user);

                let data;
                if (empId) {
                    data = await fetchEmployeeById(empId);
                } else {
                    data = await fetchMyProfile();
                }

                // Ensure tech is always an array
                if (!data.tech || !Array.isArray(data.tech)) {
                    data.tech = [];
                }
                if (!data.work_history) data.work_history = [];
                if (!data.education) data.education = [];
                setProfile(data);
            } catch (error) {
                console.error('Failed to load profile', error);
                setMessage('Failed to load profile. It may not exist.');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [empId]);

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

    const handleSave = async (dataToSave?: ProfileData, e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const profileToSave = dataToSave || profile;
        if (!profileToSave) return;

        setSaving(true);
        try {
            // Sanitize data before sending
            const sanitizedProfile = {
                ...profileToSave,
                work_history: profileToSave.work_history.map(h => ({
                    ...h,
                    start_date: h.start_date || null,
                    end_date: h.end_date || null
                })),
                education: profileToSave.education.map(edu => ({
                    ...edu,
                    graduation_year: edu.graduation_year || null
                }))
            };
            if (empId) {
                await updateEmployee(empId, sanitizedProfile);
            } else {
                await updateMyProfile(sanitizedProfile);
            }
            setMessage('Profile saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error: any) {
            console.error('Save failed:', error);
            setMessage(error.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleCreate = async () => {
        if (!currentUser) return;
        setSaving(true);
        try {
            const newProfileData: ProfileData = {
                emp_id: `EMP${Math.floor(Math.random() * 10000)}`,
                name: currentUser.name || 'New Profile',
                email: currentUser.email,
                phone: '',
                location: '',
                tech: [],
                level: 1,
                experience_years: 0,
                work_mode: 'OFFICE',
                status: 'ON_BENCH',
                bandwidth: 100,
                career_summary: '',
                search_phrase: '',
                work_history: [],
                education: []
            };
            const newProfile = await createEmployee(newProfileData);
            setProfile(newProfile);
            setMessage('Profile created successfully! You can now edit it.');
        } catch (error: any) {
            console.error('Create failed:', error);
            setMessage(error.message || 'Failed to create profile.');
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

            // Send current profile and pasted text to backend for strict merging
            const response = await autofillProfile({
                current_profile: profile,
                pasted_text: textToParse
            });

            // Validate response structure
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid AI response');
            }

            // Backend already handled the merge correctly
            setAiGeneratedData(response);
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
            // Hard Guard: Save immediately to database
            handleSave(aiGeneratedData);
            setMessage('AI data confirmed and saved to database!');
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

    const handleGenerateSearchPhrase = async () => {
        if (!profile) return;
        setAutofilling(true);
        try {
            const result = await generateSearchPhrase(profile);
            setProfile({ ...profile, search_phrase: result.search_phrase });
            setMessage('Search phrase generated!');
            setTimeout(() => setMessage(''), 5000);
        } catch (error) {
            setMessage('Failed to generate search phrase.');
        } finally {
            setAutofilling(false);
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"></div></div>;

    if (!profile) return (
        <div className="container mt-5 text-center">
            <div className="card shadow-sm border-0 py-5">
                <div className="card-body">
                    <i className="bi bi-person-x fs-1 mb-3 d-block text-muted"></i>
                    <h4 className="fw-bold">No Profile Found</h4>
                    <p className="text-muted mb-4">This user does not have an employee profile yet.</p>
                    {(!empId || currentUser?.role === 'ADMIN') && (
                        <button className="btn btn-primary px-4 fw-bold" onClick={handleCreate} disabled={saving}>
                            {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-person-plus-fill me-2"></i>}
                            Create Employee Profile
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

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
                    <div className="d-flex align-items-center mt-1">
                        <span className="text-muted fs-5 me-2">Employee ID:</span>
                        <input
                            type="text"
                            name="emp_id"
                            className="form-control form-control-sm fw-bold border-primary shadow-sm"
                            style={{ width: '150px' }}
                            value={profile.emp_id}
                            onChange={handleChange}
                        />
                    </div>
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
                            </div>
                            <textarea name="career_summary" className="form-control mb-4" rows={4} value={profile.career_summary} onChange={handleChange} placeholder="Professional summary..."></textarea>

                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h5 className="card-title fw-bold text-uppercase text-secondary small ls-1 mb-0">Search Phrase</h5>
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={handleGenerateSearchPhrase}
                                    disabled={autofilling}
                                >
                                    {autofilling ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-magic me-1"></i>}
                                    Generate
                                </button>
                            </div>
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
