import {
  HotelResult,
  VacationRentalResult,
  CarRentalResult,
  ActivityResult,
  TravelSearchResults,
} from './types';

/**
 * Sandbox/Test Data for Expedia APIs
 * 
 * Returns realistic mock data when API credentials are not configured.
 * Data structure mirrors actual Expedia API responses.
 */

interface DestinationData {
  hotels: Omit<HotelResult, 'booking_url'>[];
  vacation_rentals: Omit<VacationRentalResult, 'booking_url'>[];
  car_rentals: Omit<CarRentalResult, 'booking_url'>[];
  activities: Omit<ActivityResult, 'booking_url'>[];
}

// Destination-specific mock data
const destinationData: Record<string, DestinationData> = {
  miami: {
    hotels: [
      {
        id: '7595',  // Real Expedia ID for Fontainebleau
        name: 'Fontainebleau Miami Beach',
        star_rating: 4.5,
        guest_rating: 8.6,
        review_count: 12453,
        address: '4441 Collins Ave',
        city: 'Miami Beach',
        price_per_night: 289,
        total_price: 867,
        currency: 'USD',
        refundable: true,
        amenities: ['Pool', 'Spa', 'Beach Access', 'Restaurant', 'Fitness Center'],
        image_url: 'https://images.trvl-media.com/hotels/1000000/900000/899000/898900/898900_200_b.jpg',
      },
      {
        id: '1424757',  // Real Expedia ID for The Setai
        name: 'The Setai Miami Beach',
        star_rating: 5,
        guest_rating: 9.2,
        review_count: 3421,
        address: '2001 Collins Ave',
        city: 'Miami Beach',
        price_per_night: 695,
        total_price: 2085,
        currency: 'USD',
        refundable: true,
        amenities: ['Private Beach', 'Spa', 'Infinity Pool', 'Fine Dining', 'Butler Service'],
        image_url: 'https://images.trvl-media.com/hotels/2000000/1900000/1899000/1898900/1898900_200_b.jpg',
      },
      {
        id: '13498',  // Real Expedia ID for Hilton Miami Downtown
        name: 'Hilton Miami Downtown',
        star_rating: 4,
        guest_rating: 8.2,
        review_count: 5632,
        address: '1601 Biscayne Blvd',
        city: 'Miami',
        price_per_night: 179,
        total_price: 537,
        currency: 'USD',
        refundable: true,
        amenities: ['Pool', 'Restaurant', 'Fitness Center', 'Business Center', 'WiFi'],
        image_url: 'https://images.trvl-media.com/hotels/3000000/2900000/2899000/2898900/2898900_200_b.jpg',
      },
    ],
    vacation_rentals: [
      {
        id: 'vrbo-123456',
        name: 'Luxury Oceanfront Condo with Stunning Views',
        property_type: 'Condo',
        bedrooms: 2,
        bathrooms: 2,
        sleeps: 6,
        price_per_night: 325,
        total_price: 975,
        currency: 'USD',
        rating: 4.9,
        review_count: 156,
        amenities: ['Ocean View', 'Pool', 'Kitchen', 'Parking', 'WiFi', 'A/C'],
        image_url: 'https://images.vrbo.com/property/123456/main.jpg',
        instant_book: true,
      },
      {
        id: 'vrbo-234567',
        name: 'South Beach Art Deco Studio - Walk to Everything',
        property_type: 'Apartment',
        bedrooms: 1,
        bathrooms: 1,
        sleeps: 2,
        price_per_night: 149,
        total_price: 447,
        currency: 'USD',
        rating: 4.7,
        review_count: 89,
        amenities: ['Kitchen', 'WiFi', 'A/C', 'Washer/Dryer'],
        image_url: 'https://images.vrbo.com/property/234567/main.jpg',
        instant_book: true,
      },
    ],
    car_rentals: [
      {
        id: 'car-001',
        supplier: 'Hertz',
        vehicle_category: 'Economy',
        vehicle_description: 'Nissan Versa or similar',
        passengers: 5,
        bags: 2,
        price_per_day: 45,
        total_price: 135,
        currency: 'USD',
        features: ['Unlimited Mileage', 'Free Cancellation', 'A/C'],
        pickup_location: 'Miami International Airport (MIA)',
        image_url: 'https://images.cars.com/economy-sedan.png',
      },
      {
        id: 'car-002',
        supplier: 'Enterprise',
        vehicle_category: 'Convertible',
        vehicle_description: 'Ford Mustang Convertible or similar',
        passengers: 4,
        bags: 2,
        price_per_day: 89,
        total_price: 267,
        currency: 'USD',
        features: ['Unlimited Mileage', 'Free Cancellation', 'Convertible Top'],
        pickup_location: 'Miami International Airport (MIA)',
        image_url: 'https://images.cars.com/convertible.png',
      },
      {
        id: 'car-003',
        supplier: 'Budget',
        vehicle_category: 'SUV',
        vehicle_description: 'Toyota RAV4 or similar',
        passengers: 5,
        bags: 4,
        price_per_day: 65,
        total_price: 195,
        currency: 'USD',
        features: ['Unlimited Mileage', 'Free Cancellation', 'A/C', 'Bluetooth'],
        pickup_location: 'Miami International Airport (MIA)',
        image_url: 'https://images.cars.com/suv.png',
      },
    ],
    activities: [
      {
        id: 'act-miami-001',
        title: 'Everglades Airboat Tour & Wildlife Show',
        description: 'Experience the thrill of an airboat ride through the Everglades and see alligators up close',
        duration: '4 hours',
        price: 49,
        price_formatted: '$49/person',
        currency: 'USD',
        rating: 4.7,
        review_count: 2341,
        image_url: 'https://images.activities.com/everglades-tour.jpg',
      },
      {
        id: 'act-miami-002',
        title: 'Miami Beach Art Deco Walking Tour',
        description: 'Explore the iconic Art Deco Historic District with an expert guide',
        duration: '2 hours',
        price: 35,
        price_formatted: '$35/person',
        currency: 'USD',
        rating: 4.8,
        review_count: 892,
        image_url: 'https://images.activities.com/art-deco-tour.jpg',
      },
      {
        id: 'act-miami-003',
        title: 'Little Havana Food & Culture Tour',
        description: 'Taste authentic Cuban cuisine and learn about Miami\'s vibrant Cuban heritage',
        duration: '3 hours',
        price: 69,
        price_formatted: '$69/person',
        currency: 'USD',
        rating: 4.9,
        review_count: 1567,
        image_url: 'https://images.activities.com/little-havana.jpg',
      },
    ],
  },
  
  hawaii: {
    hotels: [
      {
        id: '334440',  // Real Expedia ID
        name: 'Four Seasons Resort Maui at Wailea',
        star_rating: 5,
        guest_rating: 9.4,
        review_count: 4521,
        address: '3900 Wailea Alanui Dr',
        city: 'Wailea',
        price_per_night: 895,
        total_price: 2685,
        currency: 'USD',
        refundable: true,
        amenities: ['Private Beach', 'Spa', 'Multiple Pools', 'Fine Dining', 'Golf'],
        image_url: 'https://images.trvl-media.com/hotels/hawaii/four-seasons-maui.jpg',
      },
      {
        id: '5765',  // Real Expedia ID
        name: 'Hyatt Regency Waikiki Beach Resort',
        star_rating: 4,
        guest_rating: 8.5,
        review_count: 8932,
        address: '2424 Kalakaua Ave',
        city: 'Honolulu',
        price_per_night: 329,
        total_price: 987,
        currency: 'USD',
        refundable: true,
        amenities: ['Beach Access', 'Pool', 'Spa', 'Restaurant', 'Ocean View'],
        image_url: 'https://images.trvl-media.com/hotels/hawaii/hyatt-waikiki.jpg',
      },
      {
        id: '5791',  // Real Expedia ID
        name: 'Outrigger Reef Waikiki Beach Resort',
        star_rating: 4,
        guest_rating: 8.3,
        review_count: 6234,
        address: '2169 Kalia Rd',
        city: 'Honolulu',
        price_per_night: 275,
        total_price: 825,
        currency: 'USD',
        refundable: true,
        amenities: ['Beachfront', 'Pool', 'Restaurant', 'Luau', 'WiFi'],
        image_url: 'https://images.trvl-media.com/hotels/hawaii/outrigger-reef.jpg',
      },
    ],
    vacation_rentals: [
      {
        id: 'vrbo-hi-001',
        name: 'Oceanfront Villa with Private Pool in Kona',
        property_type: 'Villa',
        bedrooms: 4,
        bathrooms: 3,
        sleeps: 10,
        price_per_night: 599,
        total_price: 1797,
        currency: 'USD',
        rating: 4.9,
        review_count: 87,
        amenities: ['Private Pool', 'Ocean View', 'Full Kitchen', 'BBQ', 'Parking'],
        image_url: 'https://images.vrbo.com/hawaii/kona-villa.jpg',
        instant_book: true,
      },
      {
        id: 'vrbo-hi-002',
        name: 'Cozy Maui Cottage Steps from Beach',
        property_type: 'Cottage',
        bedrooms: 1,
        bathrooms: 1,
        sleeps: 2,
        price_per_night: 189,
        total_price: 567,
        currency: 'USD',
        rating: 4.8,
        review_count: 213,
        amenities: ['Beach Access', 'Kitchen', 'Lanai', 'WiFi', 'Parking'],
        image_url: 'https://images.vrbo.com/hawaii/maui-cottage.jpg',
        instant_book: true,
      },
    ],
    car_rentals: [
      {
        id: 'car-hi-001',
        supplier: 'Avis',
        vehicle_category: 'Jeep',
        vehicle_description: 'Jeep Wrangler or similar',
        passengers: 4,
        bags: 2,
        price_per_day: 95,
        total_price: 285,
        currency: 'USD',
        features: ['Unlimited Mileage', '4WD', 'Convertible Top', 'A/C'],
        pickup_location: 'Honolulu International Airport (HNL)',
        image_url: 'https://images.cars.com/jeep-wrangler.png',
      },
      {
        id: 'car-hi-002',
        supplier: 'National',
        vehicle_category: 'Midsize',
        vehicle_description: 'Toyota Camry or similar',
        passengers: 5,
        bags: 3,
        price_per_day: 55,
        total_price: 165,
        currency: 'USD',
        features: ['Unlimited Mileage', 'Free Cancellation', 'A/C', 'Bluetooth'],
        pickup_location: 'Honolulu International Airport (HNL)',
        image_url: 'https://images.cars.com/midsize-sedan.png',
      },
    ],
    activities: [
      {
        id: 'act-hi-001',
        title: 'Snorkeling Tour to Molokini Crater',
        description: 'Snorkel in crystal-clear waters at the famous Molokini Crater marine preserve',
        duration: '5 hours',
        price: 129,
        price_formatted: '$129/person',
        currency: 'USD',
        rating: 4.8,
        review_count: 3421,
        image_url: 'https://images.activities.com/molokini-snorkel.jpg',
      },
      {
        id: 'act-hi-002',
        title: 'Road to Hana Adventure Tour',
        description: 'Experience the breathtaking Road to Hana with waterfalls, beaches, and tropical rainforest',
        duration: '11 hours',
        price: 189,
        price_formatted: '$189/person',
        currency: 'USD',
        rating: 4.9,
        review_count: 2156,
        image_url: 'https://images.activities.com/road-to-hana.jpg',
      },
      {
        id: 'act-hi-003',
        title: 'Traditional Hawaiian Luau Experience',
        description: 'Enjoy an authentic luau with traditional food, music, and hula dancing',
        duration: '4 hours',
        price: 159,
        price_formatted: '$159/person',
        currency: 'USD',
        rating: 4.6,
        review_count: 4532,
        image_url: 'https://images.activities.com/luau.jpg',
      },
    ],
  },
  
  // Default fallback for any destination
  default: {
    hotels: [
      {
        id: 'default-001',
        name: 'Grand Hotel & Resort',
        star_rating: 4,
        guest_rating: 8.5,
        review_count: 2341,
        address: '123 Main Street',
        city: 'City Center',
        price_per_night: 199,
        total_price: 597,
        currency: 'USD',
        refundable: true,
        amenities: ['Pool', 'Spa', 'Restaurant', 'Fitness Center', 'WiFi'],
        image_url: 'https://images.trvl-media.com/hotels/default/grand-hotel.jpg',
      },
      {
        id: 'default-002',
        name: 'Comfort Inn & Suites',
        star_rating: 3,
        guest_rating: 8.0,
        review_count: 1532,
        address: '456 Oak Avenue',
        city: 'City Center',
        price_per_night: 109,
        total_price: 327,
        currency: 'USD',
        refundable: true,
        amenities: ['Free Breakfast', 'Pool', 'WiFi', 'Parking'],
        image_url: 'https://images.trvl-media.com/hotels/default/comfort-inn.jpg',
      },
    ],
    vacation_rentals: [
      {
        id: 'vrbo-default-001',
        name: 'Charming Downtown Apartment',
        property_type: 'Apartment',
        bedrooms: 2,
        bathrooms: 1,
        sleeps: 4,
        price_per_night: 150,
        total_price: 450,
        currency: 'USD',
        rating: 4.7,
        review_count: 89,
        amenities: ['Kitchen', 'WiFi', 'Washer/Dryer', 'A/C'],
        image_url: 'https://images.vrbo.com/default/downtown-apt.jpg',
        instant_book: true,
      },
    ],
    car_rentals: [
      {
        id: 'car-default-001',
        supplier: 'Hertz',
        vehicle_category: 'Economy',
        vehicle_description: 'Toyota Corolla or similar',
        passengers: 5,
        bags: 2,
        price_per_day: 39,
        total_price: 117,
        currency: 'USD',
        features: ['Unlimited Mileage', 'Free Cancellation', 'A/C'],
        pickup_location: 'Airport',
        image_url: 'https://images.cars.com/economy.png',
      },
      {
        id: 'car-default-002',
        supplier: 'Enterprise',
        vehicle_category: 'SUV',
        vehicle_description: 'Ford Explorer or similar',
        passengers: 7,
        bags: 4,
        price_per_day: 69,
        total_price: 207,
        currency: 'USD',
        features: ['Unlimited Mileage', 'Free Cancellation', 'A/C', '4WD'],
        pickup_location: 'Airport',
        image_url: 'https://images.cars.com/suv.png',
      },
    ],
    activities: [
      {
        id: 'act-default-001',
        title: 'City Highlights Walking Tour',
        description: 'Discover the best attractions and hidden gems with a knowledgeable local guide',
        duration: '3 hours',
        price: 45,
        price_formatted: '$45/person',
        currency: 'USD',
        rating: 4.7,
        review_count: 567,
        image_url: 'https://images.activities.com/city-tour.jpg',
      },
      {
        id: 'act-default-002',
        title: 'Food & Culture Experience',
        description: 'Taste local cuisine and learn about the area\'s culinary traditions',
        duration: '3.5 hours',
        price: 75,
        price_formatted: '$75/person',
        currency: 'USD',
        rating: 4.8,
        review_count: 342,
        image_url: 'https://images.activities.com/food-tour.jpg',
      },
    ],
  },
};

