const { Router } = require('express');
const productController = require('../controllers/product.controller');
const requireAuth = require('../middleware/requireAuth');

const router = Router();

router.use(requireAuth);
router.get('/suggestions', productController.suggestions);

module.exports = router;
