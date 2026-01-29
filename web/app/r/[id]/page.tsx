import { Metadata } from 'next';
import Image from 'next/image';
import { redis } from '@/lib/redis';
import { RecommendationData } from '@/lib/types';
import { branding } from '@/lib/config';
import { Logo } from '@/components/Logo';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { id: string };
}

async function getData(id: string): Promise<RecommendationData | null> {
  try {
    const data = await redis.get(`r:${id}`);
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data as RecommendationData;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getData(params.id);
  
  if (!data) return { title: 'Not Found' };
  
  let title: string;
  let description: string;
  
  if (data.market) {
    title = `${data.market.question} | ${branding.name}`;
    description = `📊 ${data.market.yes_probability_formatted} YES · ${data.market.category_display} · Resolves ${data.market.resolution_date_formatted}`;
  } else if (data.reservation) {
    title = `Reservation at ${data.reservation.restaurant_name} | ${branding.name}`;
    description = `🍽️ Table for ${data.reservation.party_size} on ${data.reservation.date_formatted} at ${data.reservation.time_formatted}`;
  } else {
    title = `${data.destination} | ${branding.name}`;
    description = '';
    if (data.hotel) {
      description += `🏨 ${data.hotel.name} - ${data.hotel.price}`;
      if (data.hotel.rating) description += ` ⭐${data.hotel.rating}`;
    }
    if (data.activity) {
      if (description) description += ' | ';
      description += `🎯 ${data.activity.title} - ${data.activity.price}`;
    }
    if (!description) {
      description = `Predictions for ${data.destination}`;
    }
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marketmaker-nine.vercel.app';
  const ogImageUrl = `${baseUrl}/api/og/${params.id}`;
  
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: ogImageUrl, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl] },
  };
}

