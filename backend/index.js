const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const aiService = require('./aiService');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

// ------ ROUTES ------

// STEP 1 & 2: Generate Caption
app.post('/generate-caption', async (req, res) => {
  const { text, textType } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text input is required' });
  }

  try {
    const captionData = await aiService.generateMemeCaption(text, textType || 'double');
    res.json(captionData);
  } catch (error) {
    if (error.message === 'TOKEN_LIMIT_EXCEEDED') {
      return res.status(503).json({ error: 'TOKEN_LIMIT_EXCEEDED' });
    }
    console.error('Server error generating caption:', error);
    res.status(500).json({ error: 'An unexpected error occurred while processing the request' });
  }
});

// STEP 4: Generate Meme Image via Imgflip
app.post('/generate-meme', async (req, res) => {
  const { topText, bottomText, templateId } = req.body;

  if (!topText || !templateId) {
    return res.status(400).json({ error: 'Top text and templateId are required' });
  }

  try {
    const params = new URLSearchParams();
    params.append('template_id', templateId);
    params.append('username', process.env.IMGFLIP_USERNAME);
    params.append('password', process.env.IMGFLIP_PASSWORD);
    params.append('text0', topText);
    params.append('text1', bottomText);
    
    const imgflipResponse = await axios.post('https://api.imgflip.com/caption_image', params);
    const imgflipData = imgflipResponse.data;
    
    if (!imgflipData.success) {
       console.error('Imgflip API Error:', imgflipData);
       return res.status(500).json({ error: imgflipData.error_message || 'Failed to generate meme image from Imgflip' });
    }
    
    res.json({ memeUrl: imgflipData.data.url });
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'An unexpected error occurred while processing the request' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
// aiService.js