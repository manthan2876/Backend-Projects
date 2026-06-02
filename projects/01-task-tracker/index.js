import { addTask, updateTask, deleteTask, updateTaskStatus, listTasks } from './taskService.js';

/**
 * Orchestrates CLI console argument array captures via systematic processing delegation patterns.
 */
function main() {
    // Extract positioning vector elements from process parameters standard arguments pipeline
    const args = process.argv.slice(2);
    const command = args[0];

    // Gracefully handle edge cases where execution occurs without operational command definitions
    if (!command) {
        console.error('Error: Operational instruction command missing argument parameters.');
        console.log('Usage: task-cli <command> [arguments]');
        process.exit(1);
    }

    // Direct instructions matrix map towards functional routing blocks
    switch (command) {
        case 'add':
            // TODO: Ensure args[1] presents a description value string before handling execution steps.
            addTask(args[1]);
            break;

        case 'update':
            // TODO: Extract ID string key value tracking identifiers and modified summary argument sequences.
            updateTask(args[1], args[2]);
            break;

        case 'delete':
            // TODO: Track ID mapping parameter index requirements cleanly.
            deleteTask(args[1]);
            break;

        case 'mark-in-progress':
            // TODO: Route status patch operations context parameters down to services.
            updateTaskStatus(args[1], 'in-progress');
            break;

        case 'mark-done':
            // TODO: Handle state updates payload transformation step flows.
            updateTaskStatus(args[1], 'done');
            break;

        case 'list':
            // TODO: Evaluate potential optional extension filtering criteria arguments (todo/in-progress/done).
            listTasks(args[1]);
            break;

        default:
            console.error(`Error: Unknown syntax instruction variant command parameter sequence: "${command}"`);
            process.exit(1);
    }
}

// Global process exception catching context handler overrides
process.on('uncaughtException', (err) => {
    console.error('System runtime failure event caught gracefully:', err.message);
    process.exit(1);
});

// Fire up program context execution loop orchestration channels
main();