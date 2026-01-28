import { branding } from '@/lib/config';

export default function Home() {
  // Get bot username from env or use default
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'bookingbot';
  
  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center p-8"
      style={{ background: branding.backgroundGradient }}
    >
      <div className="text-center max-w-2xl">
        <div className="text-6xl mb-6">{branding.logo}</div>
        <h1 
          className="text-4xl font-bold mb-4"
          style={{ 
            background: branding.textGradient, 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
          }}
        >
          {branding.name}
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          {branding.tagline}
        </p>
        
        <div 
          className="rounded-xl p-6 mb-8 text-left border"
          style={{ 
            background: branding.cardBackground,
            borderColor: branding.cardBorder,
          }}
        >
          <h2 
            className="text-lg font-semibold mb-3"
            style={{ color: branding.primaryColor }}
          >
            How it works
          </h2>
          <ol className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-2xl">1️⃣</span>
              <span>
                Tweet about your travel plans and mention{' '}
                <code 
                  className="px-2 py-0.5 rounded"
                  style={{ background: branding.cardBackground }}
                >
                  @{botUsername}
                </code>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">2️⃣</span>
              <span>{branding.name} analyzes your conversation for destinations, dates, and preferences</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">3️⃣</span>
              <span>Get personalized recommendations with booking links</span>
            </li>
          </ol>
        </div>
        
        <a 
          href={`https://x.com/${botUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full transition-opacity hover:opacity-90"
          style={{ background: branding.buttonGradient, color: branding.primaryColor }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Follow @{botUsername}
        </a>
      </div>
      
      <footer className="absolute bottom-4 text-gray-500 text-sm">
        <a 
          href={branding.poweredByUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-400 transition-colors"
        >
          {branding.poweredBy}
        </a>
      </footer>
    </main>
  );
}
