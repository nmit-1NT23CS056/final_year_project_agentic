import { useEffect, useState } from 'react';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Briefcase, BrainCircuit, LineChart, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
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
    setRoadmap(null);
    try {
      const token = await getToken();
      const res = await api.post('/roadmap/generate', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let data = res.data.roadmap;
      if (typeof data === 'object') {
        data = JSON.stringify(data, null, 2);
      }
      setRoadmap(data);
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
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2 text-indigo-500">
          <BrainCircuit className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight text-gray-900">Agentic Career Advisor</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-sm font-medium text-indigo-600 border-b-2 border-indigo-600">Roadmap</Link>
          <Link to="/jobs" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition">Job Matches</Link>
          <span className="text-sm font-medium text-gray-500 pl-4 border-l border-gray-300">Welcome, {user?.firstName || user?.primaryEmailAddress?.emailAddress}</span>
          <button onClick={handleLogout} className="text-sm px-4 py-2 text-gray-700 hover:bg-indigo-500 hover:text-gray-900 rounded-md transition">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8 mt-4">
        {loading || !isLoaded ? (
          <div className="animate-pulse flex space-x-4 text-indigo-500 justify-center mt-20">Loading your secure terminal...</div>
        ) : !profile ? (
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-10 text-center max-w-2xl mx-auto mt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Initialize Your Profile</h2>
            <Link to="/assessment" className="inline-flex items-center px-6 py-3 bg-indigo-500 text-gray-900 font-medium rounded-lg hover:bg-indigo-600 shadow-sm transition mt-6">
              Start 5-Dimensional Assessment
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Radar Chart */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-xl border border-gray-200 p-6 flex flex-col items-center h-fit">
              <h3 className="text-lg font-semibold text-gray-900 w-full mb-4">Your 5D Profile</h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="#2d2d34" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Column: AI Roadmap Area */}
            <div className="lg:col-span-2 space-y-6">
              
              {!roadmap && !generating && (
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 flex flex-col justify-center items-center text-center">
                  <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6 border border-gray-200">
                    <LineChart className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Analyzed Successfully</h2>
                  <p className="text-gray-500 max-w-md mb-8">
                    Your data is ready. Our LangGraph multi-agent system will now research the live market and plot your optimal career trajectory.
                  </p>
                  <button onClick={handleGenerate} className="px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 shadow-md transition transform hover:-translate-y-0.5">
                    Generate Agentic Roadmap
                  </button>
                </div>
              )}

              {generating && (
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-12 flex flex-col justify-center items-center text-center space-y-4">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                  <h3 className="text-xl font-bold text-gray-900">Multi-Agent System is Running...</h3>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>1. Profiler is analyzing your EQ & Tech scores...</p>
                    <p>2. Researcher is scanning live job markets via Tavily...</p>
                    <p>3. Strategist is drafting your career plan...</p>
                    <p>4. Critic is reviewing and refining the draft...</p>
                  </div>
                </div>
              )}

              {roadmap && (
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-4 flex justify-between items-center">
                    Your Personalized Roadmap
                    <button onClick={() => setRoadmap(null)} className="text-sm px-3 py-1 bg-indigo-500 text-gray-700 rounded hover:bg-indigo-600">Start Over</button>
                  </h3>
                  <div className="prose  max-w-none text-gray-700">
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
