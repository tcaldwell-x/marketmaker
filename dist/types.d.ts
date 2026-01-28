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
export interface Media {
    media_key: string;
    type: 'photo' | 'video' | 'animated_gif';
    url?: string;
    preview_image_url?: string;
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
export interface ConversationThread {
    tweets: Tweet[];
    participants: User[];
    originalTweet?: Tweet;
    media?: Media[];
}
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
    propertyType: string;
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
    company: string;
    carType: string;
    carName: string;
    price: string;
    pricePerDay: number;
    totalPrice: number;
    features: string[];
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
    searchUrl: string;
    summary: string;
}
//# sourceMappingURL=types.d.ts.map