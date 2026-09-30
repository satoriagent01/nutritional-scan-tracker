/**
 * AI Module - Calls an OpenAI-compatible endpoint for OCR text extraction.
 * The endpoint URL, API key, and model are configurable via parameters.
 */

/**
 * Sends an image to an OpenAI-compatible OCR endpoint and returns the extracted text.
 * @param {Blob|File|ArrayBuffer} imageData - The image data to process.
 * @param {Object} config - Configuration for the AI endpoint.
 * @param {string} config.url - The endpoint URL (e.g., 'https://api.openai.com/v1').
 * @param {string} config.key - The API key for authentication.
 * @param {string} config.model - The model to use (e.g., 'gpt-4o').
 * @returns {Promise<string>} The extracted text from the image.
 */
export async function extractText(imageData, config) {
  const { url, key, model } = config;

  if (!url || !key || !model) {
    throw new Error('Missing required configuration: url, key, and model are required');
  }

  // Convert image data to base64
  let base64Image;
  if (imageData instanceof Blob || imageData instanceof File) {
    base64Image = await blobToBase64(imageData);
  } else if (imageData instanceof ArrayBuffer) {
    base64Image = arrayBufferToBase64(imageData);
  } else {
    throw new Error('Unsupported image data type');
  }

  const mimeType = imageData instanceof Blob || imageData instanceof File
    ? imageData.type || 'image/jpeg'
    : 'image/jpeg';

  const endpoint = `${url}/chat/completions`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all nutritional information from this image. Return only the raw text as it appears on the label, preserving all numbers, units, and language-specific terms. Do not add any commentary or formatting.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI endpoint error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response from AI endpoint');
  }

  return data.choices[0].message.content;
}

/**
 * Converts a Blob to base64 string.
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts an ArrayBuffer to base64 string.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}