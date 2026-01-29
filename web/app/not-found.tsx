import Link from 'next/link';
import { branding } from '@/lib/config';
import { Logo } from '@/components/Logo';

export default function NotFound() {
  return (
    <main 
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{ background: branding.backgroundGradient }}
    >
      {/* Ambient background glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-10 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${branding.secondaryColor} 0%, transparent 70%)` }}
      />
      
      <div className="relative z-10 text-center px-6">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 mb-8">
          <Logo size="lg" />
        </div>
        
        {/* Error message */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
          Not Found
        </h1>
        <p className="text-gray-500 mb-10 max-w-xs mx-auto leading-relaxed">
          This link may have expired or doesn't exist.
        </p>
        
        {/* CTA */}
        <Link
          href="/"
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full transition-transform hover:scale-105 active:scale-95"
        >
          <div 
            className="absolute inset-0 transition-opacity group-hover:opacity-90"
            style={{ background: branding.buttonGradient }}
          />
          <div className="relative flex items-center gap-2 px-6 py-3">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-semibold text-white text-sm tracking-wide">
              Go Home
            </span>
          </div>
        </Link>
      </div>
    </main>
  );
}
