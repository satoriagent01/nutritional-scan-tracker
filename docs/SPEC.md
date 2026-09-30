# Nutritional Scan Tracker - Specification

## 1. Overview
A free, client-side Progressive Web App (PWA) that allows users to photograph nutritional labels, extract data via client-side OCR, and track dietary intake (calories, sodium, saturated fat, etc.) through a custom meal planner.

## 2. Architecture
- **Frontend**: HTML, CSS, ES Modules. No build step.
- **Backend**: None. All logic runs in the browser.
- **OCR Engine**: Client-side library (e.g., Tesseract.js) or a configurable OpenAI-compatible endpoint (mocked in tests).
- **Storage**: `localStorage` for persistence of scans, custom metrics, and meal logs.

## 3. Modules

### 3.1. OCR Module (`src/ocr.js`)
Handles image capture and text extraction.

- **`captureImage()`**: Returns a `Blob` or `DataURL` of the captured image.
- **`extractText(imageData) -> Promise<string>`**: Sends the image to the OCR engine and returns the raw text.
  - *Example Input*: A JPEG blob of a nutritional label.
  - *Example Output*: `"Nährwertdeklaration\nEnergie 2292 kJ\nFett 33 g\n..."`
- **`parseNutritionalTable(rawText) -> NutritionalData`**: Deterministic parser that converts raw OCR text into structured data.
  - *Parameters*: `rawText` (string), `language` (string, e.g., 'de', 'nl', 'en').
  - *Returns*: Object with keys: `energyKj`, `energyKcal`, `fat`, `saturates`, `carbohydrates`, `sugars`, `fiber`, `protein`, `salt`, `servingSize`, `servingUnit`.
  - *Example Input*: `"Energie 2292 kJ\nFett 33 g\ndavon gesättigte Fettsäuren 13 g\nKohlenhydrate 55 g\ndavon Zucker 45 g\nBallaststoffe 2,4 g\nEiweiß 6,8 g\nSalz 0,18 g\n100 g"`
  - *Example Output*: `{ energyKj: 2292, energyKcal: 549, fat: 33, saturates: 13, carbohydrates: 55, sugars: 45, fiber: 2.4, protein: 6.8, salt: 0.18, servingSize: 100, servingUnit: 'g' }`

### 3.2. Custom Metrics Module (`src/metrics.js`)
Manages user-defined metrics beyond the standard nutritional table.

- **`addCustomMetric(name, unit) -> void`**: Adds a new metric to the user's profile.
  - *Example Input*: `addCustomMetric("Sodium", "mg")`
- **`getCustomMetrics() -> Array<{name, unit}>`**: Returns list of custom metrics.
- **`removeCustomMetric(name) -> void`**: Removes a metric.

### 3.3. Meal Planner Module (`src/mealPlanner.js`)
Handles adding food items and calculating totals.

- **`addFoodItem(name, portionGrams, nutritionalData, customValues) -> FoodItem`**: Adds an item to the current meal log.
  - *Parameters*:
    - `name`: string (e.g., "Chocolate Bar")
    - `portionGrams`: number (e.g., 30)
    - `nutritionalData`: object (per 100g, from OCR or manual entry)
    - `customValues`: object (e.g., `{ "Sodium": 200 }`)
  - *Returns*: `FoodItem` object with calculated values based on portion size.
- **`getMealLog() -> Array<FoodItem>`**: Returns all items in the current meal log.
- **`calculateTotals(mealLog) -> Totals`**: Sums up all nutritional values in the log.
  - *Returns*: Object with total `energyKcal`, `fat`, `saturates`, `carbohydrates`, `sugars`, `fiber`, `protein`, `salt`, and any custom metrics.
- **`clearMealLog() -> void`**: Clears the current meal log.

### 3.4. Storage Module (`src/storage.js`)
Handles persistence using `localStorage`.

