const basketService = require('../services/basket.service');
const { validateAddToBasket } = require('../validation/product.validation');

function getBasket(req, res) {
  res.json({ items: basketService.getBasket(req.session.user.userId) });
}

function addToBasket(req, res) {
  const { name, type, quantity } = req.body || {};

  const validationError = validateAddToBasket({ name, type, quantity });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const item = basketService.addToBasket(req.session.user.userId, {
      name,
      type,
      quantity,
    });
    res.status(201).json({ item });
  } catch (err) {
    if (err.code === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    if (err.code === 'DUPLICATE_PRODUCT') {
      return res.status(409).json({ error: err.message });
    }
    throw err;
  }
}

function removeFromBasket(req, res) {
  const basketId = Number(req.params.id);
  if (!Number.isInteger(basketId) || basketId < 1) {
    return res.status(400).json({ error: 'Invalid basket item id.' });
  }

  try {
    basketService.removeFromBasket(req.session.user.userId, basketId);
    res.status(204).end();
  } catch (err) {
    if (err.code === 'BASKET_ITEM_NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    throw err;
  }
}

module.exports = { getBasket, addToBasket, removeFromBasket };
