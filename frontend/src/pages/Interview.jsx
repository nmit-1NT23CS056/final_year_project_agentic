import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { BrainCircuit, Send, User, Volume2, Bot } from 'lucide-react';
import api from '../lib/axios';

export default function Interview() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileExists, setProfileExists] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial check for profile only - NO automatic API greeting
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const token = await getToken();
        await api.get(`/profile/?t=${new Date().getTime()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Set initial hardcoded UI message without hitting AI API
        setMessages([{ role: 'ai', content: "Welcome to your Mock Interview session! I have your skill gaps ready. How can I help you prepare today?" }]);
      } catch (err) {
        if (err.response?.status === 404) {
          setProfileExists(false);
        }
      }
    };
    checkProfile();
  }, []);

  const handleLogout = () => {
    signOut(() => navigate('/'));
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    const newHistory = [...messages, { role: 'user', content: userMessage }];
    setMessages([...newHistory, { role: 'ai', content: '' }]); // Add empty AI bubble for streaming
    setLoading(true);

    try {
      const token = await getToken();
      
      const response = await fetch('http://localhost:8000/interview/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          chat_history: messages
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let aiFullResponse = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                 aiFullResponse += "\n\n[Error: " + data.error + "]";
                 setMessages((prev) => {
                   const updated = [...prev];
                   updated[updated.length - 1] = { ...updated[updated.length - 1], content: aiFullResponse };
                   return updated;
                 });
                 break;
              }
              if (data.text) {
                 aiFullResponse += data.text;
                 setMessages((prev) => {
                   const updated = [...prev];
                   updated[updated.length - 1] = { ...updated[updated.length - 1], content: aiFullResponse };
                   return updated;
                 });
              }
            } catch (e) {
              console.error("Failed to parse stream data:", e);
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'ai', content: "Sorry, I encountered an error. Let's try that again." };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profileExists) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] text-[#33312E] font-sans flex flex-col">
        <nav className="bg-[#EAE4DB] border-b border-[#DCD3C6] px-8 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center space-x-2 text-[#8A9A86]">
            <BrainCircuit className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight text-[#33312E]">Pathfinder</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/dashboard" className="text-sm font-medium text-[#5C554B] hover:text-[#73826F] transition">Dashboard</Link>
            <Link to="/interview" className="text-sm font-medium text-[#73826F] border-b-2 border-[#8A9A86] pb-1">Mock Interview</Link>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center p-8">
           <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#EAE4DB] p-10 text-center max-w-lg w-full">
             <Bot className="w-16 h-16 text-[#8A9A86] mx-auto mb-4" />
             <h2 className="text-2xl font-bold text-[#33312E] mb-2" style={{ fontFamily: 'Georgia, serif' }}>Profile Required</h2>
             <p className="text-[#6B6358] mb-6">You need to upload your resume to identify your skill gaps before starting a mock interview.</p>
             <Link to="/assessment" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-[#8A9A86] hover:bg-[#73826F] transition">
               Go to Assessment
             </Link>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#33312E] font-sans flex flex-col h-screen">
      <nav className="bg-[#EAE4DB] border-b border-[#DCD3C6] px-8 py-4 flex justify-between items-center shadow-sm flex-none">
        <div className="flex items-center space-x-2 text-[#8A9A86]">
          <BrainCircuit className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight text-[#33312E]">Pathfinder</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-sm font-medium text-[#5C554B] hover:text-[#73826F] transition">Dashboard</Link>
          <Link to="/interview" className="text-sm font-medium text-[#73826F] border-b-2 border-[#8A9A86] pb-1">Mock Interview</Link>
          <Link to="/jobs" className="text-sm font-medium text-[#5C554B] hover:text-[#73826F] transition">Job Matches</Link>
          <span className="text-sm font-medium text-[#6B6358] pl-4 border-l border-[#DCD3C6]">Welcome, {user?.firstName || user?.primaryEmailAddress?.emailAddress}</span>
          <button onClick={handleLogout} className="text-sm px-4 py-2 text-[#5C554B] hover:bg-[#F7F5F2] hover:text-[#33312E] rounded-full transition">Logout</button>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col min-h-0 overflow-hidden">
        <div className="bg-white/80 backdrop-blur-md rounded-t-2xl shadow-sm border border-[#EAE4DB] border-b-0 p-6 flex-none">
          <div className="flex items-center">
             <div className="w-12 h-12 bg-[#8A9A86]/20 rounded-full flex items-center justify-center mr-4 border border-[#8A9A86]/30">
                <Bot className="w-6 h-6 text-[#73826F]" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-[#33312E]" style={{ fontFamily: 'Georgia, serif' }}>Technical Interviewer</h2>
               <p className="text-sm text-[#6B6358]">Adaptive Mock Interview Session</p>
             </div>
          </div>
        </div>

        <div className="flex-1 bg-white/60 backdrop-blur-sm border border-[#EAE4DB] p-6 overflow-y-auto space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center mt-1 ${msg.role === 'user' ? 'bg-[#33312E] ml-3' : 'bg-[#8A9A86] mr-3'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                </div>

                <div className={`relative px-5 py-3 rounded-2xl shadow-sm min-h-[44px] ${
                  msg.role === 'user' 
                    ? 'bg-[#33312E] text-white rounded-tr-sm' 
                    : 'bg-white border border-[#EAE4DB] text-[#33312E] rounded-tl-sm'
                }`}>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content === '' && loading ? (
                      <div className="flex space-x-1.5 p-1 mt-1"><div className="w-2 h-2 bg-[#8A9A86] rounded-full animate-bounce" style={{animationDelay: "0ms"}}></div><div className="w-2 h-2 bg-[#8A9A86] rounded-full animate-bounce" style={{animationDelay: "150ms"}}></div><div className="w-2 h-2 bg-[#8A9A86] rounded-full animate-bounce" style={{animationDelay: "300ms"}}></div></div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  
                  {msg.role === 'ai' && msg.content !== '' && !loading && (
                    <button 
                      onClick={() => speakText(msg.content)}
                      className="absolute -right-8 top-2 p-1.5 text-[#8A9A86] hover:bg-[#EAE4DB] rounded-full transition-colors"
                      title="Read aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-b-2xl shadow-sm border border-[#EAE4DB] border-t-0 p-4 flex-none">
          <form onSubmit={handleSend} className="flex space-x-4">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              disabled={loading}
              className="flex-1 bg-[#F7F5F2] border border-[#DCD3C6] rounded-full px-6 py-3 text-sm text-[#33312E] focus:outline-none focus:ring-2 focus:ring-[#8A9A86] disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="flex-none bg-[#8A9A86] hover:bg-[#73826F] text-white rounded-full px-6 py-3 flex items-center justify-center shadow-sm transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}




