const fetch = require('node-fetch');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { taskId, apiKey } = req.body;
    
    if (!taskId || !apiKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: taskId, apiKey' 
      });
    }
    
    const response = await fetch(`https://api.kie.ai/api/v1/veo/status/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.code === 200 && result.data) {
      const data = result.data;
      const videoUrl = data.videoUrl || data.video_url || data.url;
      
      return res.json({
        success: true,
        data: {
          status: videoUrl ? 'completed' : (data.status || 'processing'),
          videoUrl: videoUrl,
          taskId: taskId
        }
      });
    } else {
      throw new Error(result.msg || 'Status check failed');
    }
    
  } catch (error) {
    console.error('Status Check Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
