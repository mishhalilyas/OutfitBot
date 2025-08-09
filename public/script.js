// script.js

// Elements
const drop = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');
const thumb = document.getElementById('thumb');
const fileName = document.getElementById('fileName');
const fileMeta = document.getElementById('fileMeta');
const feedbackBtn = document.getElementById('feedbackBtn');
const removeBtn = document.getElementById('removeBtn');
const result = document.getElementById('result');
const procText = document.getElementById('procText');
const processingLine = document.getElementById('processingLine');
const outcome = document.getElementById('outcome');
const feedbackText = document.getElementById('feedbackText');
const suggestionsList = document.getElementById('suggestionsList');
const labelsList = document.getElementById('labelsList');
const colorsList = document.getElementById('colorsList');

let currentFileAsDataURL = null;

// --- ✅ MODIFIED: Event listener now includes a fallback for server errors ---
feedbackBtn.addEventListener('click', async () => {
  if (!currentFileAsDataURL) {
    alert("Please select a file first.");
    return;
  }

  // Show processing state
  result.style.display = 'block';
  processingLine.style.display = 'block';
  outcome.style.display = 'none';
  procText.textContent = 'Sending to cloud AI for analysis...';

  try {
    // Use fetch to send the image data to our server's endpoint
    const response = await fetch('http://localhost:3000/analyze-outfit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: currentFileAsDataURL }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with an error: ${errorText}`);
    }

    const analysis = await response.json();
    console.log("Received from server:", analysis);

    displayAnalysis(analysis);

  } catch (err) {
    // --- ✅ NEW: Check for a connection error and display fallback content ---
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      console.warn("SERVER CONNECTION FAILED: Using fallback data.");
      procText.textContent = 'Could not connect to the server. Displaying example analysis.';

      // Create a mock analysis object to display
      const fallbackAnalysis = {
        labels: ['Fashion', 'Style', 'Outerwear', 'Street fashion', 'Footwear'],
        colors: [
          { hex: '#2c3e50' }, // Midnight Blue
          { hex: '#ecf0f1' }, // Clouds (Light Grey)
          { hex: '#bdc3c7' }, // Silver
          { hex: '#7f8c8d' }  // Asbestos
        ],
        // Provide pre-written, generic suggestions for the fallback
        suggestions: [
          "A great outfit often balances proportions. Try pairing a looser top with fitted bottoms, or vice-versa.",
          "To create a cohesive look, try picking one accessory (like a bag or shoes) that matches a secondary color in your outfit.",
          "Layering textures, like pairing a cotton shirt with a leather jacket, can add depth and interest.",
          "When in doubt, a classic monochromatic look (using different shades of the same color) is always chic."
        ]
      };
      
      // Display the fallback data using the same function
      displayAnalysis(fallbackAnalysis);
      return; // Exit the function after showing the fallback
    }

    // Handle other, non-connection errors
    console.error("Error fetching analysis:", err);
    procText.textContent = `An error occurred: ${err.message}`;
  }
});


// --- ✅ MODIFIED: Function updated to handle pre-defined suggestions ---
function displayAnalysis(analysis) {
  processingLine.style.display = 'none';
  outcome.style.display = 'block';
  
  // A simple feedback generator
  feedbackText.textContent = `This outfit has several interesting elements. The dominant colors create a specific mood, and we've identified some key labels.`;

  // Display labels as chips
  fillChips('labelsList', analysis.labels);

  // Display colors as swatches
  colorsList.innerHTML = '';
  analysis.colors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color.hex;
    swatch.title = `Hex: ${color.hex}`;
    colorsList.appendChild(swatch);
  });
  
  // --- This logic now checks if suggestions are already provided (for the fallback) ---
  const suggestions = analysis.suggestions || [
    `Try pairing the dominant colors with a neutral tone like white or grey.`, 
    `Accessorize with items that match the "${analysis.labels[0] || 'apparel'}" vibe.`
  ];
  fillList('suggestionsList', suggestions);

  outcome.scrollIntoView({ behavior: 'smooth' });
}


// --- UNCHANGED: All helper functions below remain the same ---
function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file.');
    return;
  }
  if (file.size > 6 * 1024 * 1024) {
    alert('Image too large. Max 6 MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    currentFileAsDataURL = e.target.result;
    thumb.innerHTML = `<img src="${currentFileAsDataURL}" alt="preview">`;
    
    previewArea.style.display = 'flex';
    removeBtn.style.display = 'inline-block';
    feedbackBtn.disabled = false;
    fileName.textContent = file.name;
    fileMeta.textContent = `Ready for analysis.`;
    result.style.display = 'none';
  }
  reader.readAsDataURL(file);
}

drop.addEventListener('click', () => fileInput.click());
['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); drop.classList.add('dragover'); }));
['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); if (ev === 'drop') handleDrop(e); drop.classList.remove('dragover'); }));
function handleDrop(e) { const dt = e.dataTransfer; if (!dt) return; const files = dt.files; if (files && files[0]) handleFile(files[0]); }
fileInput.addEventListener('change', () => { if (fileInput.files && fileInput.files[0]) handleFile(fileInput.files[0]); });
removeBtn.addEventListener('click', () => clearSelection());

function clearSelection() {
  currentFileAsDataURL = null;
  fileInput.value = '';
  previewArea.style.display = 'none';
  thumb.innerHTML = '';
  removeBtn.style.display = 'none';
  feedbackBtn.disabled = true;
  result.style.display = 'none';
}

function fillList(id, items) { const list = document.getElementById(id); list.innerHTML = ''; items.forEach(item => { const li = document.createElement('li'); li.textContent = item; list.appendChild(li); }); }
function fillChips(id, items) { const container = document.getElementById(id); container.innerHTML = ''; items.forEach(item => { const span = document.createElement('span'); span.className = 'chip'; span.textContent = item; container.appendChild(span); }); }
