import { describe, it, expect } from 'vitest';
import { validEmail } from './validEmail.js'

describe('validEmail', () => {
  describe('Valid addresses', () => {
    it('Simple email', () => {
      expect(validEmail('user@example.com')).toBe(true);
    });
    it('User with tag', () => {
      expect(validEmail('user.name+tag@example.co.uk')).toBe(true);
    });
    it('Minimal email', () => {
      expect(validEmail('a@b.cd')).toBe(true);
    });    
  });

  describe('Invalid format', () => {
    it('Null', () => {
      expect(validEmail(null)).toBe(false);
    });
    it('Empty string', () => {
      expect(validEmail('')).toBe(false);
    });
  });

  describe('Invalid user', () => {
    it('Missing user', () => {
      expect(validEmail('@example.com')).toBe(false);
    });
    it('dot at the start', () => {
      expect(validEmail('.invalid@example.com')).toBe(false);
    });
    it('two dots', () => {
      expect(validEmail('invalid..dots@example.com')).toBe(false);
    });
    it('dot at the end', () => {
      expect(validEmail('invalid.@example.com')).toBe(false);
    });
    it('Invalid chatacter', () => {
      expect(validEmail('invalid:character@example.com')).toBe(false);
    });
  });

  describe('Invalid domain', () => {
    it('Two character domain', () => {
      expect(validEmail('a@b.cd')).toBe(true);
    });
    it('Single character domain', () => {
      expect(validEmail('a@b.c')).toBe(false);
    });
    it('missing domain', () => {
      expect(validEmail('invalid@')).toBe(false);
    });
    it('Missing dot', () => {
      expect(validEmail('invalid@example')).toBe(false);
    });
    it('Missing TLD', () => {
      expect(validEmail('invalid@example.')).toBe(false);
    });
    it('hyphen at the start the end', () => {
      expect(validEmail('invalid.@-example.com')).toBe(false);
    });
    it('hyphen at the end', () => {
      expect(validEmail('invalid.@example-.com')).toBe(false);
    });
    it('Invalid chatacter', () => {
      expect(validEmail('invalid@invalid&character.com')).toBe(false);
    });
  });
});
