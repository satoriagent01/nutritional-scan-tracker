/**
 * Custom Metrics Module - Manages user-defined dietary markers.
 * Uses localStorage for persistence.
 */

const STORAGE_KEY = 'nutritional-scan-custom-metrics';

/**
 * Adds a new custom metric to the user's profile.
 * @param {string} name - Name of the metric (e.g., "Sodium").
 * @param {string} unit - Unit of measurement (e.g., "mg").
 */
export function addCustomMetric(name, unit) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Invalid metric name');
  }
  if (!unit || typeof unit !== 'string' || unit.trim() === '') {
    throw new Error('Invalid unit');
  }

  const metrics = getCustomMetrics();
  // Check for duplicate names (case-insensitive)
  if (metrics.some(m => m.name.toLowerCase() === name.toLowerCase())) {
    throw new Error(`Custom metric "${name}" already exists`);
  }

  metrics.push({ name: name.trim(), unit: unit.trim() });
  saveMetrics(metrics);
}

/**
 * Returns list of custom metrics.
 * @returns {Array<{name: string, unit: string}>}
 */
export function getCustomMetrics() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Removes a custom metric by name.
 * @param {string} name - Name of the metric to remove.
 */
export function removeCustomMetric(name) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Invalid metric name');
  }

  const metrics = getCustomMetrics();
  const filtered = metrics.filter(m => m.name !== name);
  saveMetrics(filtered);
}

/**
 * Saves custom metrics to localStorage.
 * @param {Array<{name: string, unit: string}>} metrics
 */
function saveMetrics(metrics) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
}