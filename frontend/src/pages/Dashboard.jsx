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
      <div className="min-h-screen bg-[#F7F5F2] text-[#33312E] font-sans relative overflow-hidden">
        {/* Fake Blurred Navbar */}
        <nav className="bg-[#EAE4DB] border-b border-[#DCD3C6] px-8 py-4 flex justify-between items-center shadow-sm opacity-50">
          <div className="flex items-center space-x-2 text-[#8A9A86]">
            <BrainCircuit className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight text-[#33312E]">Dashboard</span>
          </div>
          <div className="flex items-center space-x-8 text-sm font-medium text-[#6B6358] hidden md:flex">
            <span>Analytics</span>
            <span>Market Demand</span>
            <span>Job Matches</span>
            <span>Settings</span>
          </div>
        </nav>

        {/* Fake Realistic Dashboard Content */}
        <main className="max-w-7xl mx-auto p-8 mt-4 opacity-40 blur-[2px] select-none pointer-events-none transition-all duration-1000">
          
          {/* Top Row Charts */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1">
              <h3 className="text-lg font-bold text-[#8A9A86] mb-4">Analytics</h3>
              <ul className="space-y-3 text-[#6B6358] text-sm">
                <li>Customize account</li>
                <li>System preferences</li>
                <li>Data analysis</li>
                <li>Security</li>
              </ul>
            </div>
            
            <div className="col-span-1">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#6B6358] mb-4">Skill Gap Analysis</h3>
              <div className="h-24 flex items-end justify-between space-x-2">
                <div className="w-1/6 bg-[#8A9A86]/40 h-3/4 rounded-t"></div>
                <div className="w-1/6 bg-[#8A9A86]/60 h-full rounded-t"></div>
                <div className="w-1/6 bg-[#8A9A86]/30 h-1/2 rounded-t"></div>
                <div className="w-1/6 bg-[#C8795A]/50 h-2/3 rounded-t"></div>
                <div className="w-1/6 bg-[#8A9A86]/80 h-4/5 rounded-t"></div>
              </div>
            </div>

            <div className="col-span-1">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#6B6358] mb-4">Market Demand</h3>
              <div className="h-24 relative overflow-hidden rounded-lg">
                 {/* Fake line chart */}
                 <svg viewBox="0 0 100 50" className="w-full h-full stroke-[#8A9A86] fill-transparent stroke-2">
                   <path d="M0 40 Q 20 10, 40 30 T 80 10 T 100 20" />
                 </svg>
              </div>
            </div>

            <div className="col-span-1">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#6B6358] mb-4">Job Match Scores</h3>
              <div className="space-y-3">
                <div className="w-full bg-[#EAE4DB] rounded-full h-3"><div className="bg-[#8A9A86] h-3 rounded-full w-[85%]"></div></div>
                <div className="w-full bg-[#EAE4DB] rounded-full h-3"><div className="bg-[#8A9A86] h-3 rounded-full w-[60%]"></div></div>
                <div className="w-full bg-[#EAE4DB] rounded-full h-3"><div className="bg-[#8A9A86] h-3 rounded-full w-[40%]"></div></div>
              </div>
            </div>
          </div>

          {/* Bottom Large Graphic Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-2 relative h-96 bg-white/30 rounded-2xl border border-[#EAE4DB] p-8 flex items-center justify-center overflow-hidden">
               {/* Decorative background nodes to simulate the network graph */}
               <div className="absolute top-10 left-10 w-24 h-24 border-2 border-[#8A9A86]/30 rounded-full flex items-center justify-center"><BrainCircuit className="w-8 h-8 text-[#8A9A86]/40" /></div>
               <div className="absolute bottom-20 left-1/4 w-32 h-32 border-2 border-[#8A9A86]/30 rounded-full flex items-center justify-center"><Briefcase className="w-10 h-10 text-[#8A9A86]/40" /></div>
               <div className="absolute top-20 right-20 w-40 h-40 border-2 border-[#C8795A]/30 rounded-full flex items-center justify-center"><TrendingUp className="w-12 h-12 text-[#C8795A]/40" /></div>
               
               <svg className="absolute inset-0 w-full h-full stroke-[#EAE4DB] stroke-2 -z-10">
                 <line x1="20%" y1="25%" x2="30%" y2="70%" />
                 <line x1="30%" y1="70%" x2="75%" y2="35%" />
                 <line x1="20%" y1="25%" x2="75%" y2="35%" />
               </svg>
            </div>
            
            <div className="col-span-1 space-y-6">
               <h3 className="text-2xl font-bold text-[#33312E] mb-4">Career Path</h3>
               <p className="text-[#6B6358] leading-relaxed">We will analyze your current skillset and compare it to live job market data to map out exactly what you need to learn. Your customized learning path will appear here once generated.</p>
               
               <div className="mt-8 p-6 bg-white/40 rounded-xl border border-[#EAE4DB]">
                 <h4 className="font-bold text-[#33312E] mb-2">Skill Assessment</h4>
                 <div className="flex justify-between text-sm text-[#6B6358] mb-2"><span>Technical</span><span>85%</span></div>
                 <div className="flex justify-between text-sm text-[#6B6358]"><span>Market Fit</span><span>Pending</span></div>
               </div>
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
