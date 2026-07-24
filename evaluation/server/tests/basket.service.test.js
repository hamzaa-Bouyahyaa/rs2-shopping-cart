process.env.DB_PATH = ':memory:';

const { getDb, closeDb } = require('../src/db/connection');
const { seed } = require('../src/db/seed');
const {
  getBasket,
  addToBasket,
  removeFromBasket,
  ProductNotFoundError,
  DuplicateProductError,
  BasketItemNotFoundError,
} = require('../src/services/basket.service');

const USER_ID = 1;

beforeEach(() => {
  seed(getDb());
});

afterEach(() => {
  closeDb();
});

describe('basket service', () => {
  test('adds an existing product to the basket', () => {
    const item = addToBasket(USER_ID, { name: 'Hamlet', type: 'Books', quantity: 2 });

    expect(item).toMatchObject({
      name: 'Hamlet',
      type: 'Books',
      quantity: 2,
    });
    expect(getBasket(USER_ID)).toHaveLength(1);
  });

  test('matches product names case-insensitively', () => {
    const item = addToBasket(USER_ID, { name: 'hamlet', type: 'Books', quantity: 1 });
    expect(item.name).toBe('Hamlet');
  });

  test('throws ProductNotFoundError for an unknown product', () => {
    expect(() =>
      addToBasket(USER_ID, { name: 'Nonexistent', type: 'Books', quantity: 1 })
    ).toThrow(ProductNotFoundError);
  });

  test('throws ProductNotFoundError when the type does not match the name', () => {
    expect(() =>
      addToBasket(USER_ID, { name: 'Hamlet', type: 'Music', quantity: 1 })
    ).toThrow(ProductNotFoundError);
  });

  test('throws DuplicateProductError when the user buys the same product twice', () => {
    addToBasket(USER_ID, { name: 'Chess', type: 'Games', quantity: 1 });

    expect(() =>
      addToBasket(USER_ID, { name: 'Chess', type: 'Games', quantity: 3 })
    ).toThrow(DuplicateProductError);
    expect(getBasket(USER_ID)).toHaveLength(1);
  });

  test('scopes baskets per user', () => {
    addToBasket(USER_ID, { name: 'Dune', type: 'Books', quantity: 1 });
    expect(getBasket(USER_ID)).toHaveLength(1);
    expect(getBasket(999)).toHaveLength(0);
  });

  test('removes a basket row', () => {
    const item = addToBasket(USER_ID, { name: 'Dune', type: 'Books', quantity: 1 });

    removeFromBasket(USER_ID, item.basketId);
    expect(getBasket(USER_ID)).toHaveLength(0);
  });

  test('throws BasketItemNotFoundError for an unknown row', () => {
    expect(() => removeFromBasket(USER_ID, 12345)).toThrow(BasketItemNotFoundError);
  });

  test("does not remove another user's basket row", () => {
    const item = addToBasket(USER_ID, { name: 'Dune', type: 'Books', quantity: 1 });

    expect(() => removeFromBasket(999, item.basketId)).toThrow(BasketItemNotFoundError);
    expect(getBasket(USER_ID)).toHaveLength(1);
  });
});
