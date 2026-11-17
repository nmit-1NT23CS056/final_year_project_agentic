import { useLocation, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth, useUser } from '@clerk/clerk-react';
import { 
  ArrowLeft, 
  BrainCircuit, 
  RefreshCw, 
  Loader2, 
  Clock, 
  Target, 
  GraduationCap, 
  Briefcase, 
  Sparkles, 
  Send,
  MessageSquare
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/axios';

export default function Roadmap() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, getToken } = useAuth();
  const { user } = useUser();

  const [roadmapData, setRoadmapData] = useState(location.state?.roadmap || null);
  const [profile, setProfile] = useState(null);
  const [adaptiveDuration, setAdaptiveDuration] = useState('');
  const [generating, setGenerating] = useState(!location.state?.roadmap);
  
  // Human-in-the-Loop Feedback state
  const [humanFeedback, setHumanFeedback] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    const fetchProfileAndRoadmap = async () => {
      try {
        const token = await getToken();
        const res = await api.get('/profile/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data) {
          setProfile(res.data);
          if (res.data.adaptive_duration) {
            setAdaptiveDuration(res.data.adaptive_duration);
          }
          
          if (!roadmapData && res.data.saved_roadmap) {
            let data = res.data.saved_roadmap;
            if (typeof data === 'string' && data.startsWith('"') && data.endsWith('"')) {
              data = JSON.parse(data);
            }
            setRoadmapData(data);
          } else if (!roadmapData && !res.data.saved_roadmap) {
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error("Error fetching roadmap profile:", error);
        if (!roadmapData) navigate('/dashboard');
      } finally {
        setGenerating(false);
      }
    };

    fetchProfileAndRoadmap();
  }, [roadmapData, getToken, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleRegenerate = async (feedbackText = "") => {
    if (feedbackText) {
      setFeedbackLoading(true);
    } else {
      setGenerating(true);
    }

    try {
      const token = await getToken();
      const res = await api.post('/roadmap/generate', { 
        force_regenerate: true,
        human_feedback: feedbackText || ""
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let data = res.data.roadmap;
      if (typeof data === 'object') {
        data = JSON.stringify(data, null, 2);
      }
      setRoadmapData(data);
      if (res.data.adaptive_duration) {
        setAdaptiveDuration(res.data.adaptive_duration);
      }
      if (feedbackText) {
        setHumanFeedback('');
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update roadmap. Please try again.");
    } finally {
      setGenerating(false);
      setFeedbackLoading(false);
    }
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!humanFeedback.trim()) return;
    handleRegenerate(humanFeedback.trim());
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

      <main className="max-w-4xl mx-auto p-8 mt-4 space-y-6">
        
        {/* Navigation & Actions Top Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="flex items-center text-[#8A9A86] hover:text-[#73826F] font-medium transition">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          <button 
            onClick={() => handleRegenerate("")}
            disabled={generating || feedbackLoading}
            className="flex items-center px-4 py-2 text-sm bg-white/70 border border-[#EAE4DB] text-[#5C554B] font-medium rounded-lg hover:bg-white shadow-sm transition disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#8A9A86]" /> : <RefreshCw className="w-4 h-4 mr-2 text-[#8A9A86]" />}
            {generating ? "Agents Working..." : "Regenerate Full Plan"}
          </button>
        </div>

        {/* Adaptive Context Header Banner */}
        {profile && (
          <div className="bg-white/70 backdrop-blur-md rounded-xl p-5 border border-[#EAE4DB] shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#8A9A86]/20 text-[#33312E]">
                {profile.persona === 'professional' ? (
                  <><Briefcase className="h-3.5 w-3.5 mr-1" /> Working Professional</>
                ) : (
                  <><GraduationCap className="h-3.5 w-3.5 mr-1" /> Student Candidate</>
                )}
              </span>

              {profile.target_role && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#EAE4DB] text-[#4A443C]">
                  <Target className="h-3.5 w-3.5 mr-1 text-[#8A9A86]" />
                  Target: {profile.target_role}
                </span>
              )}

              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-[#EAE4DB] text-[#6B6358]">
                <Clock className="h-3.5 w-3.5 mr-1 text-[#8A9A86]" />
                Bandwidth: {profile.available_hours_per_week || 15} hrs/week
              </span>
            </div>

            {adaptiveDuration && (
              <div className="text-xs font-bold text-[#8A9A86] bg-[#8A9A86]/10 px-3 py-1.5 rounded-lg border border-[#8A9A86]/20 flex items-center">
                <Sparkles className="h-4 w-4 mr-1.5" />
                Adaptive Timeline: {adaptiveDuration}
              </div>
            )}
          </div>
        )}

        {/* Human-in-the-Loop Feedback Input Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-[#EAE4DB] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-[#33312E] flex items-center">
              <MessageSquare className="w-4 h-4 text-[#8A9A86] mr-2" />
              Human-in-the-Loop Agent Revision
            </h3>
            <span className="text-xs text-[#8A9A86] font-medium">Interactive Multi-Agent Loop</span>
          </div>
          <p className="text-xs text-[#6B6358] mb-3">
            Want to customize this curriculum? Instruct the Strategist Agent (e.g. <i>"I already know Docker, please swap it for Kubernetes CI/CD"</i> or <i>"Make it a 2-week sprint for an upcoming interview"</i>).
          </p>

          <form onSubmit={handleFeedbackSubmit} className="flex gap-2">
            <input
              type="text"
              value={humanFeedback}
              onChange={(e) => setHumanFeedback(e.target.value)}
              placeholder="Type your instructions to the AI agent..."
              disabled={generating || feedbackLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-[#DCD3C6] bg-white focus:outline-none focus:ring-2 focus:ring-[#8A9A86] text-sm text-[#33312E]"
            />
            <button
              type="submit"
              disabled={generating || feedbackLoading || !humanFeedback.trim()}
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[#8A9A86] hover:bg-[#73826F] text-white font-medium text-sm transition shadow-sm disabled:opacity-40"
            >
              {feedbackLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Revising...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Refine Plan
                </>
              )}
            </button>
          </form>
        </div>

        {/* Roadmap Content */}
        {generating ? (
          <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm p-16 border border-[#EAE4DB] flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 text-[#8A9A86] animate-spin mb-4" />
            <h2 className="text-xl font-bold text-[#33312E]" style={{ fontFamily: 'Georgia, serif' }}>
              Orchestrating Multi-Agent Curriculum...
            </h2>
            <p className="text-[#6B6358] mt-2 text-center max-w-md text-sm">
              The Strategist Agent is drafting your adaptive timeline with DAG dependencies and verified learning sources, while the Critic Agent verifies the standard.
            </p>
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm p-8 sm:p-10 border border-[#EAE4DB]">
            <h1 className="text-3xl font-bold text-[#33312E] mb-6 border-b border-[#EAE4DB] pb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Your Adaptive Career Action Plan
            </h1>
            
            <div className="prose prose-lg max-w-none 
                            prose-headings:text-[#33312E] prose-headings:font-bold prose-headings:font-serif
                            prose-a:text-[#8A9A86] hover:prose-a:text-[#73826F] prose-a:font-semibold
                            prose-table:border-collapse prose-table:w-full prose-table:my-6
                            prose-th:bg-[#EAE4DB] prose-th:text-[#33312E] prose-th:p-3 prose-th:border prose-th:border-[#DCD3C6] prose-th:text-xs prose-th:uppercase
                            prose-td:p-3.5 prose-td:border prose-td:border-[#EAE4DB] prose-td:text-sm
                            prose-ul:list-disc prose-li:marker:text-[#8A9A86] prose-li:my-1
                            prose-strong:text-[#33312E]
                            prose-code:text-[#73826F] prose-code:bg-[#8A9A86]/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
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
