import React, { useEffect, useState } from 'react';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { 
  Briefcase, BrainCircuit, Loader2, FileText, CheckCircle, 
  ExternalLink, Edit3, Save, X, Copy, Check, MapPin, 
  DollarSign, Clock, Building2, Search, Filter, Sparkles, 
  Send, AlertCircle, BookmarkCheck, ArrowUpRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Jobs() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState('jd'); // 'jd' or 'cover_letter'
  const [isEditingLetter, setIsEditingLetter] = useState(false);
  const [editedLetter, setEditedLetter] = useState('');
  const [savingLetter, setSavingLetter] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAppliedOnly, setShowAppliedOnly] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [isLoaded, user]);

  const fetchJobs = async () => {
    if (!isLoaded || !user) return;
    try {
      const token = await getToken();
      const res = await api.get('/jobs/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(res.data);
      if (res.data.length > 0 && !selectedJob) {
        setSelectedJob(res.data[0]);
        setEditedLetter(res.data[0].tailored_cover_letter || '');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const token = await getToken();
      const res = await api.post('/jobs/scan', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchJobs();
      showToast(`🎯 Agent scanned live portals and found ${res.data.found || 'new'} tailored job matches!`);
    } catch (error) {
      console.error(error);
      alert("Failed to scan for jobs. Please complete your assessment first.");
    } finally {
      setScanning(false);
    }
  };

  const selectJobCard = (job) => {
    setSelectedJob(job);
    setEditedLetter(job.tailored_cover_letter || '');
    setIsEditingLetter(false);
    setCopied(false);
  };

  const handleSaveLetter = async () => {
    if (!selectedJob) return;
    setSavingLetter(true);
    try {
      const token = await getToken();
      await api.put(`/jobs/${selectedJob.id}/letter`, {
        tailored_cover_letter: editedLetter
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setSelectedJob(prev => ({ ...prev, tailored_cover_letter: editedLetter }));
      setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, tailored_cover_letter: editedLetter } : j));
      setIsEditingLetter(false);
      showToast("✅ Cover letter saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to save cover letter.");
    } finally {
      setSavingLetter(false);
    }
  };

  const handleCopyLetter = () => {
    if (!selectedJob) return;
    const textToCopy = isEditingLetter ? editedLetter : (selectedJob.tailored_cover_letter || '');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadLetter = () => {
    if (!selectedJob) return;
    const element = document.createElement("a");
    const file = new Blob([selectedJob.tailored_cover_letter || ''], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedJob.company.replace(/\s+/g, '_')}_Cover_Letter.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleApplyNow = async () => {
    if (!selectedJob) return;

    // 1. Copy tailored cover letter to clipboard automatically
    if (selectedJob.tailored_cover_letter) {
      navigator.clipboard.writeText(selectedJob.tailored_cover_letter);
    }

    // 2. Mark job as applied in backend
    try {
      const token = await getToken();
      const res = await api.post(`/jobs/${selectedJob.id}/apply`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const appliedTime = res.data.applied_at || 'Just now';
      setSelectedJob(prev => ({ ...prev, application_status: 'Applied', applied_at: appliedTime }));
      setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, application_status: 'Applied', applied_at: appliedTime } : j));
    } catch (e) {
      console.error("Could not update applied status:", e);
    }

    // 3. Open the actual job posting in a new window/tab
    if (selectedJob.job_url) {
      window.open(selectedJob.job_url, '_blank', 'noopener,noreferrer');
    }

    // 4. Show toast notification
    showToast(`🚀 Opening ${selectedJob.source_portal || 'Job Portal'}! Your tailored cover letter has been copied to your clipboard.`);
  };

  // Helper to parse JSON arrays safely
  const parseSkillList = (jsonStr) => {
    if (!jsonStr) return [];
    if (Array.isArray(jsonStr)) return jsonStr;
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Source Portal Styling Helper
  const getPortalBadge = (portal) => {
    const p = (portal || 'linkedin').toLowerCase();
    if (p.includes('naukri')) {
      return { name: 'Naukri.com', bg: 'bg-[#e8f0fe] text-[#004aad] border-[#c2d7f8]' };
    } else if (p.includes('internshala')) {
      return { name: 'Internshala', bg: 'bg-[#e0f7fa] text-[#00838f] border-[#b2ebf2]' };
    } else if (p.includes('wellfound')) {
      return { name: 'Wellfound', bg: 'bg-[#f5f5f5] text-[#212121] border-[#e0e0e0]' };
    }
    return { name: 'LinkedIn', bg: 'bg-[#0077b5]/10 text-[#0077b5] border-[#0077b5]/30' };
  };

  // Filtered jobs
  const filteredJobs = jobs.filter(job => {
    const matchesPlatform = filterPlatform === 'All' || (job.source_portal || '').toLowerCase() === filterPlatform.toLowerCase();
    const matchesSearch = !searchQuery || 
      (job.job_title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (job.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesApplied = !showAppliedOnly || job.application_status === 'Applied';
    return matchesPlatform && matchesSearch && matchesApplied;
  });

  const appliedCount = jobs.filter(j => j.application_status === 'Applied').length;

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#33312E] font-sans flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-[#EAE4DB] border-b border-[#DCD3C6] px-8 py-4 flex justify-between items-center shadow-sm flex-none">
        <div className="flex items-center space-x-2 text-[#8A9A86]">
          <BrainCircuit className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight text-[#33312E]">Pathfinder</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-sm font-medium text-[#5C554B] hover:text-[#73826F] transition">Roadmap</Link>
          <Link to="/interview" className="text-sm font-medium text-[#5C554B] hover:text-[#73826F] transition">Mock Interview</Link>
          <Link to="/jobs" className="text-sm font-medium text-[#73826F] border-b-2 border-[#8A9A86] pb-1">Job Matches</Link>
          <Link to="/profile" className="text-sm font-medium text-[#5C554B] hover:text-[#73826F] transition">Profile</Link>
          <span className="text-sm font-medium text-[#6B6358] pl-4 border-l border-[#DCD3C6]">
            Welcome, {user?.firstName || user?.primaryEmailAddress?.emailAddress}
          </span>
          <button onClick={handleLogout} className="text-sm px-4 py-2 text-[#5C554B] hover:bg-[#F7F5F2] hover:text-[#33312E] rounded-full transition">Logout</button>
        </div>
      </nav>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#33312E] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-sm animate-fade-in border border-white/10">
          <Sparkles className="w-4 h-4 text-[#8A9A86]" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto w-full p-6 md:p-8 flex-1 flex flex-col">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-6 border-b border-[#DCD3C6] gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl md:text-4xl font-bold text-[#33312E]" style={{ fontFamily: 'Georgia, serif' }}>
                Autonomous Job Discovery
              </h1>
              <span className="bg-[#8A9A86]/20 text-[#73826F] text-xs font-semibold px-3 py-1 rounded-full border border-[#8A9A86]/30">
                Live Market Sync
              </span>
            </div>
            <p className="text-[#6B6358] text-sm mt-1.5">
              Live job opportunities fetched across <strong>LinkedIn, Naukri, Internshala & Wellfound</strong> with AI-tailored application kits.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center px-6 py-3 bg-[#33312E] text-white font-medium rounded-full hover:bg-black shadow-sm transition disabled:opacity-50"
            >
              {scanning ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin text-[#8A9A86]" /> Scanning Live Portals...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2 text-[#8A9A86]" /> Scan Live Openings</>
              )}
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#EAE4DB] p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#8C8477] absolute left-3.5 top-3" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role, company, city..."
              className="w-full bg-[#F7F5F2] border border-[#DCD3C6] rounded-full pl-10 pr-4 py-2 text-xs text-[#33312E] focus:outline-none focus:ring-2 focus:ring-[#8A9A86]"
            />
          </div>

          {/* Platform Filters */}
          <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto scrollbar-none">
            <span className="text-xs text-[#6B6358] font-medium mr-1 flex items-center">
              <Filter className="w-3.5 h-3.5 mr-1" /> Portal:
            </span>
            {['All', 'LinkedIn', 'Naukri', 'Internshala', 'Wellfound'].map((platform) => (
              <button
                key={platform}
                onClick={() => setFilterPlatform(platform)}
                className={`text-xs px-3.5 py-1.5 rounded-full border transition whitespace-nowrap ${
                  filterPlatform === platform 
                    ? 'bg-[#33312E] text-white border-[#33312E] font-medium' 
                    : 'bg-[#F7F5F2] text-[#5C554B] border-[#DCD3C6] hover:bg-[#EAE4DB]'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>

          {/* Applied Toggle */}
          <div className="flex items-center space-x-2 self-end md:self-center">
            <button
              onClick={() => setShowAppliedOnly(!showAppliedOnly)}
              className={`text-xs px-3 py-1.5 rounded-full border transition flex items-center space-x-1.5 ${
                showAppliedOnly 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold' 
                  : 'bg-[#F7F5F2] text-[#5C554B] border-[#DCD3C6] hover:bg-[#EAE4DB]'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Applied Only ({appliedCount})</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#8A9A86]">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p className="text-sm font-medium text-[#6B6358]">Loading matched job opportunities...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-[#EAE4DB] p-16 text-center max-w-xl mx-auto my-8">
            <Briefcase className="w-16 h-16 text-[#DCD3C6] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#33312E] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              {jobs.length === 0 ? "No Live Job Matches Yet" : "No Matches Found for Filter"}
            </h2>
            <p className="text-[#6B6358] text-sm mb-6">
              {jobs.length === 0 
                ? "Click 'Scan Live Openings' to unleash our autonomous agent across LinkedIn, Naukri, and Internshala." 
                : "Try resetting your search query or platform filters to view all discovered openings."}
            </p>
            {jobs.length === 0 ? (
              <button 
                onClick={handleScan}
                disabled={scanning}
                className="inline-flex items-center px-6 py-3 bg-[#8A9A86] text-white font-medium rounded-full hover:bg-[#73826F] transition shadow-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" /> Start Scanning Now
              </button>
            ) : (
              <button 
                onClick={() => { setFilterPlatform('All'); setSearchQuery(''); setShowAppliedOnly(false); }}
                className="text-xs text-[#73826F] font-semibold underline"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          /* Split View Portal */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
            {/* Left Column: Job Cards List (5 cols) */}
            <div className="lg:col-span-5 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              <div className="text-xs text-[#6B6358] font-medium px-1 flex justify-between items-center mb-1">
                <span>Showing {filteredJobs.length} Verified Openings</span>
                <span>Sorted by Profile Match</span>
              </div>

              {filteredJobs.map((job) => {
                const badge = getPortalBadge(job.source_portal);
                const isSelected = selectedJob?.id === job.id;
                const isApplied = job.application_status === 'Applied';

                return (
                  <div
                    key={job.id}
                    onClick={() => selectJobCard(job)}
                    className={`bg-white/80 backdrop-blur-md rounded-2xl p-5 border cursor-pointer transition-all duration-200 relative ${
                      isSelected 
                        ? 'border-[#8A9A86] shadow-md ring-2 ring-[#8A9A86]/20 bg-white' 
                        : 'border-[#EAE4DB] hover:border-[#DCD3C6] hover:shadow-sm'
                    }`}
                  >
                    {/* Top Row: Portal & Match % */}
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        {isApplied && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center">
                            <Check className="w-3 h-3 mr-0.5" /> Applied
                          </span>
                        )}
                        <span className="text-xs font-bold text-[#73826F] bg-[#8A9A86]/10 px-2.5 py-0.5 rounded-full border border-[#8A9A86]/20">
                          {job.match_score} Match
                        </span>
                      </div>
                    </div>

                    {/* Job Title & Company */}
                    <h3 className="font-bold text-base text-[#33312E] leading-tight mb-1">
                      {job.job_title}
                    </h3>
                    <p className="text-xs font-semibold text-[#73826F] mb-3 flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1" />
                      {job.company}
                    </p>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-[#6B6358] mb-2.5">
                      <span className="flex items-center bg-[#F7F5F2] px-2 py-0.5 rounded-md border border-[#EAE4DB]">
                        <MapPin className="w-3 h-3 mr-1 text-[#8A9A86]" />
                        {job.location || 'Remote / Hybrid'}
                      </span>
                      <span className="flex items-center bg-[#F7F5F2] px-2 py-0.5 rounded-md border border-[#EAE4DB]">
                        <DollarSign className="w-3 h-3 mr-1 text-[#8A9A86]" />
                        {job.salary_range || 'Competitive'}
                      </span>
                      <span className="flex items-center bg-[#F7F5F2] px-2 py-0.5 rounded-md border border-[#EAE4DB]">
                        <Clock className="w-3 h-3 mr-1 text-[#8A9A86]" />
                        {job.experience_level || '0-2 yrs'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Job Detailed Inspector & Application Kit (7 cols) */}
            <div className="lg:col-span-7 flex flex-col">
              {selectedJob ? (
                <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-[#EAE4DB] overflow-hidden flex flex-col h-full max-h-[calc(100vh-280px)]">
                  {/* Top Bar of Right Panel */}
                  <div className="p-6 border-b border-[#DCD3C6] bg-gradient-to-b from-[#EAE4DB]/50 to-white flex-none">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1.5">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getPortalBadge(selectedJob.source_portal).bg}`}>
                            {getPortalBadge(selectedJob.source_portal).name} Listing
                          </span>
                          <span className="text-xs font-semibold text-[#8A9A86] bg-[#8A9A86]/10 px-2.5 py-0.5 rounded-full">
                            {selectedJob.employment_type || 'Full-time'}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-[#33312E]" style={{ fontFamily: 'Georgia, serif' }}>
                          {selectedJob.job_title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-[#5C554B] mt-2">
                          <span className="font-semibold text-sm text-[#73826F]">{selectedJob.company}</span>
                          <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-[#8A9A86]" /> {selectedJob.location}</span>
                          <span className="flex items-center"><DollarSign className="w-3.5 h-3.5 mr-1 text-[#8A9A86]" /> {selectedJob.salary_range}</span>
                        </div>
                      </div>

                      {/* Primary Apply Button */}
                      <div className="flex flex-col items-end space-y-2 flex-none">
                        <button
                          onClick={handleApplyNow}
                          className="flex items-center px-5 py-2.5 bg-[#8A9A86] hover:bg-[#73826F] text-white text-xs font-bold rounded-full shadow-sm transition transform hover:-translate-y-0.5"
                          title="Opens real job posting & copies your customized cover letter"
                        >
                          <span>Apply on {selectedJob.source_portal || 'Portal'}</span>
                          <ArrowUpRight className="w-4 h-4 ml-1.5" />
                        </button>
                        
                        {selectedJob.application_status === 'Applied' && (
                          <span className="text-[11px] text-emerald-700 font-medium flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" /> Applied {selectedJob.applied_at || ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex space-x-6 mt-6 border-b border-[#DCD3C6] -mb-6">
                      <button
                        onClick={() => setActiveTab('jd')}
                        className={`text-xs font-bold pb-3 border-b-2 transition flex items-center space-x-1.5 ${
                          activeTab === 'jd' 
                            ? 'border-[#8A9A86] text-[#33312E]' 
                            : 'border-transparent text-[#6B6358] hover:text-[#33312E]'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Job Description & Skill Match</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('cover_letter')}
                        className={`text-xs font-bold pb-3 border-b-2 transition flex items-center space-x-1.5 ${
                          activeTab === 'cover_letter' 
                            ? 'border-[#8A9A86] text-[#33312E]' 
                            : 'border-transparent text-[#6B6358] hover:text-[#33312E]'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>AI-Tailored Cover Letter</span>
                      </button>
                    </div>
                  </div>

                  {/* Body Content of Right Panel */}
                  <div className="p-6 flex-1 overflow-y-auto">
                    {activeTab === 'jd' ? (
                      /* Tab 1: Detailed Job Description & Skill Comparison */
                      <div className="space-y-6">
                        {/* Skill Match Breakdown Box */}
                        <div className="bg-[#F7F5F2] border border-[#DCD3C6] rounded-2xl p-4">
                          <h4 className="text-xs font-bold text-[#33312E] uppercase tracking-wider mb-3 flex items-center">
                            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#8A9A86]" /> Profile Compatibility Breakdown
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Matching Skills */}
                            <div>
                              <p className="text-[11px] font-semibold text-emerald-700 mb-1.5 flex items-center">
                                <Check className="w-3 h-3 mr-1" /> Your Matching Skills:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {parseSkillList(selectedJob.matching_skills).length > 0 ? (
                                  parseSkillList(selectedJob.matching_skills).map((skill, i) => (
                                    <span key={i} className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                                      ✓ {skill}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-[#8C8477] italic">React, Node.js, Python, Git</span>
                                )}
                              </div>
                            </div>

                            {/* Desirable Skills to Learn */}
                            <div>
                              <p className="text-[11px] font-semibold text-amber-700 mb-1.5 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" /> Skills in JD to Brush Up:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {parseSkillList(selectedJob.missing_skills).length > 0 ? (
                                  parseSkillList(selectedJob.missing_skills).map((skill, i) => (
                                    <span key={i} className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                                      + {skill}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-[#8C8477] italic">Docker, Unit Testing</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Full Job Description Markdown */}
                        <div className="prose prose-sm max-w-none text-[#5C554B] leading-relaxed">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h3: ({node, ...props}) => <h3 className="text-sm font-bold text-[#33312E] mt-4 mb-2 uppercase tracking-wide border-b border-[#DCD3C6] pb-1" {...props} />,
                              p: ({node, ...props}) => <p className="mb-3 text-xs leading-relaxed" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-3 space-y-1 text-xs" {...props} />,
                              li: ({node, ...props}) => <li className="text-xs leading-relaxed" {...props} />
                            }}
                          >
                            {selectedJob.job_description || "### About the Role\nNo detailed description provided by the poster."}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      /* Tab 2: AI Tailored Cover Letter with Real Edit & Copy */
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-[#DCD3C6]">
                          <div>
                            <span className="text-xs font-bold text-[#33312E]">Customized Application Pitch</span>
                            <p className="text-[11px] text-[#6B6358]">Tailored specifically for {selectedJob.company}'s requirements.</p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {isEditingLetter ? (
                              <>
                                <button
                                  onClick={handleSaveLetter}
                                  disabled={savingLetter}
                                  className="flex items-center text-xs px-3 py-1.5 bg-[#8A9A86] hover:bg-[#73826F] text-white rounded-full font-medium transition disabled:opacity-50"
                                >
                                  {savingLetter ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                                  <span>Save Changes</span>
                                </button>
                                <button
                                  onClick={() => { setIsEditingLetter(false); setEditedLetter(selectedJob.tailored_cover_letter || ''); }}
                                  className="flex items-center text-xs px-3 py-1.5 border border-[#DCD3C6] text-[#5C554B] hover:bg-[#F7F5F2] rounded-full font-medium transition"
                                >
                                  <X className="w-3.5 h-3.5 mr-1" />
                                  <span>Cancel</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setIsEditingLetter(true)}
                                  className="flex items-center text-xs px-3 py-1.5 border border-[#DCD3C6] text-[#33312E] hover:bg-[#F7F5F2] rounded-full font-medium transition shadow-sm"
                                >
                                  <Edit3 className="w-3.5 h-3.5 mr-1 text-[#8A9A86]" />
                                  <span>Edit Letter</span>
                                </button>
                                <button
                                  onClick={handleCopyLetter}
                                  className="flex items-center text-xs px-3 py-1.5 bg-[#F7F5F2] border border-[#DCD3C6] text-[#33312E] hover:bg-[#EAE4DB] rounded-full font-medium transition shadow-sm"
                                >
                                  {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1 text-[#8A9A86]" />}
                                  <span>{copied ? "Copied!" : "Copy Pitch"}</span>
                                </button>
                                <button
                                  onClick={handleDownloadLetter}
                                  className="flex items-center text-xs px-3 py-1.5 border border-[#DCD3C6] text-[#5C554B] hover:bg-[#F7F5F2] rounded-full transition"
                                  title="Download as .txt file"
                                >
                                  <span>.txt</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Editor / Markdown Box */}
                        {isEditingLetter ? (
                          <div className="space-y-2">
                            <textarea
                              value={editedLetter}
                              onChange={(e) => setEditedLetter(e.target.value)}
                              rows={14}
                              className="w-full bg-[#F7F5F2] border border-[#8A9A86] rounded-xl p-4 text-xs font-mono text-[#33312E] focus:outline-none focus:ring-2 focus:ring-[#8A9A86] leading-relaxed"
                              placeholder="Write or refine your cover letter..."
                            />
                            <p className="text-[11px] text-[#8C8477]">
                              Tip: Emphasize your key projects or academic hackathons to give your pitch an extra edge.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-[#F7F5F2] border border-[#DCD3C6] rounded-2xl p-6 text-xs text-[#33312E] leading-relaxed whitespace-pre-wrap font-sans">
                            {selectedJob.tailored_cover_letter || "No cover letter generated yet."}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Footer Bar */}
                  <div className="p-4 border-t border-[#DCD3C6] bg-[#EAE4DB]/30 flex-none flex justify-between items-center">
                    <span className="text-xs text-[#6B6358] flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-[#8A9A86]" />
                      Authentic link verified for {selectedJob.source_portal || 'Portal'}
                    </span>

                    <button
                      onClick={handleApplyNow}
                      className="flex items-center px-6 py-2 bg-[#8A9A86] hover:bg-[#73826F] text-white text-xs font-bold rounded-full shadow-sm transition"
                    >
                      <ArrowUpRight className="w-4 h-4 mr-1.5" />
                      <span>Proceed to Apply on {selectedJob.source_portal || 'Portal'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-[#EAE4DB] flex flex-col items-center justify-center h-full min-h-[400px] text-[#8C8477] p-8 text-center">
                  <Briefcase className="w-12 h-12 mb-3 text-[#DCD3C6]" />
                  <p className="font-semibold text-sm text-[#5C554B]">No Job Selected</p>
                  <p className="text-xs text-[#8C8477] mt-1">Select any job card from the list on the left to inspect full requirements and customize your application kit.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
