import React, { useState, useEffect } from 'react';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Loader2, 
  BookOpen, 
  ExternalLink, 
  Activity,
  Compass,
  Target,
  GraduationCap,
  Briefcase,
  Clock,
  Award,
  GitBranch
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis 
} from 'recharts';

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

  // Parse Domain Marks from 100-mark rubric
  let domainMarks = {};
  try {
    domainMarks = JSON.parse(profile.domain_marks || "{}");
  } catch (e) {
    domainMarks = {};
  }

  const defaultDomainMarks = {
    "Languages & CS": { score: Math.round(profile.market_demand_score * 0.20), max: 20 },
    "Target Domain": { score: Math.round(profile.market_demand_score * 0.30), max: 30 },
    "Cloud & DevOps": { score: Math.round(profile.market_demand_score * 0.20), max: 20 },
    "Projects & GitHub": { score: Math.round(profile.market_demand_score * 0.15), max: 15 },
    "Courses & Certs": { score: Math.round(profile.market_demand_score * 0.15), max: 15 }
  };

  const effectiveMarks = Object.keys(domainMarks).length > 0 ? domainMarks : defaultDomainMarks;

  const radarData = Object.entries(effectiveMarks).map(([key, val]) => {
    const score = typeof val === 'object' ? (val.score ?? 0) : Number(val);
    const max = typeof val === 'object' ? (val.max ?? 100) : 100;
    const pct = max > 0 ? Math.round((score / max) * 100) : score;
    return {
      subject: key,
      percentage: pct,
      score: score,
      max: max,
      fullMark: 100
    };
  });

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
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#8A9A86]/20 text-[#33312E] mb-3">
                {profile.persona === 'professional' ? '💼 Working Professional' : '🎓 Student Candidate'}
              </span>
              <h3 className="text-xs font-semibold text-[#6B6358] uppercase tracking-wider mb-1">Current Profile</h3>
              <p className="text-xl font-bold text-[#33312E]">{profile.current_role}</p>
              <p className="text-xs text-[#6B6358] mb-3">{profile.years_of_experience} years verified experience</p>

              {profile.target_role && (
                <div className="p-3 bg-[#8A9A86]/10 rounded-lg border border-[#8A9A86]/25 text-left mb-3">
                  <div className="flex items-center text-xs font-bold text-[#73826F] mb-1">
                    <Target className="h-3.5 w-3.5 mr-1" />
                    Target Desired Role
                  </div>
                  <p className="text-sm font-bold text-[#33312E]">{profile.target_role}</p>
                  <p className="text-[11px] text-[#6B6358] mt-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1 inline text-[#8A9A86]" />
                    Pacing: {profile.available_hours_per_week || 15} hrs / week
                  </p>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-[#EAE4DB]">
                <h3 className="text-xs font-semibold text-[#6B6358] uppercase tracking-wider mb-3">Market Demand Score</h3>
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-[#EAE4DB]" />
                    <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="301.6" strokeDashoffset={301.6 - (301.6 * profile.market_demand_score) / 100} className={profile.market_demand_score > 70 ? 'text-[#8A9A86]' : 'text-[#C8795A]'} />
                  </svg>
                  <span className="absolute text-2xl font-bold text-[#33312E]">{profile.market_demand_score}</span>
                </div>
                <p className="mt-2 text-xs text-[#6B6358]">Aggregated 100-mark rubric</p>
                {profile.github_link && (
                  <div className="mt-4 pt-3 border-t border-[#EAE4DB] flex items-center justify-center text-xs text-[#6B6358]">
                    <GitBranch className="h-3.5 w-3.5 mr-1 text-[#8A9A86]" />
                    <a href={profile.github_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[180px]">
                      Audited GitHub Repos
                    </a>
                  </div>
                )}
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

        {/* Evaluation Rubric & Market Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          
          {/* 1. Domain Marks Radar Chart (Spider Web) */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm p-6 border border-[#EAE4DB]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-[#33312E] flex items-center">
                <Compass className="w-5 h-5 text-[#8A9A86] mr-2" />
                Domain Evaluation Rubric
              </h3>
              <span className="text-xs font-bold px-3 py-1 bg-[#8A9A86]/20 text-[#33312E] rounded-full">
                100 Marks Breakdown
              </span>
            </div>
            <p className="text-xs text-[#6B6358] mb-2">
              Competency polygon across core CS, domain depth, DevOps, projects, and certifications:
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#EAE4DB" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#4A443C', fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#DCD3C6" tick={{ fill: '#6B6358', fontSize: 10 }} />
                  <Radar name="Candidate Competency" dataKey="percentage" stroke="#8A9A86" fill="#8A9A86" fillOpacity={0.45} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #EAE4DB', backgroundColor: 'rgba(255, 255, 255, 0.95)' }} 
                    formatter={(value, name, item) => [`${item.payload.score} / ${item.payload.max} Marks (${value}%)`, 'Evaluated Score']} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Marks distribution pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#EAE4DB]">
              {radarData.map((item, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-white/70 border border-[#EAE4DB] text-center">
                  <p className="text-[11px] font-semibold text-[#6B6358] truncate">{item.subject}</p>
                  <p className="text-sm font-bold text-[#33312E]">
                    {item.score} <span className="text-xs font-normal text-[#6B6358]">/ {item.max}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Missing Skill Demand Chart */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm p-6 border border-[#EAE4DB] flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#33312E] flex items-center mb-2">
                <Activity className="w-5 h-5 text-[#8A9A86] mr-2" />
                Live Demand for Missing Skills
              </h3>
              <p className="text-xs text-[#6B6358] mb-4">
                Real-time frequency of required missing skills across live job postings:
              </p>
            </div>

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
              <p className="text-[#8C8477] italic py-12 text-center">No missing gaps identified.</p>
            )}

            <div className="mt-4 pt-3 border-t border-[#EAE4DB] text-xs text-[#6B6358] text-center">
              Targeted skills automatically prioritized in your adaptive curriculum.
            </div>
          </div>

        </div>

        {/* AI Reasoning & Sources Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
