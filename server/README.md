# API Server

TypeScript Express API server for PesoPlan - ready for Postman testing.

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run the Server

```bash
# Development mode (with auto-reload)
npm run api:dev

# Production mode
npm run api:start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check
- **GET** `/api/health` - Check if API is running

### Users
- **GET** `/api/users` - Get all users
- **GET** `/api/users/:id` - Get user by ID
- **POST** `/api/users` - Create a new user
- **PUT** `/api/users/:id` - Update user
- **DELETE** `/api/users/:id` - Delete user

### Income
- **GET** `/api/income` - Get all income records (optional query: `?user_id=1`)
- **GET** `/api/income/:id` - Get income by ID
- **POST** `/api/income` - Create a new income record
- **PUT** `/api/income/:id` - Update income record
- **DELETE** `/api/income/:id` - Delete income record

### Expenses
- **GET** `/api/expenses` - Get all expenses (optional queries: `?user_id=1&category=needs`)
- **GET** `/api/expenses/:id` - Get expense by ID
- **POST** `/api/expenses` - Create a new expense record
- **PUT** `/api/expenses/:id` - Update expense record
- **DELETE** `/api/expenses/:id` - Delete expense record

### Budget Plans
- **GET** `/api/budget-plans` - Get all budget plans (optional queries: `?user_id=1&active=true`)
- **GET** `/api/budget-plans/:id` - Get budget plan by ID
- **POST** `/api/budget-plans` - Create a new budget plan
- **PUT** `/api/budget-plans/:id` - Update budget plan
- **DELETE** `/api/budget-plans/:id` - Delete budget plan

## Postman Examples

### Create Income
```json
POST http://localhost:3001/api/income
Content-Type: application/json

{
  "user_id": "1",
  "name": "Salary",
  "amount": 50000,
  "source": "Employer",
  "date_received": "2024-01-15T00:00:00.000Z"
}
```

### Create Expense
```json
POST http://localhost:3001/api/expenses
Content-Type: application/json

{
  "user_id": "1",
  "name": "Groceries",
  "amount": 5000,
  "category": "needs",
  "subcategory": "food",
  "is_recurring": true,
  "recurring_interval": "monthly",
  "next_due_date": "2024-02-15T00:00:00.000Z"
}
```

### Create Budget Plan
```json
POST http://localhost:3001/api/budget-plans
Content-Type: application/json

{
  "user_id": "1",
  "needs_percentage": 50,
  "wants_percentage": 30,
  "savings_percentage": 20,
  "active": true
}
```

## Notes

- The server uses in-memory storage. Data will be lost on server restart.
- Replace the in-memory storage with a database (e.g., PostgreSQL, MongoDB) for production use.
- All endpoints return JSON responses.
- Error responses include appropriate HTTP status codes.

