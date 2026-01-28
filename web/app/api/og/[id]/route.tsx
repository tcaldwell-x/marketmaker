import { ImageResponse } from '@vercel/og';
import { Redis } from '@upstash/redis';
import { RecommendationData } from '@/lib/types';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';


// Branding config (edge runtime can't use Node.js modules, so we inline the config)
// Dark theme with blue accent for prediction markets
const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'PredictBot',
  logo: process.env.NEXT_PUBLIC_BRAND_LOGO || '📊',
  primaryColor: process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR || '#0a0a0a',
  secondaryColor: process.env.NEXT_PUBLIC_BRAND_SECONDARY_COLOR || '#3b82f6',
  yesColor: process.env.NEXT_PUBLIC_BRAND_YES_COLOR || '#22c55e',
  noColor: process.env.NEXT_PUBLIC_BRAND_NO_COLOR || '#ef4444',
  backgroundGradient: process.env.NEXT_PUBLIC_BRAND_BG_GRADIENT || 
    'linear-gradient(135deg, #0a0a0a 0%, #0f172a 50%, #0a0a0a 100%)',
  textGradient: process.env.NEXT_PUBLIC_BRAND_TEXT_GRADIENT || 
    'linear-gradient(90deg, #3b82f6, #60a5fa)',
  cardBackground: process.env.NEXT_PUBLIC_BRAND_CARD_BG || 'rgba(15, 23, 42, 0.95)',
  accentColor: process.env.NEXT_PUBLIC_BRAND_ACCENT_COLOR || '#ffffff',
  poweredBy: process.env.NEXT_PUBLIC_BRAND_POWERED_BY || 'Prediction Markets',
};

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  let data: RecommendationData | null = null;
  try {
    const raw = await redis.get(`r:${params.id}`);
    console.log(`[OG] Fetched data for ${params.id}:`, raw ? 'found' : 'not found');
    if (raw) {
      data = typeof raw === 'string' ? JSON.parse(raw) : raw as RecommendationData;
      console.log(`[OG] Data type: ${data?.type}, hasMarket: ${!!data?.market}`);
    }
  } catch (err) {
    console.error(`[OG] Redis error for ${params.id}:`, err);
  }
  
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
          <div style={{ display: 'flex', fontSize: 80 }}>{brand.logo}</div>
          <div style={{ display: 'flex', fontSize: 36, color: 'white', marginTop: 20, fontWeight: 700 }}>{brand.name}</div>
          <div style={{ display: 'flex', fontSize: 24, color: '#6b7280', marginTop: 10, fontWeight: 600 }}>Market not found</div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const isMarket = !!data.market;
  const isReservation = !!data.reservation;

  // Prediction Market OG image
  if (isMarket && data.market) {
    const yesPercent = Math.round(data.market.yes_probability * 100);
    const noPercent = 100 - yesPercent;
    
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
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 50, marginRight: 16 }}>{brand.logo}</span>
            <span style={{ 
              fontSize: 32, 
              fontWeight: 700, 
              background: brand.textGradient, 
              backgroundClip: 'text', 
              color: 'transparent',
            }}>
              {brand.name}
            </span>
            <span style={{
              marginLeft: 'auto',
              fontSize: 18,
              fontWeight: 600,
              color: brand.secondaryColor,
              background: 'rgba(59, 130, 246, 0.15)',
              padding: '8px 16px',
              borderRadius: 20,
            }}>
              {data.market.category_display}
            </span>
          </div>

          {/* Market Question */}
          <div style={{ 
            display: 'flex',
            fontSize: 48, 
            fontWeight: 700, 
            color: 'white', 
            marginBottom: 40,
            lineHeight: 1.2,
          }}>
            {data.market.question}
          </div>

          {/* Probability Display */}
          <div style={{ 
            display: 'flex', 
            background: brand.cardBackground, 
            borderRadius: 24, 
            padding: 40,
            marginTop: 'auto',
            marginBottom: 30,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            alignItems: 'center',
          }}>
            {/* YES */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <span style={{ fontSize: 20, color: '#6b7280', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>YES</span>
              <span style={{ fontSize: 72, fontWeight: 700, color: brand.yesColor }}>
                {yesPercent}%
              </span>
            </div>
            
            {/* Divider */}
            <div style={{ width: 2, height: 100, background: 'rgba(255,255,255,0.1)', margin: '0 40px' }} />
            
            {/* NO */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <span style={{ fontSize: 20, color: '#6b7280', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>NO</span>
              <span style={{ fontSize: 72, fontWeight: 700, color: brand.noColor }}>
                {noPercent}%
              </span>
            </div>
            
            {/* Divider */}
            <div style={{ width: 2, height: 100, background: 'rgba(255,255,255,0.1)', margin: '0 40px' }} />
            
            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 16 }}>
                <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Volume</span>
                <span style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>
                  {data.market.volume_formatted || '$0'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolves</span>
                <span style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>
                  {data.market.resolution_date_formatted}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            display: 'flex',
            position: 'absolute', 
            bottom: 30, 
            right: 60, 
            fontSize: 16, 
            color: '#4b5563',
            fontWeight: 600,
          }}>
            {brand.poweredBy}
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // Reservation confirmation OG image (legacy)
  if (isReservation && data.reservation) {
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
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 50, marginRight: 16 }}>🍽️</span>
            <span style={{ 
              fontSize: 32, 
              fontWeight: 700, 
              background: brand.textGradient, 
              backgroundClip: 'text', 
              color: 'transparent',
            }}>
              Reservation
            </span>
          </div>

          {/* Restaurant Name */}
          <div style={{ 
            display: 'flex',
            fontSize: 56, 
            fontWeight: 700, 
            color: 'white', 
            marginBottom: 8,
          }}>
            {data.reservation.restaurant_name}
          </div>
          
          {/* Cuisine & Neighborhood */}
          <div style={{ 
            display: 'flex',
            fontSize: 24, 
            color: '#6b7280', 
            marginBottom: 30,
            fontWeight: 600,
          }}>
            {data.reservation.cuisine}{data.reservation.neighborhood ? ` • ${data.reservation.neighborhood}` : ''}
          </div>

          {/* Reservation Details Card */}
          <div style={{ 
            display: 'flex', 
            background: brand.cardBackground, 
            borderRadius: 16, 
            padding: 30,
            marginTop: 'auto',
            marginBottom: 40,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 14, color: '#6b7280', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>
                {data.reservation.date_formatted}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 14, color: '#6b7280', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>
                {data.reservation.time_formatted}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 14, color: '#6b7280', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Party</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>
                {data.reservation.party_size} guests
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: 14, color: '#6b7280', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirmation</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: brand.secondaryColor }}>
                {data.reservation.confirmation_number}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            display: 'flex',
            position: 'absolute', 
            bottom: 30, 
            right: 60, 
            fontSize: 16, 
            color: '#4b5563',
            fontWeight: 600,
          }}>
            {brand.poweredBy}
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // Travel recommendation OG image (legacy)
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
          display: 'flex',
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
              borderRadius: 16, 
              padding: 24,
              flex: hasBothItems ? 1 : 'none',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <span style={{ fontSize: 40, marginRight: 16 }}>🏨</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                  display: 'flex',
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
              borderRadius: 16, 
              padding: 24,
              flex: hasBothItems ? 1 : 'none',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <span style={{ fontSize: 40, marginRight: 16 }}>🎯</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                  display: 'flex',
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
          display: 'flex',
          position: 'absolute', 
          bottom: 30, 
          right: 60, 
          fontSize: 16, 
          color: '#4b5563',
          fontWeight: 600,
        }}>
          {brand.poweredBy}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
