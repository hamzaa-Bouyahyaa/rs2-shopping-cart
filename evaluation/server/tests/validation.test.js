const {
  isValidProductName,
  isValidProductType,
  isValidQuantity,
  validateAddToBasket,
} = require('../src/validation/product.validation');
const { validateLogin } = require('../src/validation/auth.validation');

describe('product name validation ([A-Za-z], max 30)', () => {
  test.each(['Hamlet', 'a', 'ABC', 'a'.repeat(30)])('accepts %p', (name) => {
    expect(isValidProductName(name)).toBe(true);
  });

  test.each([
    '',                 // empty
    'a'.repeat(31),     // over the 30 character limit
    'abc123',           // digits
    'war and peace',    // spaces
    'café',             // accented character
    'a-b',              // punctuation
    null,
    undefined,
    42,
  ])('rejects %p', (name) => {
    expect(isValidProductName(name)).toBe(false);
  });
});

describe('product type validation', () => {
  test.each(['Books', 'Music', 'Games'])('accepts %p', (type) => {
    expect(isValidProductType(type)).toBe(true);
  });

  test.each(['books', 'Movies', '', null, undefined])('rejects %p', (type) => {
    expect(isValidProductType(type)).toBe(false);
  });
});

describe('quantity validation', () => {
  test.each([1, 2, 999])('accepts %p', (quantity) => {
    expect(isValidQuantity(quantity)).toBe(true);
  });

  test.each([0, -1, 1000, 1.5, '2', NaN, null, undefined])(
    'rejects %p',
    (quantity) => {
      expect(isValidQuantity(quantity)).toBe(false);
    }
  );
});

describe('validateAddToBasket', () => {
  test('returns null for a valid payload', () => {
    expect(
      validateAddToBasket({ name: 'Hamlet', type: 'Books', quantity: 2 })
    ).toBeNull();
  });

  test('reports the first invalid field', () => {
    expect(validateAddToBasket({ name: 'abc123', type: 'Books', quantity: 1 })).toMatch(/Product name/);
    expect(validateAddToBasket({ name: 'Hamlet', type: 'Movies', quantity: 1 })).toMatch(/Product type/);
    expect(validateAddToBasket({ name: 'Hamlet', type: 'Books', quantity: 0 })).toMatch(/Quantity/);
  });

  test('handles a missing payload', () => {
    expect(validateAddToBasket()).toMatch(/Product name/);
  });
});

describe('validateLogin (Varchar2(20) fields)', () => {
  test('returns null for a valid payload', () => {
    expect(validateLogin({ loginName: 'rs2user', password: 'Password' })).toBeNull();
  });

  test.each([
    [{}, /Login name/],
    [{ loginName: '', password: 'Password' }, /Login name/],
    [{ loginName: 'a'.repeat(21), password: 'Password' }, /Login name/],
    [{ loginName: 42, password: 'Password' }, /Login name/],
    [{ loginName: 'rs2user' }, /Password/],
    [{ loginName: 'rs2user', password: 'a'.repeat(21) }, /Password/],
  ])('rejects %p', (payload, expected) => {
    expect(validateLogin(payload)).toMatch(expected);
  });

  test('handles a missing payload', () => {
    expect(validateLogin()).toMatch(/Login name/);
  });
});
