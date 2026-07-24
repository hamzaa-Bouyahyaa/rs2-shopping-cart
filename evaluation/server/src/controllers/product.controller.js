const productService = require('../services/product.service');
const {
  isValidProductName,
  isValidProductType,
  PRODUCT_TYPES,
} = require('../validation/product.validation');

function suggestions(req, res) {
  const { name, type } = req.query;

  // A partial name obeys the same rule as a full one: [A-Za-z], max 30.
  if (!isValidProductName(name)) {
    return res
      .status(400)
      .json({ error: 'Name prefix must be 1 to 30 letters (A-Z or a-z) only.' });
  }
  if (type !== undefined && !isValidProductType(type)) {
    return res
      .status(400)
      .json({ error: `Product type must be one of: ${PRODUCT_TYPES.join(', ')}.` });
  }

  res.json({ suggestions: productService.suggestProducts({ name, type }) });
}

module.exports = { suggestions };
