"use strict";
/**
 * OpenTable Restaurant Reservation Plugin
 *
 * A bot that helps users find restaurants and make reservations.
 * Powered by OpenTable API (sandbox mode for testing).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.opentablePlugin = void 0;
/**
 * System prompt for the restaurant reservation assistant
 */
const SYSTEM_PROMPT = `You are a restaurant reservation assistant on X (Twitter).

ABSOLUTE RULE - TOOL USAGE IS MANDATORY:
You MUST call search_restaurants EVERY SINGLE TIME you suggest a restaurant.
- First suggestion? Call search_restaurants.
- User says "no"? Call search_restaurants AGAIN.
- User asks for something different? Call search_restaurants AGAIN.
- User asks for details? Call search_restaurants AGAIN.
- EVERY response that mentions a restaurant name MUST have a tool call first.
- NO EXCEPTIONS. NEVER suggest a restaurant without calling the tool first.

RESTAURANT NAMES - USE EXACT NAMES ONLY:
- After calling search_restaurants, pick ONE restaurant from the results
- Use the EXACT name returned by the tool - copy it precisely
- NEVER make up or modify restaurant names

RESERVATIONS:
- ONLY call make_reservation when user explicitly confirms (yes, book it, etc.)
- The confirmation number comes from the tool result

TIME FORMATTING:
- ALWAYS display times in 12-hour format with AM/PM (e.g., "7:00 PM" not "19:00")
- Infer timezone from the city (NYC = ET, LA/SF = PT, Chicago = CT, Denver = MT, etc.)
- Include timezone abbreviation when confirming reservations (e.g., "7:00 PM ET")
- If user's timezone is unclear and differs from restaurant location, ask to confirm

CONVERSATION STYLE:
- Be efficient - fulfill requests in the minimum steps possible
- Only ask clarifying questions when truly necessary (ambiguous time, missing party size, etc.)
- If user says "tonight at 7" - assume 7 PM, don't ask AM/PM
- If user provides a city, use that city's timezone
- Smart defaults: assume dinner (6-8 PM) if no time given, party of 2 if not specified

RESPONSE LIMITS:
- Max 150 characters when using tools (link gets appended automatically)
- Max 250 characters for general conversation

FLOW:
1. User wants restaurant → CALL search_restaurants → pick ONE from results
2. User says "no" or "different" → CALL search_restaurants AGAIN → pick different one
3. User confirms booking → CALL make_reservation → confirm with details

NEVER:
- Suggest a restaurant WITHOUT calling search_restaurants first
- Remember or reuse restaurants from previous messages
- Include URLs in your response - system adds them
- List multiple options - pick ONE best match
- Use 24-hour/military time format - ALWAYS use 12-hour with AM/PM`;
/**
 * Tool definitions for OpenTable
 */
