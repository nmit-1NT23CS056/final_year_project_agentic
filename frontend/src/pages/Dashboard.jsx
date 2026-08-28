import { useEffect, useState } from 'react';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { Briefcase, BrainCircuit, LineChart, Loader2, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
        const res = await api.get('/profile/', {
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
      alert("Failed to generate roadmap.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="animate-pulse flex space-x-4 text-indigo-500">Loading your secure terminal...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center mt-20">
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-10 text-center max-w-2xl w-full">
          <BrainCircuit className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Career Diagnostics Needed</h2>
          <p className="mt-2 text-gray-600 mb-6">You haven't initialized your profile yet. Upload your resume to start.</p>
          <Link to="/assessment" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition">
            Start Initialization
          </Link>
        </div>
      </div>
    );
  }

  const coreSkills = JSON.parse(profile.core_skills || "[]");
  const skillGaps = JSON.parse(profile.skill_gaps || "[]");

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2 text-indigo-500">
          <BrainCircuit className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight text-gray-900">Agentic Career Advisor</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 pb-1">Roadmap</Link>
          <Link to="/jobs" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition">Job Matches</Link>
          <span className="text-sm font-medium text-gray-500 pl-4 border-l border-gray-300">Welcome, {user?.firstName || user?.primaryEmailAddress?.emailAddress}</span>
          <button onClick={handleLogout} className="text-sm px-4 py-2 text-gray-700 hover:bg-indigo-500 hover:text-white rounded-md transition">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8 mt-4 space-y-8">
        
        {/* Market Diagnostics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Role & Score */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow p-6 border border-gray-200 text-center">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Profile</h3>
              <p className="text-xl font-bold text-gray-900">{profile.current_role}</p>
              <p className="text-md text-gray-500">{profile.years_of_experience} years experience</p>
              
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Market Demand Score</h3>
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-200" />
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * profile.market_demand_score) / 100} className={profile.market_demand_score > 70 ? 'text-green-500' : 'text-yellow-500'} />
                  </svg>
                  <span className="absolute text-3xl font-bold text-gray-800">{profile.market_demand_score}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">Based on live job market trends</p>
              </div>
            </div>
          </div>

          {/* Right Column: Skills & Gaps */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                Verified Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {coreSkills.length > 0 ? coreSkills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200">
                    {skill}
                  </span>
                )) : <span className="text-gray-400 italic">No skills extracted.</span>}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
                Missing Market Skills (Gaps)
              </h3>
              <p className="text-sm text-gray-600 mb-4">The AI analyzed live job postings for {profile.current_role}s and found you are missing these highly requested skills:</p>
              <div className="flex flex-wrap gap-2">
                {skillGaps.length > 0 ? skillGaps.map(gap => (
                  <span key={gap} className="px-3 py-1 bg-amber-50 text-amber-700 text-sm font-medium rounded-full border border-amber-200">
                    {gap}
                  </span>
                )) : <span className="text-gray-400 italic">No gaps identified. You're perfect!</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap Generator Section */}
        <div className="bg-white rounded-xl shadow p-8 border border-gray-200 mt-8 text-center">
           <h3 className="text-xl font-bold text-gray-900 mb-2">Close the Gap. Let AI Build Your Plan.</h3>
           <p className="text-gray-600 max-w-2xl mx-auto mb-6">
             Click below to spin up the Multi-Agent System. The Strategist Agent will design a custom learning path to acquire your missing skills, and the Critic Agent will review it for quality.
           </p>
           <button 
             onClick={handleGenerate}
             disabled={generating}
             className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition"
           >
             {generating ? <><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> Orchestrating Agents...</> : <><TrendingUp className="-ml-1 mr-2 h-5 w-5" /> Generate Action Plan</>}
           </button>
           
        </div>

      </main>
    </div>
  );
}
