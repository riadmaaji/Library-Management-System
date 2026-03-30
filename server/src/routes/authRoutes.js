const express = require('express');

const { authenticate } = require('../middleware/auth');
const { loginHandler, getMeHandler } = require('../controllers/authController');

const router = express.Router();

router.post('/login', loginHandler);
router.get('/me', authenticate, getMeHandler);

module.exports = router;
