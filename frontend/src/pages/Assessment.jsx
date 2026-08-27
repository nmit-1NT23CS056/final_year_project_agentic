import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api from '../lib/axios';

export default function Assessment() {
  const { getToken } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsingMsg, setParsingMsg] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Profile State
  const [profile, setProfile] = useState({
    technical_skills_score: 5,
    soft_skills_score: 5,
    career_motivator: 'Impact',
    personality_type: 'INTJ', // Default placeholder
    eq_self_awareness: 5,
    eq_empathy: 5,
    eq_self_regulation: 5,
    eq_motivation: 5
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setParsingMsg("Uploading and parsing PDF with AI...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = await getToken();
      const response = await api.post('/profile/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const parsedData = response.data.parsed_data;
      setProfile(prev => ({
        ...prev,
        technical_skills_score: parsedData.technical_skills_score || prev.technical_skills_score,
        career_motivator: parsedData.career_motivator || prev.career_motivator
      }));
      setParsingMsg("Success! Auto-filled technical score based on resume.");
    } catch (error) {
      console.error(error);
      setParsingMsg("Failed to parse resume.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      await api.post('/profile/', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Navigate back to dashboard where the profile will be displayed
      navigate('/dashboard'); 
    } catch (error) {
      console.error("Failed to save profile", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900">Initialize Your Profile</h2>
          <p className="mt-2 text-lg text-gray-500">Step 1: Upload Resume (Optional) & Step 2: Self-Assessment</p>
        </div>

        {/* Step 1: Resume Upload */}
        <div className="bg-white shadow-xl rounded-xl border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">Step 1: Upload Resume (PDF)</h3>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md hover:border-gray-500 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="space-y-1 text-center">
              {file ? (
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              ) : (
                <UploadCloud className="mx-auto h-12 w-12 text-gray-500" />
              )}
              <div className="flex text-sm text-gray-500 justify-center mt-2">
                <span className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-500 hover:text-indigo-400">
                  {file ? file.name : "Upload a file"}
                </span>
                <input ref={fileInputRef} type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
              </div>
              <p className="text-xs text-gray-500">PDF up to 10MB</p>
            </div>
          </div>
          
          <button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className={`mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 ${!file || uploading ? 'bg-gray-700 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'}`}
          >
            {uploading ? 'Processing...' : 'Parse Resume with AI'}
          </button>
          
          {parsingMsg && (
            <div className="mt-4 p-3 bg-indigo-50 text-indigo-300 rounded-md text-sm border border-indigo-900/50">
              {parsingMsg}
            </div>
          )}
        </div>

        {/* Step 2: Manual Profile */}
        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-xl border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Step 2: EQ & Psychometric Alignment</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Technical Skills Score (1-10)</label>
              <input type="number" min="1" max="10" step="0.1" value={profile.technical_skills_score} onChange={(e) => setProfile({...profile, technical_skills_score: parseFloat(e.target.value)})} className="mt-1 block w-full rounded-md bg-indigo-50 text-gray-900 border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Career Motivator</label>
              <select value={profile.career_motivator} onChange={(e) => setProfile({...profile, career_motivator: e.target.value})} className="mt-1 block w-full rounded-md bg-indigo-50 text-gray-900 border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                <option>Impact</option>
                <option>Leadership</option>
                <option>Financial</option>
                <option>Work-Life Balance</option>
                <option>Technical Depth</option>
              </select>
            </div>

            <div className="col-span-full">
              <h4 className="text-md font-medium text-gray-800 mb-3">Mayer-Salovey-Caruso EQ Dimensions (1-10)</h4>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Self-Awareness: {profile.eq_self_awareness}</label>
              <input type="range" min="1" max="10" value={profile.eq_self_awareness} onChange={(e) => setProfile({...profile, eq_self_awareness: parseInt(e.target.value)})} className="mt-2 w-full accent-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Empathy: {profile.eq_empathy}</label>
              <input type="range" min="1" max="10" value={profile.eq_empathy} onChange={(e) => setProfile({...profile, eq_empathy: parseInt(e.target.value)})} className="mt-2 w-full accent-indigo-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Self-Regulation: {profile.eq_self_regulation}</label>
              <input type="range" min="1" max="10" value={profile.eq_self_regulation} onChange={(e) => setProfile({...profile, eq_self_regulation: parseInt(e.target.value)})} className="mt-2 w-full accent-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Motivation: {profile.eq_motivation}</label>
              <input type="range" min="1" max="10" value={profile.eq_motivation} onChange={(e) => setProfile({...profile, eq_motivation: parseInt(e.target.value)})} className="mt-2 w-full accent-indigo-500" />
            </div>

          </div>

          <div className="pt-5 border-t border-gray-200">
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Save Profile & Generate Dashboard
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
