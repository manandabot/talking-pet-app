const fetch = require('node-fetch');

export default async function handler(req, res) {
  // Enable CORS
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
    const { script, apiKey, imageBase64 } = req.body;
    
    if (!script || !apiKey || !imageBase64) {
      return res.status(400).json({ 
        error: 'Missing required fields: script, apiKey, imageBase64' 
      });
    }
    
    // Upload image to ImgBB
    const imgbbApiKey = 'f94ca4b1bbd98b8e9c06953c0e1b0c94';
    const formData = new URLSearchParams();
    formData.append('key', imgbbApiKey);
    formData.append('image', imageBase64);
    formData.append('expiration', '7200');
    
    const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    
    const imgbbResult = await imgbbResponse.json();
    
    if (!imgbbResult.success) {
      throw new Error('Failed to upload image');
    }
    
    const imageUrl = imgbbResult.data.url;
    
    // Generate video with Kie AI
    const kieRequest = {
      prompt: `Transform this pet image into a video where the pet is saying: "${script}". The pet should have realistic mouth movements synchronized with the speech, natural head movements, and expressive eyes. The pet should appear to be speaking naturally with clear lip-sync.`,
      imageUrls: [imageUrl],
      model: 'veo3_fast',
      aspectRatio: '16:9'
    };
    
    const kieResponse = await fetch('https://api.kie.ai/api/v1/veo/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(kieRequest)
    });
    
    const kieResult = await kieResponse.json();
    
    if (kieResult.code === 200 && kieResult.data) {
      return res.json({
        success: true,
        data: {
          taskId: kieResult.data.taskId,
          videoUrl: kieResult.data.videoUrl,
          status: kieResult.data.videoUrl ? 'completed' : 'processing'
        }
      });
    } else {
      throw new Error(kieResult.msg || 'Video generation failed');
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