- **`saveScans(scans) -> void`**: Saves array of scan objects.
- **`loadScans() -> Array`**: Returns saved scans.
- **`saveMetrics(metrics) -> void`**: Saves custom metrics.
- **`loadMetrics() -> Array`**: Returns saved metrics.
- **`saveMealLog(log) -> void`**: Saves current meal log.
- **`loadMealLog() -> Array`**: Returns saved meal log.

## 4. User Interface

### 4.1. Scan Screen
- **User Actions**:
  - Click "Take Photo" or "Upload Image".
  - View raw OCR text (optional, for debugging).
  - View parsed nutritional data.
  - Confirm or edit parsed data.
  - Save scan to history.
- **Logic Calls**: `captureImage()`, `extractText()`, `parseNutritionalTable()`, `saveScans()`.

### 4.2. Meal Planner Screen
- **User Actions**:
  - Add food item (name, portion size, source: scan/manual).
  - View current meal log.
  - View total nutritional intake.
  - Clear meal log.
- **Logic Calls**: `addFoodItem()`, `getMealLog()`, `calculateTotals()`, `clearMealLog()`, `saveMealLog()`.

### 4.3. Custom Metrics Screen
- **User Actions**:
  - Add new metric (name, unit).
  - View list of custom metrics.
  - Remove metric.
- **Logic Calls**: `addCustomMetric()`, `getCustomMetrics()`, `removeCustomMetric()`, `saveMetrics()`.

## 5. Acceptance Criteria

### AC-1: OCR Extraction
- The app can capture or upload an image of a nutritional label.
- The app extracts raw text from the image using client-side OCR.
- The app parses the raw text into structured nutritional data (Energy, Fat, Saturates, Carbs, Sugars, Fiber, Protein, Salt).
- The parser handles multilingual labels (German, Dutch, English, Italian) as seen in the sample images.

### AC-2: Custom Metric Tracking
- Users can define custom metrics (e.g., "Sodium", "Vitamin C") with units (e.g., "mg", "%").
- Users can add custom values to food items.
- Custom metrics are included in the meal log totals.

### AC-3: Meal Planner
- Users can add food items with a name, portion size (grams/ml), and nutritional data.
- The app calculates nutritional values based on the portion size (e.g., if 100g has 549 kcal, 30g has 164.7 kcal).
- Users can view a list of items in their meal log.
- Users can view the total nutritional intake for the meal log.
- Users can clear the meal log.

### AC-4: Data Persistence
- Scans, custom metrics, and meal logs are saved to `localStorage`.
- Data persists across browser sessions (page reloads).
- Users can view their scan history.

### AC-5: Accessibility & Multilingual
- The UI is accessible (ARIA labels, sufficient contrast).
- The OCR engine supports multiple languages (German, Dutch, English, Italian).

### AC-6: Free & No Ads
- The app is free to use with no advertising or paywalls.
- No backend costs are incurred by the user (client-side only).

## 6. Examples from Shared Images

### Example 1: Chocolate Bar (Image 1)
- **Language**: German (primary), with French, Dutch, Italian.
- **Parsed Data**:
  - Energy: 2292 kJ / 549 kcal (per 100g)
  - Fat: 33 g (per 100g)
  - Saturates: 13 g (per 100g)
  - Carbohydrates: 55 g (per 100g)
  - Sugars: 45 g (per 100g)
  - Fiber: 2.4 g (per 100g)
  - Protein: 6.8 g (per 100g)
  - Salt: 0.18 g (per 100g)
  - Serving Size: 30 g (1 Melto)

### Example 2: Juice Bottle (Image 2)
- **Language**: Dutch.
- **Parsed Data**:
  - Energy: 199 kJ / 47 kcal (per 100 ml)
  - Sugars: 10 g (per 100 ml)
  - Vitamin C: 26% (per 100 ml)
  - Serving Size: 200 ml

### Example 3: Olive Oil Spray (Image 3)
- **Language**: Dutch.
- **Parsed Data**:
  - Energy: 3404 kJ / 828 kcal (per 100 ml)
  - Fat: 14 g (per 100 ml)
  - Carbohydrates: 0 g (per 100 ml)
  - Serving Size: 5 ml (0 g) - Note: Tracking by volume is supported.