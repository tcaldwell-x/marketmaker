import { ImageResponse } from '@vercel/og';
import { Redis } from '@upstash/redis';
import { RecommendationData } from '@/lib/types';

export const runtime = 'edge';

// Branding config (edge runtime can't use Node.js modules, so we inline the config)
// Default colors based on Expedia brand: Blue #00355F, Yellow #ffc60b, White #ffffff
const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'BookingBot',
  logo: process.env.NEXT_PUBLIC_BRAND_LOGO || '🛫',
  primaryColor: process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR || '#00355F',
  secondaryColor: process.env.NEXT_PUBLIC_BRAND_SECONDARY_COLOR || '#ffc60b',
  backgroundGradient: process.env.NEXT_PUBLIC_BRAND_BG_GRADIENT || 
    'linear-gradient(135deg, #00355F 0%, #001a2e 50%, #002244 100%)',
  textGradient: process.env.NEXT_PUBLIC_BRAND_TEXT_GRADIENT || 
    'linear-gradient(90deg, #ffc60b, #ffe066)',
  cardBackground: process.env.NEXT_PUBLIC_BRAND_CARD_BG || 'rgba(0, 53, 95, 0.7)',
  accentColor: process.env.NEXT_PUBLIC_BRAND_ACCENT_COLOR || '#ffffff',
  poweredBy: process.env.NEXT_PUBLIC_BRAND_POWERED_BY || 'Powered by Expedia',
};

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  let data: RecommendationData | null = null;
  try {
    const raw = await redis.get(`r:${params.id}`);
    if (raw) data = typeof raw === 'string' ? JSON.parse(raw) : raw as RecommendationData;
  } catch { /* ignore */ }
  
  // Not found state
  if (!data) {
    return new ImageResponse(
      (
        <div style={{ 
          height: '100%', 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: brand.backgroundGradient,
        }}>
          <div style={{ fontSize: 80 }}>{brand.logo}</div>
          <div style={{ fontSize: 36, color: 'white', marginTop: 20, fontWeight: 600 }}>{brand.name}</div>
          <div style={{ fontSize: 24, color: '#94a3b8', marginTop: 10 }}>Recommendation not found</div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const hasHotel = !!data.hotel;
  const hasActivity = !!data.activity;
  const hasBothItems = hasHotel && hasActivity;

  return new ImageResponse(
    (
      <div style={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        background: brand.backgroundGradient, 
        padding: 60,
      }}>
        {/* Header with logo and brand name */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
          <span style={{ fontSize: 50, marginRight: 16 }}>{brand.logo}</span>
          <span style={{ 
            fontSize: 36, 
            fontWeight: 700, 
            background: brand.textGradient, 
            backgroundClip: 'text', 
            color: 'transparent',
          }}>
            {brand.name}
          </span>
        </div>

        {/* Destination */}
        <div style={{ 
          fontSize: 72, 
          fontWeight: 700, 
          color: 'white', 
          marginBottom: 30,
        }}>
          {data.destination}
        </div>

        {/* Recommendations - flexible layout */}
        <div style={{ 
          display: 'flex', 
          flexDirection: hasBothItems ? 'row' : 'column',
          gap: 20, 
          marginTop: 'auto',
          marginBottom: 40,
        }}>
          {/* Hotel card */}
          {data.hotel && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              background: brand.cardBackground, 
              borderRadius: 20, 
              padding: 24,
              flex: hasBothItems ? 1 : 'none',
              border: `2px solid rgba(255, 198, 11, 0.3)`,
            }}>
              <span style={{ fontSize: 40, marginRight: 16 }}>🏨</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                  fontSize: hasBothItems ? 24 : 32, 
                  fontWeight: 600, 
                  color: 'white', 
                  marginBottom: 6,
                }}>
                  {data.hotel.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ 
                    fontSize: hasBothItems ? 24 : 28, 
                    fontWeight: 700, 
                    color: brand.secondaryColor,
                  }}>
                    {data.hotel.price}
                  </span>
                  {data.hotel.rating && (
                    <span style={{ fontSize: hasBothItems ? 20 : 24, color: brand.secondaryColor }}>
                      ⭐ {data.hotel.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Activity card */}
          {data.activity && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              background: brand.cardBackground, 
              borderRadius: 20, 
              padding: 24,
              flex: hasBothItems ? 1 : 'none',
              border: `2px solid rgba(255, 198, 11, 0.3)`,
            }}>
              <span style={{ fontSize: 40, marginRight: 16 }}>🎯</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                  fontSize: hasBothItems ? 24 : 32, 
                  fontWeight: 600, 
                  color: 'white', 
                  marginBottom: 6,
                }}>
                  {data.activity.title}
                </div>
                <span style={{ 
                  fontSize: hasBothItems ? 24 : 28, 
                  fontWeight: 700, 
                  color: brand.secondaryColor,
                }}>
                  {data.activity.price}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          position: 'absolute', 
          bottom: 30, 
          right: 60, 
          fontSize: 18, 
          color: '#64748b',
        }}>
          {brand.poweredBy}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
