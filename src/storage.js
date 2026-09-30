/**
 * Storage Module - Handles persistence using localStorage.
 * Provides generic save/load functions for different data types.
 */

const STORAGE_KEYS = {
  scans: 'nutritional-scan-scans',
  metrics: 'nutritional-scan-custom-metrics',
  mealLog: 'nutritional-scan-meal-log',
};

/**
 * Saves data to localStorage.
 * @param {string} key - The storage key.
 * @param {*} data - The data to save.
 */
export function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Loads data from localStorage.
 * @param {string} key - The storage key.
 * @returns {*} The loaded data, or null if not found.
 */
export function loadData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Saves array of scan objects.
 * @param {Array} scans
 */
export function saveScans(scans) {
  saveData(STORAGE_KEYS.scans, scans);
}

/**
 * Returns saved scans.
 * @returns {Array}
 */
export function loadScans() {
  return loadData(STORAGE_KEYS.scans) || [];
}

/**
 * Saves custom metrics.
 * @param {Array} metrics
 */
export function saveMetrics(metrics) {
  saveData(STORAGE_KEYS.metrics, metrics);
}

/**
 * Returns saved metrics.
 * @returns {Array}
 */
export function loadMetrics() {
  return loadData(STORAGE_KEYS.metrics) || [];
}

/**
 * Saves current meal log.
 * @param {Array} log
 */
export function saveMealLog(log) {
  saveData(STORAGE_KEYS.mealLog, log);
}

/**
 * Returns saved meal log.
 * @returns {Array}
 */
export function loadMealLog() {
  return loadData(STORAGE_KEYS.mealLog) || [];
}