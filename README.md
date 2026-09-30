# Nutritional Scan Tracker

A free, open-access Progressive Web App (PWA) for tracking dietary intake by scanning product nutritional labels.

## Features

- **Scan Labels**: Take a photo or upload an image of a nutritional label. The app extracts data (Energy, Fat, Saturates, Carbs, Sugars, Fiber, Protein, Salt) using client-side OCR.
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
   - Go to the "Scan Label" section.
   - Click "Choose File" or "Take Photo" to upload an image of a nutritional label.
   - The app will extract the nutritional data. Review and confirm the values.
   - The scanned data is saved to your history.

2. **Add Custom Metrics**:
   - Go to the "Custom Metrics" section.
   - Enter a metric name (e.g., "Sodium") and unit (e.g., "mg").
   - Click "Add Metric" to save it.

3. **Plan a Meal**:
   - Go to the "Meal Planner" section.
   - Click "Add Food Item".
   - Enter the food name, portion size (in grams or milliliters), and select the source (from a scan or manual entry).
   - If using a scan, select the scanned product. If manual, enter the nutritional values.
   - The app calculates the total intake for all metrics.

4. **View Log**:
   - Go to the "Log" section to view all food items added to your current meal log.
   - You can clear the log to start a new one.

## Configuration

- **AI Endpoint**: The app uses client-side OCR (Tesseract.js) by default. No API keys or endpoints are required.
- **Data Persistence**: All data is stored in your browser's localStorage. Clearing your browser data will remove your scans and logs.

## Testing

Run the tests with:
```bash
npm test
```

## What is Not Done Yet

- **PWA Installation**: The app is not yet installable as a PWA (no `manifest.json` or Service Worker).
- **Data Export**: There is no option to export data (CSV/JSON) for backup.
- **Product Database**: The app does not include a database of known products; all entries are manual or scan-based.
- **Advanced OCR**: The OCR is basic and may not handle all label formats perfectly.