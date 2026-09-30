// Custom metrics module: addCustomMetric, getCustomMetrics, removeCustomMetric

const STORAGE_KEY = 'nutritional-scan-tracker-custom-metrics';

/**
 * Load custom metrics from localStorage.
 * @returns {Array<{name: string, unit: string}>}
 */
function loadMetrics() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save custom metrics to localStorage.
 * @param {Array<{name: string, unit: string}>} metrics
 */
function saveMetrics(metrics) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
}

/**
 * Add a custom metric.
 * @param {string} name
 * @param {string} unit
 * @returns {Array<{name: string, unit: string}>}
 */
export function addCustomMetric(name, unit) {
  const metrics = loadMetrics();
  // Avoid duplicates
  if (metrics.some(m => m.name === name)) {
    return metrics;
  }
  metrics.push({ name, unit });
  saveMetrics(metrics);
  return metrics;
}

/**
 * Get all custom metrics.
 * @returns {Array<{name: string, unit: string}>}
 */
export function getCustomMetrics() {
  return loadMetrics();
}

/**
 * Remove a custom metric by name.
 * @param {string} name
 * @returns {Array<{name: string, unit: string}>}
 */
export function removeCustomMetric(name) {
  const metrics = loadMetrics().filter(m => m.name !== name);
  saveMetrics(metrics);
  return metrics;
}