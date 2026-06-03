import { existsSync, writeFileSync, readFileSync } from 'fs';
import {fileURLToPath} from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FILE_PATH = join(__dirname, 'posts.json');

/**
 * Validates that local database state JSON storage documents exist on disk.
 */
function initializeStorage() {
    // TODO: Verify target JSON boundaries file presence. Bootstrap empty array structure if missing.
    if(!existsSync(FILE_PATH)) {
        writeFileSync(FILE_PATH, JSON.stringify([]));
    }
}

/**
 * Accesses and parses article data models records collection tracks out of storage files.
 * @returns {Array} List of blog post elements.
 */
function readPosts() {
    // TODO: Verify safety, read files data streams buffers, parse JSON strings into logical arrays.
    const data = readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(data);
}

/**
 * Overwrites file-based data records with the latest updated context array maps.
 * @param {Array} posts - Updated content collection.
 */
function writePosts(posts) {
    // TODO: Drop stringified data metrics downwards into system persistent storage targets.
    const data = JSON.stringify(posts, null, 2);
    writeFileSync(FILE_PATH, data, 'utf-8');
}

export {
    initializeStorage,
    readPosts,
    writePosts
};