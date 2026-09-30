import { parseNutritionalTable } from '../src/ocr.js';
import { addCustomMetric, getCustomMetrics, removeCustomMetric } from '../src/metrics.js';
import { addFoodItem, getMealLog, calculateTotals, clearMealLog } from '../src/mealPlanner.js';

// --- State ---
let currentParsedData = null;
let currentImageData = null;

// --- DOM Elements ---
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

const imageInput = document.getElementById('imageInput');
const captureBtn = document.getElementById('captureBtn');
const uploadBtn = document.getElementById('uploadBtn');
const scanPreview = document.getElementById('scanPreview');
const previewImg = document.getElementById('previewImg');
const ocrResult = document.getElementById('ocrResult');
const rawText = document.getElementById('rawText');
const parsedData = document.getElementById('parsedData');
const addToPlannerBtn = document.getElementById('addToPlannerBtn');
const historyList = document.getElementById('historyList');

const foodName = document.getElementById('foodName');
const portionSize = document.getElementById('portionSize');
const addFoodBtn = document.getElementById('addFoodBtn');
const dailyTotals = document.getElementById('dailyTotals');
const totalsData = document.getElementById('totalsData');
const mealLog = document.getElementById('mealLog');
const logList = document.getElementById('logList');
const clearLogBtn = document.getElementById('clearLogBtn');

const metricName = document.getElementById('metricName');
const metricUnit = document.getElementById('metricUnit');
const addMetricBtn = document.getElementById('addMetricBtn');
const metricsUl = document.getElementById('metricsUl');

const fullLogList = document.getElementById('fullLogList');
const fullLogTotals = document.getElementById('fullLogTotals');
const clearFullLogBtn = document.getElementById('clearFullLogBtn');

const ocrEndpoint = document.getElementById('ocrEndpoint');
const apiKey = document.getElementById('apiKey');
const model = document.getElementById('model');
const languageSelect = document.getElementById('language');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');

// --- Tab Navigation ---
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    
    // Refresh data when switching tabs
    if (btn.dataset.tab === 'planner' || btn.dataset.tab === 'log') {
      renderMealLog();
    }
    if (btn.dataset.tab === 'metrics') {
      renderCustomMetrics();
    }
  });
});

// --- Image Capture / Upload ---
captureBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    });
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    
    // Create a simple camera UI
    const cameraContainer = document.createElement('div');
    cameraContainer.className = 'camera-container';
    cameraContainer.innerHTML = `
      <video id="cameraFeed" autoplay playsinline></video>
      <button id="takePhotoBtn">📸 Take Photo</button>
      <button id="cancelCameraBtn">Cancel</button>
    `;
    
    const cameraFeed = cameraContainer.querySelector('#cameraFeed');
    cameraFeed.srcObject = stream;
    
    document.querySelector('.scan-area').appendChild(cameraContainer);
    
    document.getElementById('takePhotoBtn').addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = cameraFeed.videoWidth;
      canvas.height = cameraFeed.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(cameraFeed, 0, 0);
      canvas.toBlob(blob => {
        handleImage(blob);
        stream.getTracks().forEach(t => t.stop());
        cameraContainer.remove();
      }, 'image/jpeg');
    });
    
    document.getElementById('cancelCameraBtn').addEventListener('click', () => {
      stream.getTracks().forEach(t => t.stop());
      cameraContainer.remove();
    });
  } catch (err) {
    alert('Camera access denied or not available. Please use upload instead.');
  }
});

uploadBtn.addEventListener('click', () => {
  imageInput.click();
});

imageInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    handleImage(e.target.files[0]);
  }
});

async function handleImage(file) {
  currentImageData = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    scanPreview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
  
  // Extract text via OCR
  await performOCR(file);
}

async function performOCR(file) {
  // Show loading state
  rawText.textContent = 'Processing...';
  ocrResult.classList.remove('hidden');
  
  try {
    // Get settings
    const settings = JSON.parse(localStorage.getItem('nutritional-scan-settings') || '{}');
    const endpoint = settings.endpoint || '';
    const key = settings.apiKey || '';
    const model_name = settings.model || '';
    const lang = languageSelect.value;
    
    let rawTextStr = '';
    
    if (endpoint && key && model_name) {
      // Call the configured AI endpoint for OCR
      rawTextStr = await extractTextViaAI(file, endpoint, key, model_name);
    } else {
      // No endpoint configured - show message
      rawText.textContent = 'No OCR endpoint configured. Please configure one in Settings to extract text from images.';
      parsedData.innerHTML = '<p class="info">Configure an AI endpoint in Settings to enable OCR scanning.</p>';
      return;
    }
    
    rawText.textContent = rawTextStr;
    
    // Parse the nutritional data
    try {
      const parsed = parseNutritionalTable(rawTextStr, lang);
      currentParsedData = parsed;
      displayParsedData(parsed);
    } catch (err) {
      parsedData.innerHTML = `<p class="error">Failed to parse nutritional data: ${err.message}</p>`;
    }
  } catch (err) {
    rawText.textContent = `Error: ${err.message}`;
  }
}

