// X API Tweet types
export interface Tweet {
  id: string;
  text: string;
  author_id?: string;
  conversation_id?: string;
  in_reply_to_user_id?: string;
  created_at?: string;
  referenced_tweets?: ReferencedTweet[];
  attachments?: {
    media_keys?: string[];
  };
}

export interface ReferencedTweet {
  type: 'replied_to' | 'quoted' | 'retweeted';
  id: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
}

// Media types for image understanding
export interface Media {
  media_key: string;
  type: 'photo' | 'video' | 'animated_gif';
  url?: string;           // For photos
  preview_image_url?: string;  // For videos/gifs
  width?: number;
  height?: number;
  alt_text?: string;
}

export interface StreamData {
  data: Tweet;
  includes?: {
    users?: User[];
    tweets?: Tweet[];
    media?: Media[];
  };
  matching_rules?: MatchingRule[];
}

export interface MatchingRule {
  id: string;
  tag?: string;
}

// Rule types
export interface StreamRule {
  id?: string;
  value: string;
  tag?: string;
}

export interface RulesResponse {
  data?: StreamRule[];
  meta: {
    sent: string;
    summary?: {
      created: number;
      not_created: number;
      valid: number;
      invalid: number;
    };
  };
  errors?: ApiError[];
}

export interface ApiError {
  title: string;
  detail: string;
  type: string;
}

// Conversation types
export interface ConversationThread {
  tweets: Tweet[];
  participants: User[];
  originalTweet?: Tweet;
  media?: Media[];  // All media from the conversation
}

// Recommendation types
export interface HotelRecommendation {
  id: string;
  name: string;
  price: string;
  pricePerNight: number;
  totalPrice: number;
  description: string;
  rating?: number;
  reviewCount?: number;
  amenities: string[];
  bookingUrl: string;
  imageUrl?: string;
}

export interface VacationRentalRecommendation {
  id: string;
  name: string;
  propertyType: string;  // "Entire home", "Condo", "Villa", etc.
  price: string;
  pricePerNight: number;
  totalPrice: number;
  bedrooms: number;
  bathrooms: number;
  sleeps: number;
  description: string;
  rating?: number;
  reviewCount?: number;
  amenities: string[];
  bookingUrl: string;
  imageUrl?: string;
}

export interface CarRentalRecommendation {
  id: string;
  company: string;       // "Hertz", "Enterprise", etc.
  carType: string;       // "Economy", "SUV", "Luxury", etc.
  carName: string;       // "Toyota Corolla or similar"
  price: string;
  pricePerDay: number;
  totalPrice: number;
  features: string[];    // "Unlimited mileage", "Free cancellation", etc.
  pickupLocation: string;
  bookingUrl: string;
  imageUrl?: string;
}

export interface ActivityRecommendation {
  id: string;
  title: string;
  price: string;
  priceAmount: number;
  description: string;
  duration?: string;
  rating?: number;
  reviewCount?: number;
  bookingUrl: string;
  imageUrl?: string;
}

export interface RecommendationResponse {
  destination: string;
  checkin?: string;
  checkout?: string;
  hotels: HotelRecommendation[];
  vacationRentals: VacationRentalRecommendation[];
  carRentals: CarRentalRecommendation[];
  activities: ActivityRecommendation[];
  searchUrl: string;  // Link to full Expedia search results
  summary: string;
}
