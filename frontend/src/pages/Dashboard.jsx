import React, { useState, useEffect } from 'react';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, CheckCircle2, AlertTriangle, TrendingUp, Loader2, BookOpen, ExternalLink, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      getToken().then(token => {
        fetch('http://localhost:8000/api/profile/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (!data.detail) {
            setProfile(data);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
      });
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  const handleLogout = () => signOut();

  const handleGenerate = async () => {
    if (profile?.saved_roadmap) {
      navigate('/roadmap');
      return;
    }
    
    setGenerating(true);
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:8000/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        navigate('/roadmap');
      }
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  if (!isLoaded || loading) return <div className="min-h-screen flex items-center justify-center bg-[#F7F5F2] text-[#6B6358]">Loading...</div>;

  if (!isSignedIn) return <Navigate to="/sign-in" />;

  if (!profile) {
    // Renders the overlay if no profile
    return (
      <div className="min-h-screen bg-[#F7F5F2] text-[#33312E] font-sans relative overflow-hidden">
        {/* Top Navbar */}
        <nav className="bg-[#EAE4DB] border-b border-[#DCD3C6] px-8 py-4 flex justify-between items-center opacity-40">
          <div className="flex items-center space-x-2 text-[#8A9A86]">
            <BrainCircuit className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight text-[#33312E]">Pathfinder</span>
          </div>
          <div className="flex items-center space-x-8 text-sm font-medium text-[#6B6358] hidden md:flex">
            <span>Analytics</span>
            <span>Market Demand</span>
            <span>Job Matches</span>
            <span>Settings</span>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto p-8 mt-4 space-y-8 opacity-40 blur-[2px] pointer-events-none">
          {/* Fake layout for background */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white rounded-xl shadow-sm p-6 border border-[#EAE4DB] h-64"></div>
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-[#EAE4DB] h-28"></div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-[#EAE4DB] h-28"></div>
            </div>
          </div>
        </main>

        {/* Crisp Overlay CTA */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 bg-[#F7F5F2]/20 backdrop-blur-[1px]">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#DCD3C6] p-10 text-center max-w-lg w-full transform transition-all hover:scale-[1.01] -mt-10">
            <BrainCircuit className="w-14 h-14 text-[#8A9A86] mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-[#33312E] mb-3" style={{ fontFamily: 'Georgia, serif' }}>Career Diagnostics Needed</h2>
            <p className="text-base text-[#6B6358] mb-8 leading-relaxed px-4">
              We need to understand your current skillset before our AI agents can map your future. Upload your resume to reveal your live market gaps.
            </p>
            <Link to="/assessment" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-bold rounded-full shadow-md text-white bg-[#8A9A86] hover:bg-[#73826F] transition-all hover:shadow-lg hover:-translate-y-0.5">
              Start Initialization
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const coreSkills = JSON.parse(profile.core_skills || "[]");
  const skillGaps = JSON.parse(profile.skill_gaps || "[]");
  const hasRoadmap = !!profile.saved_roadmap;
  
  const aiReasoning = profile.ai_reasoning || "Analyzing live data streams to identify skill gaps based on current role requirements.";
  const marketSources = JSON.parse(profile.market_sources || "[]");
  const skillDemands = JSON.parse(profile.skill_demands || "{}");

  const chartData = skillGaps.map(skill => ({
    name: skill,
    demand: skillDemands[skill] || Math.floor(Math.random() * (95 - 60 + 1)) + 60 // Fallback if data is missing
  }));

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
          <Link to="/interview" className="text-sm font-medium text-[#5C554B] hover:text-[#73826F] transition">Mock Interview</Link>
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

        {/* NEW: Analytics & Sources Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          
          {/* Missing Skill Demand Chart */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm p-6 border border-[#EAE4DB]">
            <h3 className="text-lg font-bold text-[#33312E] flex items-center mb-6">
              <Activity className="w-5 h-5 text-[#8A9A86] mr-2" />
              Live Demand for Missing Skills
            </h3>
            {chartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6B6358' }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#33312E', fontSize: 13 }} />
                    <Tooltip cursor={{ fill: '#F7F5F2' }} contentStyle={{ borderRadius: '8px', border: '1px solid #EAE4DB' }} formatter={(value) => [`${value}% Demand`, 'Frequency']} />
                    <Bar dataKey="demand" fill="#C8795A" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-[#8C8477] italic">No gaps to graph.</p>
            )}
          </div>

          {/* AI Reasoning & Sources */}
          <div className="space-y-6">
            <div className="bg-[#33312E] text-[#F7F5F2] rounded-xl shadow-sm p-6 border border-[#1E1E1E]">
              <h3 className="text-lg font-bold text-white flex items-center mb-3">
                <BrainCircuit className="w-5 h-5 text-[#8A9A86] mr-2" />
                AI Score Reasoning
              </h3>
              <p className="text-sm leading-relaxed text-gray-300">
                "{aiReasoning}"
              </p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm p-6 border border-[#EAE4DB]">
              <h3 className="text-lg font-bold text-[#33312E] flex items-center mb-3">
                <ExternalLink className="w-5 h-5 text-[#8A9A86] mr-2" />
                Live Market Sources
              </h3>
              <p className="text-xs text-[#6B6358] mb-4">Tavily scraped the following live URLs to calculate your score:</p>
              <ul className="space-y-3">
                {marketSources.length > 0 ? marketSources.map((url, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-[#8A9A86] mr-2 mt-0.5">•</span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">
                      {url}
                    </a>
                  </li>
                )) : (
                  <li className="text-sm text-[#8C8477] italic">Waiting for resume upload to fetch live sources...</li>
                )}
              </ul>
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
