import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api from '../lib/axios';
import { Loader2, FileText, CheckCircle, CloudUpload } from 'lucide-react';

export default function Assessment() {
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0]);
    }
  };

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
      const errMsg = error.response?.data?.detail || error.message;
        alert('Google AI servers are heavily loaded. Please wait a moment and try again. Error: ' + errMsg);
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
          
          <div 
            className={`mt-2 relative flex flex-col items-center justify-center px-6 pt-12 pb-12 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out ${
              dragActive ? 'border-[#8A9A86] bg-[#8A9A86]/10 scale-[1.02]' : 'border-[#DCD3C6] bg-white/50 hover:bg-white/80'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-3 text-center pointer-events-none">
              {resumeFile ? (
                <FileText className="mx-auto h-16 w-16 text-[#8A9A86]" />
              ) : (
                <CloudUpload className="mx-auto h-16 w-16 text-[#8A9A86]/60" />
              )}
              
              <div className="flex text-lg text-[#5C554B] justify-center mt-4">
                <label
                  htmlFor="resume"
                  className="relative cursor-pointer bg-transparent rounded-md font-bold text-[#8A9A86] hover:text-[#73826F] focus-within:outline-none pointer-events-auto transition"
                >
                  <span>{resumeFile ? 'Change file' : 'Upload a file'}</span>
                  <input id="resume" name="resume" type="file" accept=".pdf" className="sr-only" onChange={(e) => setResumeFile(e.target.files[0])} />
                </label>
                {!resumeFile && <p className="pl-2">or drag and drop</p>}
              </div>
              <p className="text-sm text-[#6B6358] font-medium">
                {resumeFile ? resumeFile.name : 'PDF up to 10MB'}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading || success || !resumeFile}
              className="inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-[#8A9A86] hover:bg-[#73826F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8A9A86] disabled:opacity-50 transition"
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




