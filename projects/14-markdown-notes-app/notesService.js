import { existsSync, writeFileSync, readFileSync } from 'fs';
import { marked } from 'marked';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FILE_PATH = join(__dirname, 'notes.json');

/**
 * Initializes local storage array file structures cleanly if missing from disk paths.
 */
function initializeStorage() {
    // Verify target storage boundaries. Seed empty structural arrays if absent.
    if (!existsSync(FILE_PATH)) {
        writeFileSync(FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
}

/**
 * Accesses and reads notes out of file system persistence sheets.
 * @returns {Array} List of saved note components records.
 */
function readNotes() {
    try {
        initializeStorage();
        const fileContent = readFileSync(FILE_PATH, 'utf-8');
        return fileContent ? JSON.parse(fileContent) : [];
    } catch (error) {
        console.error('Error reading structural database file layer:', error.message);
        return [];
    }
}

/**
 * Persists data array states back down onto local data files.
 * @param {Array} notes - Modified array tracking changes.
 */
function writeNotes(notes) {
    try {
        writeFileSync(FILE_PATH, JSON.stringify(notes, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing structural database down onto storage:', error.message);
    }
}

/**
 * Transforms raw markdown markup fields into standard readable HTML structures via library utilities.
 * @param {string} markdownText - Input Markdown syntax string value context parameters.
 * @returns {string} Fully parsed HTML body string block.
 */
function compileMarkdownToHtml(markdownText) {
    // Pass markdown string down to library hooks. Marked handles string compilation out of the box.
    return marked.parse(markdownText || '');
}

export {
    initializeStorage,
    readNotes,
    writeNotes,
    compileMarkdownToHtml
};