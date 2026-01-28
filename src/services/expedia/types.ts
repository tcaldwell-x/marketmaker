/**
 * Expedia Group API Types
 * 
 * Rapid API (Hotels): https://developers.expediagroup.com/docs/rapid
 * Activities API: https://developers.expediagroup.com/docs/activities
 */

// ============================================
// HOTEL TYPES (Rapid API)
// ============================================

export interface HotelSearchRequest {
  checkin: string;        // YYYY-MM-DD
  checkout: string;       // YYYY-MM-DD
  currency: string;       // USD, EUR, etc.
  language: string;       // en-US
  country_code: string;   // US, GB, etc.
  occupancy: Occupancy[];
  sales_channel: 'website' | 'mobile_app' | 'mobile_web' | 'cache';
  sales_environment: 'hotel_only' | 'hotel_package';
  sort_type?: 'preferred' | 'distance' | 'price:asc' | 'price:desc' | 'review' | 'star_rating';
  rate_plan_count?: number;
  // Location - one of these required
  region_id?: string;
  property_id?: string[];
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface Occupancy {
  adults: number;
  children?: ChildAge[];
}

export interface ChildAge {
  age: number;
}

export interface Property {
  property_id: string;
  name: string;
  address: Address;
  ratings: Ratings;
  location: GeoLocation;
  phone?: string;
  category: PropertyCategory;
  amenities?: Record<string, Amenity>;
  images?: PropertyImage[];
  rooms?: Room[];
}

export interface Address {
  line_1: string;
  line_2?: string;
  city: string;
  state_province_code?: string;
  state_province_name?: string;
  postal_code?: string;
  country_code: string;
}

export interface Ratings {
  property?: {
    rating: string;
    type: 'Star' | 'Diamond' | 'Crown';
  };
  guest?: {
    count: number;
    overall: string;
    cleanliness?: string;
    service?: string;
    comfort?: string;
  };
}

export interface GeoLocation {
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface PropertyCategory {
  id: string;
  name: string;
}

export interface Amenity {
  id: string;
  name: string;
}

export interface PropertyImage {
  caption?: string;
  hero_image?: boolean;
  category?: number;
  links?: {
    '350px'?: { href: string };
    '70px'?: { href: string };
    '1000px'?: { href: string };
  };
}

export interface Room {
  id: string;
  name: string;
  descriptions?: {
    overview?: string;
  };
  amenities?: Record<string, Amenity>;
  rates?: Rate[];
}

export interface Rate {
  id: string;
  status: 'available' | 'sold_out';
  available_rooms?: number;
  refundable?: boolean;
  occupancy_pricing?: Record<string, OccupancyPricing>;
}

export interface OccupancyPricing {
  nightly?: Array<{
    type: string;
    value: string;
    currency: string;
  }>;
  totals?: {
    inclusive?: {
      request_currency?: {
        value: string;
        currency: string;
      };
    };
  };
}

export interface Region {
  id: string;
  type: string;
  name: string;
  name_full: string;
  country_code?: string;
  coordinates?: {
    center_latitude: number;
    center_longitude: number;
  };
}

// ============================================
// ACTIVITIES TYPES
// ============================================

export interface ActivitySearchRequest {
  location: string;       // City name or region
  start_date: string;     // YYYY-MM-DD
  end_date: string;       // YYYY-MM-DD
  currency?: string;
  language?: string;
  travelers?: number;
  category?: ActivityCategory;
}

export type ActivityCategory = 
  | 'tours'
  | 'attractions'
  | 'outdoor'
  | 'food_drink'
  | 'nightlife'
  | 'shows_events'
  | 'transportation'
  | 'wellness';

export interface Activity {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  duration?: ActivityDuration;
  price: ActivityPrice;
  rating?: ActivityRating;
  images?: ActivityImage[];
  categories?: string[];
  location?: ActivityLocation;
  highlights?: string[];
  includes?: string[];
  booking_type?: 'instant' | 'request';
  cancellation_policy?: string;
  deep_link?: string;
}

export interface ActivityDuration {
  value: number;
  unit: 'minutes' | 'hours' | 'days';
  formatted?: string;
}

export interface ActivityPrice {
  amount: number;
  currency: string;
  formatted: string;
  per_person?: boolean;
}

export interface ActivityRating {
  average: number;
  count: number;
}

export interface ActivityImage {
  url: string;
  caption?: string;
}

export interface ActivityLocation {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

// ============================================
// CAR RENTAL TYPES
// ============================================

export interface CarSearchRequest {
  pickup_location: string;    // Airport code or city
  dropoff_location?: string;  // If different from pickup
  pickup_datetime: string;    // ISO datetime
  dropoff_datetime: string;   // ISO datetime
  currency?: string;
  country_code?: string;
}

export interface CarRental {
  id: string;
  supplier: CarSupplier;
  vehicle: Vehicle;
  rate: CarRate;
  pickup: CarLocation;
  dropoff: CarLocation;
  features: string[];
  policies: CarPolicies;
  deep_link?: string;
}

export interface CarSupplier {
  code: string;
  name: string;         // "Hertz", "Enterprise", etc.
  logo_url?: string;
}

export interface Vehicle {
  category: string;     // "Economy", "Compact", "SUV", etc.
  type: string;         // "Car", "SUV", "Van", etc.
  description: string;  // "Toyota Corolla or similar"
  capacity: {
    passengers: number;
    bags_large: number;
    bags_small: number;
  };
  transmission: 'automatic' | 'manual';
  air_conditioning: boolean;
  image_url?: string;
}

export interface CarRate {
  total: {
    amount: number;
    currency: string;
  };
  per_day: {
    amount: number;
    currency: string;
  };
  includes_taxes: boolean;
}

export interface CarLocation {
  type: 'airport' | 'city' | 'rail';
  code?: string;        // Airport code
  name: string;
  address?: string;
  datetime: string;
}

export interface CarPolicies {
  mileage: 'unlimited' | 'limited';
  fuel_policy: string;
  free_cancellation: boolean;
  cancellation_deadline?: string;
}

// ============================================
// VRBO / VACATION RENTAL TYPES
// ============================================

export interface VacationRentalSearchRequest {
  region_id?: string;
  destination?: string;
  checkin: string;
  checkout: string;
  adults: number;
  children?: number;
  pets?: boolean;
  min_bedrooms?: number;
  property_type?: VacationRentalType[];
  amenities?: string[];
  currency?: string;
}

export type VacationRentalType = 
  | 'house'
  | 'apartment'
  | 'condo'
  | 'villa'
  | 'cabin'
  | 'cottage'
  | 'townhouse'
  | 'bungalow';

export interface VacationRental {
  id: string;
  name: string;
  property_type: string;
  headline: string;
  description: string;
  location: VacationRentalLocation;
  bedrooms: number;
  bathrooms: number;
  sleeps: number;
  amenities: VacationRentalAmenity[];
  images: VacationRentalImage[];
  rating?: VacationRentalRating;
  pricing: VacationRentalPricing;
  availability: VacationRentalAvailability;
  policies: VacationRentalPolicies;
  host?: VacationRentalHost;
  deep_link?: string;
}

export interface VacationRentalLocation {
  city: string;
  region: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface VacationRentalAmenity {
  id: string;
  name: string;
  category: string;  // "Kitchen", "Pool", "Entertainment", etc.
}

export interface VacationRentalImage {
  url: string;
  caption?: string;
  primary?: boolean;
}

export interface VacationRentalRating {
  overall: number;
  review_count: number;
  cleanliness?: number;
  communication?: number;
  location?: number;
  value?: number;
}

export interface VacationRentalPricing {
  total: {
    amount: number;
    currency: string;
  };
  per_night: {
    amount: number;
    currency: string;
  };
  cleaning_fee?: {
    amount: number;
    currency: string;
  };
  service_fee?: {
    amount: number;
    currency: string;
  };
}

export interface VacationRentalAvailability {
  available: boolean;
  min_nights?: number;
  max_nights?: number;
  instant_book: boolean;
}

export interface VacationRentalPolicies {
  cancellation: string;
  check_in_time: string;
  check_out_time: string;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  events_allowed: boolean;
}

export interface VacationRentalHost {
  id: string;
  name: string;
  response_rate?: number;
  response_time?: string;
  superhost?: boolean;
}

// ============================================
// SIMPLIFIED RESULT TYPES (for bot responses)
// ============================================

export interface HotelResult {
  id: string;
  name: string;
  star_rating: number;
  guest_rating?: number;
  review_count?: number;
  address: string;
  city: string;
  price_per_night: number;
  total_price: number;
  currency: string;
  refundable: boolean;
  amenities: string[];
  image_url?: string;
  booking_url: string;
}

export interface VacationRentalResult {
  id: string;
  name: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  sleeps: number;
  price_per_night: number;
  total_price: number;
  currency: string;
  rating?: number;
  review_count?: number;
  amenities: string[];
  image_url?: string;
  instant_book: boolean;
  booking_url: string;
}

export interface CarRentalResult {
  id: string;
  supplier: string;
  vehicle_category: string;
  vehicle_description: string;
  passengers: number;
  bags: number;
  price_per_day: number;
  total_price: number;
  currency: string;
  features: string[];
  pickup_location: string;
  image_url?: string;
  booking_url: string;
}

export interface ActivityResult {
  id: string;
  title: string;
  description: string;
  duration?: string;
  price: number;
  price_formatted: string;
  currency: string;
  rating?: number;
  review_count?: number;
  image_url?: string;
  booking_url: string;
}

export interface TravelSearchResults {
  destination: string;
  checkin?: string;
  checkout?: string;
  hotels: HotelResult[];
  vacation_rentals: VacationRentalResult[];
  car_rentals: CarRentalResult[];
  activities: ActivityResult[];
}
