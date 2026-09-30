/**
 * Custom Metrics Module - Manages user-defined dietary markers.
 * Uses storage.js for persistence.
 */

import { saveMetrics, loadMetrics } from './storage.js';

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
  return loadMetrics();
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