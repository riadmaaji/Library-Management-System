require('dotenv').config();

const { v4: uuidv4 } = require('uuid');

const db = require('./src/storage/LocalStorageDB');
const { hashPassword } = require('./src/utils/password');
const { COLLECTIONS, ROLES } = require('./src/config/constants');

async function seed() {
  console.log('Seeding database...');

  const existingUsers = db.getAll(COLLECTIONS.USERS);
  const adminExists = existingUsers.some((user) => user.role === ROLES.ADMIN);

  if (!adminExists) {
    const hashedPassword = await hashPassword('password');
    const admin = {
      id: uuidv4(),
      name: 'Mozna Platforms',
      email: 'mozna@example.com',
      password: hashedPassword,
      role: ROLES.ADMIN,
      createdAt: new Date().toISOString(),
    };

    db.create(COLLECTIONS.USERS, admin);
    console.log('Admin user created: mozna@p.com / password');
  } else {
    console.log('Admin already exists, skipping.');
  }

  const employeeExists = existingUsers.some((user) => user.role === ROLES.EMPLOYEE);

  if (!employeeExists) {
    const hashedPassword = await hashPassword('password');
    const employee = {
      id: uuidv4(),
      name: 'Riad Maaji',
      email: 'maaji.riad@mozna.com',
      password: hashedPassword,
      role: ROLES.EMPLOYEE,
      createdAt: new Date().toISOString(),
    };

    db.create(COLLECTIONS.USERS, employee);
    console.log('Employee user created: maaji.riad@mozna.com / password');
  }

  const existingBooks = db.getAll(COLLECTIONS.BOOKS);
  if (existingBooks.length === 0) {
    const sampleBooks = [
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
    ];

    sampleBooks.forEach((book) => {
      db.create(COLLECTIONS.BOOKS, { id: uuidv4(), ...book });
    });

    console.log(`${sampleBooks.length} sample books seeded.`);
  }

  const existingCustomers = db.getAll(COLLECTIONS.CUSTOMERS);
  if (existingCustomers.length === 0) {
    const sampleCustomers = [
      { fullName: 'Alice Johnson', email: 'alice@example.com', phone: '555-0101' },
      { fullName: 'Bob Smith', email: 'bob@example.com', phone: '555-0102' },
      { fullName: 'Carol Williams', phone: '555-0103' },
    ];

    sampleCustomers.forEach((customer) => {
      db.create(COLLECTIONS.CUSTOMERS, {
        id: uuidv4(),
        ...customer,
        createdAt: new Date().toISOString(),
      });
    });

    console.log(`${sampleCustomers.length} sample customers seeded.`);
  }

  console.log('Seeding complete!');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
