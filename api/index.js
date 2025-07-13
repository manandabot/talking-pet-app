export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    return res.json({ message: 'Talking Pet API is working!', timestamp: new Date().toISOString() });
  }
  
  if (req.method === 'POST') {
    try {
      const { script, apiKey, imageBase64, action, taskId } = req.body || {};
      
      // Handle video generation
      if (action === 'generate' || !action) {
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
  console.error('ImgBB Error:', imgbbResult);
  throw new Error(`ImgBB upload failed: ${imgbbResult.error?.message || 'Unknown error'}`);
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
      }
      
      // Handle status checking
      if (action === 'status') {
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
      }
      
      // Test action
      if (action === 'test') {
        return res.json({ 
          message: 'POST received', 
          action: 'test',
          timestamp: new Date().toISOString() 
        });
      }
      
      return res.status(400).json({ error: 'Invalid action' });
      
    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({ 
        error: error.message || 'Internal server error' 
      });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
