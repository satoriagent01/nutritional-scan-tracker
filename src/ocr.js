/**
 * OCR Parsing Module
 * Extracts nutritional data from raw OCR text of product labels.
 * Supports multilingual labels (German, Dutch, French, Italian, English).
 */

/**
 * Parses raw OCR text into structured nutritional data.
 * @param {string} rawText - The raw text extracted from the image.
 * @param {string} [language='en'] - The language of the label (de, nl, fr, it, en).
 * @returns {object} Structured nutritional data.
 * @throws {Error} If no nutritional table is found.
 */
export function parseNutritionalTable(rawText, language = 'en') {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    throw new Error('Invalid input: rawText must be a non-empty string');
  }

  const text = rawText.trim();

  // Check if the text contains any nutritional table indicators
  const tableIndicators = [
    'nährwert', 'nutrition', 'nutritional', 'voedingswaarde', 'valeur',
    'valore', 'energie', 'fett', 'vet', 'matières grasses', 'grassi',
    'kohlenhydrat', 'koolhydrat', 'glucides', 'zucker', 'suiker',
    'eiweiß', 'eiwit', 'protéine', 'protéines', 'salz', 'zout', 'sel',
    'ballaststoff', 'vezel', 'fibre', 'fett', 'vet', 'saturates',
    'gesättigte', 'verzadigde', 'acides gras saturés', 'grassi saturi'
  ];

  const lowerText = text.toLowerCase();
  const hasIndicator = tableIndicators.some(indicator => lowerText.includes(indicator));

  if (!hasIndicator) {
    throw new Error('Invalid input: no nutritional table found in the provided text');
  }

  // Parse the nutritional table
  const result = {
    energyKj: 0,
    energyKcal: 0,
    fat: 0,
    saturates: 0,
    carbohydrates: 0,
    sugars: 0,
    fiber: 0,
    protein: 0,
    salt: 0,
    servingSize: 0,
    servingUnit: 'g'
  };

  // Split text into lines for processing
  const lines = text.split('\n');

  // Try to find the nutritional table section
  let inTable = false;
  let tableLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this line starts the nutritional table
    if (
      trimmed.toLowerCase().includes('nährwert') ||
      trimmed.toLowerCase().includes('nutrition') ||
      trimmed.toLowerCase().includes('voedingswaarde') ||
      trimmed.toLowerCase().includes('valeur nutritionnelle') ||
      trimmed.toLowerCase().includes('valore nutrizionale')
    ) {
      inTable = true;
      tableLines = [trimmed];
      continue;
    }

    if (inTable) {
      tableLines.push(trimmed);
    }
  }

  // If we didn't find a clear table section, try to parse the whole text
  if (tableLines.length === 0) {
    tableLines = lines.filter(l => l.trim().length > 0);
  }

  // Parse serving size first
  const servingInfo = parseServingSize(text);
  if (servingInfo) {
    result.servingSize = servingInfo.size;
    result.servingUnit = servingInfo.unit;
  }

  // Parse each nutritional component
  for (const line of tableLines) {
    parseLine(line, result);
  }

  // Validate that we found at least some data
  const hasData = result.energyKj > 0 || result.energyKcal > 0 || result.fat > 0 ||
                  result.carbohydrates > 0 || result.protein > 0;

  if (!hasData) {
    throw new Error('Invalid input: no nutritional data could be extracted from the provided text');
  }

  return result;
}

/**
 * Check if a line contains a numeric value (with optional decimal and unit)
 */
function hasNumericValue(line) {
  return /\d[\d,]*\s*(?:kJ|kcal|g|ml|%)/i.test(line);
}

/**
 * Check if a line is a table header
 */
function isTableHeader(line) {
  const lower = line.toLowerCase();
  return lower.includes('100') || lower.includes('per ') || lower.includes('pro ') ||
         lower.includes('pro 100') || lower.includes('pro 100 g') ||
         lower.includes('pro 100 ml') || lower.includes('pro 100 g/ml');
}

/**
 * Parse serving size from the text
 */
