/**
 * Generic storable data for any plugin type
 * Supports prediction markets, travel recommendations, restaurant reservations, etc.
 */
export interface RecommendationData {
  // Common fields
  destination: string;  // Primary title (market question, destination, restaurant name, etc.)
  searchUrl: string;    // Action URL
  createdAt: number;
  
  // Type indicator
  type?: 'market' | 'travel' | 'reservation' | 'search';
  
  // Prediction Market fields
  market?: {
    id: string;
    question: string;
    description?: string;
    category: string;
    category_display: string;
    resolution_date: string;
    resolution_date_formatted: string;
    yes_probability: number;
    yes_probability_formatted: string;
    no_probability: number;
    volume?: number;
    volume_formatted?: string;
    traders?: number;
    source_claim?: string;
    status: 'open' | 'resolved' | 'closed';
    is_new?: boolean;  // Whether this was just created vs existing
  };
  
  // Travel (Expedia) fields
  hotel?: {
    name: string;
    price: string;
    rating?: number;
  };
  activity?: {
    title: string;
    price: string;
  };
  
  // Reservation (OpenTable) fields
  reservation?: {
    confirmation_number: string;
    restaurant_name: string;
    cuisine?: string;
    neighborhood?: string;
    address?: string;
    phone?: string;
    date: string;
    date_formatted: string;
    time: string;
    time_formatted: string;
    party_size: number;
    rating?: number;
    price_range?: string;
    special_requests?: string;
  };
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
