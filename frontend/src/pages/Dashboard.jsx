import { useEffect, useState } from 'react';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { Briefcase, BrainCircuit, LineChart, Loader2, TrendingUp, AlertTriangle, CheckCircle2, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Roadmap State
  const [roadmap, setRoadmap] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        // Add timestamp to strictly bypass any aggressive browser caching
        const res = await api.get(`/profile/?t=${new Date().getTime()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
      } catch (error) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    if (isLoaded && user) {
      fetchProfile();
    }
  }, [isLoaded, user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const token = await getToken();
      const res = await api.post('/roadmap/generate', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let data = res.data.roadmap;
      if (typeof data === 'object') {
        data = JSON.stringify(data, null, 2);
      }
      navigate('/roadmap', { state: { roadmap: data } });
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.detail || "Failed to generate roadmap.";
      alert(`Error: ${errMsg}\n\n(If it says RateLimitError, Google has temporarily blocked your free API key for making too many requests today)`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex justify-center items-center">
        <div className="animate-pulse flex space-x-4 text-[#8A9A86]">Loading your secure terminal...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] p-8 flex flex-col items-center mt-20">
        <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm border border-[#EAE4DB] p-10 text-center max-w-2xl w-full">
          <BrainCircuit className="w-16 h-16 text-[#8A9A86] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#33312E]" style={{ fontFamily: 'Georgia, serif' }}>Career Diagnostics Needed</h2>
          <p className="mt-2 text-[#6B6358] mb-6">You haven't initialized your profile yet. Upload your resume to start.</p>
          <Link to="/assessment" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-[#8A9A86] hover:bg-[#73826F] transition">
            Start Initialization
          </Link>
        </div>
      </div>
    );
  }

  const coreSkills = JSON.parse(profile.core_skills || "[]");
  const skillGaps = JSON.parse(profile.skill_gaps || "[]");
  const hasRoadmap = !!profile.saved_roadmap;

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#33312E] font-sans">
      {/* Top Navbar */}
      <nav className="bg-[#EAE4DB] border-b border-[#DCD3C6] px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2 text-[#8A9A86]">
          <BrainCircuit className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight text-[#33312E]">Pathfinder</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-sm font-medium text-[#73826F] border-b-2 border-[#8A9A86] pb-1">Roadmap</Link>
          <Link to="/jobs" className="text-sm font-medium text-[#5C554B] hover:text-[#73826F] transition">Job Matches</Link>
          <Link to="/profile" className="text-sm font-medium text-[#5C554B] hover:text-[#73826F] transition">Profile</Link>
          <span className="text-sm font-medium text-[#6B6358] pl-4 border-l border-[#DCD3C6]">Welcome, {user?.firstName || user?.primaryEmailAddress?.emailAddress}</span>
          <button onClick={handleLogout} className="text-sm px-4 py-2 text-[#5C554B] hover:bg-[#F7F5F2] hover:text-[#33312E] rounded-full transition">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8 mt-4 space-y-8">
        
        {/* Market Diagnostics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Role & Score */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm p-6 border border-[#EAE4DB] text-center">
              <h3 className="text-sm font-semibold text-[#6B6358] uppercase tracking-wider mb-2">Current Profile</h3>
              <p className="text-xl font-bold text-[#33312E]">{profile.current_role}</p>
              <p className="text-md text-[#6B6358]">{profile.years_of_experience} years experience</p>
              
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-[#6B6358] uppercase tracking-wider mb-4">Market Demand Score</h3>
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-[#EAE4DB]" />
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * profile.market_demand_score) / 100} className={profile.market_demand_score > 70 ? 'text-[#8A9A86]' : 'text-[#C8795A]'} />
                  </svg>
                  <span className="absolute text-3xl font-bold text-[#33312E]">{profile.market_demand_score}</span>
                </div>
                <p className="mt-2 text-xs text-[#6B6358]">Based on live job market trends</p>
              </div>
            </div>
          </div>

          {/* Right Column: Skills & Gaps */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm p-6 border border-[#EAE4DB]">
              <h3 className="text-lg font-bold text-[#33312E] flex items-center mb-4">
                <CheckCircle2 className="w-5 h-5 text-[#8A9A86] mr-2" />
                Verified Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {coreSkills.length > 0 ? coreSkills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-[#8A9A86]/10 text-[#73826F] text-sm font-medium rounded-full border border-[#8A9A86]/20">
                    {skill}
                  </span>
                )) : <span className="text-[#8C8477] italic">No skills extracted.</span>}
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm p-6 border border-[#EAE4DB]">
              <h3 className="text-lg font-bold text-[#33312E] flex items-center mb-4">
                <AlertTriangle className="w-5 h-5 text-[#C8795A] mr-2" />
                Missing Market Skills (Gaps)
              </h3>
              <p className="text-sm text-[#6B6358] mb-4">The AI analyzed live job postings for {profile.current_role}s and found you are missing these highly requested skills:</p>
              <div className="flex flex-wrap gap-2">
                {skillGaps.length > 0 ? skillGaps.map(gap => (
                  <span key={gap} className="px-3 py-1 bg-[#C8795A]/10 text-[#C8795A] text-sm font-medium rounded-full border border-[#C8795A]/20">
                    {gap}
                  </span>
                )) : <span className="text-[#8C8477] italic">No gaps identified. You're perfect!</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap Generator Section */}
        <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm p-8 border border-[#EAE4DB] mt-8 text-center">
           <h3 className="text-2xl font-bold text-[#33312E] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
             {hasRoadmap ? "Your Custom Action Plan is Ready" : "Close the Gap. Let AI Build Your Plan."}
           </h3>
           <p className="text-[#6B6358] max-w-2xl mx-auto mb-6">
             {hasRoadmap 
               ? "Jump back into your personalized learning path to start acquiring your missing market skills."
               : "Click below to spin up the Multi-Agent System. The Strategist Agent will design a custom learning path to acquire your missing skills, and the Critic Agent will review it for quality."
             }
           </p>
           <button 
             onClick={handleGenerate}
             disabled={generating}
             className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-[#1E1E1E] hover:bg-black disabled:opacity-50 transition"
           >
             {generating ? (
               <><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> Orchestrating Agents...</>
             ) : hasRoadmap ? (
               <><BookOpen className="-ml-1 mr-2 h-5 w-5" /> View Action Plan</>
             ) : (
               <><TrendingUp className="-ml-1 mr-2 h-5 w-5" /> Generate Action Plan</>
             )}
           </button>
           
        </div>

      </main>
    </div>
  );
}
