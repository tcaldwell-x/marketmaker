import { branding } from '@/lib/config';

export default function Home() {
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'marketmake67808';
  
  return (
    <main 
      className="min-h-screen relative overflow-hidden"
      style={{ background: branding.backgroundGradient }}
    >
      {/* Ambient background effects */}
      <div 
        className="absolute top-0 left-1/4 w-[600px] h-[600px] opacity-15 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${branding.secondaryColor} 0%, transparent 70%)` }}
      />
      <div 
        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] opacity-10 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${branding.secondaryColor} 0%, transparent 70%)` }}
      />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="text-center max-w-md">
          {/* Logo Badge */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 mb-8 text-5xl">
            {branding.logo}
          </div>
          
          {/* Title */}
          <h1 
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
            style={{ 
              background: branding.textGradient, 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
            }}
          >
            {branding.name}
          </h1>
          
          {/* Tagline */}
          <p className="text-lg text-gray-400 mb-12 leading-relaxed">
            {branding.tagline}
          </p>
          
          {/* How it works */}
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 mb-10 text-left">
            <h2 className="text-[11px] text-gray-500 uppercase tracking-[0.2em] font-semibold mb-6">
              How it works
            </h2>
            
            <div className="space-y-5">
              <Step 
                number={1}
                text="Someone makes a bold claim or prediction on X"
              />
              <Step 
                number={2}
                text={
                  <>
                    Reply mentioning{' '}
                    <code className="px-2 py-0.5 rounded-md bg-white/5 text-white/80 font-mono text-sm">
                      @{botUsername}
                    </code>
                    {' '}to create a market
                  </>
                }
              />
              <Step 
                number={3}
                text="Get a prediction market link to bet on the outcome"
              />
            </div>
          </div>
          
          {/* CTA Button */}
          <a 
            href={`https://x.com/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full transition-transform hover:scale-105 active:scale-95"
          >
            <div 
              className="absolute inset-0 transition-opacity group-hover:opacity-90"
              style={{ background: branding.buttonGradient }}
            />
            <div className="relative flex items-center gap-3 px-8 py-4">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="font-semibold text-white tracking-wide">
                Follow @{botUsername}
              </span>
            </div>
          </a>
          
          {/* Secondary link */}
          <p className="mt-6 text-sm text-gray-500">
            or{' '}
            <a 
              href={`https://x.com/intent/tweet?text=Hey%20@${botUsername}%20`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors underline underline-offset-4"
            >
              try it now
            </a>
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="absolute bottom-6 left-0 right-0 text-center">
        <a 
          href={branding.poweredByUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors tracking-wide"
        >
          {branding.poweredBy}
        </a>
      </footer>
    </main>
  );
}

function Step({ number, text }: { number: number; text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div 
        className="flex-shrink-0 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
      >
        <span className="text-xs font-semibold text-gray-400">{number}</span>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed pt-0.5">{text}</p>
    </div>
  );
}