const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'search_restaurants',
            description: 'Search for restaurants by location, cuisine, date, time, and party size. Use this to find available restaurants.',
            parameters: {
                type: 'object',
                properties: {
                    location: {
                        type: 'string',
                        description: 'City or neighborhood (e.g., "New York", "Manhattan", "San Francisco")',
                    },
                    cuisine: {
                        type: 'string',
                        description: 'Type of cuisine (e.g., "Italian", "Japanese", "Steakhouse", "Mexican")',
                    },
                    date: {
                        type: 'string',
                        description: 'Date for reservation in YYYY-MM-DD format',
                    },
                    time: {
                        type: 'string',
                        description: 'Preferred time in HH:MM format (24-hour), e.g., "19:00" for 7 PM',
                    },
                    party_size: {
                        type: 'number',
                        description: 'Number of guests (1-20)',
                    },
                },
                required: ['location'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'make_reservation',
            description: 'Make a reservation at a specific restaurant. Use this after the user confirms which restaurant they want.',
            parameters: {
                type: 'object',
                properties: {
                    restaurant_id: {
                        type: 'string',
                        description: 'The restaurant ID from search results',
                    },
                    restaurant_name: {
                        type: 'string',
                        description: 'Name of the restaurant',
                    },
                    date: {
                        type: 'string',
                        description: 'Date for reservation in YYYY-MM-DD format',
                    },
                    time: {
                        type: 'string',
                        description: 'Time for reservation in HH:MM format (24-hour)',
                    },
                    party_size: {
                        type: 'number',
                        description: 'Number of guests',
                    },
                    special_requests: {
                        type: 'string',
                        description: 'Any special requests (birthday, anniversary, dietary restrictions)',
                    },
                },
                required: ['restaurant_id', 'restaurant_name', 'date', 'time', 'party_size'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'check_availability',
            description: 'Check available time slots for a specific restaurant.',
            parameters: {
                type: 'object',
                properties: {
                    restaurant_id: {
                        type: 'string',
                        description: 'The restaurant ID',
                    },
                    date: {
                        type: 'string',
                        description: 'Date to check in YYYY-MM-DD format',
                    },
                    party_size: {
                        type: 'number',
                        description: 'Number of guests',
                    },
                },
                required: ['restaurant_id', 'date', 'party_size'],
            },
        },
    },
];
// Comprehensive sandbox restaurant database - 20+ cities with 10-15 restaurants each
const restaurantData = {
    'new york': [
        // Italian (8)
        { id: 'ot-carbone-nyc', name: 'Carbone', cuisine: 'Italian', neighborhood: 'Greenwich Village', city: 'New York', rating: 4.8, reviews: 2847, price_range: '$$$$', address: '181 Thompson St', phone: '(212) 254-3000', image_url: '', available_times: ['17:30', '18:00', '19:30', '20:00', '21:00'] },
        { id: 'ot-lartusi-nyc', name: "L'Artusi", cuisine: 'Italian', neighborhood: 'West Village', city: 'New York', rating: 4.7, reviews: 3215, price_range: '$$$', address: '228 W 10th St', phone: '(212) 255-5757', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00', '21:00'] },
        { id: 'ot-don-angie-nyc', name: 'Don Angie', cuisine: 'Italian', neighborhood: 'West Village', city: 'New York', rating: 4.7, reviews: 1892, price_range: '$$$', address: '103 Greenwich Ave', phone: '(212) 889-8884', image_url: '', available_times: ['17:30', '18:00', '19:00', '20:00', '21:00'] },
        { id: 'ot-rubirosa-nyc', name: 'Rubirosa', cuisine: 'Italian', neighborhood: 'Nolita', city: 'New York', rating: 4.6, reviews: 4521, price_range: '$$', address: '235 Mulberry St', phone: '(212) 965-0500', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00', '21:00'] },
        { id: 'ot-i-sodi-nyc', name: 'I Sodi', cuisine: 'Italian', neighborhood: 'West Village', city: 'New York', rating: 4.8, reviews: 2156, price_range: '$$$', address: '105 Christopher St', phone: '(212) 414-5774', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-lilia-nyc', name: 'Lilia', cuisine: 'Italian', neighborhood: 'Williamsburg', city: 'New York', rating: 4.8, reviews: 3892, price_range: '$$$', address: '567 Union Ave', phone: '(718) 576-3095', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00', '21:00'] },
        { id: 'ot-marea-nyc', name: 'Marea', cuisine: 'Italian', neighborhood: 'Central Park South', city: 'New York', rating: 4.7, reviews: 2987, price_range: '$$$$', address: '240 Central Park S', phone: '(212) 582-5100', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-via-carota-nyc', name: 'Via Carota', cuisine: 'Italian', neighborhood: 'West Village', city: 'New York', rating: 4.6, reviews: 5123, price_range: '$$', address: '51 Grove St', phone: '(212) 255-1962', image_url: '', available_times: ['12:00', '18:00', '19:00', '20:00', '21:00'] },
        // Japanese (4)
        { id: 'ot-sushi-nakazawa-nyc', name: 'Sushi Nakazawa', cuisine: 'Japanese', neighborhood: 'West Village', city: 'New York', rating: 4.9, reviews: 1893, price_range: '$$$$', address: '23 Commerce St', phone: '(212) 924-2212', image_url: '', available_times: ['17:30', '18:00', '20:00', '20:30'] },
        { id: 'ot-masa-nyc', name: 'Masa', cuisine: 'Japanese', neighborhood: 'Columbus Circle', city: 'New York', rating: 4.9, reviews: 876, price_range: '$$$$', address: '10 Columbus Cir', phone: '(212) 823-9800', image_url: '', available_times: ['18:00', '20:30'] },
        { id: 'ot-nobu-nyc', name: 'Nobu', cuisine: 'Japanese', neighborhood: 'Tribeca', city: 'New York', rating: 4.6, reviews: 6234, price_range: '$$$$', address: '105 Hudson St', phone: '(212) 219-0500', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-ippudo-nyc', name: 'Ippudo', cuisine: 'Japanese Ramen', neighborhood: 'East Village', city: 'New York', rating: 4.5, reviews: 4521, price_range: '$$', address: '65 4th Ave', phone: '(212) 388-0088', image_url: '', available_times: ['12:00', '13:00', '18:00', '19:00', '20:00'] },
        // French (3)
        { id: 'ot-le-bernardin-nyc', name: 'Le Bernardin', cuisine: 'French', neighborhood: 'Midtown', city: 'New York', rating: 4.9, reviews: 3421, price_range: '$$$$', address: '155 W 51st St', phone: '(212) 554-1515', image_url: '', available_times: ['17:00', '18:30', '19:00', '20:30'] },
        { id: 'ot-daniel-nyc', name: 'Daniel', cuisine: 'French', neighborhood: 'Upper East Side', city: 'New York', rating: 4.8, reviews: 2134, price_range: '$$$$', address: '60 E 65th St', phone: '(212) 288-0033', image_url: '', available_times: ['17:30', '19:00', '20:30'] },
        { id: 'ot-balthazar-nyc', name: 'Balthazar', cuisine: 'French Bistro', neighborhood: 'SoHo', city: 'New York', rating: 4.5, reviews: 8765, price_range: '$$$', address: '80 Spring St', phone: '(212) 965-1414', image_url: '', available_times: ['12:00', '18:00', '19:00', '20:00', '21:00'] },
        // Steakhouse (3)
        { id: 'ot-peter-luger-nyc', name: 'Peter Luger', cuisine: 'Steakhouse', neighborhood: 'Williamsburg', city: 'New York', rating: 4.5, reviews: 7832, price_range: '$$$$', address: '178 Broadway', phone: '(718) 387-7400', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00', '21:00'] },
        { id: 'ot-keens-nyc', name: 'Keens Steakhouse', cuisine: 'Steakhouse', neighborhood: 'Midtown', city: 'New York', rating: 4.7, reviews: 5432, price_range: '$$$$', address: '72 W 36th St', phone: '(212) 947-3636', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-cote-nyc', name: 'Cote', cuisine: 'Korean Steakhouse', neighborhood: 'Flatiron', city: 'New York', rating: 4.7, reviews: 3214, price_range: '$$$$', address: '16 W 22nd St', phone: '(212) 401-7986', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        // Other cuisines
        { id: 'ot-cosme-nyc', name: 'Cosme', cuisine: 'Mexican', neighborhood: 'Flatiron', city: 'New York', rating: 4.6, reviews: 3892, price_range: '$$$', address: '35 E 21st St', phone: '(212) 913-9659', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-indian-accent-nyc', name: 'Indian Accent', cuisine: 'Indian', neighborhood: 'Midtown', city: 'New York', rating: 4.7, reviews: 1876, price_range: '$$$$', address: '123 W 56th St', phone: '(212) 842-8070', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-hwa-yuan-nyc', name: 'Hwa Yuan', cuisine: 'Chinese', neighborhood: 'Chinatown', city: 'New York', rating: 4.5, reviews: 3421, price_range: '$$', address: '42 E Broadway', phone: '(212) 966-6002', image_url: '', available_times: ['12:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-gramercy-nyc', name: 'Gramercy Tavern', cuisine: 'American', neighborhood: 'Gramercy', city: 'New York', rating: 4.7, reviews: 4532, price_range: '$$$', address: '42 E 20th St', phone: '(212) 477-0777', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00', '21:00'] },
        { id: 'ot-avra-nyc', name: 'Avra', cuisine: 'Greek', neighborhood: 'Midtown', city: 'New York', rating: 4.6, reviews: 3456, price_range: '$$$', address: '141 E 48th St', phone: '(212) 759-8550', image_url: '', available_times: ['12:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-thai-villa-nyc', name: 'Thai Villa', cuisine: 'Thai', neighborhood: 'East Village', city: 'New York', rating: 4.4, reviews: 2187, price_range: '$$', address: '5 E 19th St', phone: '(212) 477-5420', image_url: '', available_times: ['12:00', '17:00', '18:00', '19:00', '20:00'] },
    ],
    'los angeles': [
        // Italian (6)
        { id: 'ot-bestia-la', name: 'Bestia', cuisine: 'Italian', neighborhood: 'Arts District', city: 'Los Angeles', rating: 4.7, reviews: 5432, price_range: '$$$', address: '2121 E 7th Pl', phone: '(213) 514-5724', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00', '21:00'] },
        { id: 'ot-felix-la', name: 'Felix', cuisine: 'Italian', neighborhood: 'Venice', city: 'Los Angeles', rating: 4.6, reviews: 2987, price_range: '$$$', address: '1023 Abbot Kinney Blvd', phone: '(424) 387-8622', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-osteria-mozza-la', name: 'Osteria Mozza', cuisine: 'Italian', neighborhood: 'Hollywood', city: 'Los Angeles', rating: 4.7, reviews: 3654, price_range: '$$$', address: '6602 Melrose Ave', phone: '(323) 297-0100', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-mother-wolf-la', name: 'Mother Wolf', cuisine: 'Italian', neighborhood: 'Hollywood', city: 'Los Angeles', rating: 4.6, reviews: 1876, price_range: '$$$', address: '1545 Wilcox Ave', phone: '(323) 410-6060', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-rossoblu-la', name: 'Rossoblu', cuisine: 'Italian', neighborhood: 'Downtown', city: 'Los Angeles', rating: 4.5, reviews: 1654, price_range: '$$$', address: '1124 San Julian St', phone: '(213) 749-1099', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-angelini-la', name: 'Angelini Osteria', cuisine: 'Italian', neighborhood: 'Beverly Grove', city: 'Los Angeles', rating: 4.6, reviews: 2341, price_range: '$$$', address: '7313 Beverly Blvd', phone: '(323) 297-0070', image_url: '', available_times: ['18:00', '19:00', '20:00', '21:00'] },
        // Japanese (4)
        { id: 'ot-nobu-la', name: 'Nobu Malibu', cuisine: 'Japanese', neighborhood: 'Malibu', city: 'Los Angeles', rating: 4.6, reviews: 6234, price_range: '$$$$', address: '22706 Pacific Coast Hwy', phone: '(310) 317-9140', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-n-naka-la', name: 'n/naka', cuisine: 'Japanese', neighborhood: 'Palms', city: 'Los Angeles', rating: 4.9, reviews: 543, price_range: '$$$$', address: '3455 Overland Ave', phone: '(310) 836-6252', image_url: '', available_times: ['18:00', '20:00'] },
        { id: 'ot-matsuhisa-la', name: 'Matsuhisa', cuisine: 'Japanese', neighborhood: 'Beverly Hills', city: 'Los Angeles', rating: 4.7, reviews: 3214, price_range: '$$$$', address: '129 N La Cienega Blvd', phone: '(310) 659-9639', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-sugarfish-la', name: 'Sugarfish', cuisine: 'Japanese', neighborhood: 'Downtown', city: 'Los Angeles', rating: 4.5, reviews: 4876, price_range: '$$$', address: '600 W 7th St', phone: '(213) 627-3000', image_url: '', available_times: ['12:00', '17:00', '18:00', '19:00', '20:00'] },
        // Mexican (3)
        { id: 'ot-guelaguetza-la', name: 'Guelaguetza', cuisine: 'Mexican', neighborhood: 'Koreatown', city: 'Los Angeles', rating: 4.5, reviews: 3892, price_range: '$$', address: '3014 W Olympic Blvd', phone: '(213) 427-0608', image_url: '', available_times: ['11:00', '12:00', '17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-broken-spanish-la', name: 'Broken Spanish', cuisine: 'Mexican', neighborhood: 'Downtown', city: 'Los Angeles', rating: 4.6, reviews: 2143, price_range: '$$$', address: '1050 S Flower St', phone: '(213) 749-1460', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-guerrilla-la', name: 'Guerrilla Tacos', cuisine: 'Mexican', neighborhood: 'Arts District', city: 'Los Angeles', rating: 4.4, reviews: 1876, price_range: '$$', address: '2000 E 7th St', phone: '(213) 375-3300', image_url: '', available_times: ['11:00', '12:00', '18:00', '19:00', '20:00'] },
        // Other
        { id: 'ot-providence-la', name: 'Providence', cuisine: 'Seafood', neighborhood: 'Hollywood', city: 'Los Angeles', rating: 4.8, reviews: 2876, price_range: '$$$$', address: '5955 Melrose Ave', phone: '(323) 460-4170', image_url: '', available_times: ['17:30', '18:00', '20:00', '20:30'] },
        { id: 'ot-spago-la', name: 'Spago', cuisine: 'American', neighborhood: 'Beverly Hills', city: 'Los Angeles', rating: 4.6, reviews: 4321, price_range: '$$$$', address: '176 N Canon Dr', phone: '(310) 385-0880', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-majordomo-la', name: 'Majordomo', cuisine: 'Korean', neighborhood: 'Chinatown', city: 'Los Angeles', rating: 4.5, reviews: 2654, price_range: '$$$', address: '1725 Naud St', phone: '(323) 545-4880', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-jitlada-la', name: 'Jitlada', cuisine: 'Thai', neighborhood: 'Thai Town', city: 'Los Angeles', rating: 4.6, reviews: 3421, price_range: '$$', address: '5233 Sunset Blvd', phone: '(323) 667-9809', image_url: '', available_times: ['11:00', '17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-petit-trois-la', name: 'Petit Trois', cuisine: 'French', neighborhood: 'Hollywood', city: 'Los Angeles', rating: 4.5, reviews: 1987, price_range: '$$$', address: '718 N Highland Ave', phone: '(323) 468-8916', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00', '21:00'] },
    ],
    'san francisco': [
        { id: 'ot-flour-water-sf', name: 'Flour + Water', cuisine: 'Italian', neighborhood: 'Mission', city: 'San Francisco', rating: 4.7, reviews: 4521, price_range: '$$$', address: '2401 Harrison St', phone: '(415) 826-7000', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-acquerello-sf', name: 'Acquerello', cuisine: 'Italian', neighborhood: 'Polk Gulch', city: 'San Francisco', rating: 4.8, reviews: 1876, price_range: '$$$$', address: '1722 Sacramento St', phone: '(415) 567-5432', image_url: '', available_times: ['17:30', '19:00', '20:30'] },
        { id: 'ot-cotogna-sf', name: 'Cotogna', cuisine: 'Italian', neighborhood: 'Jackson Square', city: 'San Francisco', rating: 4.6, reviews: 3214, price_range: '$$$', address: '490 Pacific Ave', phone: '(415) 775-8508', image_url: '', available_times: ['11:30', '17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-atelier-sf', name: 'Atelier Crenn', cuisine: 'French', neighborhood: 'Cow Hollow', city: 'San Francisco', rating: 4.9, reviews: 1243, price_range: '$$$$', address: '3127 Fillmore St', phone: '(415) 440-0460', image_url: '', available_times: ['17:30', '20:00'] },
        { id: 'ot-omakase-sf', name: 'Omakase', cuisine: 'Japanese', neighborhood: 'SOMA', city: 'San Francisco', rating: 4.8, reviews: 1543, price_range: '$$$$', address: '665 Townsend St', phone: '(415) 865-0633', image_url: '', available_times: ['18:00', '20:30'] },
        { id: 'ot-kokkari-sf', name: 'Kokkari Estiatorio', cuisine: 'Greek', neighborhood: 'Financial District', city: 'San Francisco', rating: 4.7, reviews: 3892, price_range: '$$$', address: '200 Jackson St', phone: '(415) 981-0983', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-lazy-sf', name: 'Lazy Bear', cuisine: 'American', neighborhood: 'Mission', city: 'San Francisco', rating: 4.8, reviews: 2156, price_range: '$$$$', address: '3416 19th St', phone: '(415) 874-9921', image_url: '', available_times: ['18:00', '20:30'] },
        { id: 'ot-state-bird-sf', name: 'State Bird Provisions', cuisine: 'American', neighborhood: 'Fillmore', city: 'San Francisco', rating: 4.7, reviews: 3421, price_range: '$$$', address: '1529 Fillmore St', phone: '(415) 795-1272', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-mister-jius-sf', name: "Mister Jiu's", cuisine: 'Chinese', neighborhood: 'Chinatown', city: 'San Francisco', rating: 4.7, reviews: 1987, price_range: '$$$', address: '28 Waverly Pl', phone: '(415) 857-9688', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-nopalito-sf', name: 'Nopalito', cuisine: 'Mexican', neighborhood: 'Inner Sunset', city: 'San Francisco', rating: 4.6, reviews: 3214, price_range: '$$', address: '1224 9th Ave', phone: '(415) 233-9966', image_url: '', available_times: ['11:30', '17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-house-prime-sf', name: 'House of Prime Rib', cuisine: 'Steakhouse', neighborhood: 'Nob Hill', city: 'San Francisco', rating: 4.6, reviews: 6543, price_range: '$$$', address: '1906 Van Ness Ave', phone: '(415) 885-4605', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-kin-khao-sf', name: 'Kin Khao', cuisine: 'Thai', neighborhood: 'Union Square', city: 'San Francisco', rating: 4.6, reviews: 2143, price_range: '$$', address: '55 Cyril Magnin St', phone: '(415) 362-7456', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
    ],
    'chicago': [
        { id: 'ot-alinea-chi', name: 'Alinea', cuisine: 'American', neighborhood: 'Lincoln Park', city: 'Chicago', rating: 4.9, reviews: 2134, price_range: '$$$$', address: '1723 N Halsted St', phone: '(312) 867-0110', image_url: '', available_times: ['17:00', '20:00'] },
        { id: 'ot-girl-goat-chi', name: 'Girl & The Goat', cuisine: 'American', neighborhood: 'West Loop', city: 'Chicago', rating: 4.7, reviews: 5432, price_range: '$$$', address: '809 W Randolph St', phone: '(312) 492-6262', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00', '21:00'] },
        { id: 'ot-smyth-chi', name: 'Smyth', cuisine: 'American', neighborhood: 'West Loop', city: 'Chicago', rating: 4.8, reviews: 987, price_range: '$$$$', address: '177 N Ada St', phone: '(773) 913-3773', image_url: '', available_times: ['17:30', '20:00'] },
        { id: 'ot-avec-chi', name: 'Avec', cuisine: 'Mediterranean', neighborhood: 'West Loop', city: 'Chicago', rating: 4.6, reviews: 3421, price_range: '$$$', address: '615 W Randolph St', phone: '(312) 377-2002', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-frontera-chi', name: 'Frontera Grill', cuisine: 'Mexican', neighborhood: 'River North', city: 'Chicago', rating: 4.6, reviews: 4521, price_range: '$$$', address: '445 N Clark St', phone: '(312) 661-1434', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-giordanos-chi', name: "Giordano's", cuisine: 'Italian', neighborhood: 'Loop', city: 'Chicago', rating: 4.4, reviews: 8932, price_range: '$$', address: '130 E Randolph St', phone: '(312) 616-1200', image_url: '', available_times: ['11:00', '17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-spiaggia-chi', name: 'Spiaggia', cuisine: 'Italian', neighborhood: 'Gold Coast', city: 'Chicago', rating: 4.7, reviews: 2341, price_range: '$$$$', address: '980 N Michigan Ave', phone: '(312) 280-2750', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-oriole-chi', name: 'Oriole', cuisine: 'American', neighborhood: 'West Loop', city: 'Chicago', rating: 4.9, reviews: 876, price_range: '$$$$', address: '661 W Walnut St', phone: '(312) 877-5339', image_url: '', available_times: ['17:00', '19:30'] },
        { id: 'ot-momotaro-chi', name: 'Momotaro', cuisine: 'Japanese', neighborhood: 'West Loop', city: 'Chicago', rating: 4.6, reviews: 2876, price_range: '$$$', address: '820 W Lake St', phone: '(312) 733-4818', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-bavette-chi', name: "Bavette's", cuisine: 'Steakhouse', neighborhood: 'River North', city: 'Chicago', rating: 4.7, reviews: 3654, price_range: '$$$$', address: '218 W Kinzie St', phone: '(312) 624-8154', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00', '21:00'] },
    ],
    'miami': [
        { id: 'ot-juvia-mia', name: 'Juvia', cuisine: 'French-Japanese', neighborhood: 'South Beach', city: 'Miami', rating: 4.5, reviews: 3421, price_range: '$$$$', address: '1111 Lincoln Rd', phone: '(305) 763-8272', image_url: '', available_times: ['18:00', '19:00', '20:00', '21:00'] },
        { id: 'ot-mandolin-mia', name: 'Mandolin Aegean Bistro', cuisine: 'Greek', neighborhood: 'Design District', city: 'Miami', rating: 4.7, reviews: 2876, price_range: '$$$', address: '4312 NE 2nd Ave', phone: '(305) 576-6066', image_url: '', available_times: ['12:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-versailles-mia', name: 'Versailles', cuisine: 'Cuban', neighborhood: 'Little Havana', city: 'Miami', rating: 4.3, reviews: 7654, price_range: '$$', address: '3555 SW 8th St', phone: '(305) 444-0240', image_url: '', available_times: ['11:00', '12:00', '17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-zuma-mia', name: 'Zuma', cuisine: 'Japanese', neighborhood: 'Downtown', city: 'Miami', rating: 4.7, reviews: 2876, price_range: '$$$$', address: '270 Biscayne Blvd', phone: '(305) 577-0277', image_url: '', available_times: ['18:00', '19:00', '20:00', '21:00'] },
        { id: 'ot-macchialina-mia', name: 'Macchialina', cuisine: 'Italian', neighborhood: 'South Beach', city: 'Miami', rating: 4.6, reviews: 1987, price_range: '$$$', address: '820 Alton Rd', phone: '(305) 534-2124', image_url: '', available_times: ['18:00', '19:00', '20:00', '21:00'] },
        { id: 'ot-cvi-che-mia', name: 'CVI.CHE 105', cuisine: 'Peruvian', neighborhood: 'Downtown', city: 'Miami', rating: 4.6, reviews: 3421, price_range: '$$$', address: '105 NE 3rd Ave', phone: '(305) 577-3454', image_url: '', available_times: ['12:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-michael-mia', name: "Michael's Genuine", cuisine: 'American', neighborhood: 'Design District', city: 'Miami', rating: 4.5, reviews: 2654, price_range: '$$$', address: '130 NE 40th St', phone: '(305) 573-5550', image_url: '', available_times: ['11:30', '17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-stubborn-mia', name: 'Stubborn Seed', cuisine: 'American', neighborhood: 'South Beach', city: 'Miami', rating: 4.7, reviews: 1234, price_range: '$$$$', address: '101 Washington Ave', phone: '(786) 322-5211', image_url: '', available_times: ['18:00', '20:00'] },
        { id: 'ot-fiola-mia', name: 'Fiola Miami', cuisine: 'Italian', neighborhood: 'Coral Gables', city: 'Miami', rating: 4.6, reviews: 1543, price_range: '$$$$', address: '1500 San Ignacio Ave', phone: '(305) 912-2639', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-yardbird-mia', name: 'Yardbird', cuisine: 'Southern', neighborhood: 'South Beach', city: 'Miami', rating: 4.5, reviews: 4321, price_range: '$$$', address: '1600 Lenox Ave', phone: '(305) 538-5220', image_url: '', available_times: ['11:00', '17:00', '18:00', '19:00', '20:00'] },
    ],
    'denver': [
        { id: 'ot-frasca-den', name: 'Frasca Food and Wine', cuisine: 'Italian', neighborhood: 'Boulder', city: 'Denver', rating: 4.8, reviews: 1876, price_range: '$$$$', address: '1738 Pearl St', phone: '(303) 442-6966', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-tavernetta-den', name: 'Tavernetta', cuisine: 'Italian', neighborhood: 'Union Station', city: 'Denver', rating: 4.7, reviews: 2341, price_range: '$$$', address: '1889 16th St', phone: '(720) 605-1889', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-acorn-den', name: 'Acorn', cuisine: 'American', neighborhood: 'RiNo', city: 'Denver', rating: 4.6, reviews: 3214, price_range: '$$$', address: '3350 Brighton Blvd', phone: '(720) 542-3721', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-sushi-den-den', name: 'Sushi Den', cuisine: 'Japanese', neighborhood: 'South Pearl', city: 'Denver', rating: 4.7, reviews: 4521, price_range: '$$$', address: '1487 S Pearl St', phone: '(303) 777-0826', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-guard-grace-den', name: 'Guard and Grace', cuisine: 'Steakhouse', neighborhood: 'Downtown', city: 'Denver', rating: 4.6, reviews: 2987, price_range: '$$$$', address: '1801 California St', phone: '(303) 293-8500', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-mercantile-den', name: 'Mercantile', cuisine: 'American', neighborhood: 'Union Station', city: 'Denver', rating: 4.5, reviews: 2143, price_range: '$$$', address: '1701 Wynkoop St', phone: '(720) 460-3733', image_url: '', available_times: ['11:00', '17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-los-chingones-den', name: 'Los Chingones', cuisine: 'Mexican', neighborhood: 'RiNo', city: 'Denver', rating: 4.4, reviews: 2876, price_range: '$$', address: '2463 Larimer St', phone: '(303) 295-0686', image_url: '', available_times: ['11:00', '17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-beckon-den', name: 'Beckon', cuisine: 'American', neighborhood: 'RiNo', city: 'Denver', rating: 4.7, reviews: 654, price_range: '$$$$', address: '2843 Larimer St', phone: '(720) 669-4133', image_url: '', available_times: ['18:00', '20:00'] },
    ],
    'seattle': [
        { id: 'ot-canlis-sea', name: 'Canlis', cuisine: 'American', neighborhood: 'Westlake', city: 'Seattle', rating: 4.9, reviews: 1543, price_range: '$$$$', address: '2576 Aurora Ave N', phone: '(206) 283-3313', image_url: '', available_times: ['17:30', '19:30'] },
        { id: 'ot-altura-sea', name: 'Altura', cuisine: 'Italian', neighborhood: 'Capitol Hill', city: 'Seattle', rating: 4.8, reviews: 987, price_range: '$$$$', address: '617 Broadway E', phone: '(206) 402-6749', image_url: '', available_times: ['17:00', '19:30'] },
        { id: 'ot-bateau-sea', name: 'Bateau', cuisine: 'Steakhouse', neighborhood: 'Capitol Hill', city: 'Seattle', rating: 4.7, reviews: 1234, price_range: '$$$$', address: '1040 E Union St', phone: '(206) 900-8699', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-shiro-sea', name: "Shiro's", cuisine: 'Japanese', neighborhood: 'Belltown', city: 'Seattle', rating: 4.8, reviews: 2341, price_range: '$$$$', address: '2401 2nd Ave', phone: '(206) 443-9844', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-walrus-sea', name: 'The Walrus and the Carpenter', cuisine: 'Seafood', neighborhood: 'Ballard', city: 'Seattle', rating: 4.6, reviews: 3214, price_range: '$$$', address: '4743 Ballard Ave NW', phone: '(206) 395-9227', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-spinasse-sea', name: 'Spinasse', cuisine: 'Italian', neighborhood: 'Capitol Hill', city: 'Seattle', rating: 4.7, reviews: 1876, price_range: '$$$', address: '1531 14th Ave', phone: '(206) 251-7673', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-copine-sea', name: 'Copine', cuisine: 'French', neighborhood: 'Ballard', city: 'Seattle', rating: 4.6, reviews: 1234, price_range: '$$$', address: '6460 24th Ave NW', phone: '(206) 258-8940', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-stateside-sea', name: 'Stateside', cuisine: 'Vietnamese', neighborhood: 'Capitol Hill', city: 'Seattle', rating: 4.5, reviews: 1654, price_range: '$$', address: '300 E Pike St', phone: '(206) 557-7273', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
    ],
    'austin': [
        { id: 'ot-uchi-aus', name: 'Uchi', cuisine: 'Japanese', neighborhood: 'South Lamar', city: 'Austin', rating: 4.8, reviews: 3421, price_range: '$$$$', address: '801 S Lamar Blvd', phone: '(512) 916-4808', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-lenoir-aus', name: 'Lenoir', cuisine: 'American', neighborhood: 'South Congress', city: 'Austin', rating: 4.7, reviews: 1234, price_range: '$$$$', address: '1807 S 1st St', phone: '(512) 215-9778', image_url: '', available_times: ['18:00', '20:00'] },
        { id: 'ot-franklin-aus', name: 'Franklin Barbecue', cuisine: 'BBQ', neighborhood: 'East Austin', city: 'Austin', rating: 4.9, reviews: 8765, price_range: '$$', address: '900 E 11th St', phone: '(512) 653-1187', image_url: '', available_times: ['11:00', '12:00', '13:00'] },
        { id: 'ot-emmer-aus', name: 'Emmer & Rye', cuisine: 'American', neighborhood: 'Rainey Street', city: 'Austin', rating: 4.6, reviews: 1876, price_range: '$$$', address: '51 Rainey St', phone: '(512) 366-5530', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-juniper-aus', name: 'Juniper', cuisine: 'Italian', neighborhood: 'East Austin', city: 'Austin', rating: 4.5, reviews: 1543, price_range: '$$$', address: '2400 E Cesar Chavez', phone: '(512) 220-9421', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-suerte-aus', name: 'Suerte', cuisine: 'Mexican', neighborhood: 'East Austin', city: 'Austin', rating: 4.7, reviews: 2341, price_range: '$$$', address: '1800 E 6th St', phone: '(512) 953-0092', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-lavenaria-aus', name: "L'Oca d'Oro", cuisine: 'Italian', neighborhood: 'Mueller', city: 'Austin', rating: 4.6, reviews: 1234, price_range: '$$$', address: '1900 Simond Ave', phone: '(512) 580-6590', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-salty-aus', name: 'Salty Sow', cuisine: 'American', neighborhood: 'East Austin', city: 'Austin', rating: 4.4, reviews: 2143, price_range: '$$', address: '1917 Manor Rd', phone: '(512) 391-2337', image_url: '', available_times: ['11:00', '17:00', '18:00', '19:00', '20:00'] },
    ],
    'boston': [
        { id: 'ot-oleana-bos', name: 'Oleana', cuisine: 'Mediterranean', neighborhood: 'Cambridge', city: 'Boston', rating: 4.8, reviews: 2143, price_range: '$$$', address: '134 Hampshire St', phone: '(617) 661-0505', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-menton-bos', name: 'Menton', cuisine: 'French', neighborhood: 'Seaport', city: 'Boston', rating: 4.9, reviews: 1234, price_range: '$$$$', address: '354 Congress St', phone: '(617) 737-0099', image_url: '', available_times: ['17:30', '19:30'] },
        { id: 'ot-no9-bos', name: 'No. 9 Park', cuisine: 'French-Italian', neighborhood: 'Beacon Hill', city: 'Boston', rating: 4.7, reviews: 1876, price_range: '$$$$', address: '9 Park St', phone: '(617) 742-9991', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-oishii-bos', name: 'Oishii', cuisine: 'Japanese', neighborhood: 'South End', city: 'Boston', rating: 4.7, reviews: 2341, price_range: '$$$$', address: '1166 Washington St', phone: '(617) 482-8868', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-neptune-bos', name: 'Neptune Oyster', cuisine: 'Seafood', neighborhood: 'North End', city: 'Boston', rating: 4.6, reviews: 4321, price_range: '$$$', address: '63 Salem St', phone: '(617) 742-3474', image_url: '', available_times: ['11:30', '17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-sorellina-bos', name: 'Sorellina', cuisine: 'Italian', neighborhood: 'Back Bay', city: 'Boston', rating: 4.6, reviews: 1987, price_range: '$$$$', address: '1 Huntington Ave', phone: '(617) 412-4600', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-toro-bos', name: 'Toro', cuisine: 'Spanish', neighborhood: 'South End', city: 'Boston', rating: 4.5, reviews: 3214, price_range: '$$$', address: '1704 Washington St', phone: '(617) 536-4300', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00', '21:00'] },
        { id: 'ot-myers-bos', name: "Myers + Chang", cuisine: 'Asian', neighborhood: 'South End', city: 'Boston', rating: 4.5, reviews: 2654, price_range: '$$', address: '1145 Washington St', phone: '(617) 542-5200', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
    ],
    'washington dc': [
        { id: 'ot-minibar-dc', name: 'Minibar', cuisine: 'American', neighborhood: 'Penn Quarter', city: 'Washington DC', rating: 4.9, reviews: 876, price_range: '$$$$', address: '855 E St NW', phone: '(202) 393-0812', image_url: '', available_times: ['18:00', '20:30'] },
        { id: 'ot-rose-dc', name: "Rose's Luxury", cuisine: 'American', neighborhood: 'Capitol Hill', city: 'Washington DC', rating: 4.7, reviews: 2341, price_range: '$$$', address: '717 8th St SE', phone: '(202) 580-8889', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-pineapple-dc', name: 'Pineapple and Pearls', cuisine: 'American', neighborhood: 'Capitol Hill', city: 'Washington DC', rating: 4.8, reviews: 987, price_range: '$$$$', address: '715 8th St SE', phone: '(202) 595-7375', image_url: '', available_times: ['17:30', '20:00'] },
        { id: 'ot-dabney-dc', name: 'The Dabney', cuisine: 'American', neighborhood: 'Shaw', city: 'Washington DC', rating: 4.6, reviews: 1654, price_range: '$$$', address: '122 Blagden Alley NW', phone: '(202) 450-1015', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-fiola-dc', name: 'Fiola', cuisine: 'Italian', neighborhood: 'Penn Quarter', city: 'Washington DC', rating: 4.7, reviews: 1876, price_range: '$$$$', address: '601 Pennsylvania Ave NW', phone: '(202) 628-2888', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-sushi-taro-dc', name: 'Sushi Taro', cuisine: 'Japanese', neighborhood: 'Dupont Circle', city: 'Washington DC', rating: 4.6, reviews: 1432, price_range: '$$$$', address: '1503 17th St NW', phone: '(202) 462-8999', image_url: '', available_times: ['18:00', '19:00', '20:00'] },
        { id: 'ot-oyamel-dc', name: 'Oyamel', cuisine: 'Mexican', neighborhood: 'Penn Quarter', city: 'Washington DC', rating: 4.4, reviews: 3421, price_range: '$$', address: '401 7th St NW', phone: '(202) 628-1005', image_url: '', available_times: ['11:30', '17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-le-dip-dc', name: 'Le Diplomate', cuisine: 'French', neighborhood: 'Logan Circle', city: 'Washington DC', rating: 4.5, reviews: 4876, price_range: '$$$', address: '1601 14th St NW', phone: '(202) 332-3333', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00', '21:00'] },
    ],
    'philadelphia': [
        { id: 'ot-zahav-phi', name: 'Zahav', cuisine: 'Israeli', neighborhood: 'Society Hill', city: 'Philadelphia', rating: 4.8, reviews: 3214, price_range: '$$$', address: '237 St James Pl', phone: '(215) 625-8800', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-vernick-phi', name: 'Vernick Food & Drink', cuisine: 'American', neighborhood: 'Rittenhouse', city: 'Philadelphia', rating: 4.7, reviews: 2143, price_range: '$$$', address: '2031 Walnut St', phone: '(267) 639-6644', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-laurel-phi', name: 'Laurel', cuisine: 'French', neighborhood: 'Passyunk', city: 'Philadelphia', rating: 4.8, reviews: 876, price_range: '$$$$', address: '1617 E Passyunk Ave', phone: '(215) 271-8299', image_url: '', available_times: ['17:30', '20:00'] },
        { id: 'ot-vetri-phi', name: 'Vetri Cucina', cuisine: 'Italian', neighborhood: 'Center City', city: 'Philadelphia', rating: 4.8, reviews: 1654, price_range: '$$$$', address: '1312 Spruce St', phone: '(215) 732-3478', image_url: '', available_times: ['17:00', '19:30'] },
        { id: 'ot-talulas-phi', name: "Talula's Garden", cuisine: 'American', neighborhood: 'Washington Square', city: 'Philadelphia', rating: 4.5, reviews: 2876, price_range: '$$$', address: '210 W Washington Sq', phone: '(215) 592-7787', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-morimoto-phi', name: 'Morimoto', cuisine: 'Japanese', neighborhood: 'Washington Square', city: 'Philadelphia', rating: 4.5, reviews: 3421, price_range: '$$$$', address: '723 Chestnut St', phone: '(215) 413-9070', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-south-phi', name: 'South Philly Barbacoa', cuisine: 'Mexican', neighborhood: 'Italian Market', city: 'Philadelphia', rating: 4.6, reviews: 1987, price_range: '$', address: '1140 S 9th St', phone: '(215) 694-3797', image_url: '', available_times: ['10:00', '11:00', '12:00'] },
    ],
    'las vegas': [
        { id: 'ot-joelrobuchon-lv', name: 'Joel Robuchon', cuisine: 'French', neighborhood: 'Strip', city: 'Las Vegas', rating: 4.9, reviews: 1234, price_range: '$$$$', address: '3799 Las Vegas Blvd S', phone: '(702) 891-7925', image_url: '', available_times: ['17:30', '20:00'] },
        { id: 'ot-carbone-lv', name: 'Carbone', cuisine: 'Italian', neighborhood: 'Strip', city: 'Las Vegas', rating: 4.7, reviews: 2341, price_range: '$$$$', address: '3325 Las Vegas Blvd S', phone: '(702) 730-6700', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00', '21:00'] },
        { id: 'ot-bazaar-lv', name: 'Bazaar Meat', cuisine: 'Steakhouse', neighborhood: 'Strip', city: 'Las Vegas', rating: 4.6, reviews: 1876, price_range: '$$$$', address: '2535 Las Vegas Blvd S', phone: '(702) 761-7610', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-nobu-lv', name: 'Nobu', cuisine: 'Japanese', neighborhood: 'Strip', city: 'Las Vegas', rating: 4.5, reviews: 4521, price_range: '$$$$', address: '4455 Paradise Rd', phone: '(702) 693-5090', image_url: '', available_times: ['18:00', '19:00', '20:00', '21:00'] },
        { id: 'ot-lotus-lv', name: 'Lotus of Siam', cuisine: 'Thai', neighborhood: 'Off Strip', city: 'Las Vegas', rating: 4.7, reviews: 5432, price_range: '$$', address: '620 E Flamingo Rd', phone: '(702) 735-3033', image_url: '', available_times: ['11:30', '17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-bardot-lv', name: 'Bardot Brasserie', cuisine: 'French', neighborhood: 'Strip', city: 'Las Vegas', rating: 4.5, reviews: 1654, price_range: '$$$', address: '3730 Las Vegas Blvd S', phone: '(702) 730-6700', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-esther-lv', name: "Esther's Kitchen", cuisine: 'Italian', neighborhood: 'Arts District', city: 'Las Vegas', rating: 4.5, reviews: 1234, price_range: '$$', address: '1130 S Casino Center Blvd', phone: '(702) 570-7864', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
    ],
    'nashville': [
        { id: 'ot-catbird-nas', name: 'Catbird Seat', cuisine: 'American', neighborhood: 'Midtown', city: 'Nashville', rating: 4.9, reviews: 876, price_range: '$$$$', address: '1711 Division St', phone: '(615) 810-8200', image_url: '', available_times: ['18:00', '20:30'] },
        { id: 'ot-husk-nas', name: 'Husk', cuisine: 'Southern', neighborhood: 'Downtown', city: 'Nashville', rating: 4.6, reviews: 3421, price_range: '$$$', address: '37 Rutledge St', phone: '(615) 256-6565', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-rolf-nas', name: 'Rolf and Daughters', cuisine: 'Italian', neighborhood: 'Germantown', city: 'Nashville', rating: 4.7, reviews: 2143, price_range: '$$$', address: '700 Taylor St', phone: '(615) 866-9897', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-princes-nas', name: "Prince's Hot Chicken", cuisine: 'Southern', neighborhood: 'East Nashville', city: 'Nashville', rating: 4.5, reviews: 5432, price_range: '$', address: '123 Ewing Dr', phone: '(615) 226-9442', image_url: '', available_times: ['11:00', '12:00', '13:00', '17:00', '18:00'] },
        { id: 'ot-bastion-nas', name: 'Bastion', cuisine: 'American', neighborhood: 'Wedgewood-Houston', city: 'Nashville', rating: 4.6, reviews: 987, price_range: '$$$', address: '434 Houston St', phone: '(615) 490-8434', image_url: '', available_times: ['18:00', '20:00'] },
        { id: 'ot-peninsula-nas', name: 'Peninsula', cuisine: 'Spanish', neighborhood: 'East Nashville', city: 'Nashville', rating: 4.5, reviews: 1234, price_range: '$$$', address: '1035 W Eastland Ave', phone: '(615) 679-0377', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
    ],
    'portland': [
        { id: 'ot-canard-por', name: 'Canard', cuisine: 'French', neighborhood: 'Inner SE', city: 'Portland', rating: 4.7, reviews: 1876, price_range: '$$$', address: '734 E Burnside St', phone: '(971) 279-2356', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-lepigeon-por', name: 'Le Pigeon', cuisine: 'French', neighborhood: 'Inner SE', city: 'Portland', rating: 4.7, reviews: 2143, price_range: '$$$$', address: '738 E Burnside St', phone: '(503) 546-8796', image_url: '', available_times: ['17:00', '19:30'] },
        { id: 'ot-langbaan-por', name: 'Langbaan', cuisine: 'Thai', neighborhood: 'Division', city: 'Portland', rating: 4.8, reviews: 987, price_range: '$$$$', address: '6 SE 28th Ave', phone: '(971) 344-2564', image_url: '', available_times: ['18:00', '20:30'] },
        { id: 'ot-ox-por', name: 'Ox Restaurant', cuisine: 'Steakhouse', neighborhood: 'Inner NE', city: 'Portland', rating: 4.6, reviews: 2654, price_range: '$$$', address: '2225 NE Martin Luther King Jr Blvd', phone: '(503) 284-3366', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-nodoguro-por', name: 'Nodoguro', cuisine: 'Japanese', neighborhood: 'Inner NE', city: 'Portland', rating: 4.8, reviews: 765, price_range: '$$$$', address: '2832 SE Belmont St', phone: '(971) 888-5755', image_url: '', available_times: ['18:00', '20:00'] },
        { id: 'ot-ava-por', name: 'Ava Gene\'s', cuisine: 'Italian', neighborhood: 'Division', city: 'Portland', rating: 4.6, reviews: 1987, price_range: '$$$', address: '3377 SE Division St', phone: '(971) 229-0571', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-pok-por', name: 'Pok Pok', cuisine: 'Thai', neighborhood: 'Division', city: 'Portland', rating: 4.5, reviews: 4321, price_range: '$$', address: '3226 SE Division St', phone: '(503) 232-1387', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
    ],
    'san diego': [
        { id: 'ot-addison-sd', name: 'Addison', cuisine: 'French', neighborhood: 'Del Mar', city: 'San Diego', rating: 4.9, reviews: 876, price_range: '$$$$', address: '5200 Grand Del Mar Way', phone: '(858) 314-1900', image_url: '', available_times: ['18:00', '20:00'] },
        { id: 'ot-juniper-sd', name: 'Juniper & Ivy', cuisine: 'American', neighborhood: 'Little Italy', city: 'San Diego', rating: 4.6, reviews: 2341, price_range: '$$$', address: '2228 Kettner Blvd', phone: '(619) 269-9036', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-born-sd', name: 'Born & Raised', cuisine: 'Steakhouse', neighborhood: 'Little Italy', city: 'San Diego', rating: 4.6, reviews: 1876, price_range: '$$$$', address: '1909 India St', phone: '(619) 202-4577', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-sushi-ota-sd', name: 'Sushi Ota', cuisine: 'Japanese', neighborhood: 'Pacific Beach', city: 'San Diego', rating: 4.7, reviews: 3214, price_range: '$$$', address: '4529 Mission Bay Dr', phone: '(858) 270-5670', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
        { id: 'ot-puesta-sd', name: 'Puesto', cuisine: 'Mexican', neighborhood: 'Downtown', city: 'San Diego', rating: 4.4, reviews: 4521, price_range: '$$', address: '789 W Harbor Dr', phone: '(619) 233-8880', image_url: '', available_times: ['11:00', '17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-civico-sd', name: 'Civico 1845', cuisine: 'Italian', neighborhood: 'Little Italy', city: 'San Diego', rating: 4.5, reviews: 1654, price_range: '$$$', address: '1845 India St', phone: '(619) 431-5990', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
    ],
    'new orleans': [
        { id: 'ot-commanders-no', name: "Commander's Palace", cuisine: 'Creole', neighborhood: 'Garden District', city: 'New Orleans', rating: 4.7, reviews: 5432, price_range: '$$$$', address: '1403 Washington Ave', phone: '(504) 899-8221', image_url: '', available_times: ['11:30', '18:00', '19:00', '20:00'] },
        { id: 'ot-compere-no', name: 'Compere Lapin', cuisine: 'Caribbean', neighborhood: 'Warehouse District', city: 'New Orleans', rating: 4.6, reviews: 1876, price_range: '$$$', address: '535 Tchoupitoulas St', phone: '(504) 599-2119', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-cochon-no', name: 'Cochon', cuisine: 'Cajun', neighborhood: 'Warehouse District', city: 'New Orleans', rating: 4.5, reviews: 3214, price_range: '$$$', address: '930 Tchoupitoulas St', phone: '(504) 588-2123', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-peche-no', name: 'Peche Seafood Grill', cuisine: 'Seafood', neighborhood: 'Warehouse District', city: 'New Orleans', rating: 4.6, reviews: 2654, price_range: '$$$', address: '800 Magazine St', phone: '(504) 522-1744', image_url: '', available_times: ['11:00', '17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-galatoires-no', name: "Galatoire's", cuisine: 'French Creole', neighborhood: 'French Quarter', city: 'New Orleans', rating: 4.5, reviews: 4321, price_range: '$$$$', address: '209 Bourbon St', phone: '(504) 525-2021', image_url: '', available_times: ['11:30', '17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-shaya-no', name: 'Shaya', cuisine: 'Israeli', neighborhood: 'Uptown', city: 'New Orleans', rating: 4.6, reviews: 1987, price_range: '$$$', address: '4213 Magazine St', phone: '(504) 891-4213', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
    ],
    'atlanta': [
        { id: 'ot-bacchanalia-atl', name: 'Bacchanalia', cuisine: 'American', neighborhood: 'Westside', city: 'Atlanta', rating: 4.8, reviews: 1654, price_range: '$$$$', address: '1460 Ellsworth Industrial Blvd NW', phone: '(404) 365-0410', image_url: '', available_times: ['18:00', '20:00'] },
        { id: 'ot-staplehouse-atl', name: 'Staplehouse', cuisine: 'American', neighborhood: 'Old Fourth Ward', city: 'Atlanta', rating: 4.7, reviews: 1234, price_range: '$$$$', address: '541 Edgewood Ave SE', phone: '(404) 524-5005', image_url: '', available_times: ['17:30', '19:30'] },
        { id: 'ot-mf-sushi-atl', name: 'MF Sushi', cuisine: 'Japanese', neighborhood: 'Midtown', city: 'Atlanta', rating: 4.7, reviews: 987, price_range: '$$$$', address: '1587 Monroe Dr NE', phone: '(404) 815-8844', image_url: '', available_times: ['18:00', '20:00'] },
        { id: 'ot-gunshow-atl', name: 'Gunshow', cuisine: 'American', neighborhood: 'Glenwood Park', city: 'Atlanta', rating: 4.6, reviews: 1876, price_range: '$$$', address: '924 Garrett St SE', phone: '(404) 380-1886', image_url: '', available_times: ['18:00', '19:00', '20:00'] },
        { id: 'ot-bones-atl', name: "Bone's", cuisine: 'Steakhouse', neighborhood: 'Buckhead', city: 'Atlanta', rating: 4.6, reviews: 2654, price_range: '$$$$', address: '3130 Piedmont Rd NE', phone: '(404) 237-2663', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-miller-atl', name: 'Miller Union', cuisine: 'Southern', neighborhood: 'Westside', city: 'Atlanta', rating: 4.5, reviews: 2143, price_range: '$$$', address: '999 Brady Ave NW', phone: '(678) 733-8550', image_url: '', available_times: ['17:30', '18:30', '19:30', '20:30'] },
    ],
    'minneapolis': [
        { id: 'ot-spoon-min', name: 'Spoon and Stable', cuisine: 'French', neighborhood: 'North Loop', city: 'Minneapolis', rating: 4.7, reviews: 2341, price_range: '$$$', address: '211 N 1st St', phone: '(612) 224-9850', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-travail-min', name: 'Travail Kitchen', cuisine: 'American', neighborhood: 'Robbinsdale', city: 'Minneapolis', rating: 4.8, reviews: 987, price_range: '$$$$', address: '4124 W Broadway Ave', phone: '(763) 535-1131', image_url: '', available_times: ['18:00', '20:00'] },
        { id: 'ot-hai-min', name: 'Hai Hai', cuisine: 'Vietnamese', neighborhood: 'Northeast', city: 'Minneapolis', rating: 4.5, reviews: 1876, price_range: '$$', address: '2121 University Ave NE', phone: '(612) 223-8640', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-young-min', name: 'Young Joni', cuisine: 'American', neighborhood: 'Northeast', city: 'Minneapolis', rating: 4.6, reviews: 2143, price_range: '$$$', address: '165 13th Ave NE', phone: '(612) 345-5719', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-bar-la-min', name: 'Bar La Grassa', cuisine: 'Italian', neighborhood: 'North Loop', city: 'Minneapolis', rating: 4.6, reviews: 3214, price_range: '$$$', address: '800 N Washington Ave', phone: '(612) 333-3837', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00', '21:00'] },
    ],
    'honolulu': [
        { id: 'ot-sushi-sho-hon', name: 'Sushi Sho', cuisine: 'Japanese', neighborhood: 'Waikiki', city: 'Honolulu', rating: 4.9, reviews: 654, price_range: '$$$$', address: '1680 Kapiolani Blvd', phone: '(808) 941-3600', image_url: '', available_times: ['17:30', '19:30'] },
        { id: 'ot-mavro-hon', name: 'Chef Mavro', cuisine: 'Hawaiian-French', neighborhood: 'McCully', city: 'Honolulu', rating: 4.7, reviews: 987, price_range: '$$$$', address: '1969 S King St', phone: '(808) 944-4714', image_url: '', available_times: ['18:00', '20:00'] },
        { id: 'ot-mw-hon', name: 'MW Restaurant', cuisine: 'Hawaiian', neighborhood: 'Kakaako', city: 'Honolulu', rating: 4.5, reviews: 1654, price_range: '$$$', address: '1538 Kapiolani Blvd', phone: '(808) 955-6505', image_url: '', available_times: ['17:00', '18:00', '19:00', '20:00'] },
        { id: 'ot-senia-hon', name: 'Senia', cuisine: 'American', neighborhood: 'Chinatown', city: 'Honolulu', rating: 4.7, reviews: 876, price_range: '$$$$', address: '75 N King St', phone: '(808) 200-5412', image_url: '', available_times: ['17:30', '19:30'] },
        { id: 'ot-marukame-hon', name: 'Marukame Udon', cuisine: 'Japanese', neighborhood: 'Waikiki', city: 'Honolulu', rating: 4.4, reviews: 6543, price_range: '$', address: '2310 Kuhio Ave', phone: '(808) 931-6000', image_url: '', available_times: ['11:00', '12:00', '17:00', '18:00', '19:00'] },
    ],
};
// Default restaurants for unknown cities
const defaultRestaurants = [
    {
        id: 'ot-default-italian',
        name: 'Trattoria Roma',
        cuisine: 'Italian',
        neighborhood: 'Downtown',
        city: 'City Center',
        rating: 4.5,
        reviews: 1234,
        price_range: '$$$',
        address: '123 Main St',
        phone: '(555) 123-4567',
        image_url: 'https://images.opentable.com/default-italian.jpg',
        available_times: ['17:00', '18:00', '19:00', '20:00', '21:00'],
    },
    {
        id: 'ot-default-american',
        name: 'The Local Kitchen',
        cuisine: 'American',
        neighborhood: 'Downtown',
        city: 'City Center',
        rating: 4.4,
        reviews: 2345,
        price_range: '$$',
        address: '456 Oak Ave',
        phone: '(555) 234-5678',
        image_url: 'https://images.opentable.com/default-american.jpg',
        available_times: ['11:00', '12:00', '17:00', '18:00', '19:00', '20:00'],
    },
];
/**
 * Get restaurants for a location
 */
function getRestaurants(location, cuisine) {
    const normalized = location.toLowerCase().trim();
    // Find matching city
    let restaurants = restaurantData[normalized];
    // Try partial match
    if (!restaurants) {
        for (const [city, data] of Object.entries(restaurantData)) {
            if (normalized.includes(city) || city.includes(normalized)) {
                restaurants = data;
                break;
            }
        }
    }
    // Fall back to default
    if (!restaurants) {
        restaurants = defaultRestaurants;
    }
    // Filter by cuisine if specified
    if (cuisine) {
        const cuisineLower = cuisine.toLowerCase();
        const filtered = restaurants.filter(r => r.cuisine.toLowerCase().includes(cuisineLower));
        if (filtered.length > 0) {
            return filtered;
        }
    }
    return restaurants;
}
/**
 * Generate a confirmation number
 */
function generateConfirmationNumber() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let num = 'OT-';
    for (let i = 0; i < 6; i++) {
        num += chars[Math.floor(Math.random() * chars.length)];
    }
    return num;
}
/**
 * Get timezone abbreviation for a city
 */
function getTimezoneForCity(city) {
    const cityLower = city.toLowerCase();
    // Eastern Time
    if (['new york', 'nyc', 'manhattan', 'brooklyn', 'miami', 'atlanta', 'boston', 'philadelphia', 'washington dc', 'dc'].some(c => cityLower.includes(c))) {
        return 'ET';
    }
    // Central Time
    if (['chicago', 'houston', 'dallas', 'austin', 'san antonio', 'nashville', 'new orleans', 'minneapolis'].some(c => cityLower.includes(c))) {
        return 'CT';
    }
    // Mountain Time
    if (['denver', 'phoenix', 'salt lake', 'albuquerque'].some(c => cityLower.includes(c))) {
        return 'MT';
    }
    // Pacific Time
    if (['los angeles', 'la', 'san francisco', 'sf', 'seattle', 'portland', 'san diego', 'las vegas', 'honolulu'].some(c => cityLower.includes(c))) {
        return 'PT';
    }
    // Hawaii Time
    if (['honolulu', 'hawaii', 'maui'].some(c => cityLower.includes(c))) {
        return 'HT';
    }
    return ''; // Unknown timezone
}
/**
 * Format time from 24h to 12h with optional timezone
 */
function formatTime(time, city) {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const timeStr = `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    if (city) {
        const tz = getTimezoneForCity(city);
        return tz ? `${timeStr} ${tz}` : timeStr;
    }
    return timeStr;
}
/**
 * Format available times array to 12h format
 */
function formatAvailableTimes(times) {
    return times.map(t => {
        const [hours, minutes] = t.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    });
}
/**
 * Format date for display
 */
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}
/**
 * OpenTable Restaurant Reservation Plugin
 */
exports.opentablePlugin = {
    id: 'opentable',
    name: 'OpenTable Reservation Bot',
    description: 'A restaurant assistant that helps users find restaurants and make reservations powered by OpenTable.',
    version: '1.0.0',
    systemPrompt: SYSTEM_PROMPT,
    tools: TOOLS,
    async initialize(config) {
        // In a real implementation, we'd initialize the OpenTable API client here
        // For now, we use sandbox data
        console.log('[OpenTable Plugin] ✅ Initialized (sandbox mode)');
        console.log('[OpenTable Plugin] Available cities:', Object.keys(restaurantData).join(', '));
    },
    async executeTool(context) {
        const { toolName, arguments: args } = context;
        try {
            switch (toolName) {
                case 'search_restaurants': {
                    const location = args.location;
                    const cuisine = args.cuisine;
                    const date = args.date || new Date().toISOString().split('T')[0];
                    const time = args.time || '19:00';
                    const partySize = args.party_size || 2;
                    const restaurants = getRestaurants(location, cuisine);
                    // Filter by time availability
                    const available = restaurants.filter(r => {
                        // Check if any time slot is close to requested time
                        return r.available_times.some(t => {
                            const [reqH] = time.split(':').map(Number);
                            const [availH] = t.split(':').map(Number);
                            return Math.abs(reqH - availH) <= 2;
                        });
                    });
                    const timezone = getTimezoneForCity(location);
                    return {
                        success: true,
                        data: {
                            type: 'restaurants',
                            location,
                            timezone,
                            cuisine,
                            date,
                            time,
                            time_formatted: formatTime(time),
                            party_size: partySize,
                            restaurants: available.slice(0, 4).map(r => ({
                                id: r.id,
                                name: r.name,
                                cuisine: r.cuisine,
                                neighborhood: r.neighborhood,
                                city: r.city,
                                rating: r.rating,
                                reviews: r.reviews,
                                price_range: r.price_range,
                                available_times: formatAvailableTimes(r.available_times.slice(0, 4)),
                            })),
                        },
                    };
                }
                case 'check_availability': {
                    const restaurantId = args.restaurant_id;
                    const date = args.date;
                    const partySize = args.party_size || 2;
                    // Find the restaurant
                    let restaurant;
                    for (const restaurants of Object.values(restaurantData)) {
                        restaurant = restaurants.find(r => r.id === restaurantId);
                        if (restaurant)
                            break;
                    }
                    if (!restaurant) {
                        restaurant = defaultRestaurants.find(r => r.id === restaurantId);
                    }
                    if (!restaurant) {
                        return { success: false, error: 'Restaurant not found' };
                    }
                    const timezone = getTimezoneForCity(restaurant.city);
                    return {
                        success: true,
                        data: {
                            type: 'availability',
                            restaurant_id: restaurantId,
                            restaurant_name: restaurant.name,
                            city: restaurant.city,
                            timezone,
                            date,
                            party_size: partySize,
                            available_times: formatAvailableTimes(restaurant.available_times),
                        },
                    };
                }
                case 'make_reservation': {
                    const restaurantId = args.restaurant_id;
                    const restaurantName = args.restaurant_name;
                    const date = args.date;
                    const time = args.time;
                    const partySize = args.party_size;
                    const specialRequests = args.special_requests;
                    // Find the restaurant for full details
                    let restaurant;
                    for (const restaurants of Object.values(restaurantData)) {
                        restaurant = restaurants.find(r => r.id === restaurantId);
                        if (restaurant)
                            break;
                    }
                    if (!restaurant) {
                        restaurant = defaultRestaurants.find(r => r.id === restaurantId) || {
                            id: restaurantId,
                            name: restaurantName,
                            cuisine: 'Restaurant',
                            neighborhood: '',
                            city: '',
                            rating: 4.5,
                            reviews: 100,
                            price_range: '$$$',
                            address: '',
                            phone: '',
                            image_url: '',
                            available_times: [],
                        };
                    }
                    const confirmation = {
                        confirmation_number: generateConfirmationNumber(),
                        restaurant,
                        date,
                        time,
                        party_size: partySize,
                        special_requests: specialRequests,
                    };
                    const timezone = getTimezoneForCity(restaurant.city);
                    return {
                        success: true,
                        data: {
                            type: 'reservation',
                            confirmation_number: confirmation.confirmation_number,
                            restaurant: {
                                id: restaurant.id,
                                name: restaurant.name,
                                cuisine: restaurant.cuisine,
                                neighborhood: restaurant.neighborhood,
                                city: restaurant.city,
                                address: restaurant.address,
                                phone: restaurant.phone,
                                rating: restaurant.rating,
                                price_range: restaurant.price_range,
                            },
                            date,
                            date_formatted: formatDate(date),
                            time,
                            time_formatted: formatTime(time, restaurant.city),
                            timezone,
                            party_size: partySize,
                            special_requests: specialRequests,
                        },
                    };
                }
                default:
                    return { success: false, error: `Unknown tool: ${toolName}` };
            }
        }
        catch (error) {
            console.error(`[OpenTable Plugin] Tool ${toolName} failed:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },
    extractStorableData(toolResults, grokMessage) {
        // FIRST PASS: Look for a reservation confirmation (highest priority)
        for (const result of toolResults) {
            if (!result.success || !result.data)
                continue;
            const data = result.data;
            if (data.type === 'reservation') {
                console.log(`[OpenTable] Found reservation confirmation: ${data.confirmation_number}`);
                return {
                    title: data.restaurant.name,
                    subtitle: `${data.date_formatted} at ${data.time_formatted}`,
                    primaryItem: {
                        name: `Table for ${data.party_size}`,
                        price: data.restaurant.price_range,
                        rating: data.restaurant.rating,
                    },
                    secondaryItem: {
                        name: `Confirmation: ${data.confirmation_number}`,
                        price: data.restaurant.neighborhood ? `${data.restaurant.neighborhood}` : data.restaurant.cuisine,
                    },
                    actionUrl: `https://www.opentable.com/r/${data.restaurant.id}`,
                    metadata: {
                        type: 'reservation',
                        confirmation_number: data.confirmation_number,
                        restaurant: data.restaurant,
                        date: data.date,
                        time: data.time,
                        time_formatted: data.time_formatted,
                        date_formatted: data.date_formatted,
                        timezone: data.timezone,
                        party_size: data.party_size,
                        special_requests: data.special_requests,
                    },
                };
            }
        }
        // SECOND PASS: Look for restaurant search results (only if no reservation found)
        for (const result of toolResults) {
            if (!result.success || !result.data)
                continue;
            const data = result.data;
            if (data.type === 'restaurants' && data.restaurants?.length > 0) {
                let selectedRestaurant = data.restaurants[0]; // Default to first
                // Try to match restaurant name from Grok's message
                if (grokMessage) {
                    // Normalize for matching - remove punctuation and extra spaces
                    const normalizeForMatch = (s) => s.toLowerCase().replace(/[''`]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
                    const messageNorm = normalizeForMatch(grokMessage);
                    for (const restaurant of data.restaurants) {
                        const nameNorm = normalizeForMatch(restaurant.name);
                        // Check if the restaurant name appears in the message
                        if (messageNorm.includes(nameNorm)) {
                            selectedRestaurant = restaurant;
                            console.log(`[OpenTable] Matched restaurant "${restaurant.name}" from Grok message`);
                            break;
                        }
                    }
                }
                return {
                    title: selectedRestaurant.name,
                    subtitle: `${selectedRestaurant.cuisine} · ${selectedRestaurant.neighborhood || data.location}`,
                    primaryItem: {
                        name: selectedRestaurant.name,
                        price: selectedRestaurant.price_range,
                        rating: selectedRestaurant.rating,
                    },
                    secondaryItem: {
                        name: selectedRestaurant.cuisine,
                        price: selectedRestaurant.neighborhood,
                    },
                    actionUrl: `https://www.opentable.com/r/${selectedRestaurant.id}`,
                    metadata: {
                        type: 'search',
                        restaurant: selectedRestaurant,
                        searchParams: {
                            location: data.location,
                            cuisine: data.cuisine,
                            date: data.date,
                            time: data.time,
                            party_size: data.party_size,
                        },
                    },
                };
            }
        }
        return null;
    },
};
exports.default = exports.opentablePlugin;
//# sourceMappingURL=index.js.map