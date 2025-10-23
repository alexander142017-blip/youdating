export default async function handler(req, res) {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ ok: false, error: 'missing_coords' });
    
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      { headers: { 'User-Agent': 'YouDating/1.0 (contact: support@youdating.app)' } }
    );
    
    const data = await resp.json();
    const addr = data.address || {};
    
    return res.json({
      ok: true,
      city: addr.city || addr.town || addr.village || addr.county || null,
      state: addr.state || addr.region || null,
      country: addr.country || null,
      display: data.display_name || null
    });
  } catch (err) {
    console.error('Reverse geocode error', err);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
}