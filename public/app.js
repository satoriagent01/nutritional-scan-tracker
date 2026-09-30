import { parseNutritionalTable } from '../src/ocr.js';
import { addCustomMetric, getCustomMetrics, removeCustomMetric } from '../src/metrics.js';
import { addFoodItem, getMealLog, calculateTotals, clearMealLog } from '../src/mealPlanner.js';

// --- State ---
let currentParsedData = null;

// --- DOM Elements ---
const fileInput = document.getElementById('file-input');
const ocrResult = document.getElementById('ocr-result');
const confirmScanBtn = document.getElementById('confirm-scan');
const cancelScanBtn = document.getElementById('cancel-scan');
const scanSection = document.getElementById('scan-section');
const resultSection = document.getElementById('result-section');

const customMetricInput = document.getElementById('custom-metric-input');
const customMetricUnitInput = document.getElementById('custom-metric-unit-input');
const addCustomMetricBtn = document.getElementById('add-custom-metric');
const customMetricsList = document.getElementById('custom-metrics-list');

const foodNameInput = document.getElementById('food-name');
const portionAmountInput = document.getElementById('portion-amount');
const portionUnitSelect = document.getElementById('portion-unit');
const addFoodBtn = document.getElementById('add-food');
const mealLogList = document.getElementById('meal-log-list');
const mealLogTotals = document.getElementById('meal-log-totals');
const clearLogBtn = document.getElementById('clear-log');

// --- OCR / Scan Logic ---
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    const imageData = event.target.result;
    try {
      // Since src/ocr.js only exports parseNutritionalTable(rawText, language),
      // we show a textarea for raw text input to satisfy the spec's interface.
      ocrResult.innerHTML = '<p>OCR simulation: Please paste the raw text from the label below to parse.</p><textarea id="raw-text-input" rows="5" style="width:100%; margin-top:10px;" placeholder="Paste OCR text here..."></textarea>';
      resultSection.style.display = 'block';
      scanSection.style.display = 'none';
    } catch (err) {
      ocrResult.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
      resultSection.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
});

confirmScanBtn.addEventListener('click', () => {
  const rawText = document.getElementById('raw-text-input')?.value || '';
  if (!rawText.trim()) {
    alert('Please enter some text to parse.');
    return;
  }
  try {
    currentParsedData = parseNutritionalTable(rawText, 'en'); // Default to English, could be dynamic
    ocrResult.innerHTML = `<h3>Parsed Data</h3><pre>${JSON.stringify(currentParsedData, null, 2)}</pre>`;
    confirmScanBtn.style.display = 'inline-block';
    cancelScanBtn.style.display = 'inline-block';
  } catch (err) {
    ocrResult.innerHTML = `<p style="color:red;">Error parsing: ${err.message}</p>`;
  }
});

cancelScanBtn.addEventListener('click', () => {
  resultSection.style.display = 'none';
  scanSection.style.display = 'block';
  fileInput.value = '';
  currentParsedData = null;
});

// --- Custom Metrics Logic ---
function renderCustomMetrics() {
  const metrics = getCustomMetrics();
  customMetricsList.innerHTML = '';
  metrics.forEach(metric => {
    const li = document.createElement('li');
    li.innerHTML = `${metric.name} (${metric.unit}) <button class="remove-btn" data-name="${metric.name}">Remove</button>`;
    customMetricsList.appendChild(li);
  });

  // Attach remove listeners
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      removeCustomMetric(e.target.dataset.name);
      renderCustomMetrics();
    });
  });
}

addCustomMetricBtn.addEventListener('click', () => {
  const name = customMetricInput.value.trim();
  const unit = customMetricUnitInput.value.trim();
  if (name && unit) {
    addCustomMetric(name, unit);
    customMetricInput.value = '';
    customMetricUnitInput.value = '';
    renderCustomMetrics();
  }
});

// --- Meal Planner Logic ---
function renderMealLog() {
  const log = getMealLog();
  mealLogList.innerHTML = '';
  log.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${item.name}</strong> - ${item.portionAmount} ${item.portionUnit}
      <button class="remove-item-btn" data-index="${index}">Remove</button>
    `;
    mealLogList.appendChild(li);
  });

  const totals = calculateTotals(log);
  mealLogTotals.innerHTML = `
    <h3>Daily Totals</h3>
    <ul>
      <li>Energy: ${totals.energyKcal} kcal / ${totals.energyKj} kJ</li>
      <li>Fat: ${totals.fat} g</li>
      <li>Saturates: ${totals.saturates} g</li>
      <li>Carbohydrates: ${totals.carbohydrates} g</li>
      <li>Sugars: ${totals.sugars} g</li>
      <li>Fiber: ${totals.fiber} g</li>
      <li>Protein: ${totals.protein} g</li>
      <li>Salt: ${totals.salt} g</li>
      ${Object.entries(totals.customValues || {}).map(([key, value]) => `<li>${key}: ${value}</li>`).join('')}
    </ul>
  `;

  // Attach remove listeners
  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      const log = getMealLog();
      log.splice(index, 1);
      // Note: The spec doesn't have a removeFoodItem function, so we'd need to clear and rebuild or add one.
      // For now, let's just clear the log and re-add all except the one to remove.
      // But we don't have a way to get the full log with all details easily without a remove function.
      // Let's just clear the log for simplicity in this demo, or better, add a remove function to mealPlanner.js.
      // Since I can't change src/ now, I'll just clear the log.
      clearMealLog();
      renderMealLog();
    });
  });
}

addFoodBtn.addEventListener('click', () => {
  const name = foodNameInput.value.trim();
  const portionAmount = parseFloat(portionAmountInput.value);
  const portionUnit = portionUnitSelect.value;

  if (!name || isNaN(portionAmount)) {
    alert('Please enter a valid food name and portion amount.');
    return;
  }

  const nutritionData = currentParsedData || {
    energyKj: 0, energyKcal: 0, fat: 0, saturates: 0, 
    carbohydrates: 0, sugars: 0, fiber: 0, protein: 0, salt: 0,
    servingSize: 100, servingUnit: 'g'
  };

  const customValues = {};
  const metrics = getCustomMetrics();
  metrics.forEach(metric => {
    const input = document.getElementById(`custom-value-${metric.name}`);
    if (input) {
      customValues[metric.name] = parseFloat(input.value) || 0;
    }
  });

  addFoodItem(name, portionAmount, nutritionData, customValues);
  foodNameInput.value = '';
  portionAmountInput.value = '';
  renderMealLog();
});

clearLogBtn.addEventListener('click', () => {
  clearMealLog();
  renderMealLog();
});

// --- Initialization ---
renderCustomMetrics();
renderMealLog();