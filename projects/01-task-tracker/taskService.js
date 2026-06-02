import { existsSync, writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Recreate __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Target storage path in the executing context directory
const FILE_PATH = join(__dirname, 'tasks.json');

/**
 * Ensures the target storage JSON file safely exists.
 * If not present, bootstraps it with an initialized structural collection format.
 */
function initializeStorage() {
    // TODO: Verify file existence. If absent, seed structural default array block inside a try/catch.
    if(!existsSync(FILE_PATH)) {
        try{
            writeFileSync(FILE_PATH, JSON.stringify([]), 'utf-8');
            console.log('Storage initialized successfully at:', FILE_PATH);
        } catch (err) {
            console.error('Error initializing storage file:', err.message);
            process.exit(1);
        }
    }
}

/**
 * Reads tasks from the local file system.
 * @returns {Array} Collection of current task elements.
 */
function readTasks() {
    // TODO: Initialize storage safety check, read raw buffer data, map data cleanly to object arrays.
    try{
        const data = readFileSync(FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading tasks file:', err.message);
        process.exit(1);
    }
}

/**
 * Atomically writes a structural collection of tasks directly down onto persistence tracking.
 * @param {Array} tasks - The updated collection array of modified tasks.
 */
function writeTasks(tasks) {
    // TODO: Stringify tracking structural data safely, execute write stream or atomic file dump.
    try{
        writeFileSync(FILE_PATH, JSON.stringify(tasks, null, 2), 'utf-8');
        console.log('Tasks updated successfully.');
    } catch (err) {
        console.error('Error writing tasks file:', err.message);
        process.exit(1);
    }
}

/**
 * Registers an un-aliased new operational task item state.
 * @param {string} description - Summary text representing the task workload requirements.
 */
function addTask(description) {
    // TODO: Enforce input string confirmation. Read dataset, assemble object schema mapping properties.
    // TODO: Save data collection structure. Log output template string: "Task added successfully (ID: x)".
    if(!description||typeof description!=='string'){
        console.error("Error: Task description required, Please provide valid input...");
        return;
    }
    const tasks = readTasks();
    const newTask = {
        id: Date.now().toString(), // Simple unique ID based on timestamp
        description: description,
        status: 'todo',
    }
    tasks.push(newTask);
    writeTasks(tasks);
    console.log(`Task added successfully (ID: ${newTask.id})`);
}

/**
 * Modifies an existing task description mutation event.
 * @param {string} idString - The targeted ID structural component argument parameter.
 * @param {string} newDescription - Clarified modifications payload.
 */
function updateTask(idString, newDescription) {
    // TODO: Validate parsing of numerical primary lookup identifier. Retrieve tracking block arrays.
    // TODO: Perform target indexing. Handle matching record modifications, patch timestamps.
    if(!idString || !newDescription || typeof newDescription !== 'string') {
        console.error("Error: Both task ID and new description are required, Please provide valid input...");
        return;
    } 
    const tasks = readTasks();
    const taskIndex = tasks.findIndex(task => task.id === idString);
    if(taskIndex === -1) {
        console.error(`Error: No task found with ID: ${idString}`);
        return;
    }
    tasks[taskIndex].description = newDescription;
    writeTasks(tasks);
    console.log(`Task with ID: ${idString} updated successfully.`);
}

/**
 * Exterminates a targeted record structure item tracking trace mapping.
 * @param {string} idString - Primary unique verification trace ID code.
 */
function deleteTask(idString) {
    // TODO: Parse ID. Retrieve object layer structures. Filter indices collection matrix.
    // TODO: Write state traces array modification downward.
    if(!idString) {
        console.error("Error: Task ID is required for deletion, Please provide valid input...");
        return;
    }
    const tasks = readTasks();
    const filteredTasks = tasks.filter(task => task.id !== idString);
    if(filteredTasks.length === tasks.length) {
        console.error(`Error: No task found with ID: ${idString}`);
        return;
    }
    writeTasks(filteredTasks);
    console.log(`Task with ID: ${idString} deleted successfully.`);
}

/**
 * Patches tracking lifecycle enum status fields safely.
 * @param {string} idString - Targeted ID value trace index.
 * @param {string} status - New target runtime state matching enum expectations ('todo', 'in-progress', 'done').
 */
function updateTaskStatus(idString, status) {
    // TODO: Fetch existing tasks array mapping data structure representation models.
    // TODO: Locate targets, modify mapping references safely, alter updatedAt metrics, persist update state.
    if(!idString || !status) {
        console.error("Error: Both task ID and new status are required, Please provide valid input...");
        return;
    }
    const validStatuses = ['todo', 'in-progress', 'done'];
    if(!validStatuses.includes(status)) {
        console.error(`Error: Invalid status value. Valid options are: ${validStatuses.join(', ')}`);
        return;
    }
    const tasks = readTasks();
    const taskIndex = tasks.findIndex(task => task.id === idString);
    if(taskIndex === -1) {
        console.error(`Error: No task found with ID: ${idString}`);
        return;
    }
    tasks[taskIndex].status = status;
    writeTasks(tasks);
    console.log(`Task with ID: ${idString} status updated to "${status}" successfully.`);
}

/**
 * Filters and prints tabular format lists tracking items to stdout console.
 * @param {string|null} filterStatus - Null options, or target status string values to filter target lists.
 */
function listTasks(filterStatus = null) {
    // TODO: Extract tasks array collection tracking datasets records safely.
    // TODO: Evaluate filter variables against known internal tracking options.
    // TODO: Map layout arrays out elegantly via formatting prints or system string streams.
    const tasks = readTasks();
    let filteredTasks = tasks;
    if (filterStatus) {
        filteredTasks = tasks.filter(task => task.status === filterStatus);
    }
    // TODO: Implement tabular format printing logic here.
    console.table(filteredTasks);
}

export {
    initializeStorage,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    listTasks
};