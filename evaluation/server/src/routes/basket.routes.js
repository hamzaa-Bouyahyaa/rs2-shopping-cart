const { Router } = require('express');
const basketController = require('../controllers/basket.controller');
const requireAuth = require('../middleware/requireAuth');

const router = Router();

router.use(requireAuth);
router.get('/', basketController.getBasket);
router.post('/', basketController.addToBasket);
router.delete('/:id', basketController.removeFromBasket);

module.exports = router;
