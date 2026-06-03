import { MongoClient } from 'mongodb';

const URL = process.env.MONGO_URI;
const DB_NAME = 'secure_todo_app';

let todosCollection = null;

/**
 * Initializes connection to the MongoDB todos collection.
 */
async function initializeTodoStorage(dbInstance) {
    if (!todosCollection) {
        const db = dbInstance || (await new MongoClient(URL).connect()).db(DB_NAME);
        todosCollection = db.collection('todos');
        // Index by id for high-performance updates/deletions and filtering operations
        await todosCollection.createIndex({ id: 1 }, { unique: true });
        await todosCollection.createIndex({ userId: 1 });
        console.log('MongoDB Todos collection repository synchronized.');
    }
    return todosCollection;
}

/**
 * Filters the main task database to only return records belonging to the target user.
 */
async function readUserTodos(userId) {
    return await todosCollection.find({ userId }).project({ _id: 0 }).toArray();
}

/**
 * Appends an isolated task entity to local file state memory tracking.
 */
async function createUserTodo(userId, body) {
    if (!body.title || body.title.trim() === '') {
        throw new Error('Validation Error: The todo task field "title" cannot be blank.');
    }

    const newTodo = {
        id: Date.now() + Math.floor(Math.random() * 1000), // Secure randomized safe numerical ID
        userId: userId, // Structural ownership mapping pointer
        title: body.title.trim(),
        description: body.description ? body.description.trim() : '',
        completed: false,
        createdAt: new Date().toISOString()
    };

    await todosCollection.insertOne(newTodo);
    
    const { _id: _, ...todoData } = newTodo;
    return todoData;
}

/**
 * Updates an isolated task model field mapping, enforcing strong user security ownership checks.
 */
async function updateUserTodo(todoId, userId, body) {
    // 1. Locate the document to evaluate tenant authorization constraints
    const todo = await todosCollection.findOne({ id: todoId });
    if (!todo) return { status: 404, message: 'Resource Error: Target todo item could not be found.' };
    if (todo.userId !== userId) return { status: 403, message: 'Access Forbidden: Authorization ownership mismatch detected.' };

    // 2. Map payload modifications out to update properties dictionaries
    const updates = {};
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.description !== undefined) updates.description = body.description.trim();
    if (body.completed !== undefined) updates.completed = !!body.completed;
    updates.updatedAt = new Date().toISOString();

    await todosCollection.updateOne({ id: todoId }, { $set: updates });
    return { status: 200, data: { id: todoId, ...todo, ...updates, _id: undefined } };
}

/**
 * Removes an isolated task record, enforcing strong user security ownership checks.
 */
async function deleteUserTodo(todoId, userId) {
    const todo = await todosCollection.findOne({ id: todoId });
    if (!todo) return { status: 404, message: 'Resource Error: Target todo item could not be found.' };
    if (todo.userId !== userId) return { status: 403, message: 'Access Forbidden: Authorization ownership mismatch detected.' };

    await todosCollection.deleteOne({ id: todoId });
    return { status: 200, message: `Success: Task element ${todoId} has been purged from system registries.` };
}

export {
    initializeTodoStorage,
    readUserTodos,
    createUserTodo,
    updateUserTodo,
    deleteUserTodo
};