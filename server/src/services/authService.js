const db = require('../storage/LocalStorageDB');
const { COLLECTIONS } = require('../config/constants');
const { comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/token');
const {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} = require('../utils/AppError');

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

async function login(email, password) {
  if (typeof password !== 'string') {
    throw new ValidationError('Validation failed', ['password must be a string.']);
  }

  const normalizedEmail =
    typeof email === 'string' ? email.trim().toLowerCase() : '';
  const user = db.getByField(COLLECTIONS.USERS, 'email', normalizedEmail);

  if (!user || !user.password) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const passwordMatches = await comparePassword(password, user.password);

  if (!passwordMatches) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const safeUser = sanitizeUser(user);
  const token = generateToken({
    id: safeUser.id,
    email: safeUser.email,
    role: safeUser.role,
  });

  return {
    token,
    user: safeUser,
  };
}

function getCurrentUser(userId) {
  const user = db.getById(COLLECTIONS.USERS, userId);

  if (!user) {
    throw new NotFoundError('User');
  }

  return sanitizeUser(user);
}

module.exports = {
  login,
  getCurrentUser,
};
