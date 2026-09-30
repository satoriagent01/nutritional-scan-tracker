/**
 * Storage Module - Handles persistence using localStorage.
 */

const STORAGE_KEYS = {
  SCANS: 'nutritional_scans',
  METRICS: 'nutritional_metrics',
  MEAL_LOG: 'nutritional_meal_log',
};

/**
 * Saves array of scan objects.
 * @param {Array} scans
 */
export function saveScans(scans) {
  localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(scans));
}

/**
 * Returns saved scans.
 * @returns {Array}
 */
export function loadScans() {
  const data = localStorage.getItem(STORAGE_KEYS.SCANS);
  return data ? JSON.parse(data) : [];
}

/**
 * Saves custom metrics.
 * @param {Array} metrics
 */
export function saveMetrics(metrics) {
  localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(metrics));
}

/**
 * Returns saved metrics.
 * @returns {Array}
 */
export function loadMetrics() {
  const data = localStorage.getItem(STORAGE_KEYS.METRICS);
  return data ? JSON.parse(data) : [];
}

/**
 * Saves current meal log.
 * @param {Array} log
 */
export function saveMealLog(log) {
  localStorage.setItem(STORAGE_KEYS.MEAL_LOG, JSON.stringify(log));
}

/**
 * Returns saved meal log.
 * @returns {Array}
 */
export function loadMealLog() {
  const data = localStorage.getItem(STORAGE_KEYS.MEAL_LOG);
  return data ? JSON.parse(data) : [];
}