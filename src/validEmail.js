/**
 * Validates email addresses using Resend's stricter validation rules
 * Stricter checks than standard HTML5 validation:
    No consecutive dots (..)
    Local part can't start or end with dots
    Maximum 64 characters for local part, 254 for total email
    Domain must have valid TLD (at least 2 characters, letters only)
    No hyphens at start/end of domain parts
    RFC 5322 compliant pattern
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */

// export function validEmail(email) {
//   const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Stricter - also checks for invalid characters in the name and domain parts
//   //const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simpler - Just checks string@string
//   return emailRegex.test(email);
// }

export function validEmail(email) {
  // Check if email is provided and is a string
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Trim whitespace
  email = email.trim();

  // Check length constraints (typical max is 254 characters)
  if (email.length === 0 || email.length > 254) {
    return false;
  }

  // RFC 5322 compliant regex pattern with stricter validation
  // This pattern enforces:
  // - Local part (before @): alphanumeric, dots, hyphens, underscores, plus signs
  // - No consecutive dots
  // - No leading/trailing dots in local part
  // - Domain part: valid domain format with proper TLD
  const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._+-])*[a-zA-Z0-9]@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  
  // Allow single character local part
  const singleCharRegex = /^[a-zA-Z0-9]@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email) && !singleCharRegex.test(email)) {
    return false;
  }

  // Split into local and domain parts
  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [local, domain] = parts;

  // Validate local part length (max 64 characters)
  if (local.length > 64) {
    return false;
  }

  // Check for consecutive dots
  if (local.includes('..') || domain.includes('..')) {
    return false;
  }

  // Check that local part doesn't start or end with a dot
  if (local.startsWith('.') || local.endsWith('.')) {
    return false;
  }

  // Validate domain part
  // Domain must not start or end with hyphen or dot
  if (domain.startsWith('-') || domain.endsWith('-') || 
      domain.startsWith('.') || domain.endsWith('.')) {
    return false;
  }

  // Check for valid TLD (at least 2 characters)
  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return false;
  }

  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return false;
  }

  // Ensure each domain part is valid
  for (const part of domainParts) {
    if (part.length === 0 || part.startsWith('-') || part.endsWith('-')) {
      return false;
    }
  }

  return true;
}
