import { addExpense, deleteExpense, listExpenses, displaySummary } from './expenseService.js';

/**
 * Distributes operational commands to specialized services based on positional terminal input.
 */
function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        console.error('Error: Command tracking argument execution flag missing.');
        process.exit(1);
    }

    switch (command) {
        case 'add':
            addExpense(args[1], args[2], args[3]);
            break;

        case 'delete':
            deleteExpense(args[1]);
            break;

        case 'list':
            listExpenses();
            break;

        case 'summary':
            displaySummary(args[1]);
            break;

        default:
            console.error(`Error: Unrecognized execution operation argument parameters token: "${command}"`);
            process.exit(1);
    }
}

process.on('uncaughtException', (err) => {
    console.error('System process thread breakdown intercepted:', err.message);
    process.exit(1);
});

main();