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
      saturates: /waarvan\s*verzadigde\s*vetzuren\s*(\d+(?:[.,]\d+)?)\s*g/i,
      carbohydrates: /koolhydraten?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      sugars: /waarvan\s*suikers?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      fiber: /vezels?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      protein: /eiwitten?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      salt: /zout\s*(\d+(?:[.,]\d+)?)\s*g/i,
    },
    en: {
      energy: /energy\s*(\d+(?:[.,]\d+)?)\s*kJ\s*(?:\/|\s*\/\s*)\s*(\d+(?:[.,]\d+)?)\s*kcal/i,
      fat: /fat\s*(\d+(?:[.,]\d+)?)\s*g/i,
      saturates: /of\s*which\s*saturates?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      carbohydrates: /carbohydrates?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      sugars: /of\s*which\s*sugars?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      fiber: /fiber|fibre\s*(\d+(?:[.,]\d+)?)\s*g/i,
      protein: /protein\s*(\d+(?:[.,]\d+)?)\s*g/i,
      salt: /salt\s*(\d+(?:[.,]\d+)?)\s*g/i,
    },
    fr: {
      energy: /énergie?\s*(\d+(?:[.,]\d+)?)\s*kJ\s*(?:\/|\s*\/\s*)\s*(\d+(?:[.,]\d+)?)\s*kcal/i,
      fat: /matières?\s*grasses?|lipides?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      saturates: /acides?\s*gras?\s*saturés?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      carbohydrates: /glucides?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      sugars: /dont\s*sucres?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      fiber: /fibres?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      protein: /protéines?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      salt: /sel\s*(\d+(?:[.,]\d+)?)\s*g/i,
    },
    it: {
      energy: /energia\s*(\d+(?:[.,]\d+)?)\s*kJ\s*(?:\/|\s*\/\s*)\s*(\d+(?:[.,]\d+)?)\s*kcal/i,
      fat: /grassi?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      saturates: /di\s*cui\s*acidi?\s*grassi?\s*saturi?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      carbohydrates: /carboidrati?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      sugars: /di\s*cui\s*zuccheri?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      fiber: /fibre?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      protein: /proteine?\s*(\d+(?:[.,]\d+)?)\s*g/i,
      salt: /sale\s*(\d+(?:[.,]\d+)?)\s*g/i,
    },
  };

  // Get patterns for the given language, fallback to English
  const patterns = labelPatterns[language] || labelPatterns['en'];

  // Helper to extract a numeric value from a line using a regex
  function extractValue(line, regex) {
    const match = line.match(regex);
    if (match) {
      return parseFloat(match[1].replace(',', '.'));
    }
    return null;
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
    // Energy line: "Energie 2292 kJ / 549 kcal"
    if (energyKj === null && energyKcal === null) {
      const energyMatch = line.match(patterns.energy);
      if (energyMatch) {
        energyKj = parseFloat(energyMatch[1].replace(',', '.'));
        energyKcal = parseFloat(energyMatch[2].replace(',', '.'));
        continue;
      }
    }

    // Fat
    if (fat === null) {
      fat = extractValue(line, patterns.fat);
    }

    // Saturates
    if (saturates === null) {
      saturates = extractValue(line, patterns.saturates);
    }

    // Carbohydrates
    if (carbohydrates === null) {
      carbohydrates = extractValue(line, patterns.carbohydrates);
    }

    // Sugars
    if (sugars === null) {
      sugars = extractValue(line, patterns.sugars);
    }

    // Fiber
    if (fiber === null) {
      fiber = extractValue(line, patterns.fiber);
    }

    // Protein
    if (protein === null) {
      protein = extractValue(line, patterns.protein);
    }

    // Salt
    if (salt === null) {
      salt = extractValue(line, patterns.salt);
    }

    // Serving Size
    if (servingSize === null) {
      const servingMatch = line.match(/serving\s*size[:\s]*\s*(\d+(?:[.,]\d+)?)\s*(ml|g)/i);
      if (servingMatch) {
        servingSize = parseFloat(servingMatch[1].replace(',', '.'));
        servingUnit = servingMatch[2].toLowerCase();
      }
    }
  }

  // Validate that we found at least some nutritional data
  const hasEnergy = energyKj !== null || energyKcal !== null;
  const hasFat = fat !== null;
  const hasCarbs = carbohydrates !== null;
  const hasProtein = protein !== null;

  if (!hasEnergy && !hasFat && !hasCarbs && !hasProtein) {
    throw new Error('Invalid input: no nutritional data found in text');
  }

  return {
    energyKj: energyKj ?? 0,
    energyKcal: energyKcal ?? 0,
    fat: fat ?? 0,
    saturates: saturates ?? 0,
    carbohydrates: carbohydrates ?? 0,
    sugars: sugars ?? 0,
    fiber: fiber ?? 0,
    protein: protein ?? 0,
    salt: salt ?? 0,
    servingSize: servingSize ?? 100,
    servingUnit: servingUnit,
  };
}