import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { RecommendationData, generateShortId } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.destination) {
      return NextResponse.json({ error: 'destination required' }, { status: 400 });
    }
    
    const id = generateShortId();
    
    const data: RecommendationData = {
      destination: body.destination,
      type: body.type || 'market',
      // Prediction market data
      market: body.market,
      // Legacy travel data (for backward compatibility)
      hotel: body.hotel,
      activity: body.activity,
      reservation: body.reservation,
      searchUrl: body.searchUrl || 'https://marketmaker-nine.vercel.app',
      createdAt: Date.now(),
    };
    
    // Store with 30-day TTL (2592000 seconds)
    await redis.set(`r:${id}`, JSON.stringify(data), { ex: 2592000 });
    
    console.log(`[API] Stored ${data.type || 'market'} data with id: ${id}`);
    console.log(`[API] hasMarket: ${!!data.market}, marketId: ${data.market?.id}`);
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marketmaker-nine.vercel.app';
    
    return NextResponse.json({ id, url: `${baseUrl}/r/${id}` });
  } catch (error) {
    console.error('Error storing recommendation:', error);
    return NextResponse.json({ error: 'Failed to store' }, { status: 500 });
  }
}
