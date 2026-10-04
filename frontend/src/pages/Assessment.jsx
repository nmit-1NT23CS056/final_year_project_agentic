import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api from '../lib/axios';
import { Loader2, FileText, CheckCircle } from 'lucide-react';

export default function Assessment() {
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) return;
    setLoading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', resumeFile);
      
      await api.post('/profile/parse-resume', 
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error(error);
      alert('Failed to parse resume. Please check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#33312E] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white/60 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-[#EAE4DB]">
        <div className="px-8 py-6 border-b border-[#EAE4DB] bg-[#8A9A86]/10">
          <h2 className="text-2xl font-bold text-[#33312E] flex items-center" style={{ fontFamily: 'Georgia, serif' }}>
            <FileText className="mr-3 text-[#8A9A86]" />
            Resume Onboarding
          </h2>
          <p className="mt-2 text-sm text-[#6B6358]">
            Upload your resume PDF below. Our AI will analyze your skills and compare them against the live job market to generate your Career Diagnostics.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label htmlFor="resume" className="block text-sm font-medium text-[#5C554B]">
              Upload your Resume (PDF)
            </label>
            <div className="mt-2">
              <input
                type="file"
                accept=".pdf"
                id="resume"
                name="resume"
                className="shadow-sm focus:ring-[#8A9A86] focus:border-[#8A9A86] block w-full sm:text-sm border border-[#DCD3C6] rounded-md p-4 bg-white/50"
                onChange={(e) => setResumeFile(e.target.files[0])}
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || success || !resumeFile}
              className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#8A9A86] hover:bg-[#73826F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8A9A86] disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Analyzing Market Fit...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="-ml-1 mr-2 h-5 w-5" />
                  Profile Built! Redirecting...
                </>
              ) : (
                'Analyze My Career'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
