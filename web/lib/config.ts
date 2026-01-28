/**
 * Web App Branding Configuration
 * 
 * Customize the look and feel of your bot's web presence.
 * All settings can be overridden via environment variables.
 */

export interface BrandingConfig {
  // Bot identity
  name: string;
  tagline: string;
  logo: string;  // Emoji or URL to image
  
  // Colors (CSS values)
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  
  // Gradients
  backgroundGradient: string;
  buttonGradient: string;
  textGradient: string;
  
  // Card styling
  cardBackground: string;
  cardBorder: string;
  
  // Attribution
  poweredBy: string;
  poweredByUrl: string;
  
  // Button text
  ctaText: string;
}

/**
 * Default branding configuration
 * Override any value with environment variables prefixed with NEXT_PUBLIC_BRAND_
 * 
 * Default colors based on Expedia brand:
 * - Blue: #00355F (primary)
 * - Yellow: #ffc60b (accent/highlight)
 * - White: #ffffff (text)
 */
export const branding: BrandingConfig = {
  // Bot identity
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'BookingBot',
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'AI-Powered Travel Recommendations',
  logo: process.env.NEXT_PUBLIC_BRAND_LOGO || '🛫',
  
  // Colors (Expedia brand)
  primaryColor: process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR || '#00355F',     // Expedia blue
  secondaryColor: process.env.NEXT_PUBLIC_BRAND_SECONDARY_COLOR || '#ffc60b', // Expedia yellow
  accentColor: process.env.NEXT_PUBLIC_BRAND_ACCENT_COLOR || '#ffffff',       // White
  
  // Gradients
  backgroundGradient: process.env.NEXT_PUBLIC_BRAND_BG_GRADIENT || 
    'linear-gradient(135deg, #00355F 0%, #001a2e 50%, #002244 100%)',
  buttonGradient: process.env.NEXT_PUBLIC_BRAND_BUTTON_GRADIENT || 
    'linear-gradient(90deg, #ffc60b, #ffdb4d)',
  textGradient: process.env.NEXT_PUBLIC_BRAND_TEXT_GRADIENT || 
    'linear-gradient(90deg, #ffc60b, #ffe066)',
  
  // Card styling
  cardBackground: process.env.NEXT_PUBLIC_BRAND_CARD_BG || 'rgba(0, 53, 95, 0.7)',
  cardBorder: process.env.NEXT_PUBLIC_BRAND_CARD_BORDER || 'rgba(255, 198, 11, 0.3)',
  
  // Attribution
  poweredBy: process.env.NEXT_PUBLIC_BRAND_POWERED_BY || 'Powered by Expedia',
  poweredByUrl: process.env.NEXT_PUBLIC_BRAND_POWERED_BY_URL || 'https://www.expedia.com',
  
  // CTA
  ctaText: process.env.NEXT_PUBLIC_BRAND_CTA_TEXT || 'Book Now →',
};

/**
 * Get CSS variables for use in stylesheets
 */
export function getBrandingCssVars(): Record<string, string> {
  return {
    '--brand-primary': branding.primaryColor,
    '--brand-secondary': branding.secondaryColor,
    '--brand-accent': branding.accentColor,
    '--brand-bg-gradient': branding.backgroundGradient,
    '--brand-button-gradient': branding.buttonGradient,
    '--brand-text-gradient': branding.textGradient,
    '--brand-card-bg': branding.cardBackground,
    '--brand-card-border': branding.cardBorder,
  };
}
