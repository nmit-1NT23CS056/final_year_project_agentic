import { useEffect, useState } from 'react';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { Briefcase, BrainCircuit, Loader2, FileText, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Jobs() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [isLoaded, user]);

  const fetchJobs = async () => {
    if (!isLoaded || !user) return;
    try {
      const token = await getToken();
      const res = await api.get('/jobs/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const token = await getToken();
      await api.post('/jobs/scan', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchJobs();
    } catch (error) {
      console.error(error);
      alert("Failed to scan for jobs. Please complete your assessment first.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2 text-indigo-600">
          <BrainCircuit className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight text-gray-900">Agentic Career Advisor</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition">Roadmap</Link>
          <Link to="/jobs" className="text-sm font-medium text-indigo-600 border-b-2 border-indigo-600">Job Matches</Link>
          <span className="text-sm font-medium text-gray-500 pl-4 border-l border-gray-300">
            Welcome, {user?.firstName || user?.primaryEmailAddress?.emailAddress}
          </span>
          <button onClick={handleLogout} className="text-sm px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8 mt-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Autonomous Job Hunter</h1>
            <p className="text-gray-500 mt-1">Our AI scans the live market and custom-tailors your cover letters.</p>
          </div>
          <button 
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
          >
            {scanning ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Scanning Web...</>
            ) : (
              <><Briefcase className="w-5 h-5 mr-2" /> Trigger Autonomous Agent</>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center mt-20 text-indigo-600"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">No Job Matches Yet</h2>
            <p className="text-gray-500 mt-2 mb-6">Trigger the agent to search the web for jobs matching your 5D profile.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Job List */}
            <div className="lg:col-span-1 space-y-4">
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  onClick={() => setSelectedJob(job)}
                  className={`bg-white rounded-xl shadow-sm border p-5 cursor-pointer transition transform hover:-translate-y-1 ${selectedJob?.id === job.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-300'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900">{job.job_title}</h3>
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">{job.match_score} Match</span>
                  </div>
                  <p className="text-sm font-medium text-indigo-600 mb-2">{job.company}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{job.job_description}</p>
                </div>
              ))}
            </div>

            {/* Job Details & Cover Letter */}
            <div className="lg:col-span-2">
              {selectedJob ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedJob.job_title}</h2>
                    <p className="text-indigo-600 font-medium">{selectedJob.company}</p>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex items-center space-x-2 mb-4 text-sm font-semibold text-gray-700 border-b pb-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span>AI-Tailored Cover Letter</span>
                    </div>
                    <div className="prose max-w-none text-gray-700 text-sm">
                      <ReactMarkdown>{selectedJob.tailored_cover_letter}</ReactMarkdown>
                    </div>
                  </div>
                  <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-4">
                    <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium">
                      Edit Letter
                    </button>
                    <button className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
                      <CheckCircle className="w-4 h-4 mr-2" /> Auto-Apply
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400">
                  <FileText className="w-12 h-12 mb-4 text-gray-300" />
                  <p>Select a job match to view your tailored cover letter.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
