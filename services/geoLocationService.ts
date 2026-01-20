/**
 * Geolocation Service - Detects user's country/region based on IP
 */

export interface GeoLocation {
  country_code: string;
  country_name: string;
  region: string;
}

// Mapping of country codes to region codes used in the app
const COUNTRY_TO_REGION_MAP: Record<string, string> = {
  'SA': 'SA', // Saudi Arabia
  'AE': 'UAE', // UAE
  'KW': 'KW', // Kuwait
  'QA': 'QA', // Qatar
  'BH': 'BH', // Bahrain
  'OM': 'OM', // Oman
  'YE': 'YE', // Yemen
  'EG': 'EG', // Egypt
  'JO': 'JO', // Jordan
  'LB': 'LB', // Lebanon
  'SY': 'SY', // Syria
  'IQ': 'IQ', // Iraq
  'PS': 'PS', // Palestine
  'IL': 'IL', // Israel
  'TR': 'TR', // Turkey
  'IR': 'IR', // Iran
  'MA': 'MA', // Morocco
  'TN': 'TN', // Tunisia
  'DZ': 'DZ', // Algeria
  'LY': 'LY', // Libya
  'SD': 'SD', // Sudan
  'GB': 'GB', // UK
  'US': 'US', // USA
  'CA': 'CA', // Canada
  'AU': 'AU', // Australia
  'DE': 'DE', // Germany
  'FR': 'FR', // France
};

/**
 * Detect user's location based on IP address
 * Uses ipapi.co free API (no key required)
 */
export const detectUserLocation = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Geolocation API error:', response.statusText);
      return null;
    }

    const data = await response.json();
    const countryCode = data.country_code?.toUpperCase();

    if (!countryCode) {
      console.warn('Country code not found in geolocation response');
      return null;
    }

    // Return the mapped region code or default to the country code
    const regionCode = COUNTRY_TO_REGION_MAP[countryCode] || countryCode;
    
    console.log('Detected location:', {
      country: data.country_name,
      countryCode,
      mappedRegion: regionCode,
    });

    return regionCode;
  } catch (error) {
    console.warn('Failed to detect geolocation:', error);
    return null;
  }
};

/**
 * Get country name from country code
 */
export const getCountryNameFromCode = async (code: string): Promise<string | null> => {
  try {
    const response = await fetch(`https://ipapi.co/${code}/json/`, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      return data.country_name || null;
    }
    return null;
  } catch (error) {
    console.warn('Failed to get country name:', error);
    return null;
  }
};
