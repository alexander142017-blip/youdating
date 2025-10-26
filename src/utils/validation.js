/**
 * Profile validation utilities
 */

export const MIN_AGE = 18;
export const MIN_BIO_LENGTH = 20;
export const MAX_BIO_LENGTH = 500;
export const MAX_NAME_LENGTH = 50;
export const MAX_PHOTOS = 6;

/**
 * Profile validation errors
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.field = field;
    this.name = 'ValidationError';
  }
}

/**
 * Validate a complete profile for onboarding
 * @param {Object} profile - Profile data to validate
 * @returns {void} - Throws ValidationError if invalid
 */
export function validateOnboardingProfile(profile) {
  // Name validation
  if (!profile.first_name?.trim()) {
    throw new ValidationError('Please enter your first name', 'first_name');
  }
  if (profile.first_name.trim().length < 2) {
    throw new ValidationError('First name must be at least 2 characters', 'first_name');
  }
  if (profile.first_name.trim().length > MAX_NAME_LENGTH) {
    throw new ValidationError(`First name must be less than ${MAX_NAME_LENGTH} characters`, 'first_name');
  }

  // Age validation
  if (!profile.date_of_birth) {
    throw new ValidationError('Please select your date of birth', 'date_of_birth');
  }
  const birthDate = new Date(profile.date_of_birth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  if (age < MIN_AGE) {
    throw new ValidationError(`You must be at least ${MIN_AGE} years old to use YouDating`, 'date_of_birth');
  }

  // Gender validation
  if (!profile.gender) {
    throw new ValidationError('Please select your gender', 'gender');
  }

  // Looking for validation
  if (!profile.looking_for) {
    throw new ValidationError('Please select who you\'re looking for', 'looking_for');
  }

  // Bio validation
  if (!profile.bio?.trim()) {
    throw new ValidationError('Please write a short bio about yourself', 'bio');
  }
  if (profile.bio.trim().length < MIN_BIO_LENGTH) {
    throw new ValidationError(`Bio must be at least ${MIN_BIO_LENGTH} characters`, 'bio');
  }
  if (profile.bio.trim().length > MAX_BIO_LENGTH) {
    throw new ValidationError(`Bio must be less than ${MAX_BIO_LENGTH} characters`, 'bio');
  }

  // Photos validation (optional but with limit)
  if (profile.photos && !Array.isArray(profile.photos)) {
    throw new ValidationError('Invalid photos format', 'photos');
  }
  if (profile.photos?.length > MAX_PHOTOS) {
    throw new ValidationError(`You can upload up to ${MAX_PHOTOS} photos`, 'photos');
  }

  // Phone validation if required
  if (import.meta.env.VITE_REQUIRE_PHONE_VERIFICATION === '1') {
    if (!profile.phone?.trim()) {
      throw new ValidationError('Please enter your phone number', 'phone');
    }
    if (!profile.phone_verified) {
      throw new ValidationError('Please verify your phone number', 'phone');
    }
  }
}

/**
 * Validate a single step of the onboarding process
 * @param {Object} data - Step data to validate
 * @param {number} step - Current step number
 * @returns {void} - Throws ValidationError if invalid
 */
export function validateOnboardingStep(data, step) {
  // Declare variables outside of cases
  const birthDate = data.date_of_birth ? new Date(data.date_of_birth) : null;
  const today = new Date();
  const yearsOld = birthDate ? today.getFullYear() - birthDate.getFullYear() : 0;
  const monthDiff = birthDate ? today.getMonth() - birthDate.getMonth() : 0;
  let age = yearsOld;
  
  if (birthDate && (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()))) {
    age--;
  }
  
  switch (step) {
    case 1:
      if (!data.first_name?.trim()) {
        throw new ValidationError('Please enter your first name', 'first_name');
      }
      if (data.first_name.trim().length < 2) {
        throw new ValidationError('First name must be at least 2 characters', 'first_name');
      }
      if (data.first_name.trim().length > MAX_NAME_LENGTH) {
        throw new ValidationError(`First name must be less than ${MAX_NAME_LENGTH} characters`, 'first_name');
      }
      break;
      
    case 2:
      if (!data.date_of_birth) {
        throw new ValidationError('Please select your date of birth', 'date_of_birth');
      }
      if (age < MIN_AGE) {
        throw new ValidationError(`You must be at least ${MIN_AGE} years old to use YouDating`, 'date_of_birth');
      }
      if (!data.gender) {
        throw new ValidationError('Please select your gender', 'gender');
      }
      if (!data.looking_for) {
        throw new ValidationError('Please select who you\'re looking for', 'looking_for');
      }
      break;
      
    case 3:
      // Photos are optional
      if (data.photos && !Array.isArray(data.photos)) {
        throw new ValidationError('Invalid photos format', 'photos');
      }
      if (data.photos?.length > MAX_PHOTOS) {
        throw new ValidationError(`You can upload up to ${MAX_PHOTOS} photos`, 'photos');
      }
      break;
      
    case 4:
      // Location is optional
      break;
      
    case 5:
      if (!data.bio?.trim()) {
        throw new ValidationError('Please write a short bio about yourself', 'bio');
      }
      if (data.bio.trim().length < MIN_BIO_LENGTH) {
        throw new ValidationError('Min 20 chars', 'bio');
      }
      if (data.bio.trim().length > MAX_BIO_LENGTH) {
        throw new ValidationError(`Bio must be less than ${MAX_BIO_LENGTH} characters`, 'bio');
      }
      break;
      
    case 6:
      if (import.meta.env.VITE_REQUIRE_PHONE_VERIFICATION === '1') {
        if (!data.phone?.trim()) {
          throw new ValidationError('Please enter your phone number', 'phone');
        }
      }
      break;
      
    case 7:
      if (import.meta.env.VITE_REQUIRE_PHONE_VERIFICATION === '1' && !data.phone_verified) {
        throw new ValidationError('Please verify your phone number first', 'phone');
      }
      break;
  }
}