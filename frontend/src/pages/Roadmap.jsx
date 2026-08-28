import { useLocation, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth, useUser } from '@clerk/clerk-react';
import { ArrowLeft, BrainCircuit } from 'lucide-react';

export default function Roadmap() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { user } = useUser();
  const roadmapData = location.state?.roadmap;

  if (!roadmapData) {
    navigate('/dashboard');
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2 text-indigo-500">
          <BrainCircuit className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight text-gray-900">Agentic Career Advisor</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition">Dashboard</Link>
          <Link to="/jobs" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition">Job Matches</Link>
          <span className="text-sm font-medium text-gray-500 pl-4 border-l border-gray-300">Welcome, {user?.firstName || user?.primaryEmailAddress?.emailAddress}</span>
          <button onClick={handleLogout} className="text-sm px-4 py-2 text-gray-700 hover:bg-indigo-500 hover:text-white rounded-md transition">Logout</button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-8 mt-4 space-y-8">
        
        <div className="flex items-center mb-6">
          <button onClick={() => navigate('/dashboard')} className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-10 border border-gray-200">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8 border-b pb-4">Your Custom Action Plan</h1>
          
          <div className="prose prose-slate prose-lg max-w-none 
                          prose-headings:text-indigo-900 prose-headings:font-bold 
                          prose-a:text-indigo-600 hover:prose-a:text-indigo-500
                          prose-table:border-collapse prose-table:w-full
                          prose-th:bg-indigo-50 prose-th:text-indigo-900 prose-th:p-3 prose-th:border prose-th:border-gray-300
                          prose-td:p-3 prose-td:border prose-td:border-gray-200
                          prose-ul:list-disc prose-li:marker:text-indigo-500
                          prose-strong:text-gray-900">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {roadmapData}
            </ReactMarkdown>
          </div>
        </div>

      </main>
    </div>
  );
}
