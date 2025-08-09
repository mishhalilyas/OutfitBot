// server.js

// 1. Import required packages
const express = require('express');
const cors = require('cors');
const vision = require('@google-cloud/vision');
const path = require('path'); // ✅ 1. ADD THIS LINE

// 2. Setup the Express app
const app = express();
app.use(cors()); 
app.use(express.json({ limit: '10mb' })); 
app.use(express.static('public')); 

// 3. Setup the Google Vision client
console.log('Loading Google Vision client with key file:', path.join(__dirname, 'google-api-key.json'));
let client;
try {
  client = new vision.ImageAnnotatorClient({
    keyFilename: path.join(__dirname, 'google-api-key.json')
  });
  console.log('Successfully initialized Google Vision client');
} catch (error) {
  console.error('Failed to initialize Google Vision client:', error);
  process.exit(1);
}

// Test the Vision API connection
async function testVisionAPI() {
  try {
    console.log('Testing Vision API connection...');
    // Try a simple request to test the connection
    const [result] = await client.labelDetection('https://cloud.google.com/vision/docs/images/bicycle_example.png');
    console.log('Vision API connection successful!');
    console.log('Test results:', result.labelAnnotations);
  } catch (error) {
    console.error('Vision API test failed:', error.message);
    if (error.message.includes('permission denied')) {
      console.error('This might be a permissions issue. Please check your service account roles.');
    } else if (error.message.includes('API not enabled')) {
      console.error('The Cloud Vision API is not enabled. Please enable it in the Google Cloud Console.');
    }
    process.exit(1);
  }
}

// Add error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// 4. Create the API endpoint for analysis
app.post('/analyze-outfit', async (req, res) => {
  try {
    const imageData = req.body.image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    const request = {
      image: {
        content: imageBuffer,
      },
      features: [
        { type: 'LABEL_DETECTION' },      // What is it? (e.g., "T-shirt", "Denim")
        { type: 'IMAGE_PROPERTIES' }, // What are the dominant colors?
      ],
    };
    
    console.log("Sending request to Google Vision API...");

    // 5. Send the request to Google and get the results
    const [result] = await client.annotateImage(request);
    
    console.log("Received response from Google.");

    // 6. Extract the useful information
    const labels = result.labelAnnotations.map(label => label.description);
    const colors = result.imagePropertiesAnnotation.dominantColors.colors.map(colorInfo => {
      return {
        hex: `#${Math.round(colorInfo.color.red).toString(16).padStart(2, '0')}${Math.round(colorInfo.color.green).toString(16).padStart(2, '0')}${Math.round(colorInfo.color.blue).toString(16).padStart(2, '0')}`,
        score: colorInfo.score
      }
    });

    // 7. Send the extracted data back to the frontend
    res.json({ labels, colors });

  } catch (error) {
    console.error("ERROR in /analyze-outfit:", error);
    res.status(500).json({ error: 'Failed to analyze image.' });
  }
});
// 8. Start the server
const PORT = 3000;
app.listen(PORT, async () => {
  console.log(`OutfitBot server running at http://localhost:${PORT}`);
  await testVisionAPI();
});