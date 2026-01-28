import crypto from 'crypto';
import {
  HotelSearchRequest,
  HotelResult,
  Property,
  Region,
  Activity,
  ActivityResult,
  ActivitySearchRequest,
  TravelSearchResults,
  CarRentalResult,
  CarSearchRequest,
  VacationRentalResult,
  VacationRentalSearchRequest,
} from './types';
import { getSandboxData } from './sandbox-data';

/**
 * Expedia Group API Client
 * 
 * Integrates:
 * - Rapid API (Hotels): https://developers.expediagroup.com/docs/rapid
 * - Vrbo API (Vacation Rentals): https://developers.expediagroup.com/docs/vrbo
 * - Cars API: https://developers.expediagroup.com/docs/cars
 * - Activities API: https://developers.expediagroup.com/docs/activities
 * 
 * Supports sandbox mode for testing without real credentials
 */
export class ExpediaClient {
  private apiKey: string;
  private sharedSecret: string;
  private affiliateId: string;
  private useSandbox: boolean;
  
  // API base URLs
  private rapidBaseUrl = 'https://api.ean.com/v3';
  private activitiesBaseUrl = 'https://api.ean.com/activities/v1';
  private carsBaseUrl = 'https://api.ean.com/cars/v3';
  private vrboBaseUrl = 'https://api.ean.com/vrbo/v1';
  
  // Sandbox URLs (if Expedia provides them)
  private sandboxRapidUrl = 'https://test.api.ean.com/v3';
  
  constructor(
    apiKey: string,
    sharedSecret: string,
    affiliateId?: string,
    useSandbox: boolean = false
  ) {
    this.apiKey = apiKey || 'sandbox-api-key';
    this.sharedSecret = sharedSecret || 'sandbox-secret';
    this.affiliateId = affiliateId || 'autobot-demo';
    this.useSandbox = useSandbox;
    
    if (useSandbox) {
      console.log('[Expedia] Running in SANDBOX mode - using simulated data');
    }
  }
  
  /**
   * Generate authentication signature for Rapid API
   */
  private generateSignature(): { signature: string; timestamp: string } {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const toHash = this.apiKey + this.sharedSecret + timestamp;
    const signature = crypto
      .createHash('sha512')
      .update(toHash)
      .digest('hex');
    
    return { signature, timestamp };
  }
  
  /**
   * Make authenticated request to Expedia APIs
   */
  private async request<T>(
    baseUrl: string,
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    params?: Record<string, string>,
    body?: object
  ): Promise<T> {
    // In sandbox mode, we don't make real API calls
    if (this.useSandbox) {
      throw new Error('SANDBOX_MODE');
    }
    
    const { signature, timestamp } = this.generateSignature();
    
    const url = new URL(`${baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }
    
    const headers: Record<string, string> = {
      'Authorization': `EAN apikey=${this.apiKey},signature=${signature},timestamp=${timestamp}`,
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'Customer-Ip': '127.0.0.1',
    };
    
    if (body) {
      headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Expedia API Error (${response.status}): ${errorText}`);
    }
    
