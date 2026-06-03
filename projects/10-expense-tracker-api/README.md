# Expense Tracker API

A simple expense tracking REST API built with Node.js and MongoDB.

## Overview

This project exposes expense management endpoints for creating, retrieving, and deleting expense records. It supports category filtering and monthly expense summaries.

## Features

- `GET /expenses` - list all expenses
- `GET /expenses?category=<category>` - filter expenses by category
- `GET /expenses/summary` - get total expenses across all records
- `GET /expenses/summary?month=<MM>` - get total expenses for a specific month
- `POST /expenses` - create a new expense record
- `DELETE /expenses/:id` - delete an expense

## Requirements

- Node.js 16 or later
- Local MongoDB instance running on `mongodb://127.0.0.1:27017`

## Install

From the `projects/10-expense-tracker-api` directory:

```bash
npm install
```

## Configuration

Create a `.env` file with the following value:

```env
MONGO_URI=mongodb://127.0.0.1:27017
```

## Run

```bash
npm start
```

The API listens on:

```text
http://localhost:3000
```

## Example Requests

Create an expense:

```bash
curl -X POST http://localhost:3000/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Groceries","amount":45.50,"category":"Food"}'
```

Get all expenses:

```bash
curl http://localhost:3000/expenses
```

Filter by category:

```bash
curl "http://localhost:3000/expenses?category=Food"
```

Get expense summary:

```bash
curl http://localhost:3000/expenses/summary
```

Get summary for a specific month (e.g., June):

```bash
curl "http://localhost:3000/expenses/summary?month=06"
```

Delete an expense:

```bash
curl -X DELETE http://localhost:3000/expenses/1234567890
```

## Project URL

- https://roadmap.sh/projects/expense-tracker-api
