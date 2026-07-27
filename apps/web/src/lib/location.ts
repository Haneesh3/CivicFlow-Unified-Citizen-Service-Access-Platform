import axios from 'axios';

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  address: string;
}

export const DEFAULT_COORDS = { latitude: 28.6139, longitude: 77.2090 };

export async function getIpLocation(apiKey?: string): Promise<LocationData> {
  const ipstackKey = apiKey?.replace(/['"]/g, '');
  if (ipstackKey) {
    try {
      const res = await axios.get(`http://api.ipstack.com/check?access_key=${ipstackKey}`);
      if (res.data && res.data.latitude) {
        return {
          latitude: res.data.latitude,
          longitude: res.data.longitude,
          city: res.data.city || 'Delhi',
          region: res.data.region_name || 'Delhi',
          address: `${res.data.city || ''}, ${res.data.region_name || ''}, ${res.data.zip || ''}`.trim()
        };
      }
    } catch (error) {
      console.warn('IPstack geolocation failed or rate limited (429), trying ipapi.co fallback:', error);
    }
  }

  // Fallback: ipapi.co (Free, no API key needed, HTTPS supported)
  try {
    const res = await axios.get('https://ipapi.co/json/');
    if (res.data && res.data.latitude) {
      return {
        latitude: res.data.latitude,
        longitude: res.data.longitude,
        city: res.data.city || 'Delhi',
        region: res.data.region || 'Delhi',
        address: `${res.data.city || ''}, ${res.data.region || ''}, ${res.data.postal || ''}`.trim()
      };
    }
  } catch (error) {
    console.error('ipapi.co geolocation fallback failed, using static default:', error);
  }

  return {
    ...DEFAULT_COORDS,
    city: 'New Delhi',
    region: 'Delhi',
    address: 'New Delhi, Delhi, India'
  };
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}