// Additional destinations
const additionalDestinations: Record<string, DestinationData> = {
  'los angeles': {
    hotels: [
      {
        id: '1020',
        name: 'The Beverly Hills Hotel',
        star_rating: 5,
        guest_rating: 9.2,
        review_count: 4521,
        address: '9641 Sunset Blvd',
        city: 'Beverly Hills',
        price_per_night: 695,
        total_price: 2085,
        currency: 'USD',
        refundable: true,
        amenities: ['Pool', 'Spa', 'Fine Dining', 'Cabanas', 'Tennis'],
        image_url: 'https://images.trvl-media.com/hotels/la/beverly-hills-hotel.jpg',
      },
      {
        id: '2172',
        name: 'Santa Monica Proper Hotel',
        star_rating: 4.5,
        guest_rating: 8.8,
        review_count: 2341,
        address: '700 Wilshire Blvd',
        city: 'Santa Monica',
        price_per_night: 389,
        total_price: 1167,
        currency: 'USD',
        refundable: true,
        amenities: ['Rooftop Pool', 'Restaurant', 'Ocean View', 'Fitness Center'],
        image_url: 'https://images.trvl-media.com/hotels/la/santa-monica-proper.jpg',
      },
      {
        id: '6394',
        name: 'The Hollywood Roosevelt',
        star_rating: 4,
        guest_rating: 8.4,
        review_count: 6532,
        address: '7000 Hollywood Blvd',
        city: 'Hollywood',
        price_per_night: 279,
        total_price: 837,
        currency: 'USD',
        refundable: true,
        amenities: ['Pool', 'Restaurant', 'Bar', 'Historic', 'Walk of Fame'],
        image_url: 'https://images.trvl-media.com/hotels/la/hollywood-roosevelt.jpg',
      },
    ],
    vacation_rentals: [
      {
        id: 'vrbo-la-001',
        name: 'Modern Venice Beach House with Rooftop Deck',
        property_type: 'House',
        bedrooms: 3,
        bathrooms: 2,
        sleeps: 6,
        price_per_night: 425,
        total_price: 1275,
        currency: 'USD',
        rating: 4.9,
        review_count: 112,
        amenities: ['Rooftop Deck', 'Beach Access', 'Kitchen', 'Parking', 'WiFi'],
        image_url: 'https://images.vrbo.com/la/venice-house.jpg',
        instant_book: true,
      },
    ],
    car_rentals: [
      {
        id: 'car-la-001',
        supplier: 'Hertz',
        vehicle_category: 'Convertible',
        vehicle_description: 'Ford Mustang Convertible or similar',
        passengers: 4,
        bags: 2,
        price_per_day: 85,
        total_price: 255,
        currency: 'USD',
        features: ['Unlimited Mileage', 'Convertible Top', 'Bluetooth'],
        pickup_location: 'Los Angeles International Airport (LAX)',
        image_url: 'https://images.cars.com/mustang-convert.png',
      },
      {
        id: 'car-la-002',
        supplier: 'Enterprise',
        vehicle_category: 'Luxury',
        vehicle_description: 'Tesla Model 3 or similar',
        passengers: 5,
        bags: 2,
        price_per_day: 95,
        total_price: 285,
        currency: 'USD',
        features: ['Electric', 'Autopilot', 'Premium Sound', 'Free Supercharging'],
        pickup_location: 'Los Angeles International Airport (LAX)',
        image_url: 'https://images.cars.com/tesla-model3.png',
      },
    ],
    activities: [
      {
        id: 'act-la-001',
        title: 'Hollywood Sign Hiking Tour',
        description: 'Hike to the iconic Hollywood Sign with stunning views of LA',
        duration: '3 hours',
        price: 49,
        price_formatted: '$49/person',
        currency: 'USD',
        rating: 4.8,
        review_count: 3421,
        image_url: 'https://images.activities.com/hollywood-sign-hike.jpg',
      },
      {
        id: 'act-la-002',
        title: 'Universal Studios Hollywood',
        description: 'Experience the movies at the world-famous theme park',
        duration: 'Full day',
        price: 139,
        price_formatted: '$139/person',
        currency: 'USD',
        rating: 4.7,
        review_count: 15632,
        image_url: 'https://images.activities.com/universal-hollywood.jpg',
      },
      {
        id: 'act-la-003',
        title: 'Santa Monica & Venice Beach Bike Tour',
        description: 'Cruise along the beach boardwalk from Santa Monica to Venice',
        duration: '3 hours',
        price: 59,
        price_formatted: '$59/person',
        currency: 'USD',
        rating: 4.9,
        review_count: 892,
        image_url: 'https://images.activities.com/venice-bike-tour.jpg',
      },
    ],
  },
  
  'new york': {
    hotels: [
      {
        id: '4912',  // Real Expedia ID for The Plaza
        name: 'The Plaza Hotel',
        star_rating: 5,
        guest_rating: 9.1,
        review_count: 8932,
        address: '768 5th Ave',
        city: 'New York',
        price_per_night: 695,
        total_price: 2085,
        currency: 'USD',
        refundable: true,
        amenities: ['Spa', 'Fine Dining', 'Butler Service', 'Fitness Center', 'Central Park View'],
        image_url: 'https://images.trvl-media.com/hotels/nyc/plaza.jpg',
      },
      {
        id: '28258',  // Real Expedia ID for Hilton Times Square
        name: 'Hilton Times Square',
        star_rating: 4,
        guest_rating: 8.3,
        review_count: 12453,
        address: '234 W 42nd St',
        city: 'New York',
        price_per_night: 259,
        total_price: 777,
        currency: 'USD',
        refundable: true,
        amenities: ['Restaurant', 'Fitness Center', 'WiFi', 'Business Center'],
        image_url: 'https://images.trvl-media.com/hotels/nyc/hilton-ts.jpg',
      },
    ],
    vacation_rentals: [
      {
        id: 'vrbo-ny-001',
        name: 'Stylish Manhattan Loft in SoHo',
        property_type: 'Loft',
        bedrooms: 1,
        bathrooms: 1,
        sleeps: 2,
        price_per_night: 275,
        total_price: 825,
        currency: 'USD',
        rating: 4.8,
        review_count: 156,
        amenities: ['Kitchen', 'WiFi', 'Washer/Dryer', 'Exposed Brick'],
        image_url: 'https://images.vrbo.com/nyc/soho-loft.jpg',
        instant_book: true,
      },
    ],
    car_rentals: [
      {
        id: 'car-ny-001',
        supplier: 'Hertz',
        vehicle_category: 'Economy',
        vehicle_description: 'Honda Civic or similar',
        passengers: 5,
        bags: 2,
        price_per_day: 65,
        total_price: 195,
        currency: 'USD',
        features: ['Unlimited Mileage', 'Free Cancellation'],
        pickup_location: 'JFK International Airport',
        image_url: 'https://images.cars.com/economy.png',
      },
    ],
    activities: [
      {
        id: 'act-ny-001',
        title: 'Statue of Liberty & Ellis Island Tour',
        description: 'Visit the iconic Statue of Liberty and explore the history of Ellis Island',
        duration: '4 hours',
        price: 49,
        price_formatted: '$49/person',
        currency: 'USD',
        rating: 4.7,
        review_count: 8932,
        image_url: 'https://images.activities.com/statue-liberty.jpg',
      },
      {
        id: 'act-ny-002',
        title: 'Broadway Show Tickets - The Lion King',
        description: 'Experience the magic of Disney\'s The Lion King on Broadway',
        duration: '2.5 hours',
        price: 199,
        price_formatted: '$199/person',
        currency: 'USD',
        rating: 4.9,
        review_count: 12453,
        image_url: 'https://images.activities.com/lion-king.jpg',
      },
    ],
  },
  
  'las vegas': {
    hotels: [
      {
        id: '3944',  // Real Expedia ID for Bellagio
        name: 'Bellagio Hotel & Casino',
        star_rating: 5,
        guest_rating: 9.0,
        review_count: 15632,
        address: '3600 S Las Vegas Blvd',
        city: 'Las Vegas',
        price_per_night: 299,
        total_price: 897,
        currency: 'USD',
        refundable: true,
        amenities: ['Casino', 'Pool', 'Spa', 'Fine Dining', 'Fountain Show'],
        image_url: 'https://images.trvl-media.com/hotels/vegas/bellagio.jpg',
      },
      {
        id: '3936',  // Real Expedia ID for Venetian
        name: 'The Venetian Resort',
        star_rating: 5,
        guest_rating: 8.9,
        review_count: 18932,
        address: '3355 S Las Vegas Blvd',
        city: 'Las Vegas',
        price_per_night: 249,
        total_price: 747,
        currency: 'USD',
        refundable: true,
        amenities: ['Casino', 'Pool', 'Spa', 'Shopping', 'Gondola Rides'],
        image_url: 'https://images.trvl-media.com/hotels/vegas/venetian.jpg',
      },
    ],
    vacation_rentals: [
      {
        id: 'vrbo-lv-001',
        name: 'Luxury Vegas Villa with Pool & Hot Tub',
        property_type: 'Villa',
        bedrooms: 5,
        bathrooms: 4,
        sleeps: 12,
        price_per_night: 450,
        total_price: 1350,
        currency: 'USD',
        rating: 4.9,
        review_count: 67,
        amenities: ['Private Pool', 'Hot Tub', 'Game Room', 'BBQ', 'Parking'],
        image_url: 'https://images.vrbo.com/vegas/luxury-villa.jpg',
        instant_book: true,
      },
    ],
    car_rentals: [
      {
        id: 'car-lv-001',
        supplier: 'Hertz',
        vehicle_category: 'Luxury',
        vehicle_description: 'BMW 5 Series or similar',
        passengers: 5,
        bags: 3,
        price_per_day: 129,
        total_price: 387,
        currency: 'USD',
        features: ['Unlimited Mileage', 'Leather Interior', 'Premium Sound'],
        pickup_location: 'Harry Reid International Airport (LAS)',
        image_url: 'https://images.cars.com/luxury.png',
      },
      {
        id: 'car-lv-002',
        supplier: 'Exotic Car Collection by Enterprise',
        vehicle_category: 'Exotic',
        vehicle_description: 'Chevrolet Corvette or similar',
        passengers: 2,
        bags: 1,
        price_per_day: 299,
        total_price: 897,
        currency: 'USD',
        features: ['Unlimited Mileage', 'Convertible', 'Premium Sound'],
        pickup_location: 'Harry Reid International Airport (LAS)',
        image_url: 'https://images.cars.com/corvette.png',
      },
    ],
    activities: [
      {
        id: 'act-lv-001',
        title: 'Grand Canyon Helicopter Tour',
        description: 'Soar over the Grand Canyon with stunning aerial views and champagne toast',
        duration: '4 hours',
        price: 399,
        price_formatted: '$399/person',
        currency: 'USD',
        rating: 4.9,
        review_count: 4532,
        image_url: 'https://images.activities.com/grand-canyon-heli.jpg',
      },
      {
        id: 'act-lv-002',
        title: 'Cirque du Soleil "O" Show',
        description: 'Experience the breathtaking aquatic masterpiece at Bellagio',
        duration: '2 hours',
        price: 169,
        price_formatted: '$169/person',
        currency: 'USD',
        rating: 4.8,
        review_count: 8921,
        image_url: 'https://images.activities.com/cirque-o.jpg',
      },
    ],
  },
};

