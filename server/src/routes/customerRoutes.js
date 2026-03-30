const express = require('express');

const { authenticate } = require('../middleware/auth');
const {
  listCustomers,
  createCustomer,
  updateCustomer,
} = require('../controllers/customerController');

const router = express.Router();

router.use(authenticate);

router.get('/', listCustomers);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);

module.exports = router;
