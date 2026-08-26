import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Briefcase, BrainCircuit, LineChart, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Roadmap State
  const [roadmap, setRoadmap] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile/');
        setProfile(res.data);
      } catch (error) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setRoadmap(null);
    try {
      const res = await api.post('/roadmap/generate');
      setRoadmap(res.data.roadmap);
    } catch (error) {
      console.error(error);
      alert("Failed to generate roadmap.");
    } finally {
      setGenerating(false);
    }
  };

  const chartData = profile ? [
    { subject: 'Technical', A: profile.technical_skills_score, fullMark: 10 },
    { subject: 'Empathy', A: profile.eq_empathy, fullMark: 10 },
    { subject: 'Self-Regulation', A: profile.eq_self_regulation, fullMark: 10 },
    { subject: 'Motivation', A: profile.eq_motivation, fullMark: 10 },
    { subject: 'Self-Awareness', A: profile.eq_self_awareness, fullMark: 10 },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2 text-indigo-700">
          <BrainCircuit className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight">Agentic Career Advisor</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-slate-600">Welcome, {user?.username}</span>
          <button onClick={handleLogout} className="text-sm px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8 mt-4">
        {loading ? (
          <div className="animate-pulse flex space-x-4">...</div>
        ) : !profile ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center max-w-2xl mx-auto mt-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Initialize Your Profile</h2>
            <Link to="/assessment" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition">
              Start 5-Dimensional Assessment
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Radar Chart */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center h-fit">
              <h3 className="text-lg font-semibold text-slate-800 w-full mb-4">Your 5D Profile</h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Column: AI Roadmap Area */}
            <div className="lg:col-span-2 space-y-6">
              
              {!roadmap && !generating && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col justify-center items-center text-center">
                  <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                    <LineChart className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Profile Analyzed Successfully</h2>
                  <p className="text-slate-500 max-w-md mb-8">
                    Your data is ready. Our LangGraph multi-agent system will now research the live market and plot your optimal career trajectory.
                  </p>
                  <button onClick={handleGenerate} className="px-8 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 shadow-md transition transform hover:-translate-y-0.5">
                    Generate Agentic Roadmap
                  </button>
                </div>
              )}

              {generating && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex flex-col justify-center items-center text-center space-y-4">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                  <h3 className="text-xl font-bold text-slate-800">Multi-Agent System is Running...</h3>
                  <div className="text-sm text-slate-500 space-y-1">
                    <p>1. Profiler is analyzing your EQ & Tech scores...</p>
                    <p>2. Researcher is scanning live job markets via Tavily...</p>
                    <p>3. Strategist is drafting your career plan...</p>
                    <p>4. Critic is reviewing and refining the draft...</p>
                  </div>
                </div>
              )}

              {roadmap && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                  <h3 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-4 flex justify-between items-center">
                    Your Personalized Roadmap
                    <button onClick={() => setRoadmap(null)} className="text-sm px-3 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200">Start Over</button>
                  </h3>
                  <div className="prose prose-slate max-w-none">
                    <ReactMarkdown>{roadmap}</ReactMarkdown>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
