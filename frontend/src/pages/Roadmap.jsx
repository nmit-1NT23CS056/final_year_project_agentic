import { useLocation, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth, useUser } from '@clerk/clerk-react';
import { ArrowLeft, BrainCircuit, RefreshCw, Loader2 } from 'lucide-react';
import { useState } from 'react';
import api from '../lib/axios';

export default function Roadmap() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const [roadmapData, setRoadmapData] = useState(location.state?.roadmap);
  const [generating, setGenerating] = useState(false);

  if (!roadmapData && !generating) {
    navigate('/dashboard');
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      const token = await getToken();
      const res = await api.post('/roadmap/generate', { force_regenerate: true }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let data = res.data.roadmap;
      if (typeof data === 'object') {
        data = JSON.stringify(data, null, 2);
      }
      setRoadmapData(data);
    } catch (error) {
      console.error(error);
      alert("Failed to regenerate roadmap.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#33312E] font-sans">
      {/* Top Navbar */}
      <nav className="bg-[#EAE4DB] border-b border-[#DCD3C6] px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2 text-[#8A9A86]">
          <BrainCircuit className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight text-[#33312E]">Pathfinder</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-sm font-medium text-[#5C554B] hover:text-[#73826F] transition">Dashboard</Link>
          <Link to="/interview" className="text-sm font-medium text-[#5C554B] hover:text-[#73826F] transition">Mock Interview</Link>
          <Link to="/jobs" className="text-sm font-medium text-[#5C554B] hover:text-[#73826F] transition">Job Matches</Link>
          <span className="text-sm font-medium text-[#6B6358] pl-4 border-l border-[#DCD3C6]">Welcome, {user?.firstName || user?.primaryEmailAddress?.emailAddress}</span>
          <button onClick={handleLogout} className="text-sm px-4 py-2 text-[#5C554B] hover:bg-[#F7F5F2] hover:text-[#33312E] rounded-full transition">Logout</button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-8 mt-4 space-y-8">
        
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate('/dashboard')} className="flex items-center text-[#8A9A86] hover:text-[#73826F] font-medium transition">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          <button 
            onClick={handleRegenerate}
            disabled={generating}
            className="flex items-center px-4 py-2 text-sm bg-white/60 border border-[#EAE4DB] text-[#5C554B] font-medium rounded-md hover:bg-white shadow-sm transition disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#8A9A86]" /> : <RefreshCw className="w-4 h-4 mr-2 text-[#8A9A86]" />}
            {generating ? "Agents Working..." : "Regenerate Plan"}
          </button>
        </div>

        {generating ? (
          <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm p-16 border border-[#EAE4DB] flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 text-[#8A9A86] animate-spin mb-4" />
            <h2 className="text-xl font-bold text-[#33312E]" style={{ fontFamily: 'Georgia, serif' }}>Agents are reviewing your profile...</h2>
            <p className="text-[#6B6358] mt-2 text-center max-w-md">The Strategist is mapping a new path and the Critic is validating it. This may take a few minutes.</p>
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm p-10 border border-[#EAE4DB]">
            <h1 className="text-3xl font-bold text-[#33312E] mb-8 border-b border-[#EAE4DB] pb-4" style={{ fontFamily: 'Georgia, serif' }}>Your Custom Action Plan</h1>
            
            <div className="prose prose-lg max-w-none 
                            prose-headings:text-[#33312E] prose-headings:font-bold prose-headings:font-serif
                            prose-a:text-[#8A9A86] hover:prose-a:text-[#73826F]
                            prose-table:border-collapse prose-table:w-full
                            prose-th:bg-[#EAE4DB] prose-th:text-[#33312E] prose-th:p-3 prose-th:border prose-th:border-[#DCD3C6]
                            prose-td:p-3 prose-td:border prose-td:border-[#EAE4DB]
                            prose-ul:list-disc prose-li:marker:text-[#8A9A86]
                            prose-strong:text-[#33312E]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {roadmapData}
              </ReactMarkdown>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}


