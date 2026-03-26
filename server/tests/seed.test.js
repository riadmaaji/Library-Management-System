'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { afterEach, beforeEach, test } = require('node:test');

const db = require('../src/storage/LocalStorageDB');
const { COLLECTIONS, ROLES } = require('../src/config/constants');

const seedModulePath = require.resolve('../seed');

const COLLECTIONS_UNDER_TEST = [
  COLLECTIONS.USERS,
  COLLECTIONS.BOOKS,
  COLLECTIONS.CUSTOMERS,
];

/** Avoid node-localstorage disk renames (Windows EPERM flakes) during tests. */
function createMemoryStorage(initialData = {}, onSetItem) {
  const data = Object.assign(Object.create(null), initialData);
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
      if (onSetItem) {
        onSetItem(key, String(value));
      }
    },
  };
}

const EXPECTED_SEEDED_BOOK_COUNT = 12;
const EXPECTED_SEEDED_CUSTOMER_COUNT = 10;
const MTL_PHONE_RE = /^(514|438)-\d{3}-\d{4}$/;

const README_PATH = path.join(__dirname, '..', '..', 'README.md');

function snapshotCollections() {
  const snapshot = {};
  for (const collection of COLLECTIONS_UNDER_TEST) {
    snapshot[collection] = db.getAll(collection);
  }
  return snapshot;
}

async function withCapturedLogs(runner) {
  const originalLog = console.log;
  const logMessages = [];
  console.log = (...args) => {
    logMessages.push(args.join(' '));
  };
  try {
    return await runner(logMessages);
  } finally {
    console.log = originalLog;
  }
}

let realStorage;

beforeEach(() => {
  realStorage = db.storage;
  db.storage = createMemoryStorage();
});

afterEach(() => {
  db.storage = realStorage;
});

test('README documents default credentials aligned with seed data', () => {
  const readme = fs.readFileSync(README_PATH, 'utf8');
  const credentialsSectionMatch = readme.match(
    /### Default Credentials\r?\n([\s\S]*?)(?:\r?\n## |\r?\n### |\s*$)/
  );

  assert.ok(
    credentialsSectionMatch,
    'README must include a "### Default Credentials" section'
  );

  const credentialsSection = credentialsSectionMatch[1];
  const credentialsTableMatch = credentialsSection.match(
    /(\|[^\r\n]*\|\r?\n\|[-|\s]+\|\r?\n(?:\|[^\r\n]*\|\r?\n?)*)/
  );

  assert.ok(
    credentialsTableMatch,
    'Default Credentials section must contain a Markdown table'
  );

  const credentialsTable = credentialsTableMatch[1];

  assert.ok(
    credentialsTable.includes('admin@mozna.com'),
    'Default Credentials table must list admin@mozna.com'
  );
  assert.ok(
    credentialsTable.includes('maaji.riad@mozna.com'),
    'Default Credentials table must list maaji.riad@mozna.com'
  );

  assert.match(
    credentialsTable,
    /\|\s*Role\s*\|\s*Email\s*\|\s*Password\s*\|/i,
    'Default credentials must use Role | Email | Password table headers'
  );

  assert.match(
    credentialsTable,
    /\|\s*Admin\s*\|\s*admin@mozna\.com\s*\|\s*password\s*\|/,
    'Admin row must use admin@mozna.com and password'
  );
  assert.match(
    credentialsTable,
    /\|\s*Employee\s*\|\s*maaji\.riad@mozna\.com\s*\|\s*password\s*\|/,
    'Employee row must use maaji.riad@mozna.com and password'
  );

  assert.ok(
    !credentialsTable.includes('mozna@example.com'),
    'Default Credentials table must not document stale mozna@example.com'
  );
  assert.ok(
    !credentialsTable.includes('admin@example.com'),
    'Default Credentials table must not document stale admin@example.com'
  );

  assert.ok(
    !readme.includes('\\```bash'),
    'README must not contain escaped bash fences from INSTRUCTIONS.md'
  );
  assert.ok(
    !readme.includes('\\```'),
    'README must not contain escaped Markdown fences from INSTRUCTIONS.md'
  );
  assert.match(
    readme,
    /```bash\r?\n[\s\S]+?\r?\n```/,
    'README must contain at least one normal bash fenced code block'
  );
  assert.match(
    readme,
    /```\r?\n[\s\S]+?\r?\n```/,
    'README must contain at least one normal fenced code block'
  );
});

test('require("../seed") exports seed without running seeding on import', async () => {
  const beforeImport = snapshotCollections();

  await withCapturedLogs(async (logMessages) => {
    delete require.cache[seedModulePath];
    try {
      const { seed } = require('../seed');

      assert.strictEqual(typeof seed, 'function');
      assert.ok(
        !logMessages.some((message) => message.includes('Seeding database...')),
        'Importing "../seed" should not start seeding'
      );

      assert.deepStrictEqual(
        snapshotCollections(),
        beforeImport,
        'importing "../seed" must not mutate users/books/customers collections'
      );
    } finally {
      delete require.cache[seedModulePath];
    }
  });
});

