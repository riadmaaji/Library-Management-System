const { v4: uuidv4 } = require('uuid');

const db = require('../storage/LocalStorageDB');
const { COLLECTIONS } = require('../config/constants');
const { validateEmail } = require('../utils/validators');
const { NotFoundError, ValidationError } = require('../utils/AppError');

function validateCustomerRecord({ fullName, phone, email }) {
  const errors = [];
  const fullNameTrimmed =
    fullName === undefined || fullName === null ? '' : String(fullName).trim();

  if (!fullNameTrimmed) {
    errors.push('fullName is required.');
  }

  const phonePresent =
    phone !== undefined &&
    phone !== null &&
    String(phone).trim() !== '';

  const emailPresent =
    email !== undefined &&
    email !== null &&
    String(email).trim() !== '';

  if (!phonePresent && !emailPresent) {
    errors.push('At least one of phone or email is required.');
  }

  if (emailPresent) {
    const emailResult = validateEmail(String(email).trim());
    if (!emailResult.valid) {
      errors.push(...emailResult.errors);
    }
  }

  return errors;
}

function listCustomers() {
  return db.getAll(COLLECTIONS.CUSTOMERS);
}

function createCustomer({ fullName, phone, email }) {
  const validationErrors = validateCustomerRecord({ fullName, phone, email });

  if (validationErrors.length > 0) {
    throw new ValidationError('Validation failed', validationErrors);
  }

  const fullNameTrimmed = String(fullName).trim();
  const phonePresent =
    phone !== undefined &&
    phone !== null &&
    String(phone).trim() !== '';
  const emailPresent =
    email !== undefined &&
    email !== null &&
    String(email).trim() !== '';

  const customer = {
    id: uuidv4(),
    fullName: fullNameTrimmed,
    createdAt: new Date().toISOString(),
  };

  if (phonePresent) {
    customer.phone = String(phone).trim();
  }

  if (emailPresent) {
    customer.email = String(email).trim().toLowerCase();
  }

  db.create(COLLECTIONS.CUSTOMERS, customer);
  return customer;
}

function updateCustomer(id, updates) {
  const existing = db.getById(COLLECTIONS.CUSTOMERS, id);

  if (!existing) {
    throw new NotFoundError('Customer');
  }

  const hasOwn = Object.prototype.hasOwnProperty.bind(updates || {});

  const merged = {
    fullName: existing.fullName,
    phone: existing.phone,
    email: existing.email,
  };

  if (hasOwn('fullName')) {
    merged.fullName = updates.fullName;
  }
  if (hasOwn('phone')) {
    merged.phone = updates.phone;
  }
  if (hasOwn('email')) {
    merged.email = updates.email;
  }

  const validationErrors = validateCustomerRecord(merged);

  if (validationErrors.length > 0) {
    throw new ValidationError('Validation failed', validationErrors);
  }

  const patch = {};

  if (hasOwn('fullName')) {
    patch.fullName = String(merged.fullName).trim();
  }
  if (hasOwn('phone')) {
    const p = merged.phone;
    patch.phone =
      p === undefined || p === null || String(p).trim() === ''
        ? undefined
        : String(p).trim();
  }
  if (hasOwn('email')) {
    const e = merged.email;
    patch.email =
      e === undefined || e === null || String(e).trim() === ''
        ? undefined
        : String(e).trim().toLowerCase();
  }

  if (Object.keys(patch).length === 0) {
    return existing;
  }

  const updated = db.update(COLLECTIONS.CUSTOMERS, id, patch);

  if (!updated) {
    throw new NotFoundError('Customer');
  }

  return updated;
}

module.exports = {
  listCustomers,
  createCustomer,
  updateCustomer,
};