    return response.json() as Promise<T>;
  }
  
  // ============================================
  // DEEP LINK GENERATION
  // ============================================
  
  generateHotelLink(propertyId: string, propertyName: string, city: string, checkin?: string, checkout?: string): string {
    const slug = propertyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
    const citySlug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    let url = `https://www.expedia.com/${citySlug}-Hotels-${slug}.h${propertyId}.Hotel-Information`;
    
    const params = new URLSearchParams();
    if (checkin) params.append('chkin', checkin);
    if (checkout) params.append('chkout', checkout);
    params.append('affcid', this.affiliateId);
    
    return url + (params.toString() ? '?' + params.toString() : '');
  }
  
  generateVrboLink(propertyId: string, checkin?: string, checkout?: string): string {
    let url = `https://www.vrbo.com/${propertyId}`;
    
    const params = new URLSearchParams();
    if (checkin) params.append('arrival', checkin);
    if (checkout) params.append('departure', checkout);
    params.append('affcid', this.affiliateId);
    
    return url + '?' + params.toString();
  }
  
  generateCarLink(pickupLocation: string, pickupDate: string, dropoffDate: string): string {
    const params = new URLSearchParams({
      locn: pickupLocation,
      date1: pickupDate,
      date2: dropoffDate,
      affcid: this.affiliateId,
    });
    
    return `https://www.expedia.com/carsearch?${params.toString()}`;
  }
  
  generateActivityLink(activityId: string, activityTitle: string): string {
    const slug = activityTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
    return `https://www.expedia.com/things-to-do/${slug}.a${activityId}.activity-details?affcid=${this.affiliateId}`;
  }
  
  generateSearchLink(destination: string, checkin?: string, checkout?: string): string {
    const params = new URLSearchParams({
      destination: destination,
      affcid: this.affiliateId,
    });
    if (checkin) params.append('startDate', checkin);
    if (checkout) params.append('endDate', checkout);
    
    return `https://www.expedia.com/Hotel-Search?${params.toString()}`;
  }
  
  // ============================================
  // HOTELS (Rapid API)
  // ============================================
  
  async findHotels(
    destination: string,
    checkin: string,
    checkout: string,
    adults: number = 2,
    children: number[] = []
  ): Promise<HotelResult[]> {
    console.log(`[Expedia] Searching hotels in ${destination}`);
    
    if (this.useSandbox) {
      const data = getSandboxData(destination, checkin, checkout);
      // In sandbox mode, use search URL since we don't have real property IDs
      const searchUrl = this.generateSearchLink(destination, checkin, checkout);
      return data.hotels.map(h => ({
        ...h,
        booking_url: searchUrl,
      }));
    }
    
    try {
      const regions = await this.searchRegions(destination);
      if (regions.length === 0) return [];
      
      const properties = await this.searchHotels({
        checkin,
        checkout,
        currency: 'USD',
        language: 'en-US',
        country_code: 'US',
        occupancy: [{ adults, children: children.map(age => ({ age })) }],
        sales_channel: 'website',
        sales_environment: 'hotel_only',
        region_id: regions[0].id,
        sort_type: 'preferred',
        rate_plan_count: 1,
      });
      
      return properties.slice(0, 5).map(p => this.transformHotel(p, destination, checkin, checkout));
    } catch (error) {
      console.error('[Expedia] Hotel search error:', error);
      return [];
    }
  }
  
  private async searchRegions(query: string): Promise<Region[]> {
    const response = await this.request<{ data: Region[] }>(
      this.rapidBaseUrl,
      '/regions',
      'GET',
      { query, language: 'en-US', include: 'details' }
    );
    return response.data || [];
  }
  
  private async searchHotels(request: HotelSearchRequest): Promise<Property[]> {
    const occupancyStr = request.occupancy.map(o => {
      let occ = `${o.adults}`;
      if (o.children?.length) occ += '-' + o.children.map(c => c.age).join(',');
      return occ;
    }).join('|');
    
    const response = await this.request<Property[]>(
      this.rapidBaseUrl,
      '/properties/availability',
      'GET',
      {
        checkin: request.checkin,
        checkout: request.checkout,
        currency: request.currency,
        language: request.language,
        country_code: request.country_code,
        occupancy: occupancyStr,
        sales_channel: request.sales_channel,
        sales_environment: request.sales_environment,
        region_id: request.region_id || '',
        sort_type: request.sort_type || 'preferred',
        rate_plan_count: (request.rate_plan_count || 1).toString(),
      }
    );
    
    return response || [];
  }
  
  private transformHotel(property: Property, destination: string, checkin?: string, checkout?: string): HotelResult {
    const room = property.rooms?.[0];
    const rate = room?.rates?.find(r => r.status === 'available');
    const pricing = rate?.occupancy_pricing ? Object.values(rate.occupancy_pricing)[0] : null;
    
    const totalPrice = pricing?.totals?.inclusive?.request_currency?.value;
    const nights = checkin && checkout ? this.calculateNights(checkin, checkout) : 1;
    const pricePerNight = totalPrice ? parseFloat(totalPrice) / nights : 0;
    
    return {
      id: property.property_id,
      name: property.name,
      star_rating: parseFloat(property.ratings?.property?.rating || '0'),
      guest_rating: property.ratings?.guest?.overall ? parseFloat(property.ratings.guest.overall) : undefined,
      review_count: property.ratings?.guest?.count,
      address: property.address?.line_1 || '',
      city: property.address?.city || destination,
      price_per_night: Math.round(pricePerNight),
      total_price: totalPrice ? Math.round(parseFloat(totalPrice)) : 0,
      currency: 'USD',
      refundable: rate?.refundable || false,
      amenities: property.amenities ? Object.values(property.amenities).slice(0, 5).map(a => a.name) : [],
      image_url: property.images?.[0]?.links?.['350px']?.href,
      booking_url: this.generateHotelLink(property.property_id, property.name, destination, checkin, checkout),
    };
  }
  
  // ============================================
  // VACATION RENTALS (Vrbo API)
  // ============================================
  
  async findVacationRentals(
    destination: string,
    checkin: string,
    checkout: string,
    guests: number = 2,
    bedrooms?: number
  ): Promise<VacationRentalResult[]> {
    console.log(`[Expedia] Searching vacation rentals in ${destination}`);
    
    if (this.useSandbox) {
      const data = getSandboxData(destination, checkin, checkout);
      // In sandbox mode, use Vrbo search URL
      const destSlug = destination.toLowerCase().replace(/\s+/g, '-');
      const vrboSearchUrl = `https://www.vrbo.com/search?destination=${encodeURIComponent(destination)}`;
      return data.vacation_rentals.map(vr => ({
        ...vr,
        booking_url: vrboSearchUrl,
      }));
    }
    
    try {
      // Real API call would go here
      const response = await this.request<{ properties: any[] }>(
        this.vrboBaseUrl,
        '/properties/search',
        'GET',
        {
          destination,
          checkin,
          checkout,
          adults: guests.toString(),
          min_bedrooms: bedrooms?.toString() || '',
        }
      );
      
      return (response.properties || []).slice(0, 5).map(p => this.transformVacationRental(p, checkin, checkout));
    } catch (error) {
      console.error('[Expedia] Vrbo search error:', error);
      return [];
    }
  }
  
  private transformVacationRental(property: any, checkin?: string, checkout?: string): VacationRentalResult {
    return {
      id: property.id,
      name: property.name,
      property_type: property.property_type || 'Vacation Rental',
      bedrooms: property.bedrooms || 1,
      bathrooms: property.bathrooms || 1,
      sleeps: property.sleeps || 2,
      price_per_night: property.price_per_night || 0,
      total_price: property.total_price || 0,
      currency: 'USD',
      rating: property.rating,
      review_count: property.review_count,
      amenities: property.amenities || [],
      image_url: property.image_url,
      instant_book: property.instant_book || false,
      booking_url: this.generateVrboLink(property.id, checkin, checkout),
    };
  }
  
  // ============================================
  // CAR RENTALS
  // ============================================
  
  async findCarRentals(
    pickupLocation: string,
    pickupDate: string,
    dropoffDate: string
  ): Promise<CarRentalResult[]> {
    console.log(`[Expedia] Searching car rentals at ${pickupLocation}`);
    
    if (this.useSandbox) {
      const data = getSandboxData(pickupLocation, pickupDate, dropoffDate);
      // In sandbox mode, use Expedia car search URL
      const carSearchUrl = this.generateCarLink(pickupLocation, pickupDate, dropoffDate);
      return data.car_rentals.map(car => ({
        ...car,
        booking_url: carSearchUrl,
      }));
    }
    
    try {
      const response = await this.request<{ offers: any[] }>(
        this.carsBaseUrl,
        '/search',
        'GET',
        {
          pickup_location: pickupLocation,
          pickup_datetime: `${pickupDate}T10:00:00`,
          dropoff_datetime: `${dropoffDate}T10:00:00`,
          currency: 'USD',
        }
      );
      
      return (response.offers || []).slice(0, 5).map(o => this.transformCarRental(o, pickupLocation, pickupDate, dropoffDate));
    } catch (error) {
      console.error('[Expedia] Car rental search error:', error);
      return [];
    }
  }
  
  private transformCarRental(offer: any, location: string, pickupDate: string, dropoffDate: string): CarRentalResult {
    return {
      id: offer.id,
      supplier: offer.supplier?.name || 'Unknown',
      vehicle_category: offer.vehicle?.category || 'Standard',
      vehicle_description: offer.vehicle?.description || 'Standard car',
      passengers: offer.vehicle?.capacity?.passengers || 5,
      bags: offer.vehicle?.capacity?.bags_large || 2,
      price_per_day: offer.rate?.per_day?.amount || 0,
      total_price: offer.rate?.total?.amount || 0,
      currency: 'USD',
      features: offer.features || [],
      pickup_location: location,
      image_url: offer.vehicle?.image_url,
      booking_url: this.generateCarLink(location, pickupDate, dropoffDate),
    };
  }
  
  // ============================================
  // ACTIVITIES
  // ============================================
  
  async findActivities(
    destination: string,
    startDate: string,
    endDate: string,
    travelers: number = 2
  ): Promise<ActivityResult[]> {
    console.log(`[Expedia] Searching activities in ${destination}`);
    
    if (this.useSandbox) {
      const data = getSandboxData(destination, startDate, endDate);
      return data.activities.map(a => ({
        ...a,
        booking_url: this.generateActivityLink(a.id, a.title),
      }));
    }
    
    try {
      const response = await this.request<{ activities: Activity[] }>(
        this.activitiesBaseUrl,
        '/search',
        'GET',
        {
          location: destination,
          start_date: startDate,
          end_date: endDate,
          travelers: travelers.toString(),
        }
      );
      
      return (response.activities || []).slice(0, 5).map(a => this.transformActivity(a));
    } catch (error) {
      console.error('[Expedia] Activities search error:', error);
      return [];
    }
  }
  
  private transformActivity(activity: Activity): ActivityResult {
    return {
      id: activity.id,
      title: activity.title,
      description: activity.short_description || activity.description?.slice(0, 150) || '',
      duration: activity.duration?.formatted || (activity.duration ? `${activity.duration.value} ${activity.duration.unit}` : undefined),
      price: activity.price.amount,
      price_formatted: activity.price.formatted,
      currency: activity.price.currency,
      rating: activity.rating?.average,
      review_count: activity.rating?.count,
      image_url: activity.images?.[0]?.url,
      booking_url: activity.deep_link || this.generateActivityLink(activity.id, activity.title),
    };
  }
  
  // ============================================
  // COMBINED SEARCH
  // ============================================
  
  async searchAll(
    destination: string,
    checkin: string,
    checkout: string,
    adults: number = 2,
    children: number[] = []
  ): Promise<TravelSearchResults> {
    console.log(`[Expedia] Full search for ${destination} (${checkin} - ${checkout})`);
    
    // Run all searches in parallel
    const [hotels, vacationRentals, carRentals, activities] = await Promise.all([
      this.findHotels(destination, checkin, checkout, adults, children),
      this.findVacationRentals(destination, checkin, checkout, adults + children.length),
      this.findCarRentals(destination, checkin, checkout),
      this.findActivities(destination, checkin, checkout, adults + children.length),
    ]);
    
    return {
      destination,
      checkin,
      checkout,
      hotels,
      vacation_rentals: vacationRentals,
      car_rentals: carRentals,
      activities,
    };
  }
  
  // ============================================
  // HELPERS
  // ============================================
  
  private calculateNights(checkin: string, checkout: string): number {
    const start = new Date(checkin);
    const end = new Date(checkout);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }
}

// ============================================
// SINGLETON & INITIALIZATION
// ============================================

let expediaClient: ExpediaClient | null = null;

export function initExpediaClient(
  apiKey: string,
  sharedSecret: string,
  affiliateId?: string,
  useSandbox: boolean = false
): ExpediaClient {
  expediaClient = new ExpediaClient(apiKey, sharedSecret, affiliateId, useSandbox);
  return expediaClient;
}

export function getExpediaClient(): ExpediaClient | null {
  return expediaClient;
}

export function isExpediaConfigured(): boolean {
  return expediaClient !== null;
}
