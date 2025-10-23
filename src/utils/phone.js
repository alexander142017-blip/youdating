/**
 * Phone Number Utilities
 * 
 * Provides E.164 formatting and validation using libphonenumber-js
 * Used for phone verification with Vonage API
 */

// Dynamic import to reduce bundle size - libphonenumber-js is large
let phoneLibPromise = null;
const getPhoneLib = () => {
  if (!phoneLibPromise) {
    phoneLibPromise = import('libphonenumber-js');
  }
  return phoneLibPromise;
};

/**
 * Converts a raw phone number to E.164 format
 * 
 * @param {string} raw - Raw phone number input (e.g., "(555) 123-4567", "5551234567")
 * @param {string} defaultCountry - Default country code (e.g., 'US', 'CA', 'GB')
 * @returns {string|null} - Valid E.164 phone number (e.g., "+15551234567") or null if invalid
 * 
 * @example
 * toE164("(555) 123-4567", "US") // "+15551234567"
 * toE164("555-123-4567") // "+15551234567" (defaults to US)
 * toE164("+44 20 7946 0958", "US") // "+442079460958" (international number)
 * toE164("invalid") // null
 */
export async function toE164(raw, defaultCountry = 'US') {
  try {
    // Return null for empty or null input
    if (!raw || typeof raw !== 'string') {
      return null;
    }

    // Clean the input (remove extra whitespace)
    const cleanInput = raw.trim();
    
    if (!cleanInput) {
      return null;
    }

    // Dynamically import libphonenumber-js
    const { parsePhoneNumber } = await getPhoneLib();

    // Parse the phone number with the default country
    const phoneNumber = parsePhoneNumber(cleanInput, defaultCountry);
    
    // Check if the parsed number is valid
    if (!phoneNumber || !phoneNumber.isValid()) {
      return null;
    }

    // Return the E.164 formatted number
    return phoneNumber.format('E.164');
    
  } catch (error) {
    console.warn('Phone number parsing error:', error.message);
    return null;
  }
}

/**
 * Validates if a phone number is valid for the given country
 * 
 * @param {string} raw - Raw phone number input
 * @param {string} defaultCountry - Default country code
 * @returns {boolean} - True if valid, false otherwise
 * 
 * @example
 * isValidPhone("(555) 123-4567", "US") // true
 * isValidPhone("555", "US") // false
 */
export async function isValidPhone(raw, defaultCountry = 'US') {
  try {
    if (!raw || typeof raw !== 'string') {
      return false;
    }

    const { isValidPhoneNumber } = await getPhoneLib();
    return isValidPhoneNumber(raw.trim(), defaultCountry);
  } catch (error) {
    return false;
  }
}

/**
 * Formats a phone number for display purposes
 * 
 * @param {string} raw - Raw phone number input
 * @param {string} defaultCountry - Default country code
 * @param {string} format - Format type ('NATIONAL' | 'INTERNATIONAL' | 'E.164')
 * @returns {string|null} - Formatted phone number or null if invalid
 * 
 * @example
 * formatPhoneDisplay("+15551234567", "US", "NATIONAL") // "(555) 123-4567"
 * formatPhoneDisplay("+15551234567", "US", "INTERNATIONAL") // "+1 555 123 4567"
 */
export async function formatPhoneDisplay(raw, defaultCountry = 'US', format = 'NATIONAL') {
  try {
    if (!raw || typeof raw !== 'string') {
      return null;
    }

    const { parsePhoneNumber } = await getPhoneLib();
    const phoneNumber = parsePhoneNumber(raw.trim(), defaultCountry);
    
    if (!phoneNumber || !phoneNumber.isValid()) {
      return null;
    }

    return phoneNumber.format(format);
    
  } catch (error) {
    console.warn('Phone number formatting error:', error.message);
    return null;
  }
}

/**
 * Gets country code from a phone number
 * 
 * @param {string} raw - Raw phone number input
 * @param {string} defaultCountry - Default country code
 * @returns {string|null} - Country code (e.g., "US", "CA") or null if invalid
 */
export async function getPhoneCountry(raw, defaultCountry = 'US') {
  try {
    if (!raw || typeof raw !== 'string') {
      return null;
    }

    const { parsePhoneNumber } = await getPhoneLib();
    const phoneNumber = parsePhoneNumber(raw.trim(), defaultCountry);
    
    if (!phoneNumber || !phoneNumber.isValid()) {
      return null;
    }

    return phoneNumber.country || null;
    
  } catch (error) {
    return null;
  }
}

/**
 * Validates and formats phone number for API submission
 * 
 * @param {string} raw - Raw phone number input
 * @param {string} defaultCountry - Default country code
 * @returns {{ valid: boolean, e164: string|null, formatted: string|null, country: string|null }}
 */
export async function validatePhoneForAPI(raw, defaultCountry = 'US') {
  const e164 = await toE164(raw, defaultCountry);
  const valid = e164 !== null;
  
  return {
    valid,
    e164,
    formatted: valid ? await formatPhoneDisplay(e164, defaultCountry, 'NATIONAL') : null,
    country: valid ? await getPhoneCountry(e164, defaultCountry) : null
  };
}

// Example usage:
/*
import { toE164, validatePhoneForAPI } from '@/utils/phone';

// Before calling /api/phone/start
const phoneE164 = toE164(userInput, 'US');
if (!phoneE164) {
  // Show error: "Please enter a valid phone number"
  return;
}

// Call API with validated E.164 number
await fetch('/api/phone/start', {
  method: 'POST',
  body: JSON.stringify({ phone: phoneE164 })
});

// Or use comprehensive validation
const phoneValidation = validatePhoneForAPI(userInput, 'US');
if (!phoneValidation.valid) {
  // Show error
  return;
}

console.log('E.164:', phoneValidation.e164);
console.log('Display:', phoneValidation.formatted);
console.log('Country:', phoneValidation.country);
*/