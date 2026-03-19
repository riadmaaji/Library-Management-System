const express = require('express');

const { authenticate, authorize } = require('../middleware/auth');
const {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
