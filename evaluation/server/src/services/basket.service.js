const { getDb } = require('../db/connection');

// Each error carries a code so controllers can map it to an HTTP status
// without matching on message strings.
class ProductNotFoundError extends Error {
  constructor() {
    super('Product not found.');
    this.code = 'PRODUCT_NOT_FOUND';
  }
}

class DuplicateProductError extends Error {
  constructor() {
    super('This product has already been bought.');
    this.code = 'DUPLICATE_PRODUCT';
  }
}

class BasketItemNotFoundError extends Error {
  constructor() {
    super('Basket item not found.');
    this.code = 'BASKET_ITEM_NOT_FOUND';
  }
}

const BASKET_ROW_SELECT = `
  SELECT b.ID AS basketId,
         p.ID AS productId,
         p.Name AS name,
         p.Type AS type,
         p.Description AS description,
         b.Quantity AS quantity
    FROM Basket b
    JOIN Product p ON p.ID = b.ProductID
`;

function getBasket(userId) {
  return getDb()
    .prepare(`${BASKET_ROW_SELECT} WHERE b.UserID = ? ORDER BY b.ID`)
    .all(userId);
}

function addToBasket(userId, { name, type, quantity }) {
  const db = getDb();

  const product = db
    .prepare('SELECT ID FROM Product WHERE Name = ? COLLATE NOCASE AND Type = ?')
    .get(name, type);

  if (!product) {
    throw new ProductNotFoundError();
  }

  try {
    const result = db
      .prepare('INSERT INTO Basket (ProductID, UserID, Quantity) VALUES (?, ?, ?)')
      .run(product.ID, userId, quantity);

    return db
      .prepare(`${BASKET_ROW_SELECT} WHERE b.ID = ?`)
      .get(result.lastInsertRowid);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new DuplicateProductError();
    }
    throw err;
  }
}

// The DELETE is scoped to the user, so another user's row looks the same
// as a missing one (404 either way).
function removeFromBasket(userId, basketId) {
  const result = getDb()
    .prepare('DELETE FROM Basket WHERE ID = ? AND UserID = ?')
    .run(basketId, userId);

  if (result.changes === 0) {
    throw new BasketItemNotFoundError();
  }
}

module.exports = {
  getBasket,
  addToBasket,
  removeFromBasket,
  ProductNotFoundError,
  DuplicateProductError,
  BasketItemNotFoundError,
};