async function extractTextViaAI(file, endpoint, key, model_name) {
  // Convert file to base64
  const base64Data = await fileToBase64(file);
  const ext = file.type.split('/')[1] || 'jpeg';
  
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: model_name,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all nutritional information from this label. Return ONLY the raw text as it appears on the label, line by line. Do not add any commentary or formatting. Just the raw text.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/${ext};base64,${base64Data}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    })
  });
  
  if (!response.ok) {
    throw new Error(`OCR API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove the data URL prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function displayParsedData(data) {
  parsedData.innerHTML = `
    <div class="parsed-grid">
      <div class="parsed-item"><strong>Energy:</strong> ${data.energyKcal} kcal</div>
      <div class="parsed-item"><strong>Fat:</strong> ${data.fat} g</div>
      <div class="parsed-item"><strong>Saturates:</strong> ${data.saturates} g</div>
      <div class="parsed-item"><strong>Carbohydrates:</strong> ${data.carbohydrates} g</div>
      <div class="parsed-item"><strong>Sugars:</strong> ${data.sugars} g</div>
      <div class="parsed-item"><strong>Fiber:</strong> ${data.fiber} g</div>
      <div class="parsed-item"><strong>Protein:</strong> ${data.protein} g</div>
      <div class="parsed-item"><strong>Salt:</strong> ${data.salt} g</div>
      <div class="parsed-item"><strong>Serving Size:</strong> ${data.servingSize} ${data.servingUnit}</div>
    </div>
  `;
}

// --- Add to Meal Planner ---
addToPlannerBtn.addEventListener('click', () => {
  if (!currentParsedData) {
    alert('Please scan a label first.');
    return;
  }
  
  const name = prompt('Enter food name:', 'Scanned Food');
  if (!name) return;
  
  const portion = parseFloat(prompt('Enter portion size (g):', '100'));
  if (isNaN(portion) || portion <= 0) {
    alert('Invalid portion size.');
    return;
  }
  
  try {
    const item = addFoodItem(name, portion, currentParsedData, {});
    alert(`Added "${name}" to meal log!`);
    renderMealLog();
  } catch (err) {
    alert(`Error adding item: ${err.message}`);
  }
});

// --- Meal Log ---
function renderMealLog() {
  const log = getMealLog();
  const totals = calculateTotals(log);
  
  // Render log items
  logList.innerHTML = log.map(item => `
    <div class="log-item">
      <div class="log-item-header">
        <strong>${item.name}</strong>
        <span>${item.portionGrams}g</span>
      </div>
      <div class="log-item-details">
        <span>${item.nutritionalData.energyKcal} kcal</span>
        <span>Fat: ${item.nutritionalData.fat}g</span>
        <span>Carbs: ${item.nutritionalData.carbohydrates}g</span>
        <span>Protein: ${item.nutritionalData.protein}g</span>
      </div>
    </div>
  `).join('');
  
  // Render totals
  totalsData.innerHTML = `
    <div class="totals-grid">
      <div class="total-item"><strong>Energy:</strong> ${totals.energyKcal} kcal</div>
      <div class="total-item"><strong>Fat:</strong> ${totals.fat}g</div>
      <div class="total-item"><strong>Saturates:</strong> ${totals.saturates}g</div>
      <div class="total-item"><strong>Carbohydrates:</strong> ${totals.carbohydrates}g</div>
      <div class="total-item"><strong>Sugars:</strong> ${totals.sugars}g</div>
      <div class="total-item"><strong>Fiber:</strong> ${totals.fiber}g</div>
      <div class="total-item"><strong>Protein:</strong> ${totals.protein}g</div>
      <div class="total-item"><strong>Salt:</strong> ${totals.salt}g</div>
    </div>
  `;
  
  // Also update full log view
  fullLogList.innerHTML = log.map(item => `
    <div class="log-item">
      <div class="log-item-header">
        <strong>${item.name}</strong>
        <span>${item.portionGrams}g</span>
      </div>
      <div class="log-item-details">
        <span>${item.nutritionalData.energyKcal} kcal</span>
        <span>Fat: ${item.nutritionalData.fat}g</span>
        <span>Carbs: ${item.nutritionalData.carbohydrates}g</span>
        <span>Protein: ${item.nutritionalData.protein}g</span>
      </div>
    </div>
  `).join('');
  
  fullLogTotals.innerHTML = `
    <div class="totals-grid">
      <div class="total-item"><strong>Energy:</strong> ${totals.energyKcal} kcal</div>
      <div class="total-item"><strong>Fat:</strong> ${totals.fat}g</div>
      <div class="total-item"><strong>Saturates:</strong> ${totals.saturates}g</div>
      <div class="total-item"><strong>Carbohydrates:</strong> ${totals.carbohydrates}g</div>
      <div class="total-item"><strong>Sugars:</strong> ${totals.sugars}g</div>
      <div class="total-item"><strong>Fiber:</strong> ${totals.fiber}g</div>
      <div class="total-item"><strong>Protein:</strong> ${totals.protein}g</div>
      <div class="total-item"><strong>Salt:</strong> ${totals.salt}g</div>
    </div>
  `;
}

addFoodBtn.addEventListener('click', () => {
  const name = foodName.value.trim();
  const portion = parseFloat(portionSize.value);
  
  if (!name) {
    alert('Please enter a food name.');
    return;
  }
  
  if (isNaN(portion) || portion <= 0) {
    alert('Please enter a valid portion size.');
    return;
  }
  
  // Use default nutritional data if no scan was done
  const nutritionalData = currentParsedData || {
    energyKj: 0, energyKcal: 0, fat: 0, saturates: 0,
    carbohydrates: 0, sugars: 0, fiber: 0, protein: 0, salt: 0,
    servingSize: 100, servingUnit: 'g'
  };
  
  try {
    addFoodItem(name, portion, nutritionalData, {});
    foodName.value = '';
    portionSize.value = '';
    alert(`Added "${name}" to meal log!`);
    renderMealLog();
  } catch (err) {
    alert(`Error adding item: ${err.message}`);
  }
});

clearLogBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the meal log?')) {
    clearMealLog();
    renderMealLog();
  }
});

clearFullLogBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the meal log?')) {
    clearMealLog();
    renderMealLog();
  }
});

// --- Custom Metrics ---
function renderCustomMetrics() {
  const metrics = getCustomMetrics();
  metricsUl.innerHTML = metrics.map(m => `
    <li class="metric-item">
      <span>${m.name} (${m.unit})</span>
      <button class="remove-metric-btn" data-name="${m.name}">Remove</button>
    </li>
  `).join('');
  
  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-metric-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      try {
        removeCustomMetric(name);
        renderCustomMetrics();
      } catch (err) {
        alert(`Error removing metric: ${err.message}`);
      }
    });
  });
}

addMetricBtn.addEventListener('click', () => {
  const name = metricName.value.trim();
  const unit = metricUnit.value.trim();
  
  if (!name || !unit) {
    alert('Please enter both name and unit.');
    return;
  }
  
  try {
    addCustomMetric(name, unit);
    metricName.value = '';
    metricUnit.value = '';
    renderCustomMetrics();
  } catch (err) {
    alert(`Error adding metric: ${err.message}`);
  }
});

// --- Settings ---
function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('nutritional-scan-settings') || '{}');
  ocrEndpoint.value = settings.endpoint || '';
  apiKey.value = settings.apiKey || '';
  model.value = settings.model || '';
  languageSelect.value = settings.language || 'de';
}

function saveSettings() {
  const settings = {
    endpoint: ocrEndpoint.value,
    apiKey: apiKey.value,
    model: model.value,
    language: languageSelect.value
  };
  localStorage.setItem('nutritional-scan-settings', JSON.stringify(settings));
  alert('Settings saved!');
}

function resetSettings() {
  localStorage.removeItem('nutritional-scan-settings');
  loadSettings();
  alert('Settings reset to defaults!');
}

saveSettingsBtn.addEventListener('click', saveSettings);
resetSettingsBtn.addEventListener('click', resetSettings);

// --- Initialize ---
loadSettings();
renderMealLog();
renderCustomMetrics();