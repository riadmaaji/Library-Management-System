function buildValidationResult(errors) {
  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateEmail(email) {
  const errors = [];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailPattern.test(String(email).trim())) {
    errors.push('A valid email is required.');
  }

  return buildValidationResult(errors);
}

function validateRequired(fields, body) {
  const errors = [];

  fields.forEach((field) => {
    const value = body?.[field];
    const missingValue =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '');

    if (missingValue) {
      errors.push(`${field} is required.`);
    }
  });

  return buildValidationResult(errors);
}

function validateISBN(isbn) {
  const errors = [];
  const isbnPattern = /^[A-Za-z0-9-]+$/;

  if (!isbn || typeof isbn !== 'string' || isbn.trim() === '') {
    errors.push('ISBN is required.');
  } else if (!isbnPattern.test(isbn.trim())) {
    errors.push('ISBN must contain only letters, numbers, or dashes.');
  }

  return buildValidationResult(errors);
}

function validatePositiveInteger(value, fieldName) {
  const errors = [];
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue < 0) {
    errors.push(`${fieldName} must be a non-negative integer.`);
  }

  return buildValidationResult(errors);
}

module.exports = {
  validateEmail,
  validateRequired,
  validateISBN,
  validatePositiveInteger,
};
