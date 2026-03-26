require('dotenv').config();

const { v4: uuidv4 } = require('uuid');

const db = require('./src/storage/LocalStorageDB');
const { hashPassword } = require('./src/utils/password');
const { COLLECTIONS, ROLES } = require('./src/config/constants');
const { PENALTY_PER_DAY } = require('./src/config/env');

const SEEDED_USERS = [
  {
    name: 'Mozna Platforms',
    email: 'admin@mozna.com',
    role: ROLES.ADMIN,
  },
  {
    name: 'Riad Maaji',
    email: 'maaji.riad@mozna.com',
    role: ROLES.EMPLOYEE,
  },
];

const SEEDED_BOOKS = [
  {
    title: 'The Pragmatic Programmer',
    author: 'David Thomas & Andrew Hunt',
    isbn: '978-0135957059',
    category: 'Technology',
    totalCopies: 5,
    availableCopies: 5,
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    category: 'Technology',
    totalCopies: 3,
    availableCopies: 3,
  },
  {
    title: 'Dune',
    author: 'Frank Herbert',
    isbn: '978-0441172719',
    category: 'Science Fiction',
    totalCopies: 4,
    availableCopies: 4,
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '978-0061120084',
    category: 'Fiction',
    totalCopies: 6,
    availableCopies: 6,
  },
  {
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    isbn: '978-0062316097',
    category: 'Non-Fiction',
    totalCopies: 3,
    availableCopies: 3,
  },
  {
    title: '1984',
    author: 'George Orwell',
    isbn: '978-0451524935',
    category: 'Fiction',
    totalCopies: 4,
    availableCopies: 4,
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    isbn: '978-0547928227',
    category: 'Fantasy',
    totalCopies: 5,
    availableCopies: 5,
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    isbn: '978-0141439518',
    category: 'Classic Fiction',
    totalCopies: 4,
    availableCopies: 4,
  },
  {
    title: 'Les Misérables',
    author: 'Victor Hugo',
    isbn: '978-0451529260',
    category: 'Classic Fiction',
    totalCopies: 3,
    availableCopies: 3,
  },
  {
    title: 'The Handmaid\'s Tale',
    author: 'Margaret Atwood',
    isbn: '978-0385490818',
    category: 'Fiction',
    totalCopies: 4,
    availableCopies: 4,
  },
  {
    title: 'Educated',
    author: 'Tara Westover',
    isbn: '978-0399590504',
    category: 'Memoir',
    totalCopies: 3,
    availableCopies: 3,
  },
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    isbn: '978-0374533557',
    category: 'Psychology',
    totalCopies: 4,
    availableCopies: 4,
  },
];

const SEEDED_CUSTOMERS = [
  {
    fullName: 'Marie-Claude Tremblay',
    email: 'marie-claude.tremblay@gmail.com',
    phone: '514-276-8841',
  },
  {
    fullName: 'Jean-François Dubois',
    email: 'jf.dubois@yahoo.ca',
    phone: '438-392-1104',
  },
  {
    fullName: 'Amélie Gagnon',
    email: 'amelie.gagnon@videotron.ca',
    phone: '514-883-2291',
  },
  {
    fullName: 'Marc-André Lefebvre',
    phone: '514-723-4401',
  },
  {
    fullName: 'Nathalie Côté',
    phone: '438-881-9022',
  },
  {
    fullName: 'Pierre-Olivier Roy',
    email: 'pierre.roy@outlook.com',
    phone: '514-884-3310',
  },
  {
    fullName: 'Catherine Desrosiers',
    phone: '438-220-5567',
  },
  {
    fullName: 'Élodie Morin',
    email: 'elodie.morin@hotmail.com',
    phone: '514-990-2244',
  },
  {
    fullName: 'Gabriel Thériault',
    phone: '514-661-7788',
  },
  {
    fullName: 'Véronique Poirier',
    email: 'veronique.poirier@sympatico.ca',
    phone: '438-445-9933',
  },
];

function toIsoDaysFromNow(daysOffset) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
}

