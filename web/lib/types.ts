/**
 * Recommendation data stored in KV
 */
export interface RecommendationData {
  destination: string;
  hotel?: {
    name: string;
    price: string;
    rating?: number;
  };
  activity?: {
    title: string;
    price: string;
  };
  searchUrl: string;
  createdAt: number;
}

/**
 * Generate a short unique ID (8 chars)
 */
export function generateShortId(): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
