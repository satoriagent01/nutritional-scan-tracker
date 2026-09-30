# Nutritional Scan Tracker

A free, client-side Progressive Web App (PWA) for tracking dietary intake by scanning product nutritional labels.

## Features

- **Scan Labels**: Take a photo or upload an image of a nutritional label. The app extracts data (Energy, Fat, Saturates, Carbs, Sugars, Fiber, Protein, Salt) using an AI-compatible OCR endpoint.
- **Custom Metrics**: Define and track your own dietary markers (e.g., Sodium, Vitamin C).
- **Meal Planner**: Add food items with custom portion sizes (grams or milliliters) and view daily totals.
- **Offline-First**: All data is stored locally in your browser. No account or internet connection required for core features.

## How to Run

1. **Serve the app**:
   ```bash
   npx serve .
   ```
2. **Open the app**:
   Navigate to `http://localhost:3000/public/` in your browser.

## How to Use

1. **Scan a Label**:
   - Go to the "Scan" tab.
   - Click "Take Photo" or "Upload Image" to capture an image of a nutritional label.
   - Configure an AI endpoint in the Settings tab first (see below).
   - The app will extract the raw text and parse the nutritional data.
   - Review the parsed values and click "Add to Meal Planner" to add the item.

2. **Add Custom Metrics**:
   - Go to the "Custom Metrics" tab.
   - Enter a metric name (e.g., "Sodium") and unit (e.g., "mg").
   - Click "Add Metric" to save it.

3. **Plan a Meal**:
   - Go to the "Meal Planner" tab.
   - Enter a food name and portion size (in grams or milliliters).
   - Click "Add Item" to add it to your meal log.
   - If you've scanned a label, the nutritional data from that scan is used as the default.
   - View daily totals at the top of the tab.

4. **View Log**:
   - Go to the "Log" tab to view all food items added to your current meal log.
   - You can clear the log to start a new one.

## Configuration

### AI Endpoint (OCR)

To enable OCR scanning, configure an OpenAI-compatible endpoint:

1. Go to the "Settings" tab.
2. Enter the API endpoint URL (e.g., `https://api.openai.com/v1`).
3. Enter your API key (e.g., `sk-...`).
4. Enter the model name (e.g., `gpt-4o`).
5. Select the default language for label parsing (German, Dutch, English, French, or Italian).
6. Click "Save Settings".

The app sends the image to the configured endpoint using the OpenAI-compatible chat completions API with vision support.

### Data Persistence

All data (scans, custom metrics, meal logs, settings) is stored in your browser's `localStorage`. Clearing your browser data will remove all stored information.

## Testing

Run the tests with:
```bash
npm test
```

## What is Not Done Yet

- **PWA Installation**: The app is not yet installable as a PWA (no `manifest.json` or Service Worker).
- **Data Export**: There is no option to export data (CSV/JSON) for backup.
- **Product Database**: The app does not include a database of known products; all entries are manual or scan-based.
- **Advanced OCR**: The OCR relies on an external AI endpoint; without one configured, scanning is not available.
- **Custom Metric Values**: Custom metrics can be defined but cannot yet have values associated with food items.