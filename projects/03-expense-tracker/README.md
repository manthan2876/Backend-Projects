# Expense Tracker

A simple Node.js CLI expense tracker for recording, listing, deleting, and summarizing expenses.

Project URL: https://roadmap.sh/projects/expense-tracker

## Key Features

- Add expenses with description, amount, and category
- Delete expenses by ID
- List all recorded expenses in a table format
- Show total expense summary for all entries or a specific month

## Prerequisites

- Node.js v18+

## Installation

```bash
cd projects/03-expense-tracker
npm install
```

## Usage

Add a new expense:

```bash
node index.js add "Coffee" 4.50 Food
```

Delete an expense:

```bash
node index.js delete 1
```

List all expenses:

```bash
node index.js list
```

Show total expenses:

```bash
node index.js summary
```

Show total expenses for a month:

```bash
node index.js summary 6
```

## Configuration

Expenses are stored locally in `expenses.json` next to the application files.

No environment variables are required.

## Contribution

Submit bug reports or enhancements by creating an issue and opening a pull request with clear details.

## License

No license is currently specified for this project.
