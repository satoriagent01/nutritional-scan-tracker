/**
 * OCR Module - Parses raw OCR text from nutritional labels into structured data.
 * Supports German, Dutch, English, French, and Italian labels.
 */

/**
 * Parses raw OCR text into structured nutritional data.
 * @param {string} rawText - Raw text from OCR engine.
 * @param {string} language - Language code (e.g., 'de', 'nl', 'en', 'fr', 'it').
 * @returns {{ energyKj: number, energyKcal: number, fat: number, saturates: number, carbohydrates: number, sugars: number, fiber: number, protein: number, salt: number, servingSize: number, servingUnit: string }}
 */
export function parseNutritionalTable(rawText, language) {
  if (!rawText || typeof rawText !== 'string' || rawText.trim() === '') {
    throw new Error('Invalid input: raw text is empty');
  }

  const trimmed = rawText.trim();
  const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) {
    throw new Error('Invalid input: no lines in raw text');
  }

  // Define language-specific label mappings
  const labelPatterns = {
    de: {
      energy: /energie\s*(\d+(?:[.,]\d+)?)\s*kJ\s*(?:\/|\s*\/\s*)\s*(\d+(?:[.,]\d+)?)\s*kcal/i,
      fat: /fett\s*(\d+(?:[.,]\d+)?)\s*g/i,
      saturates: /davon\s*gesättigte\s*fettsäuren\s*(\d+(?:[.,]\d+)?)\s*g/i,
      carbohydrates: /kohlenhydrate\s*(\d+(?:[.,]\d+)?)\s*g/i,
      sugars: /davon\s*zucker\s*(\d+(?:[.,]\d+)?)\s*g/i,
      fiber: /ballaststoffe\s*(\d+(?:[.,]\d+)?)\s*g/i,
      protein: /eiweiß\s*(\d+(?:[.,]\d+)?)\s*g/i,
      salt: /salz\s*(\d+(?:[.,]\d+)?)\s*g/i,
    },
    nl: {
      energy: /energie\s*(\d+(?:[.,]\d+)?)\s*kJ\s*(?:\/|\s*\/\s*)\s*(\d+(?:[.,]\d+)?)\s*kcal/i,
      fat: /vetten?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      saturates: /(?:waarvan\s*)?verzadigde\s*vetzuren\s*(\d+(?:[.,]\d+)?)\s*g/i,
      carbohydrates: /koolhydraten?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      sugars: /(?:waarvan\s*)?suikers?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      fiber: /vezels?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      protein: /eiwitten?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      salt: /zout\s*(\d+(?:[.,]\d+)?)\s*g/i,
    },
    en: {
      energy: /energy\s*(\d+(?:[.,]\d+)?)\s*kJ\s*(?:\/|\s*\/\s*)\s*(\d+(?:[.,]\d+)?)\s*kcal/i,
      fat: /fat\s*(\d+(?:[.,]\d+)?)\s*g/i,
      saturates: /(?:of\s+which\s+)?saturates?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      carbohydrates: /carbohydrates?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      sugars: /(?:of\s+which\s+)?sugars?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      fiber: /(?:of\s+which\s+)?fiber|fibre\s*(\d+(?:[.,]\d+)?)\s*g/i,
      protein: /protein\s*(\d+(?:[.,]\d+)?)\s*g/i,
      salt: /salt\s*(\d+(?:[.,]\d+)?)\s*g/i,
    },
    fr: {
      energy: /énergie\s*(\d+(?:[.,]\d+)?)\s*kJ\s*(?:\/|\s*\/\s*)\s*(\d+(?:[.,]\d+)?)\s*kcal/i,
      fat: /matières\s+grasses?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      saturates: /dont\s+acides\s+gras\s+saturés?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      carbohydrates: /glucides?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      sugars: /dont\s+sucres?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      fiber: /fibres?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      protein: /protéines?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      salt: /sel\s*(\d+(?:[.,]\d+)?)\s*g/i,
    },
    it: {
      energy: /energia\s*(\d+(?:[.,]\d+)?)\s*kJ\s*(?:\/|\s*\/\s*)\s*(\d+(?:[.,]\d+)?)\s*kcal/i,
      fat: /grassi?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      saturates: /di\s+cui\s+acidi\s+grassi\s+saturi?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      carbohydrates: /carboidrati?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      sugars: /di\s+cui\s+zuccheri?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      fiber: /fibre?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      protein: /proteine?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      salt: /sale\s*(\d+(?:[.,]\d+)?)\s*g/i,
    },
  };

  const patterns = labelPatterns[language] || labelPatterns['en'];

  // Helper to extract value from a line using a regex
  function extractValue(regex, line) {
    const match = line.match(regex);
    return match ? parseFloat(match[1].replace(',', '.')) : null;
  }

  let energyKj = null;
  let energyKcal = null;
  let fat = null;
  let saturates = null;
  let carbohydrates = null;
  let sugars = null;
  let fiber = null;
  let protein = null;
  let salt = null;
  let servingSize = null;
  let servingUnit = 'g';

  for (const line of lines) {
    // Energy line
    if (energyKj === null && energyKcal === null) {
      const energyMatch = line.match(patterns.energy);
      if (energyMatch) {
        energyKj = parseFloat(energyMatch[1].replace(',', '.'));
        energyKcal = parseFloat(energyMatch[2].replace(',', '.'));
        continue;
      }
    }

    // Other nutrients
    if (fat === null) fat = extractValue(patterns.fat, line);
    if (saturates === null) saturates = extractValue(patterns.saturates, line);
    if (carbohydrates === null) carbohydrates = extractValue(patterns.carbohydrates, line);
    if (sugars === null) sugars = extractValue(patterns.sugars, line);
    if (fiber === null) fiber = extractValue(patterns.fiber, line);
    if (protein === null) protein = extractValue(patterns.protein, line);
    if (salt === null) salt = extractValue(patterns.salt, line);

    // Serving size
    const servingMatch = line.match(/serving\s*size\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*(ml|g)/i);
    if (servingMatch) {
      servingSize = parseFloat(servingMatch[1].replace(',', '.'));
      servingUnit = servingMatch[2];
    }
  }

  // Validate that we got at least some nutritional data
  const hasNutritionalData = [energyKj, energyKcal, fat, saturates, carbohydrates, sugars, fiber, protein, salt].some(v => v !== null);
  if (!hasNutritionalData) {
    throw new Error('Invalid input: no nutritional data found');
  }

  return {
    energyKj: energyKj || 0,
    energyKcal: energyKcal || 0,
    fat: fat || 0,
    saturates: saturates || 0,
    carbohydrates: carbohydrates || 0,
    sugars: sugars || 0,
    fiber: fiber || 0,
    protein: protein || 0,
    salt: salt || 0,
    servingSize: servingSize || 0,
    servingUnit,
  };
}