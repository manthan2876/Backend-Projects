import { existsSync, writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Recreate __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Target storage path in the executing context directory
const FILE_PATH = join(__dirname, 'expenses.json');
/**
 * Verifies that the storage tracker file is present on disk. 
 * Initializes it to an empty collection array if missing.
 */
function initializeStorage() {
    if (!existsSync(FILE_PATH)) {
        writeFileSync(FILE_PATH, JSON.stringify([]));
    }
}

/**
 * Accesses and reads the persistent storage tracking structure.
 * @returns {Array} List of stored expense records.
 */
function readExpenses() {
    // TODO: Invoke storage checker safety hooks, read files buffer, parse array strings.
    if (!existsSync(FILE_PATH)) {
        return [];
    }
    const data = readFileSync(FILE_PATH, 'utf-8');
    try {
        return JSON.parse(data);
    } catch (error) {
        console.error('Error parsing expenses data:', error.message);
        return [];
    }
}

/**
 * Overwrites the persistent storage track record with the current active array memory footprint.
 * @param {Array} expenses - Modified array collection data mappings.
 */
function writeExpenses(expenses) {
    // TODO: Safely serialize structures down onto physical disk storage targets.
    try {
        writeFileSync(FILE_PATH, JSON.stringify(expenses, null, 2));
    } catch (error) {
        console.error('Error writing expenses data:', error.message);
    }
}

/**
 * Adds an itemized expenditure tracking block record down into local memory states.
 * @param {string} description - Log describing what items the expense represents.
 * @param {string} amountStr - Positional text raw element parsing mapping to numbers.
 * @param {string} category - Structural categorization tag string.
 */
function addExpense(description, amountStr, category = 'General') {
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
        console.error('Error: Amount parameter is not a valid number.');
        return;
    }
    const expenses = readExpenses();
    const newId = expenses.length > 0 ? expenses[expenses.length - 1].id + 1 : 1;
    const newExpense = {
        id: newId,
        date: new Date().toISOString(),
        description,
        amount,
        category
    };
    expenses.push(newExpense);
    writeExpenses(expenses);
    console.log(`Expense added successfully (ID: ${newId})`);
}

/**
 * Removes an explicit single entity out of file state storage using target tracking indicators.
 * @param {string} idString - Positional index primary key.
 */
function deleteExpense(idString) {
    const id = parseInt(idString, 10);
    if (isNaN(id)) {
        console.error('Error: ID parameter is not a valid number.');
        return;
    }
    const expenses = readExpenses();
    const index = expenses.findIndex(expense => expense.id === id);
    if (index === -1) {
        console.error(`Error: No expense found with ID ${id}.`);
        return;
    }
    expenses.splice(index, 1);
    writeExpenses(expenses);
    console.log(`Expense with ID ${id} deleted successfully.`);
}

/**
 * Prints tabular layout mappings charting full historic logs down onto stdout paths.
 */
function listExpenses() {
    const expenses = readExpenses();
    if (expenses.length === 0) {
        console.log('No expenses recorded yet.');
        return;
    }
    console.log('ID | Date | Description | Amount | Category');
    console.log('---|------|-------------|--------|---------');
    expenses.forEach(expense => {
        console.log(`${expense.id} | ${expense.date} | ${expense.description} | ${expense.amount} | ${expense.category}`);
    });
}

/**
 * Computes sum total aggregates across complete datasets or target filtered months.
 * @param {string|null} monthFilter - Optional character indicator matching target numeric months ('01' through '12').
 */
function displaySummary(monthFilter = null) {
    const expenses = readExpenses();
    let filteredExpenses = expenses;

    if (monthFilter) {
        // Ensure single-digit inputs (e.g., '6') are padded to match storage patterns (e.g., '06')
        const formattedMonth = monthFilter.toString().padStart(2, '0');

        filteredExpenses = expenses.filter(expense => {
            const expenseMonth = expense.date.slice(5, 7);
            return expenseMonth === formattedMonth;
        });
        
        // Update the lookup variable name to map against your padded string
        monthFilter = formattedMonth; 
    }

    const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    if (monthFilter) {
        const monthNames = {
            '01': 'January',
            '02': 'February',
            '03': 'March',
            '04': 'April',
            '05': 'May',
            '06': 'June',
            '07': 'July',
            '08': 'August',
            '09': 'September',
            '10': 'October',
            '11': 'November',
            '12': 'December'
        };
        const monthName = monthNames[monthFilter] || `Month ${monthFilter}`;
        console.log(`Total expenses for ${monthName}: $${total.toFixed(2)}`);
    } else {
        console.log(`Total expenses: $${total.toFixed(2)}`);
    }
}


export {
    addExpense,
    deleteExpense,
    listExpenses,
    displaySummary
};