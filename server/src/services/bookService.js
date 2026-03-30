const { v4: uuidv4 } = require('uuid');

const db = require('../storage/LocalStorageDB');
const { COLLECTIONS } = require('../config/constants');
const { validateRequired, validateISBN } = require('../utils/validators');
const { NotFoundError, ValidationError } = require('../utils/AppError');

function mergeValidationErrors(...results) {
  const errors = [];
  results.forEach((result) => {
    if (result.errors && result.errors.length > 0) {
      errors.push(...result.errors);
    }
  });
  return errors;
}

function normalizeIsbn(isbn) {
  return String(isbn).trim();
}

function findBookByIsbn(isbn, excludeId) {
  const target = normalizeIsbn(isbn).toLowerCase();
  return (
    db.query(
      COLLECTIONS.BOOKS,
      (b) =>
        String(b.isbn).trim().toLowerCase() === target && (!excludeId || b.id !== excludeId)
    )[0] || null
  );
}

function assertPositiveIntegerCopies(value, fieldName = 'totalCopies') {
  let num;

  if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!/^\d+$/.test(trimmedValue)) {
      throw new ValidationError('Validation failed', [
        `${fieldName} must be a positive integer.`,
      ]);
    }
    num = Number(trimmedValue);
  } else {
    throw new ValidationError('Validation failed', [
      `${fieldName} must be a positive integer.`,
    ]);
  }

  if (!Number.isInteger(num) || num < 1) {
    throw new ValidationError('Validation failed', [
      `${fieldName} must be a positive integer.`,
    ]);
  }
  return num;
}

function normalizeCategory(category) {
  if (category === undefined || category === null) {
    return '';
  }

  return String(category).trim();
}

function getQueryFilterValue(raw) {
  if (raw === undefined || raw === null) {
    return '';
  }
  const s = Array.isArray(raw) ? raw[0] : raw;
  return String(s).trim();
}

function matchesFilter(book, field, filterValue, mode) {
  const bookVal = book[field];
  if (bookVal === undefined || bookVal === null) {
    return false;
  }
  const haystack = String(bookVal).toLowerCase();
  const needle = filterValue.toLowerCase();
  if (mode === 'exact') {
    return haystack === needle;
  }
  return haystack.includes(needle);
}

function listBooks(queryParams = {}) {
  let books = db.getAll(COLLECTIONS.BOOKS);

  const titleQ = getQueryFilterValue(queryParams.title);
  const authorQ = getQueryFilterValue(queryParams.author);
  const isbnQ = getQueryFilterValue(queryParams.isbn);
  const categoryQ = getQueryFilterValue(queryParams.category);

  if (titleQ) {
    books = books.filter((b) => matchesFilter(b, 'title', titleQ, 'substring'));
  }
  if (authorQ) {
    books = books.filter((b) => matchesFilter(b, 'author', authorQ, 'substring'));
  }
  if (isbnQ) {
    books = books.filter((b) => matchesFilter(b, 'isbn', isbnQ, 'substring'));
  }
  if (categoryQ) {
    books = books.filter((b) => matchesFilter(b, 'category', categoryQ, 'substring'));
  }

  return books;
}

function createBook({ title, author, isbn, category, totalCopies }) {
  const requiredResult = validateRequired(
    ['title', 'author', 'isbn', 'totalCopies'],
    { title, author, isbn, totalCopies }
  );
  const isbnResult = validateISBN(isbn);
  const validationErrors = mergeValidationErrors(requiredResult, isbnResult);

  if (validationErrors.length > 0) {
    throw new ValidationError('Validation failed', validationErrors);
  }

  assertPositiveIntegerCopies(totalCopies, 'totalCopies');

  const normalizedIsbn = normalizeIsbn(isbn);
  if (findBookByIsbn(normalizedIsbn)) {
    throw new ValidationError('A book with this ISBN already exists.');
  }

  const copies = Number(totalCopies);
  const book = {
    id: uuidv4(),
    title: String(title).trim(),
    author: String(author).trim(),
    isbn: normalizedIsbn,
    category: normalizeCategory(category),
    totalCopies: copies,
    availableCopies: copies,
  };

  db.create(COLLECTIONS.BOOKS, book);
  return book;
}

function updateBook(id, updates) {
  const existing = db.getById(COLLECTIONS.BOOKS, id);

  if (!existing) {
    throw new NotFoundError('Book');
  }

  const patch = {};
  const hasOwn = Object.prototype.hasOwnProperty.bind(updates || {});

  if (hasOwn('title')) {
    const titleResult = validateRequired(['title'], { title: updates.title });
    if (!titleResult.valid) {
      throw new ValidationError('Validation failed', titleResult.errors);
    }
    patch.title = String(updates.title).trim();
  }

  if (hasOwn('author')) {
    const authorResult = validateRequired(['author'], { author: updates.author });
    if (!authorResult.valid) {
      throw new ValidationError('Validation failed', authorResult.errors);
    }
    patch.author = String(updates.author).trim();
  }

  if (hasOwn('isbn')) {
    const isbnResult = validateISBN(updates.isbn);
    if (!isbnResult.valid) {
      throw new ValidationError('Validation failed', isbnResult.errors);
    }
    const nextIsbn = normalizeIsbn(updates.isbn);
    const conflict = findBookByIsbn(nextIsbn, id);
    if (conflict) {
      throw new ValidationError('A book with this ISBN already exists.');
    }
    patch.isbn = nextIsbn;
  }

  if (hasOwn('category')) {
    patch.category = normalizeCategory(updates.category);
  }

  if (hasOwn('totalCopies')) {
    assertPositiveIntegerCopies(updates.totalCopies, 'totalCopies');
    const newTotal = Number(updates.totalCopies);
    const oldTotal = existing.totalCopies;
    const nextAvailable = existing.availableCopies + (newTotal - oldTotal);
    if (nextAvailable < 0) {
      throw new ValidationError(
        'Validation failed',
        [
          'totalCopies cannot be reduced below the number of copies currently borrowed.',
        ]
      );
    }
    patch.totalCopies = newTotal;
    patch.availableCopies = nextAvailable;
  }

  if (Object.keys(patch).length === 0) {
    return existing;
  }

  const updated = db.update(COLLECTIONS.BOOKS, id, patch);
  if (!updated) {
    throw new NotFoundError('Book');
  }

  return updated;
}

function deleteBook(id) {
  const existing = db.getById(COLLECTIONS.BOOKS, id);

  if (!existing) {
    throw new NotFoundError('Book');
  }

  const activeBorrows = db.query(
    COLLECTIONS.BORROWS,
    (borrow) => borrow.bookId === id && (borrow.returnedAt === null || borrow.returnedAt === undefined)
  );

  if (activeBorrows.length > 0) {
    throw new ValidationError('Cannot delete a book with active borrows');
  }

  db.delete(COLLECTIONS.BOOKS, id);
  return { deleted: true, id };
}

module.exports = {
  listBooks,
  createBook,
  updateBook,
  deleteBook,
};
