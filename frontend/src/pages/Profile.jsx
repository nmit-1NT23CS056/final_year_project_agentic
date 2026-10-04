import { useEffect, useState } from 'react';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { BrainCircuit, User, Briefcase, FileText, Settings, Loader2, Save, X } from 'lucide-react';

export default function Profile() {
  const { user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    current_role: '',
    years_of_experience: 0,
    core_skills: '',
    career_motivator: ''
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        const res = await api.get('/profile/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
        
        let skillsStr = '';
        try {
          const parsed = JSON.parse(res.data.core_skills);
          skillsStr = Array.isArray(parsed) ? parsed.join(', ') : res.data.core_skills;
        } catch(e) {
          skillsStr = res.data.core_skills || '';
        }

        setFormData({
          current_role: res.data.current_role || '',
          years_of_experience: res.data.years_of_experience || 0,
          core_skills: skillsStr,
          career_motivator: res.data.career_motivator || 'Growth'
        });
      } catch (error) {
        console.error("No profile yet", error);
      } finally {
        setLoading(false);
      }
    };
    if (isLoaded && user) fetchProfile();
  }, [isLoaded, user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      
      const skillsArray = formData.core_skills.split(',').map(s => s.trim()).filter(s => s);
      const dataToSave = {
        ...formData,
        core_skills: JSON.stringify(skillsArray)
      };

      const res = await api.put('/profile/', dataToSave, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data.profile);
      setEditing(false);
    } catch (error) {
      console.error(error);
      alert("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex justify-center items-center">
        <div className="animate-pulse flex space-x-4 text-[#5C554B]">Loading Profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#33312E] font-sans">
      {/* Top Navbar */}
      <nav className="bg-[#EAE4DB] border-b border-[#DCD3C6] px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2 text-[#8A9A86] cursor-pointer" onClick={() => navigate('/dashboard')}>
          <BrainCircuit className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight text-[#33312E]">Pathfinder</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-sm font-medium text-[#5C554B] hover:text-[#73826F] transition">Dashboard</Link>
          <Link to="/jobs" className="text-sm font-medium text-[#5C554B] hover:text-[#73826F] transition">Job Matches</Link>
          <Link to="/profile" className="text-sm font-medium text-[#73826F] border-b-2 border-[#8A9A86] pb-1">Profile</Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-8 mt-4 space-y-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#33312E]" style={{ fontFamily: 'Georgia, serif' }}>Your Profile</h1>
          <p className="text-[#6B6358] mt-2">Manage your personal information and career diagnostic data.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Personal Info (Clerk) */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm border border-[#EAE4DB] p-6">
              <div className="flex items-center space-x-4 mb-6">
                <img 
                  src={user?.imageUrl} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full border-2 border-[#8A9A86]/30 shrink-0"
                />
                <div className="overflow-hidden flex-1">
                  <h2 className="text-lg font-bold text-[#33312E] truncate">{user?.fullName || "User"}</h2>
                  <p className="text-sm text-[#6B6358] truncate" title={user?.primaryEmailAddress?.emailAddress}>
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => openUserProfile()}
                className="w-full flex items-center justify-center px-4 py-2 border border-[#DCD3C6] shadow-sm text-sm font-medium rounded-full text-[#33312E] bg-white hover:bg-[#F7F5F2] transition hover:border-[#8A9A86]/50"
              >
                <Settings className="w-4 h-4 mr-2 text-[#8A9A86]" />
                Manage Account
              </button>
            </div>

            <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm border border-[#EAE4DB] p-6">
              <h3 className="text-sm font-semibold text-[#73826F] uppercase tracking-wider mb-4 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-[#8A9A86]" />
                Resume Document
              </h3>
              <p className="text-sm text-[#6B6358] mb-4">
                Update your underlying career data by parsing a new resume.
              </p>
              <Link 
                to="/assessment"
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-full text-white bg-[#8A9A86] hover:bg-[#73826F] transition"
              >
                Upload New Resume
              </Link>
            </div>
          </div>

          {/* Career Profile */}
          <div className="md:col-span-2">
            <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm border border-[#EAE4DB] p-6 relative">
              <div className="flex justify-between items-center mb-6 border-b border-[#DCD3C6] pb-4">
                <h2 className="text-xl font-bold text-[#33312E] flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-[#8A9A86]" />
                  Career Diagnostics
                </h2>
                {!editing ? (
                  <button 
                    onClick={() => setEditing(true)}
                    className="text-sm text-[#8A9A86] hover:text-[#73826F] font-medium transition-colors"
                  >
                    Edit Details
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        current_role: profile?.current_role || '',
                        years_of_experience: profile?.years_of_experience || 0,
                        core_skills: JSON.parse(profile?.core_skills || '[]').join(', '),
                        career_motivator: profile?.career_motivator || 'Growth'
                      });
                    }}
                    className="text-sm text-[#6B6358] hover:text-[#33312E] font-medium flex items-center transition-colors"
                  >
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </button>
                )}
              </div>

              {!profile && !editing ? (
                <div className="text-center py-8">
                  <p className="text-[#6B6358] mb-4">No career data found. Please complete the assessment.</p>
                  <Link to="/assessment" className="text-[#8A9A86] font-medium hover:text-[#73826F] transition-colors">Start Assessment →</Link>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Role & Experience */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#6B6358] mb-1">Current Role</label>
                      {editing ? (
                        <input 
                          type="text"
                          value={formData.current_role}
                          onChange={(e) => setFormData({...formData, current_role: e.target.value})}
                          className="w-full border border-[#DCD3C6] rounded-md p-2 text-sm focus:ring-[#8A9A86] focus:border-[#8A9A86] bg-white/50 outline-none transition-colors"
                        />
                      ) : (
                        <p className="text-[#33312E] font-medium">{profile.current_role || 'Not specified'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#6B6358] mb-1">Years of Experience</label>
                      {editing ? (
                        <input 
                          type="number"
                          value={formData.years_of_experience}
                          onChange={(e) => setFormData({...formData, years_of_experience: parseInt(e.target.value) || 0})}
                          className="w-full border border-[#DCD3C6] rounded-md p-2 text-sm focus:ring-[#8A9A86] focus:border-[#8A9A86] bg-white/50 outline-none transition-colors"
                        />
                      ) : (
                        <p className="text-[#33312E] font-medium">{profile.years_of_experience} years</p>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-[#6B6358] mb-1">Verified Core Skills</label>
                    {editing ? (
                      <div>
                        <textarea 
                          value={formData.core_skills}
                          onChange={(e) => setFormData({...formData, core_skills: e.target.value})}
                          className="w-full border border-[#DCD3C6] rounded-md p-2 text-sm focus:ring-[#8A9A86] focus:border-[#8A9A86] bg-white/50 outline-none transition-colors"
                          rows="3"
                          placeholder="React, Python, AWS, Docker..."
                        />
                        <p className="text-xs text-[#8C8477] mt-1">Separate skills with commas.</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {JSON.parse(profile.core_skills || '[]').map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-[#8A9A86]/10 text-[#73826F] text-sm font-medium rounded-full border border-[#8A9A86]/20">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Motivator */}
                  <div>
                    <label className="block text-sm font-medium text-[#6B6358] mb-1">Primary Career Motivator</label>
                    {editing ? (
                      <select
                        value={formData.career_motivator}
                        onChange={(e) => setFormData({...formData, career_motivator: e.target.value})}
                        className="w-full border border-[#DCD3C6] rounded-md p-2 text-sm focus:ring-[#8A9A86] focus:border-[#8A9A86] bg-white/50 outline-none transition-colors"
                      >
                        <option value="Growth">Growth & Learning</option>
                        <option value="Compensation">Compensation</option>
                        <option value="Impact">Social Impact</option>
                        <option value="Work-Life Balance">Work-Life Balance</option>
                        <option value="Leadership">Leadership & Management</option>
                      </select>
                    ) : (
                      <p className="text-[#33312E] font-medium">{profile.career_motivator || 'Not specified'}</p>
                    )}
                  </div>

                  {editing && (
                    <div className="pt-4 border-t border-[#DCD3C6] flex justify-end">
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center px-6 py-2 bg-[#8A9A86] hover:bg-[#73826F] text-white text-sm font-medium rounded-full shadow-sm transition disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