function parseServingSize(text) {
  const servingPatterns = [
    /(?:portion|servings?|serving|porzione|portata|1\s*melto|1\s*glas|1\s*glass)\s*(?:size|größen?|größe)?\s*[:\-]?\s*(\d[\d,]*)\s*(g|ml)/i,
    /(\d[\d,]*)\s*(?:per\s*)?(?:100\s*)?(g|ml)\s*(?:per\s*)?portion/i,
    /(?:pro|per)\s*(\d[\d,]*)\s*(g|ml)/i,
    /(\d[\d,]*)\s*(?:per\s*)?(?:100\s*)?(g|ml)/i,
    /(?:portion|servings?|serving|porzione|portata)\s*[:\-]?\s*(\d[\d,]*)\s*(g|ml)/i
  ];

  for (const pattern of servingPatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        size: parseFloat(match[1].replace(',', '.')),
        unit: match[2].toLowerCase()
      };
    }
  }

  return null;
}

/**
 * Parse a single line from the nutritional table
 */
function parseLine(line, result) {
  const lowerLine = line.toLowerCase();

  // Skip header lines and non-data lines
  if (isTableHeader(line) || !hasNumericValue(line)) {
    return;
  }

  // Extract all numeric values from the line
  const values = extractNumericValues(line);
  if (values.length === 0) {
    return;
  }

  // Determine which nutritional component this line represents
  const component = identifyComponent(lowerLine);
  if (!component) {
    return;
  }

  // Assign values based on the component
  assignValue(component, values, result);
}

/**
 * Extract numeric values from a line (handles both . and , as decimal separators)
 */
function extractNumericValues(line) {
  const matches = line.matchAll(/(\d[\d,]*)\s*(?:kJ|kcal|g|ml|%|\/)/gi);
  const values = [];
  for (const match of matches) {
    const numStr = match[1].replace(',', '.');
    const num = parseFloat(numStr);
    if (!isNaN(num)) {
      values.push(num);
    }
  }
  return values;
}

/**
 * Identify which nutritional component a line represents
 */
function identifyComponent(lowerLine) {
  // Order matters: more specific patterns first
  if (lowerLine.includes('energie') || lowerLine.includes('energy') || lowerLine.includes('energi')) {
    return 'energy';
  }
  if (lowerLine.includes('fett') || lowerLine.includes('vet') || lowerLine.includes('matières grasses') || lowerLine.includes('grassi')) {
    if (lowerLine.includes('davon gesättigte') || lowerLine.includes('saturates') ||
        lowerLine.includes('verzadigde') || lowerLine.includes('acides gras saturés') ||
        lowerLine.includes('grassi saturi') || lowerLine.includes('of which saturates')) {
      return 'saturates';
    }
    return 'fat';
  }
  if (lowerLine.includes('kohlenhydrat') || lowerLine.includes('koolhydrat') ||
      lowerLine.includes('glucides') || lowerLine.includes('carbohydrat') ||
      lowerLine.includes('carboidrati')) {
    if (lowerLine.includes('davon zucker') || lowerLine.includes('of which sugars') ||
        lowerLine.includes('waarvan suikers') || lowerLine.includes('dont sucres') ||
        lowerLine.includes('di cui zuccheri')) {
      return 'sugars';
    }
    return 'carbohydrates';
  }
  if (lowerLine.includes('zucker') || lowerLine.includes('suiker') || lowerLine.includes('sucres') || lowerLine.includes('zuccheri')) {
    return 'sugars';
  }
  if (lowerLine.includes('ballaststoff') || lowerLine.includes('vezel') || lowerLine.includes('fibre')) {
    return 'fiber';
  }
  if (lowerLine.includes('eiweiß') || lowerLine.includes('eiwit') || lowerLine.includes('protéine') || lowerLine.includes('proteine') || lowerLine.includes('proteina')) {
    return 'protein';
  }
  if (lowerLine.includes('salz') || lowerLine.includes('zout') || lowerLine.includes('sel')) {
    return 'salt';
  }

  return null;
}

/**
 * Assign parsed values to the result object
 */
function assignValue(component, values, result) {
  switch (component) {
    case 'energy':
      if (values.length >= 2) {
        result.energyKj = values[0];
        result.energyKcal = values[1];
      } else if (values.length === 1) {
        if (values[0] > 1000) {
          result.energyKj = values[0];
        } else {
          result.energyKcal = values[0];
        }
      }
      break;
    case 'fat':
      result.fat = values[0];
      break;
    case 'saturates':
      result.saturates = values[0];
      break;
    case 'carbohydrates':
      result.carbohydrates = values[0];
      break;
    case 'sugars':
      result.sugars = values[0];
      break;
    case 'fiber':
      result.fiber = values[0];
      break;
    case 'protein':
      result.protein = values[0];
      break;
    case 'salt':
      result.salt = values[0];
      break;
  }
}