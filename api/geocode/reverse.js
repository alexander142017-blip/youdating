/**
 * Reverse Geocoding API - Vercel Serverless Function
 * 
 * Converts GPS coordinates to human-readable address using OpenStreetMap Nominatim
 * GET /api/geocode/reverse?lat=<num>&lng=<num>
 * 
 * @param {import('vercel').VercelRequest} req
 * @param {import('vercel').VercelResponse} res
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const { lat, lng } = req.query;

    // Validate coordinates
    if (!lat || !lng) {
      return res.status(400).json({ ok: false, error: 'missing_coordinates' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ ok: false, error: 'invalid_coordinates' });
    }

    // Validate coordinate bounds
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ ok: false, error: 'coordinates_out_of_bounds' });
    }

    // Fetch from OpenStreetMap Nominatim
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'YouDating/1.0 (contact: support@youdating.app)'
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status, response.statusText);
      return res.status(502).json({ ok: false, error: 'geocode_failed' });
    }

    const data = await response.json();

    // Handle case where no address is found
    if (!data || !data.address) {
      console.log('No address found for coordinates:', latitude, longitude);
      return res.status(502).json({ ok: false, error: 'geocode_failed' });
    }

    const address = data.address;

    // Extract location components with fallbacks
    const city = address.city || address.town || address.village || address.county || null;
    const state = address.state || address.region || null;
    const country = address.country || null;

    // Create display name
    const displayParts = [city, state, country].filter(Boolean);
    const display = displayParts.length > 0 ? displayParts.join(', ') : null;

    return res.status(200).json({
      ok: true,
      city,
      state,
      country,
      display
    });

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      return res.status(502).json({ ok: false, error: 'geocode_timeout' });
    }
    
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}