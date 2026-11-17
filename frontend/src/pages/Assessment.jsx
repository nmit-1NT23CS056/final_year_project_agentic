import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api from '../lib/axios';
import { 
  Loader2, 
  FileText, 
  CheckCircle, 
  CloudUpload, 
  GraduationCap, 
  Briefcase, 
  Clock, 
  Target, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  GitBranch, 
  Award, 
  Plus, 
  X 
} from 'lucide-react';

const SUGGESTED_ROLES = [
  "Data Scientist",
  "AI / ML Engineer",
  "Full-Stack Lead",
  "Cloud Solutions Architect",
  "DevOps Engineer"
];

export default function Assessment() {
  const [step, setStep] = useState(1);
  const [resumeFile, setResumeFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Step 2 Form States
  const [persona, setPersona] = useState('student'); // 'student' | 'professional'
  const [targetRole, setTargetRole] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(15);
  const [githubLink, setGithubLink] = useState('');
  const [humanGoal, setHumanGoal] = useState('');
  
  // Courses array: [{ name: "ML Spec", progress: 100 }]
  const [courses, setCourses] = useState([
    { name: "Full-Stack Web Dev (Coursera)", progress: 100 }
  ]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseProgress, setNewCourseProgress] = useState(100);

  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0]);
    }
  };

  const handlePersonaChange = (type) => {
    setPersona(type);
    if (type === 'student') {
      setHoursPerWeek(15);
    } else {
      setHoursPerWeek(6);
    }
  };

  const addCourse = () => {
    if (!newCourseName.trim()) return;
    setCourses([...courses, { name: newCourseName.trim(), progress: Number(newCourseProgress) }]);
    setNewCourseName('');
    setNewCourseProgress(100);
  };

  const removeCourse = (index) => {
    setCourses(courses.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!resumeFile) return;

    setLoading(true);
    setLoadingStatus('Parsing resume projects & analyzing live market trends...');

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', resumeFile);
      formData.append('persona', persona);
      formData.append('target_role', targetRole);
      formData.append('available_hours_per_week', String(hoursPerWeek));
      formData.append('github_link', githubLink);
      formData.append('online_courses', JSON.stringify(courses));
      formData.append('human_goal', humanGoal);

      await api.post('/profile/parse-resume', formData, {
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'multipart/form-data' 
        }
      });

      setSuccess(true);
      setLoadingStatus('Profile & Adaptive Diagnostics Built!');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.detail || error.message;
      alert('Error analyzing profile: ' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#33312E] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-[#EAE4DB]">
        
        {/* Header & Step Tracker */}
        <div className="px-8 py-6 border-b border-[#EAE4DB] bg-[#8A9A86]/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#33312E] flex items-center" style={{ fontFamily: 'Georgia, serif' }}>
                <Sparkles className="mr-3 text-[#8A9A86] h-6 w-6" />
                Adaptive Career Onboarding
              </h2>
              <p className="mt-1 text-sm text-[#6B6358]">
                {step === 1 ? 'Step 1 of 2: Upload your resume for semantic project parsing.' : 'Step 2 of 2: Configure your target role & adaptive pacing.'}
              </p>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition ${
                step === 1 ? 'bg-[#8A9A86] text-white shadow-sm' : 'bg-[#EAE4DB] text-[#6B6358]'
              }`}>
                1
              </span>
              <div className="w-6 h-0.5 bg-[#DCD3C6]" />
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition ${
                step === 2 ? 'bg-[#8A9A86] text-white shadow-sm' : 'bg-[#EAE4DB] text-[#6B6358]'
              }`}>
                2
              </span>
            </div>
          </div>
        </div>

        {/* Wizard Step 1: Resume Upload */}
        {step === 1 && (
          <div className="p-8 space-y-6">
            <div 
              className={`relative flex flex-col items-center justify-center px-6 pt-12 pb-12 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out ${
                dragActive ? 'border-[#8A9A86] bg-[#8A9A86]/10 scale-[1.01]' : 'border-[#DCD3C6] bg-white/50 hover:bg-white/80'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-3 text-center pointer-events-none">
                {resumeFile ? (
                  <FileText className="mx-auto h-16 w-16 text-[#8A9A86]" />
                ) : (
                  <CloudUpload className="mx-auto h-16 w-16 text-[#8A9A86]/60" />
                )}
                
                <div className="flex text-lg text-[#5C554B] justify-center mt-4">
                  <label
                    htmlFor="resume"
                    className="relative cursor-pointer bg-transparent rounded-md font-bold text-[#8A9A86] hover:text-[#73826F] focus-within:outline-none pointer-events-auto transition"
                  >
                    <span>{resumeFile ? 'Change selected file' : 'Upload your resume'}</span>
                    <input 
                      id="resume" 
                      name="resume" 
                      type="file" 
                      accept=".pdf" 
                      className="sr-only" 
                      onChange={(e) => setResumeFile(e.target.files[0])} 
                    />
                  </label>
                  {!resumeFile && <p className="pl-2">or drag and drop</p>}
                </div>
                <p className="text-sm text-[#6B6358] font-medium">
                  {resumeFile ? resumeFile.name : 'PDF format (max 10MB)'}
                </p>
              </div>
            </div>

            {resumeFile && (
              <div className="flex items-center justify-between p-4 bg-[#8A9A86]/10 rounded-lg border border-[#8A9A86]/20">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-[#8A9A86]" />
                  <div>
                    <p className="text-sm font-semibold text-[#33312E]">{resumeFile.name}</p>
                    <p className="text-xs text-[#6B6358]">{(resumeFile.size / 1024).toFixed(1)} KB • Ready for analysis</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#8A9A86] flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" /> Selected
                </span>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                disabled={!resumeFile}
                onClick={() => setStep(2)}
                className="inline-flex items-center justify-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-[#8A9A86] hover:bg-[#73826F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8A9A86] disabled:opacity-40 transition"
              >
                Continue to Career Preferences
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Wizard Step 2: Adaptive Settings & Target Role */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-8 space-y-7">
            
            {/* 1. Persona Toggle */}
            <div>
              <label className="block text-sm font-bold text-[#4A443C] mb-2">
                Candidate Profile Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handlePersonaChange('student')}
                  className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition ${
                    persona === 'student'
                      ? 'border-[#8A9A86] bg-[#8A9A86]/15 shadow-sm ring-1 ring-[#8A9A86]'
                      : 'border-[#EAE4DB] bg-white hover:bg-gray-50'
                  }`}
                >
                  <GraduationCap className={`h-6 w-6 mt-0.5 ${persona === 'student' ? 'text-[#8A9A86]' : 'text-gray-400'}`} />
                  <div>
                    <h4 className="font-bold text-[#33312E]">Student / Recent Grad</h4>
                    <p className="text-xs text-[#6B6358] mt-1">
                      More flexible study bandwidth. High capacity for rapid sprint roadmaps (15–20 hrs/week).
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePersonaChange('professional')}
                  className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition ${
                    persona === 'professional'
                      ? 'border-[#8A9A86] bg-[#8A9A86]/15 shadow-sm ring-1 ring-[#8A9A86]'
                      : 'border-[#EAE4DB] bg-white hover:bg-gray-50'
                  }`}
                >
                  <Briefcase className={`h-6 w-6 mt-0.5 ${persona === 'professional' ? 'text-[#8A9A86]' : 'text-gray-400'}`} />
                  <div>
                    <h4 className="font-bold text-[#33312E]">Working Professional</h4>
                    <p className="text-xs text-[#6B6358] mt-1">
                      Employed full-time. Realistic pacing for evenings & weekends (5–8 hrs/week).
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Target Role */}
            <div>
              <label className="block text-sm font-bold text-[#4A443C] mb-1">
                Target Position / Desired Role
              </label>
              <p className="text-xs text-[#6B6358] mb-2">
                The AI will evaluate your resume projects specifically against the hiring bar of this role.
              </p>
              <div className="relative">
                <Target className="absolute left-3 top-3 h-5 w-5 text-[#8A9A86]" />
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Data Scientist, AI/ML Engineer, Full-Stack Lead..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#DCD3C6] bg-white focus:outline-none focus:ring-2 focus:ring-[#8A9A86] text-sm"
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs text-[#6B6358] self-center">Suggestions:</span>
                {SUGGESTED_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTargetRole(r)}
                    className="text-xs px-2.5 py-1 rounded-full bg-[#EAE4DB] hover:bg-[#8A9A86]/20 text-[#4A443C] transition"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Available Study Hours (Pacing Slider) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-bold text-[#4A443C] flex items-center">
                  <Clock className="h-4 w-4 mr-1.5 text-[#8A9A86]" />
                  Weekly Available Study Bandwidth
                </label>
                <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-[#8A9A86]/20 text-[#33312E]">
                  {hoursPerWeek} hrs / week
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="30"
                step="1"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="w-full accent-[#8A9A86] cursor-pointer"
              />
              <div className="flex justify-between text-xs text-[#6B6358] mt-1">
                <span>4 hrs (Light / Paced)</span>
                <span>
                  {hoursPerWeek <= 8 ? 'Evening / Weekend Mode' : hoursPerWeek <= 16 ? 'Standard Steady Progression' : 'Intensive Sprint Mode'}
                </span>
                <span>30 hrs (Accelerated)</span>
              </div>
            </div>

            {/* 4. GitHub / Project Portfolio Link */}
            <div>
              <label className="block text-sm font-bold text-[#4A443C] mb-1">
                GitHub Profile or Project Link (For Project Verification)
              </label>
              <div className="relative">
                <GitBranch className="absolute left-3 top-3 h-5 w-5 text-[#8A9A86]" />
                <input
                  type="url"
                  value={githubLink}
                  onChange={(e) => setGithubLink(e.target.value)}
                  placeholder="https://github.com/your-username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#DCD3C6] bg-white focus:outline-none focus:ring-2 focus:ring-[#8A9A86] text-sm"
                />
              </div>
            </div>

            {/* 5. Online Courses / Certifications */}
            <div>
              <label className="block text-sm font-bold text-[#4A443C] mb-1">
                Online Courses & Certifications Completed
              </label>
              <p className="text-xs text-[#6B6358] mb-2">
                Add courses (Coursera, Udemy, NPTEL) with completion % to boost your Course domain marks.
              </p>

              {/* Course list */}
              {courses.length > 0 && (
                <div className="space-y-2 mb-3">
                  {courses.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#EAE4DB]">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-[#8A9A86]" />
                        <span className="text-sm font-medium text-[#33312E]">{c.name}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#8A9A86]/20 text-[#33312E]">
                          {c.progress}%
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCourse(idx)}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Course inputs */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Course name (e.g. Deep Learning Specialization)"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#DCD3C6] bg-white focus:outline-none focus:ring-2 focus:ring-[#8A9A86]"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newCourseProgress}
                    onChange={(e) => setNewCourseProgress(e.target.value)}
                    className="w-20 px-3 py-2 text-sm rounded-lg border border-[#DCD3C6] bg-white focus:outline-none focus:ring-2 focus:ring-[#8A9A86]"
                    title="Completion Percentage"
                  />
                  <span className="text-xs font-bold text-[#6B6358]">%</span>
                  <button
                    type="button"
                    onClick={addCourse}
                    className="px-4 py-2 text-sm rounded-lg bg-[#EAE4DB] hover:bg-[#8A9A86] hover:text-white font-medium text-[#4A443C] transition flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </button>
                </div>
              </div>
            </div>

            {/* 6. Human Goal / Intent */}
            <div>
              <label className="block text-sm font-bold text-[#4A443C] mb-1">
                Specific Intent / Upcoming Deadlines (Human Context)
              </label>
              <textarea
                rows="2"
                value={humanGoal}
                onChange={(e) => setHumanGoal(e.target.value)}
                placeholder="e.g. Preparing for a Lead AI Engineer interview in 3 weeks; want to master distributed system design and Docker..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#DCD3C6] bg-white focus:outline-none focus:ring-2 focus:ring-[#8A9A86]"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-[#EAE4DB]">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="inline-flex items-center px-4 py-2.5 rounded-lg border border-[#DCD3C6] text-sm font-medium text-[#6B6358] hover:bg-white transition"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Resume
              </button>

              <button
                type="submit"
                disabled={loading || success}
                className="inline-flex items-center justify-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-[#8A9A86] hover:bg-[#73826F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8A9A86] disabled:opacity-50 transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    {loadingStatus || 'Analyzing Career Profile...'}
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="-ml-1 mr-2 h-5 w-5" />
                    Success! Redirecting...
                  </>
                ) : (
                  'Generate Adaptive Diagnostics & Roadmap'
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
