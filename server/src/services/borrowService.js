const { v4: uuidv4 } = require('uuid');

const db = require('../storage/LocalStorageDB');
const { COLLECTIONS } = require('../config/constants');
const env = require('../config/env');
const { validateRequired } = require('../utils/validators');
const { NotFoundError, ValidationError } = require('../utils/AppError');

function getFilterValue(raw) {
  if (raw === undefined || raw === null) {
    return '';
  }
  const s = Array.isArray(raw) ? raw[0] : raw;
  return String(s).trim();
}

function enrichBorrow(borrow) {
  const book = db.getById(COLLECTIONS.BOOKS, borrow.bookId);
  const customer = db.getById(COLLECTIONS.CUSTOMERS, borrow.customerId);
  return {
    ...borrow,
    bookTitle: book ? book.title : null,
    customerName: customer ? customer.fullName : null,
  };
}

function listBorrows(filters = {}) {
  let borrows = db.getAll(COLLECTIONS.BORROWS);

  const status = getFilterValue(filters.status).toLowerCase();
  if (status === 'active') {
    borrows = borrows.filter(
      (b) => b.returnedAt === null || b.returnedAt === undefined
    );
  } else if (status === 'returned') {
    borrows = borrows.filter(
      (b) => b.returnedAt !== null && b.returnedAt !== undefined
    );
  }

  const customerId = getFilterValue(filters.customerId);
  if (customerId) {
    borrows = borrows.filter((b) => b.customerId === customerId);
  }

  const bookId = getFilterValue(filters.bookId);
  if (bookId) {
    borrows = borrows.filter((b) => b.bookId === bookId);
  }

  return borrows.map(enrichBorrow);
}

function resolveBorrowDays(borrowDays) {
  if (borrowDays === undefined || borrowDays === null || borrowDays === '') {
    return env.DEFAULT_BORROW_DAYS;
  }

  const num = Number(borrowDays);
  if (!Number.isInteger(num) || num < 1) {
    throw new ValidationError('Validation failed', [
      'borrowDays must be a positive integer.',
    ]);
  }
  return num;
}

function getAvailableCopies(book) {
  const availableCopies = Number(book.availableCopies);

  if (!Number.isInteger(availableCopies) || availableCopies < 0) {
    throw new ValidationError('Book record has invalid availableCopies value');
  }

  return availableCopies;
}

function borrowBook({ customerId, bookId, borrowDays }) {
  const requiredResult = validateRequired(
    ['customerId', 'bookId'],
    { customerId, bookId }
  );
  if (!requiredResult.valid) {
    throw new ValidationError('Validation failed', requiredResult.errors);
  }

  const customer = db.getById(COLLECTIONS.CUSTOMERS, customerId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  const book = db.getById(COLLECTIONS.BOOKS, bookId);
  if (!book) {
    throw new NotFoundError('Book');
  }

  const availableCopies = getAvailableCopies(book);

  if (availableCopies <= 0) {
    throw new ValidationError('No copies available for borrowing');
  }

  const days = resolveBorrowDays(borrowDays);

  const borrowedAt = new Date();
  const dueDate = new Date(borrowedAt);
  dueDate.setDate(dueDate.getDate() + days);

  const borrow = {
    id: uuidv4(),
    customerId,
    bookId,
    borrowedAt: borrowedAt.toISOString(),
    dueAt: dueDate.toISOString(),
    returnedAt: null,
    penaltyAmount: 0,
  };

  db.update(COLLECTIONS.BOOKS, bookId, {
    availableCopies: availableCopies - 1,
  });

  db.create(COLLECTIONS.BORROWS, borrow);

  return enrichBorrow(borrow);
}

function computePenaltyAmount(dueAtIso, returnedAtIso) {
  const due = new Date(dueAtIso);
  const returned = new Date(returnedAtIso);
  const msPerDay = 24 * 60 * 60 * 1000;

  if (returned.getTime() <= due.getTime()) {
    return 0;
  }

  const lateDays = Math.ceil((returned.getTime() - due.getTime()) / msPerDay);
  return lateDays * env.PENALTY_PER_DAY;
}

function returnBook(borrowId) {
  const borrow = db.getById(COLLECTIONS.BORROWS, borrowId);
  if (!borrow) {
    throw new NotFoundError('Borrow');
  }

  if (borrow.returnedAt !== null && borrow.returnedAt !== undefined) {
    throw new ValidationError('This book has already been returned');
  }

  const book = db.getById(COLLECTIONS.BOOKS, borrow.bookId);
  if (!book) {
    throw new NotFoundError('Book');
  }

  const availableCopies = getAvailableCopies(book);
  const returnedAt = new Date().toISOString();
  const penaltyAmount = computePenaltyAmount(borrow.dueAt, returnedAt);

  const updated = db.update(COLLECTIONS.BORROWS, borrowId, {
    returnedAt,
    penaltyAmount,
  });

  if (!updated) {
    throw new NotFoundError('Borrow');
  }

  db.update(COLLECTIONS.BOOKS, borrow.bookId, {
    availableCopies: availableCopies + 1,
  });

  return enrichBorrow(updated);
}

module.exports = {
  listBorrows,
  borrowBook,
  returnBook,
};
