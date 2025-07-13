export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    return res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
  }
  
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      return res.json({ 
        message: 'POST received', 
        action: body.action || 'none',
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
