# Library Management System

A full-stack Library Management System built with React, Node.js/Express, and simulated Local Storage persistence.

## Features
- JWT-based authentication with role-based access control
- Book management (CRUD) with search and filtering
- Customer management
- Borrow/Return system with automatic late penalty calculation ($2/day)
- Admin panel for user management
- Responsive, accessible UI

## Tech Stack
- **Frontend**: React (Vite) + React Router
- **Backend**: Node.js + Express
- **Persistence**: node-localstorage (file-based, no database required)
- **Auth**: JWT with bcrypt password hashing

## Getting Started

### Prerequisites
- Node.js >= 18

### Installation
```bash
git clone https://github.com/riadmaaji/Library-Management-System.git
cd Library-Management-System
npm install
npm run install:all
```

### Seed the database
```bash
npm run seed
```
This creates default users and sample data.

### Run the application
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Default Credentials
| Role     | Email                 | Password |
|----------|-----------------------|----------|
| Admin    | admin@mozna.com       | password |
| Employee | maaji.riad@mozna.com  | password |

## API Endpoints

### Authentication
| Method | Endpoint         | Auth | Role | Description              |
|--------|------------------|------|------|--------------------------|
| POST   | /api/auth/login  | No   | All  | Login, returns JWT token |
| GET    | /api/auth/me     | Yes  | All  | Get current user info    |

### Users (Admin only)
| Method | Endpoint          | Auth | Role  | Description     |
|--------|-------------------|------|-------|-----------------|
| GET    | /api/users        | Yes  | Admin | List all users  |
| POST   | /api/users        | Yes  | Admin | Create user     |
| PUT    | /api/users/:id    | Yes  | Admin | Update user     |
| DELETE | /api/users/:id    | Yes  | Admin | Delete user     |

### Books
| Method | Endpoint          | Auth | Role | Description          |
|--------|-------------------|------|------|----------------------|
| GET    | /api/books        | Yes  | All  | List/search books    |
| POST   | /api/books        | Yes  | All  | Create book          |
| PUT    | /api/books/:id    | Yes  | All  | Update book          |
| DELETE | /api/books/:id    | Yes  | All  | Delete book          |

### Customers
| Method | Endpoint              | Auth | Role | Description       |
|--------|-----------------------|------|------|-------------------|
| GET    | /api/customers        | Yes  | All  | List customers    |
| POST   | /api/customers        | Yes  | All  | Create customer   |
| PUT    | /api/customers/:id    | Yes  | All  | Update customer   |

### Borrows
| Method | Endpoint                  | Auth | Role | Description                |
|--------|---------------------------|------|------|----------------------------|
| GET    | /api/borrows              | Yes  | All  | List borrows (filterable)  |
| POST   | /api/borrows              | Yes  | All  | Borrow a book              |
| POST   | /api/borrows/:id/return   | Yes  | All  | Return a book + penalty    |

## How Persistence Works
This project uses `node-localstorage` to simulate browser Local Storage on the server. Data is stored as JSON files in the `server/data/localStorage/` directory. The storage layer (`server/src/storage/LocalStorageDB.js`) provides a collection-based API similar to a database, supporting CRUD operations on four collections: users, books, customers, and borrows.

**Important**: All data operations go through the Express API — the frontend never reads or writes storage directly.

## Project Structure
```
Library-Management-System/
├── client/                # React frontend (Vite)
│   └── src/
│       ├── api/           # Axios instance + service functions
│       ├── components/    # Shared UI components
│       ├── context/       # Auth context provider
│       ├── hooks/         # Custom hooks
│       ├── pages/         # Page components
│       └── utils/         # Helpers and formatters
├── server/                # Express backend
│   └── src/
│       ├── config/        # Environment config and constants
│       ├── controllers/   # Route handlers
│       ├── middleware/     # Auth, error handling
│       ├── routes/        # Route definitions
│       ├── services/      # Business logic
│       ├── storage/       # LocalStorage data access layer
│       └── utils/         # Password, token, validation helpers
└── README.md
```

## Penalty Calculation
Late penalties are calculated server-side when a book is returned:
- If returned after the due date: penalty = (days late) × $2.00
- Penalty is stored on the borrow transaction record