export default async function RecommendationPage({ params }: PageProps) {
  const data = await getData(params.id);
  
  if (!data) notFound();
  
  const isMarket = !!data.market;
  const isReservation = !!data.reservation;
  
  return (
    <main 
      className="min-h-screen relative overflow-hidden"
      style={{ background: branding.backgroundGradient }}
    >
      {/* Ambient background glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-20 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${branding.secondaryColor} 0%, transparent 70%)` }}
      />
      
      <div className="relative z-10 px-6 py-12 md:py-20">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <header className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
              <Logo size="sm" />
              <span className="text-sm font-semibold tracking-wide text-white">
                {branding.name}
              </span>
            </div>
          </header>
          
          {/* Prediction Market Content */}
          {isMarket && data.market && (
            <div className="space-y-4">
              {/* Market Question */}
              <div className="text-center mb-6">
                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide mb-4"
                     style={{ background: 'rgba(59, 130, 246, 0.2)', color: branding.secondaryColor }}>
                  {data.market.category_display}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
                  {data.market.question}
                </h1>
              </div>
              
              {/* Probability Display */}
              <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  {/* YES */}
                  <div className="text-center flex-1">
                    <div className="text-[11px] text-gray-500 uppercase tracking-[0.2em] font-semibold mb-2">
                      YES
                    </div>
                    <div 
                      className="text-4xl md:text-5xl font-bold"
                      style={{ color: branding.yesColor }}
                    >
                      {data.market.yes_probability_formatted}
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="w-px h-16 bg-white/10 mx-4" />
                  
                  {/* NO */}
                  <div className="text-center flex-1">
                    <div className="text-[11px] text-gray-500 uppercase tracking-[0.2em] font-semibold mb-2">
                      NO
                    </div>
                    <div 
                      className="text-4xl md:text-5xl font-bold"
                      style={{ color: branding.noColor }}
                    >
                      {Math.round((1 - data.market.yes_probability) * 100)}%
                    </div>
                  </div>
                </div>
                
                {/* Probability Bar */}
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: data.market.yes_probability_formatted,
                      background: `linear-gradient(90deg, ${branding.yesColor}, ${branding.yesColor}dd)`
                    }}
                  />
                </div>
              </div>
              
              {/* Market Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <DetailCard 
                  label="Resolves" 
                  value={data.market.resolution_date_formatted}
                  icon="📅"
                />
                <DetailCard 
                  label="Volume" 
                  value={data.market.volume_formatted || '$0'}
                  icon="💰"
                  highlight
                />
                <DetailCard 
                  label="Traders" 
                  value={data.market.traders?.toString() || '0'}
                  icon="👥"
                />
                <DetailCard 
                  label="Status" 
                  value={data.market.status.charAt(0).toUpperCase() + data.market.status.slice(1)}
                  icon="📊"
                />
              </div>
              
              {/* Description */}
              {data.market.description && (
                <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5">
                  <div className="text-[11px] text-gray-500 uppercase tracking-[0.15em] font-semibold mb-2">
                    Resolution Criteria
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {data.market.description}
                  </p>
                </div>
              )}
              
              {/* Source Claim */}
              {data.market.source_claim && (
                <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5">
                  <div className="text-[11px] text-gray-500 uppercase tracking-[0.15em] font-semibold mb-2">
                    Original Claim
                  </div>
                  <p className="text-white/60 text-sm italic">
                    "{data.market.source_claim}"
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Reservation Content (Legacy) */}
          {isReservation && data.reservation && (
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3 text-center">
                {data.reservation.restaurant_name}
              </h1>
              
              {data.reservation.cuisine && (
                <p className="text-gray-400 font-medium text-center">
                  {data.reservation.cuisine}
                  {data.reservation.neighborhood && ` · ${data.reservation.neighborhood}`}
                </p>
              )}
              
              {/* Confirmation Badge */}
              <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6">
                <div className="relative text-center">
                  <div className="text-[11px] text-gray-500 uppercase tracking-[0.2em] font-semibold mb-3">
                    Confirmation
                  </div>
                  <div 
                    className="text-2xl md:text-3xl font-bold tracking-wide"
                    style={{ color: branding.secondaryColor }}
                  >
                    {data.reservation.confirmation_number}
                  </div>
                </div>
              </div>
              
              {/* Reservation Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <DetailCard label="Date" value={data.reservation.date_formatted} icon="📅" />
                <DetailCard label="Time" value={data.reservation.time_formatted} icon="🕐" />
                <DetailCard label="Party Size" value={`${data.reservation.party_size} guests`} icon="👥" />
                <DetailCard label="Price Range" value={data.reservation.price_range || '$$$'} icon="💎" highlight />
              </div>
            </div>
          )}
          
          {/* Travel Content (Legacy) */}
          {!isMarket && !isReservation && (
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3 text-center">
                {data.destination}
              </h1>
              
              {data.hotel && (
                <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                      🏨
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-white truncate mb-1">
                        {data.hotel.name}
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold" style={{ color: branding.secondaryColor }}>
                          {data.hotel.price}
                        </span>
                        {data.hotel.rating && (
                          <span className="flex items-center gap-1 text-sm text-white/60">
                            <span className="text-yellow-500">★</span>
                            {data.hotel.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {data.activity && (
                <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                      🎯
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-white truncate mb-1">
                        {data.activity.title}
                      </h2>
                      <span className="text-lg font-bold" style={{ color: branding.secondaryColor }}>
                        {data.activity.price}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* CTA Button */}
          <div className="mt-8">
            <a
              href={data.searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block w-full overflow-hidden rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div 
                className="absolute inset-0 transition-opacity group-hover:opacity-90"
                style={{ background: branding.buttonGradient }}
              />
              <div className="relative px-6 py-4 text-center">
                <span className="font-semibold text-white tracking-wide">
                  {branding.ctaText}
                </span>
              </div>
            </a>
          </div>
          
          {/* Footer */}
          <footer className="mt-12 text-center">
            <a 
              href={branding.poweredByUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 transition-colors tracking-wide"
            >
              <span>Powered by</span>
              <Image 
                src="/logo.png" 
                alt="FanDuel" 
                width={80} 
                height={20} 
                className="opacity-60 hover:opacity-100 transition-opacity"
              />
            </a>
          </footer>
        </div>
      </div>
    </main>
  );
}

function DetailCard({ 
  label, 
  value, 
  icon, 
  highlight = false 
}: { 
  label: string; 
  value: string; 
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-4">
      <div className="text-[10px] text-gray-500 uppercase tracking-[0.15em] font-semibold mb-2">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-base opacity-60">{icon}</span>
        <span 
          className={`font-semibold truncate ${highlight ? '' : 'text-white'}`}
          style={highlight ? { color: branding.secondaryColor } : undefined}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
