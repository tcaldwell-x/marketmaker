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
  logo: string;  // Emoji, or URL to image (e.g., "/logo.png" or "https://example.com/logo.png")
  
  // Colors (CSS values)
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  yesColor: string;   // For YES probability
  noColor: string;    // For NO probability
  
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
 * Color palette:
 * - Electric Blue: #3b82f6 (primary accent)
 * - Charcoal/Black: #0a0a0a (near black background)
 * - Green: #22c55e (YES probability)
 * - Red: #ef4444 (NO probability)
 */
export const branding: BrandingConfig = {
  // Bot identity
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'FanDuel Predicts',
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Put Your Predictions to the Test',
  logo: process.env.NEXT_PUBLIC_BRAND_LOGO || '🎯',
  
  // Colors (dark + blue accent)
  primaryColor: process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR || '#0a0a0a',     // Near black
  secondaryColor: process.env.NEXT_PUBLIC_BRAND_SECONDARY_COLOR || '#3b82f6', // Electric blue
  accentColor: process.env.NEXT_PUBLIC_BRAND_ACCENT_COLOR || '#ffffff',       // White
  yesColor: process.env.NEXT_PUBLIC_BRAND_YES_COLOR || '#22c55e',             // Green
  noColor: process.env.NEXT_PUBLIC_BRAND_NO_COLOR || '#ef4444',               // Red
  
  // Gradients (darker, tech-focused)
  backgroundGradient: process.env.NEXT_PUBLIC_BRAND_BG_GRADIENT || 
    'linear-gradient(135deg, #0a0a0a 0%, #0f172a 50%, #0a0a0a 100%)',
  buttonGradient: process.env.NEXT_PUBLIC_BRAND_BUTTON_GRADIENT || 
    'linear-gradient(90deg, #3b82f6, #2563eb)',
  textGradient: process.env.NEXT_PUBLIC_BRAND_TEXT_GRADIENT || 
    'linear-gradient(90deg, #3b82f6, #60a5fa)',
  
  // Card styling (darker with blue tint)
  cardBackground: process.env.NEXT_PUBLIC_BRAND_CARD_BG || 'rgba(15, 23, 42, 0.95)',
  cardBorder: process.env.NEXT_PUBLIC_BRAND_CARD_BORDER || 'rgba(59, 130, 246, 0.3)',
  
  // Attribution
  poweredBy: process.env.NEXT_PUBLIC_BRAND_POWERED_BY || 'FanDuel',
  poweredByUrl: process.env.NEXT_PUBLIC_BRAND_POWERED_BY_URL || 'https://marketmaker-nine.vercel.app',
  
  // CTA
  ctaText: process.env.NEXT_PUBLIC_BRAND_CTA_TEXT || 'Trade This Market →',
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
