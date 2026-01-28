import { Metadata } from 'next';
import { redis } from '@/lib/redis';
import { RecommendationData } from '@/lib/types';
import { branding } from '@/lib/config';
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
  
  const title = `${data.destination} | ${branding.name}`;
  
  // Build description from available data
  let description = '';
  if (data.hotel) {
    description += `🏨 ${data.hotel.name} - ${data.hotel.price}`;
    if (data.hotel.rating) description += ` ⭐${data.hotel.rating}`;
  }
  if (data.activity) {
    if (description) description += ' | ';
    description += `🎯 ${data.activity.title} - ${data.activity.price}`;
  }
  if (!description) {
    description = `Travel recommendations for ${data.destination}`;
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://autobot-five.vercel.app';
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
  
  return (
    <main 
      className="min-h-screen p-6 md:p-12"
      style={{ background: branding.backgroundGradient }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{branding.logo}</div>
          <div 
            className="text-lg font-semibold mb-2"
            style={{ 
              background: branding.textGradient, 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
            }}
          >
            {branding.name}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {data.destination}
          </h1>
        </div>
        
        {/* Hotel Card */}
        {data.hotel && (
          <div 
            className="rounded-2xl p-6 mb-6 border"
            style={{ 
              background: branding.cardBackground, 
              borderColor: branding.cardBorder,
            }}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🏨</div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-1 text-white">{data.hotel.name}</h2>
                <div className="flex items-center gap-3">
                  <span 
                    className="text-lg font-bold"
                    style={{ color: branding.secondaryColor }}
                  >
                    {data.hotel.price}
                  </span>
                  {data.hotel.rating && (
                    <span className="flex items-center gap-1 text-white">
                      <span style={{ color: branding.secondaryColor }}>⭐</span>
                      {data.hotel.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Activity Card */}
        {data.activity && (
          <div 
            className="rounded-2xl p-6 mb-6 border"
            style={{ 
              background: branding.cardBackground, 
              borderColor: branding.cardBorder,
            }}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🎯</div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-1 text-white">{data.activity.title}</h2>
                <span 
                  className="text-lg font-bold"
                  style={{ color: branding.secondaryColor }}
                >
                  {data.activity.price}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* CTA Button */}
        <a
          href={data.searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full font-bold text-center py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] hover:opacity-90 mb-4"
          style={{ 
            background: branding.buttonGradient,
            color: branding.primaryColor,
          }}
        >
          {branding.ctaText}
        </a>
        
        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <a 
            href={branding.poweredByUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400 transition-colors"
          >
            {branding.poweredBy}
          </a>
        </div>
      </div>
    </main>
  );
}
