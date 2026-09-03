import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onFinished }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Ease-out: fast start, slower finish
        const increment = Math.max(1, Math.floor((100 - prev) / 8));
        return Math.min(prev + increment, 100);
      });
    }, 40);

    // Start fade-out after 2.2s
    const fadeTimer = setTimeout(() => setFadeOut(true), 2200);
    // Fully done after 2.8s
    const doneTimer = setTimeout(() => onFinished(), 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinished]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-600 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(145deg, #020617 0%, #0a1628 35%, #0c1e3a 60%, #020617 100%)',
      }}
    >
      {/* Ambient glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: '500px', height: '500px',
            top: '30%', left: '40%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(0,138,209,0.15) 0%, transparent 70%)',
            animation: 'splashPulse 3s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: '350px', height: '350px',
            top: '60%', left: '55%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(0,138,209,0.08) 0%, transparent 70%)',
            animation: 'splashPulse 3s ease-in-out infinite 1s',
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `rgba(0, 138, 209, ${Math.random() * 0.4 + 0.1})`,
              animation: `splashFloat ${Math.random() * 4 + 3}s ease-in-out infinite ${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center">
        {/* Logo icon */}
        <div
          className="relative mb-8"
          style={{ animation: 'splashLogoIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
          {/* Outer ring glow */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              transform: 'scale(1.3)',
              background: 'radial-gradient(circle, rgba(0,138,209,0.3) 0%, transparent 70%)',
              animation: 'splashPulse 2s ease-in-out infinite',
            }}
          />
          {/* Icon container */}
          <div
            className="relative flex items-center justify-center rounded-2xl shadow-2xl"
            style={{
              width: '88px', height: '88px',
              background: 'linear-gradient(135deg, #009ae5 0%, #008AD1 50%, #0070aa 100%)',
              boxShadow: '0 0 60px rgba(0,138,209,0.4), 0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            {/* BookOpen SVG */}
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
        </div>

        {/* Brand name */}
        <h1
          className="text-4xl font-bold tracking-tight text-white mb-2"
          style={{
            opacity: 0,
            animation: 'splashTextIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards',
          }}
        >
          OpenSkools
        </h1>

        {/* Subtitle */}
        <p
          className="text-sm font-semibold uppercase tracking-[0.35em] mb-10"
          style={{
            opacity: 0,
            color: '#008AD1',
            animation: 'splashTextIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards',
          }}
        >
          Finance Manager
        </p>

        {/* Progress bar */}
        <div
          className="relative overflow-hidden rounded-full"
          style={{
            width: '220px', height: '3px',
            background: 'rgba(255,255,255,0.08)',
            opacity: 0,
            animation: 'splashTextIn 0.4s ease 0.7s forwards',
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-100 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #008AD1, #33a1da, #008AD1)',
              boxShadow: '0 0 12px rgba(0,138,209,0.5)',
            }}
          />
        </div>

        {/* Loading text */}
        <p
          className="mt-4 text-xs text-slate-500 tracking-wider"
          style={{
            opacity: 0,
            animation: 'splashTextIn 0.4s ease 0.9s forwards',
          }}
        >
          {progress < 100 ? 'Loading your workspace...' : 'Ready'}
        </p>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes splashPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes splashFloat {
          0%, 100% { transform: translateY(0px); opacity: 0.3; }
          50% { transform: translateY(-20px); opacity: 0.8; }
        }
        @keyframes splashLogoIn {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes splashTextIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