// Destination aliases (map variations to canonical names)
const destinationAliases: Record<string, string> = {
  // New York
  'nyc': 'new york',
  'manhattan': 'new york',
  'brooklyn': 'new york',
  // Los Angeles
  'la': 'los angeles',
  'hollywood': 'los angeles',
  'santa monica': 'los angeles',
  'beverly hills': 'los angeles',
  // Las Vegas
  'vegas': 'las vegas',
  // San Francisco
  'sf': 'los angeles',  // fallback to LA if no SF data
  'san fran': 'los angeles',
  // Miami
  'miami beach': 'miami',
  'south beach': 'miami',
  'fort lauderdale': 'miami',
  // Hawaii
  'waikiki': 'hawaii',
  'honolulu': 'hawaii',
  'maui': 'hawaii',
  'oahu': 'hawaii',
  // Beach destinations -> Miami
  'cancun': 'miami',
  'cabo': 'miami',
  'orlando': 'miami',
  'tampa': 'miami',
};

// Merge all destinations
const allDestinations = { ...destinationData, ...additionalDestinations };

/**
 * Get sandbox data for a destination
 * Falls back to default data if destination not found
 */
export function getSandboxData(
  destination: string,
  checkin: string,
  checkout: string
): Omit<TravelSearchResults, 'hotels' | 'vacation_rentals' | 'car_rentals' | 'activities'> & DestinationData {
  let normalizedDest = destination.toLowerCase().trim();
  
  // Check for aliases first
  if (destinationAliases[normalizedDest]) {
    normalizedDest = destinationAliases[normalizedDest];
    console.log(`[Sandbox] Mapped "${destination}" to "${normalizedDest}"`);
  }
  
  // Find matching destination
  let data = allDestinations[normalizedDest];
  
  // Try partial match
  if (!data) {
    for (const [key, value] of Object.entries(allDestinations)) {
      if (normalizedDest.includes(key) || key.includes(normalizedDest)) {
        data = value;
        console.log(`[Sandbox] Partial match: "${destination}" -> "${key}"`);
        break;
      }
    }
  }
  
  // Check aliases for partial matches too
  if (!data) {
    for (const [alias, canonical] of Object.entries(destinationAliases)) {
      if (normalizedDest.includes(alias)) {
        data = allDestinations[canonical];
        console.log(`[Sandbox] Alias match: "${destination}" -> "${canonical}"`);
        break;
      }
    }
  }
  
  // Fall back to default
  if (!data) {
    data = allDestinations['default'];
    console.log(`[Sandbox] No specific data for "${destination}", using generic results`);
  }
  
  // Calculate nights and update prices
  const nights = calculateNights(checkin, checkout);
  
  return {
    destination,
    checkin,
    checkout,
    hotels: data.hotels.map(h => ({
      ...h,
      total_price: h.price_per_night * nights,
    })),
    vacation_rentals: data.vacation_rentals.map(vr => ({
      ...vr,
      total_price: vr.price_per_night * nights,
    })),
    car_rentals: data.car_rentals.map(car => ({
      ...car,
      total_price: car.price_per_day * nights,
    })),
    activities: data.activities,
  };
}

function calculateNights(checkin: string, checkout: string): number {
  try {
    const start = new Date(checkin);
    const end = new Date(checkout);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  } catch {
    return 3; // Default to 3 nights
  }
}

/**
 * List all available sandbox destinations
 */
export function getAvailableDestinations(): string[] {
  return Object.keys(allDestinations).filter(d => d !== 'default');
}
