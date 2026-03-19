const express = require('express');

const { authenticate } = require('../middleware/auth');
const {
  listBorrows,
  borrowBook,
  returnBook,
} = require('../controllers/borrowController');

const router = express.Router();

router.use(authenticate);

router.get('/', listBorrows);
router.post('/', borrowBook);
router.post('/:id/return', returnBook);

module.exports = router;
