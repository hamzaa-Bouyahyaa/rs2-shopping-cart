// Same rules as the client. The server can't trust client-side validation.

const PRODUCT_NAME_PATTERN = /^[A-Za-z]{1,30}$/; // brief: characters [A-Za-z], length 30
const PRODUCT_TYPES = ['Books', 'Music', 'Games'];
const QUANTITY_MIN = 1;

function isValidProductName(name) {
  return typeof name === 'string' && PRODUCT_NAME_PATTERN.test(name);
}

function isValidProductType(type) {
  return PRODUCT_TYPES.includes(type);
}

function isValidQuantity(quantity) {
  return Number.isInteger(quantity) && quantity >= QUANTITY_MIN;
}


function validateAddToBasket({ name, type, quantity } = {}) {
  if (!isValidProductName(name)) {
    return 'Product name must be 1 to 30 letters (A-Z or a-z) only.';
  }
  if (!isValidProductType(type)) {
    return `Product type must be one of: ${PRODUCT_TYPES.join(', ')}.`;
  }
  if (!isValidQuantity(quantity)) {
    return `Quantity must be a whole number of at least ${QUANTITY_MIN}.`;
  }
  return null;
}

module.exports = {
  PRODUCT_NAME_PATTERN,
  PRODUCT_TYPES,
  QUANTITY_MIN,
  isValidProductName,
  isValidProductType,
  isValidQuantity,
  validateAddToBasket,
};