test('when users collection is empty, seed() creates exactly two expected users', async () => {
  const { seed } = require('../seed');

  db.storage.setItem(COLLECTIONS.USERS, JSON.stringify([]));

  await seed();

  const users = db.getAll(COLLECTIONS.USERS);
  assert.strictEqual(users.length, 2);

  const admin = users.find((u) => u.email === 'admin@mozna.com');
  const employee = users.find((u) => u.email === 'maaji.riad@mozna.com');

  assert.ok(admin, 'admin user missing');
  assert.strictEqual(admin.name, 'Mozna Platforms');
  assert.strictEqual(admin.role, ROLES.ADMIN);

  assert.ok(employee, 'employee user missing');
  assert.strictEqual(employee.name, 'Riad Maaji');
  assert.strictEqual(employee.role, ROLES.EMPLOYEE);

  assert.strictEqual(
    admin.password,
    employee.password,
    'both seeded users should share one password hash per run'
  );
});

test('when books and customers are empty, seed() adds catalog and customers meeting shape rules', async () => {
  const { seed } = require('../seed');

  db.storage.setItem(COLLECTIONS.BOOKS, JSON.stringify([]));
  db.storage.setItem(COLLECTIONS.CUSTOMERS, JSON.stringify([]));

  await seed();

  const books = db.getAll(COLLECTIONS.BOOKS);
  const customers = db.getAll(COLLECTIONS.CUSTOMERS);

  assert.strictEqual(books.length, EXPECTED_SEEDED_BOOK_COUNT);
  assert.strictEqual(customers.length, EXPECTED_SEEDED_CUSTOMER_COUNT);

  for (const c of customers) {
    assert.ok(c.fullName && String(c.fullName).trim() !== '', 'every customer needs fullName');
    assert.ok(c.phone && String(c.phone).trim() !== '', 'every customer needs a non-empty phone');
    assert.ok(
      MTL_PHONE_RE.test(String(c.phone).trim()),
      `invalid phone: ${c.phone}`
    );
  }

  const withEmailAndPhone = customers.filter(
    (c) =>
      c.email &&
      String(c.email).trim() !== '' &&
      c.phone &&
      String(c.phone).trim() !== ''
  );
  assert.ok(
    withEmailAndPhone.length >= 1,
    'expected at least one customer with both email and phone'
  );

  const phoneOnly = customers.filter(
    (c) =>
      (!c.email || String(c.email).trim() === '') &&
      c.phone &&
      String(c.phone).trim() !== ''
  );
  assert.ok(phoneOnly.length >= 1, 'expected at least one phone-only customer');
});

test('when collections are empty, seed() writes expected collections including transactions', async () => {
  const { seed } = require('../seed');
  const writeCounts = Object.create(null);

  db.storage = createMemoryStorage({}, (key) => {
    writeCounts[key] = (writeCounts[key] || 0) + 1;
  });

  await seed();

  const seededBorrows = db.getAll(COLLECTIONS.BORROWS);
  const activeBorrowCount = seededBorrows.filter((borrow) => borrow.returnedAt == null).length;

  assert.strictEqual(
    writeCounts[COLLECTIONS.USERS],
    1,
    'users should be written once during seed'
  );
  assert.strictEqual(
    writeCounts[COLLECTIONS.BOOKS],
    1 + activeBorrowCount,
    'books should be written once initially, then once per active seeded borrow'
  );
  assert.strictEqual(
    writeCounts[COLLECTIONS.CUSTOMERS],
    1,
    'customers should be written once during seed'
  );
  assert.strictEqual(
    writeCounts[COLLECTIONS.BORROWS],
    1,
    'borrows should be written once during seed'
  );
});

test('when users collection already has data, seed() does not add users', async () => {
  const { seed } = require('../seed');

  const existing = [
    {
      id: 'existing-user-1',
      name: 'Existing',
      email: 'existing@example.com',
      password: 'x',
      role: ROLES.EMPLOYEE,
      createdAt: new Date().toISOString(),
    },
  ];
  db.storage.setItem(COLLECTIONS.USERS, JSON.stringify(existing));

  await withCapturedLogs(async (logMessages) => {
    await seed();

    const users = db.getAll(COLLECTIONS.USERS);
    assert.strictEqual(users.length, 1);
    assert.strictEqual(users[0].email, 'existing@example.com');

    assert.ok(
      logMessages.some((m) => m.includes('Users already present, skipping user seed.')),
      'expected user skip log when users collection is non-empty'
    );
  });
});

test('when books and customers already have data, seed() leaves counts unchanged', async () => {
  const { seed } = require('../seed');

  const books = [
    {
      id: 'book-1',
      title: 'Preloaded',
      author: 'Author',
      isbn: '978-0000000000',
      category: 'Fiction',
      totalCopies: 1,
      availableCopies: 1,
    },
  ];
  const customers = [
    {
      id: 'cust-1',
      fullName: 'Preloaded Client',
      phone: '514-111-2222',
      createdAt: new Date().toISOString(),
    },
  ];

  db.storage.setItem(COLLECTIONS.BOOKS, JSON.stringify(books));
  db.storage.setItem(COLLECTIONS.CUSTOMERS, JSON.stringify(customers));

  await withCapturedLogs(async (logMessages) => {
    await seed();

    assert.strictEqual(db.getAll(COLLECTIONS.BOOKS).length, 1);
    assert.strictEqual(db.getAll(COLLECTIONS.CUSTOMERS).length, 1);

    assert.ok(
      logMessages.some((m) => m.includes('Books already present, skipping book seed.')),
      'expected book skip log when books collection is non-empty'
    );
    assert.ok(
      logMessages.some((m) => m.includes('Customers already present, skipping customer seed.')),
      'expected customer skip log when customers collection is non-empty'
    );
  });
});
