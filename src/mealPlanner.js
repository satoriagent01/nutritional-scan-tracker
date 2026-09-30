/**
 * Meal Planner Module - Handles adding food items and calculating totals.
 * Uses localStorage for persistence.
 */

const STORAGE_KEY = 'nutritional-scan-meal-log';

/**
 * Adds a food item to the current meal log.
 * @param {string} name - Name of the food item.
 * @param {number} portionGrams - Portion size in grams (or ml).
 * @param {Object} nutritionalData - Nutritional data per 100g (from OCR or manual entry).
 * @param {Object} customValues - Custom metric values for this item.
 * @returns {Object} FoodItem object with calculated values.
 */
export function addFoodItem(name, portionGrams, nutritionalData, customValues) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Invalid food item name');
  }
  if (typeof portionGrams !== 'number' || portionGrams <= 0) {
    throw new Error('Invalid portion size');
  }

  const factor = portionGrams / 100;

  const item = {
    id: generateId(),
    name: name.trim(),
    portionGrams,
    nutritionalData: {
      energyKj: (nutritionalData.energyKj || 0) * factor,
      energyKcal: (nutritionalData.energyKcal || 0) * factor,
      fat: (nutritionalData.fat || 0) * factor,
      saturates: (nutritionalData.saturates || 0) * factor,
      carbohydrates: (nutritionalData.carbohydrates || 0) * factor,
      sugars: (nutritionalData.sugars || 0) * factor,
      fiber: (nutritionalData.fiber || 0) * factor,
      protein: (nutritionalData.protein || 0) * factor,
      salt: (nutritionalData.salt || 0) * factor,
    },
    customValues: customValues || {},
    timestamp: Date.now(),
  };

  const log = getMealLog();
  log.push(item);
  saveMealLog(log);

  return item;
}

/**
 * Returns all items in the current meal log.
 * @returns {Array<Object>}
 */
export function getMealLog() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Calculates total nutritional values for a meal log.
 * @param {Array<Object>} mealLog - Array of FoodItem objects.
 * @returns {Object} Totals object with all nutritional values and custom metrics.
 */
export function calculateTotals(mealLog) {
  const totals = {
    energyKj: 0,
    energyKcal: 0,
    fat: 0,
    saturates: 0,
    carbohydrates: 0,
    sugars: 0,
    fiber: 0,
    protein: 0,
    salt: 0,
  };

  // Collect custom metric names from all items
  const customMetricNames = new Set();
  for (const item of mealLog) {
    if (item.customValues) {
      for (const key of Object.keys(item.customValues)) {
        customMetricNames.add(key);
      }
    }
  }

  // Initialize custom metric totals
  for (const name of customMetricNames) {
    totals[name] = 0;
  }

  // Sum up all values
  for (const item of mealLog) {
    const nd = item.nutritionalData || {};
    totals.energyKj += nd.energyKj || 0;
    totals.energyKcal += nd.energyKcal || 0;
    totals.fat += nd.fat || 0;
    totals.saturates += nd.saturates || 0;
    totals.carbohydrates += nd.carbohydrates || 0;
    totals.sugars += nd.sugars || 0;
    totals.fiber += nd.fiber || 0;
    totals.protein += nd.protein || 0;
    totals.salt += nd.salt || 0;

    // Add custom values
    if (item.customValues) {
      for (const key of Object.keys(item.customValues)) {
        if (totals[key] === undefined) {
          totals[key] = 0;
        }
        totals[key] += item.customValues[key] || 0;
      }
    }
  }

  return totals;
}

/**
 * Clears the current meal log.
 */
export function clearMealLog() {
  saveMealLog([]);
}

/**
 * Saves meal log to localStorage.
 * @param {Array<Object>} log
 */
function saveMealLog(log) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
}

/**
 * Generates a unique ID for food items.
 * @returns {string}
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}