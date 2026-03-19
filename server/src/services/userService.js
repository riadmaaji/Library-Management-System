const { v4: uuidv4 } = require('uuid');

const db = require('../storage/LocalStorageDB');
const { COLLECTIONS, ROLES } = require('../config/constants');
const { hashPassword } = require('../utils/password');
const { validateEmail, validateRequired } = require('../utils/validators');
const {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} = require('../utils/AppError');

const ALLOWED_ROLES = [ROLES.ADMIN, ROLES.EMPLOYEE];

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function mergeValidationErrors(...results) {
  const errors = [];
  results.forEach((result) => {
    if (result.errors && result.errors.length > 0) {
      errors.push(...result.errors);
    }
  });
  return errors;
}

function validatePasswordInput(password) {
  if (typeof password !== 'string') {
    throw new ValidationError('Validation failed', ['password must be a string.']);
  }
}

function assertValidRole(role, fieldLabel = 'role') {
  if (!ALLOWED_ROLES.includes(role)) {
    throw new ValidationError(`Invalid ${fieldLabel}. Must be ADMIN or EMPLOYEE.`);
  }
}

function findUserByEmail(email) {
  const normalized = String(email).trim().toLowerCase();
  return (
    db.query(COLLECTIONS.USERS, (u) => {
      return String(u.email).trim().toLowerCase() === normalized;
    })[0] || null
  );
}

function listUsers() {
  return db.getAll(COLLECTIONS.USERS).map(sanitizeUser);
}

async function createUser({ name, email, password, role }) {
  const requiredResult = validateRequired(['name', 'email', 'password'], {
    name,
    email,
    password,
  });
  const emailResult = validateEmail(email);
  const validationErrors = mergeValidationErrors(requiredResult, emailResult);

  if (validationErrors.length > 0) {
    throw new ValidationError('Validation failed', validationErrors);
  }

  validatePasswordInput(password);

  const normalizedEmail = String(email).trim().toLowerCase();

  if (findUserByEmail(normalizedEmail)) {
    throw new ValidationError('A user with this email already exists.');
  }

  const resolvedRole = role === undefined || role === null ? ROLES.EMPLOYEE : role;
  assertValidRole(resolvedRole);

  const hashedPassword = await hashPassword(password);

  const user = {
    id: uuidv4(),
    name: String(name).trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: resolvedRole,
    createdAt: new Date().toISOString(),
  };

  db.create(COLLECTIONS.USERS, user);
  return sanitizeUser(user);
}

async function updateUser(id, updates) {
  const existing = db.getById(COLLECTIONS.USERS, id);

  if (!existing) {
    throw new NotFoundError('User');
  }

  const patch = {};
  const hasOwn = Object.prototype.hasOwnProperty.bind(updates || {});

  if (hasOwn('name')) {
    const nameResult = validateRequired(['name'], { name: updates.name });
    if (!nameResult.valid) {
      throw new ValidationError('Validation failed', nameResult.errors);
    }
    patch.name = String(updates.name).trim();
  }

  if (hasOwn('email')) {
    const emailResult = validateEmail(updates.email);
    if (!emailResult.valid) {
      throw new ValidationError('Validation failed', emailResult.errors);
    }
    const normalizedEmail = String(updates.email).trim().toLowerCase();
    const other = findUserByEmail(normalizedEmail);
    if (other && other.id !== id) {
      throw new ValidationError('A user with this email already exists.');
    }
    patch.email = normalizedEmail;
  }

  if (hasOwn('password')) {
    const pwdResult = validateRequired(['password'], { password: updates.password });
    if (!pwdResult.valid) {
      throw new ValidationError('Validation failed', pwdResult.errors);
    }
    validatePasswordInput(updates.password);
    patch.password = await hashPassword(updates.password);
  }

  if (hasOwn('role')) {
    assertValidRole(updates.role);
    patch.role = updates.role;
  }

  if (Object.keys(patch).length === 0) {
    return sanitizeUser(existing);
  }

  const updated = db.update(COLLECTIONS.USERS, id, patch);
  if (!updated) {
    throw new NotFoundError('User');
  }
  return sanitizeUser(updated);
}

function deleteUser(id, requestingUserId) {
  const existing = db.getById(COLLECTIONS.USERS, id);

  if (!existing) {
    throw new NotFoundError('User');
  }

  if (id === requestingUserId) {
    throw new ForbiddenError('You cannot delete your own account.');
  }

  db.delete(COLLECTIONS.USERS, id);
  return { deleted: true, id };
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
};
