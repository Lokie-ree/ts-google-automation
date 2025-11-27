import type { DocsColor } from '../types/index.js';

export const PELICAN_BRANDING = {
  colors: {
    pelicanBlue: '#0ea5e9',
    louisianaGold: '#f59e0b',
    deepBlue: '#1e40af',
    white: '#ffffff',
    gray50: '#f8fafc',
    gray900: '#0f172a',
  },
  
  fonts: {
    primary: 'Lexend',      // Body text
    heading: 'Poppins',     // Headers
    monospace: 'Courier New', // Code blocks (using widely available font)
  },
  
  typography: {
    h1: { size: 30, bold: true, color: 'pelicanBlue' as const },
    h2: { size: 20, bold: true, color: 'pelicanBlue' as const },
    h3: { size: 16, bold: true, color: 'deepBlue' as const },
    body: { size: 11, bold: false, color: 'gray900' as const },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  logo: {
    url: 'https://pelicanai.org/primary-logo.png',
    width: 200,
    height: 80,
  },
} as const;

export type BrandingConfig = typeof PELICAN_BRANDING;

/**
 * Convert hex color to RGB format for Google Docs API (0-1 range)
 */
export function hexToRgb(hex: string): { red: number; green: number; blue: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { red: 0, green: 0, blue: 0 };
  }
  return {
    red: parseInt(result[1]!, 16) / 255,
    green: parseInt(result[2]!, 16) / 255,
    blue: parseInt(result[3]!, 16) / 255,
  };
}

/**
 * Get a Google Docs API color object from a hex string
 */
export function getDocsColor(hex: string): DocsColor {
  return {
    color: {
      rgbColor: hexToRgb(hex),
    },
  };
}

/**
 * Get a branded color by name
 */
export function getBrandColor(colorName: keyof typeof PELICAN_BRANDING.colors): DocsColor {
  const hexColor = PELICAN_BRANDING.colors[colorName];
  if (!hexColor) {
    throw new Error(`Unknown color name: ${colorName}`);
  }
  return getDocsColor(hexColor);
}

/**
 * Convert points to magnitude for Google Docs API
 */
export function pointsToMagnitude(points: number): { magnitude: number; unit: 'PT' } {
  return { magnitude: points, unit: 'PT' };
}

