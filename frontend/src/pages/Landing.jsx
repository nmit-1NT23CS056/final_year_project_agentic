import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Compass, BrainCircuit, TrendingUp, Briefcase, PenTool } from 'lucide-react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

export default function Landing() {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#F7F5F2] text-[#33312E] font-sans">
      
      {/* Dynamic Particle Network - Hero Only */}
      <div className="absolute top-0 left-0 w-full h-screen z-0">
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            fpsLimit: 120,
            interactivity: {
              events: {
                onHover: {
                  enable: true,
                  mode: "grab",
                },
              },
              modes: {
                grab: {
                  distance: 200,
                  links: {
                    opacity: 0.6,
                    color: "#A6947F"
                  }
                },
              },
            },
            particles: {
              color: { value: "#B8A792" },
              links: {
                color: "#C4B9A8",
                distance: 180,
                enable: true,
                opacity: 0.5,
                width: 1.5,
              },
              move: {
                enable: true,
                speed: 1,
                outModes: { default: "bounce" },
              },
              number: {
                density: { enable: true, area: 800 },
                value: 70,
              },
              opacity: { value: 0.6 },
              shape: { type: "circle" },
              size: { value: { min: 2, max: 5 } },
            },
            detectRetina: true,
          }}
          className="absolute inset-0"
        />
        
        {/* Soft Gradients */}
        <div className="absolute top-0 right-0 w-[80vw] h-[80vw] bg-gradient-to-bl from-[#EAE4DB] to-transparent rounded-full blur-[100px] opacity-70 transform translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-gradient-to-tr from-[#E6DFD5] to-transparent rounded-full blur-[100px] opacity-60 transform -translate-x-1/4 translate-y-1/4 pointer-events-none"></div>
      </div>

      <div className="relative z-10 flex flex-col">
        
        {/* Hero Wrapper (100vh) */}
        <div className="min-h-screen flex flex-col pointer-events-none">
          {/* Navbar */}
          <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full pointer-events-auto">
            <div className="flex items-center space-x-2">
              <Compass className="w-6 h-6 text-[#5C554B]" />
              <span className="text-xl font-bold tracking-tight text-[#33312E]">Pathfinder</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#5C554B]">
              <Link to="/login" className="hover:text-[#33312E] transition-colors relative z-50">Sign In</Link>
              <Link to="/register" className="px-5 py-2.5 bg-[#B8A792] hover:bg-[#A6947F] text-white rounded-full transition-colors shadow-sm relative z-50">
                Get Started
              </Link>
            </div>
          </nav>

          {/* Hero Section */}
          <main className="flex-grow flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto mt-[-10vh] pointer-events-auto relative">
            
            {/* Floating Line-Art Illustrations */}
            <div className="absolute inset-0 pointer-events-none overflow-visible max-w-7xl mx-auto hidden md:block z-10">
              {/* Left side doodle */}
              <div className="absolute top-[65%] -left-10 lg:-left-24 xl:-left-40 text-[#33312E] opacity-90 transform -rotate-6">
                <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
                  {/* Telescope and stars */}
                  <path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.505-4.44" />
                  <path d="m13.56 11.747 4.332-.924" />
                  <path d="m16 21-3.105-6.21" />
                  <path d="M16.485 5.33 20.6 6.205a1.026 1.026 0 0 1 .778 1.199l-.088.4a1.026 1.026 0 0 1-1.21.758l-4.116-.875" />
                  <path d="m6.78 13.982 3.106 6.212" />
                  <circle cx="2" cy="4" r="1" />
                  <circle cx="8" cy="2" r="1" />
                  <path d="M4 10h1" />
                </svg>
              </div>

              {/* Right side doodle */}
              <div className="absolute top-[65%] -right-10 lg:-right-24 xl:-right-40 text-[#33312E] opacity-90">
                <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
                  {/* Desk, Laptop, Coffee doodle */}
                  <rect x="2" y="14" width="14" height="4" rx="1" />
                  <path d="M0 18h18" />
                  <path d="M14 14l2-8 3 1-2 8" />
                  <path d="M20 22v-6h-2" />
                  <path d="M17 9l1-3c.5-1.5 2.5-1.5 3 0l1 3" />
                  <path d="M4 14v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3" />
                  <path d="M8 12a2 2 0 0 1 2 2" />
                  <path d="M5 8v1" />
                  <path d="M7 7v2" />
                </svg>
              </div>
            </div>

            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#EAE4DB] text-[#7A6F62] text-sm font-medium mb-8 shadow-sm relative z-20">
              Welcome to Pathfinder
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-[#33312E] tracking-tight leading-[1.1] mb-6 relative z-20" style={{ fontFamily: 'Georgia, serif' }}>
              Navigate Your Future <br /> with AI Precision
            </h1>
            
            <p className="text-lg md:text-xl text-[#6B6358] max-w-2xl mx-auto mb-10 leading-relaxed relative z-20">
              Unlock personalized career guidance and strategic insights powered by advanced artificial intelligence.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 relative z-20">
              <Link to="/register" className="w-full sm:w-auto px-8 py-3.5 bg-[#B8A792] hover:bg-[#A6947F] text-white font-medium rounded-full transition-colors shadow-sm text-lg">
                Get Started
              </Link>
              <a href="#features" className="w-full sm:w-auto px-8 py-3.5 bg-transparent border border-[#5C554B] text-[#33312E] hover:bg-[#EAE4DB] font-medium rounded-full transition-colors text-lg">
                Learn More
              </a>
            </div>
          </main>
        </div>

        {/* Features Section */}
        <section id="features" className="w-full py-24 pointer-events-auto z-20 relative">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#33312E] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                Intelligent tools for your career journey.
              </h2>
              <p className="text-[#6B6358] max-w-2xl mx-auto">
                Our autonomous agents do the heavy lifting—from analyzing the market to drafting your cover letters.
              </p>
            </div>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              {/* Feature 1 */}
              <div className="bg-[#F7F5F2] p-8 rounded-2xl shadow-sm border border-[#DCD3C6] hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-[#EAE4DB] rounded-full flex items-center justify-center mb-6 text-[#7A6F62]">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#33312E] mb-3">Market-Driven Diagnostics</h3>
                <p className="text-[#6B6358] leading-relaxed">
                  Upload your resume and let our AI compare your skills against live job market data. Instantly discover your missing market skills and see your real-time Market Demand Score.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#F7F5F2] p-8 rounded-2xl shadow-sm border border-[#DCD3C6] hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-[#EAE4DB] rounded-full flex items-center justify-center mb-6 text-[#7A6F62]">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#33312E] mb-3">Autonomous Career Roadmaps</h3>
                <p className="text-[#6B6358] leading-relaxed">
                  Don't just find gaps—close them. Our Multi-Agent System (Strategist & Critic AI) works together to build a personalized, step-by-step learning path designed to elevate your career.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#F7F5F2] p-8 rounded-2xl shadow-sm border border-[#DCD3C6] hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-[#EAE4DB] rounded-full flex items-center justify-center mb-6 text-[#7A6F62]">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#33312E] mb-3">Precision Job Matching</h3>
                <p className="text-[#6B6358] leading-relaxed">
                  Stop scrolling endlessly. Our Job Agent continuously scans the web for remote roles that perfectly align with your verified skills and desired career trajectory.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-[#F7F5F2] p-8 rounded-2xl shadow-sm border border-[#DCD3C6] hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-[#EAE4DB] rounded-full flex items-center justify-center mb-6 text-[#7A6F62]">
                  <PenTool className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#33312E] mb-3">Tailored Cover Letters</h3>
                <p className="text-[#6B6358] leading-relaxed">
                  Apply with confidence. For every job match, our AI drafts a highly customized, 150-word cover letter that perfectly maps your exact experience to the job's requirements.
                </p>
              </div>

            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="py-8 text-center text-[#8C8477] text-sm border-t border-[#DCD3C6] w-full z-20 relative">
          Copyright Pathfinder. All rights reserved.
        </footer>

      </div>
    </div>
  );
}
