/**
 * Meal Planner Module
 * 
 * Handles adding food items by portion size and calculating total intake.
 */

// In-memory meal log
let mealLog = [];

/**
 * Add a food item to the meal log.
 * @param {string} name - The name of the food item.
 * @param {number} portionGrams - The portion size in grams (or ml for liquids).
 * @param {Object} nutritionData - Nutritional data per 100g/ml.
 * @param {Object} customValues - Custom metric values per 100g/ml.
 */
export function addFoodItem(name, portionGrams, nutritionData, customValues = {}) {
  const portionFactor = portionGrams / 100;

  const scaledNutrition = {};
  if (nutritionData) {
    for (const [key, value] of Object.entries(nutritionData)) {
      if (typeof value === 'number') {
        scaledNutrition[key] = Math.round(value * portionFactor * 100) / 100;
      }
    }
  }

  const scaledCustom = {};
  for (const [key, value] of Object.entries(customValues)) {
    if (typeof value === 'number') {
      scaledCustom[key] = Math.round(value * portionFactor * 100) / 100;
    }
  }

  mealLog.push({
    name,
    portionGrams,
    nutritionData: scaledNutrition,
    customValues: scaledCustom,
  });
}

/**
 * Get the current meal log.
 * @returns {Array} The meal log array.
 */
export function getMealLog() {
  return mealLog;
}

/**
 * Calculate totals from the meal log.
 * @param {Array} log - The meal log to calculate from.
 * @returns {Object} Totals object with all nutritional and custom metrics.
 */
export function calculateTotals(log) {
  const totals = {};

  for (const item of log) {
    for (const [key, value] of Object.entries(item.nutritionData || {})) {
      if (typeof value === 'number') {
        totals[key] = (totals[key] || 0) + value;
      }
    }
    for (const [key, value] of Object.entries(item.customValues || {})) {
      if (typeof value === 'number') {
        totals[key] = (totals[key] || 0) + value;
      }
    }
  }

  // Round all values to 2 decimal places
  for (const key of Object.keys(totals)) {
    totals[key] = Math.round(totals[key] * 100) / 100;
  }

  return totals;
}

/**
 * Clear the meal log.
 */
export function clearMealLog() {
  mealLog = [];
}