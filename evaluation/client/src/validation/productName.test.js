import { describe, expect, test } from 'vitest';
import { validateProductName } from './productName';

describe('validateProductName', () => {
  test.each(['Hamlet', 'a', 'ABC', 'a'.repeat(30)])('accepts %j', (name) => {
    expect(validateProductName(name)).toBeNull();
  });

  test('rejects an empty name', () => {
    expect(validateProductName('')).toMatch(/required/);
  });

  test('rejects a name over 30 characters', () => {
    expect(validateProductName('a'.repeat(31))).toMatch(/30 characters/);
  });

  test.each(['abc123', 'war and peace', 'a-b', 'café'])(
    'rejects %j (letters only)',
    (name) => {
      expect(validateProductName(name)).toMatch(/only contain letters/);
    }
  );
});