function buildBorrowRecord({
  customerId,
  bookId,
  borrowedDaysAgo,
  borrowDurationDays,
  returnedDaysAgo = null,
}) {
  const borrowedAt = toIsoDaysFromNow(-borrowedDaysAgo);
  const dueAt = toIsoDaysFromNow(-borrowedDaysAgo + borrowDurationDays);
  const returnedAt = returnedDaysAgo == null ? null : toIsoDaysFromNow(-returnedDaysAgo);

  let penaltyAmount = 0;
  if (returnedAt !== null) {
    const due = new Date(dueAt);
    const returned = new Date(returnedAt);
    if (returned.getTime() > due.getTime()) {
      const msPerDay = 24 * 60 * 60 * 1000;
      const lateDays = Math.ceil((returned.getTime() - due.getTime()) / msPerDay);
      penaltyAmount = lateDays * PENALTY_PER_DAY;
    }
  }

  return {
    id: uuidv4(),
    customerId,
    bookId,
    borrowedAt,
    dueAt,
    returnedAt,
    penaltyAmount,
  };
}

async function seed() {
  console.log('Seeding database...');

  const existingUsers = db.getAll(COLLECTIONS.USERS);

  if (existingUsers.length === 0) {
    const hashedPassword = await hashPassword('password');
    const seededUsers = SEEDED_USERS.map((user) => ({
      id: uuidv4(),
      ...user,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    }));

    db.replaceAll(COLLECTIONS.USERS, seededUsers);
    console.log('Admin and employee users created (admin@mozna.com, maaji.riad@mozna.com / password)');
  } else {
    console.log('Users already present, skipping user seed.');
  }

  const existingBooks = db.getAll(COLLECTIONS.BOOKS);
  if (existingBooks.length === 0) {
    const seededBooks = SEEDED_BOOKS.map((book) => ({
      id: uuidv4(),
      ...book,
    }));

    db.replaceAll(COLLECTIONS.BOOKS, seededBooks);

    console.log(`${SEEDED_BOOKS.length} sample books seeded.`);
  } else {
    console.log('Books already present, skipping book seed.');
  }

  const existingCustomers = db.getAll(COLLECTIONS.CUSTOMERS);
  if (existingCustomers.length === 0) {
    const seededCustomers = SEEDED_CUSTOMERS.map((customer) => ({
      id: uuidv4(),
      ...customer,
      createdAt: new Date().toISOString(),
    }));

    db.replaceAll(COLLECTIONS.CUSTOMERS, seededCustomers);

    console.log(`${SEEDED_CUSTOMERS.length} sample customers seeded.`);
  } else {
    console.log('Customers already present, skipping customer seed.');
  }

  const existingBorrows = db.getAll(COLLECTIONS.BORROWS);
  if (existingBorrows.length === 0) {
    const books = db.getAll(COLLECTIONS.BOOKS);
    const customers = db.getAll(COLLECTIONS.CUSTOMERS);

    if (books.length >= 4 && customers.length >= 4) {
      const sampleBorrows = [
        // Active and still on time.
        buildBorrowRecord({
          customerId: customers[0].id,
          bookId: books[0].id,
          borrowedDaysAgo: 2,
          borrowDurationDays: 14,
        }),
        // Active and overdue.
        buildBorrowRecord({
          customerId: customers[1].id,
          bookId: books[1].id,
          borrowedDaysAgo: 21,
          borrowDurationDays: 14,
        }),
        // Returned on time.
        buildBorrowRecord({
          customerId: customers[2].id,
          bookId: books[2].id,
          borrowedDaysAgo: 10,
          borrowDurationDays: 7,
          returnedDaysAgo: 4,
        }),
        // Returned late.
        buildBorrowRecord({
          customerId: customers[3].id,
          bookId: books[3].id,
          borrowedDaysAgo: 28,
          borrowDurationDays: 10,
          returnedDaysAgo: 8,
        }),
      ];

      db.replaceAll(COLLECTIONS.BORROWS, sampleBorrows);

      const activeBorrows = sampleBorrows.filter((borrow) => borrow.returnedAt == null);
      activeBorrows.forEach((borrow) => {
        const book = db.getById(COLLECTIONS.BOOKS, borrow.bookId);
        if (!book) {
          return;
        }
        const nextAvailable = Math.max(0, Number(book.availableCopies) - 1);
        db.update(COLLECTIONS.BOOKS, book.id, { availableCopies: nextAvailable });
      });

      console.log(`${sampleBorrows.length} sample transactions seeded.`);
    } else {
      console.log('Not enough books/customers available to seed transactions.');
    }
  } else {
    console.log('Transactions already present, skipping transaction seed.');
  }

  console.log('Seeding complete!');
}

module.exports = { seed };

if (require.main === module) {
  seed().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
