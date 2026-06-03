import { createServer } from 'http';
import { parse } from 'querystring';
import { initializeStorage, readNotes, writeNotes, compileMarkdownToHtml } from './notesService.js';

const PORT = 3000;

/**
 * Global interface markup layout frame wrapper providing styles and semantic boundaries uniformly.
 * @param {string} title - Page header meta title.
 * @param {string} contentHtml - Unique content layout block strings injected to body views.
 */
function renderBaseView(title, contentHtml) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>${title} - Markdown Notes Suite</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; line-height: 1.6; color: #24292e; max-width: 800px; margin: 40px auto; padding: 0 20px; background: #fafbfc; }
            header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e1e4e8; padding-bottom: 16px; margin-bottom: 32px; }
            header h2 a { text-decoration: none; color: #24292e; }
            header nav a { margin-left: 16px; text-decoration: none; color: #0366d6; font-weight: 500; }
            .note-card { background: #fff; border: 1px solid #e1e4e8; border-radius: 6px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .note-card h3 { margin-top: 0; margin-bottom: 8px; }
            .note-card h3 a { text-decoration: none; color: #0366d6; }
            .note-card h3 a:hover { text-decoration: underline; }
            .note-meta { color: #586069; font-size: 0.85em; margin-bottom: 8px; }
            .form-group { margin-bottom: 20px; }
            label { display: block; font-weight: 600; margin-bottom: 8px; }
            input[type="text"], textarea { width: 100%; border: 1px solid #e1e4e8; border-radius: 6px; padding: 8px; box-sizing: border-box; font-size: 14px; }
            textarea { font-family: monospace; resize: vertical; min-height: 200px; }
            button { background-color: #2ea44f; color: #fff; border: 1px solid rgba(27,31,35,.15); border-radius: 6px; padding: 6px 16px; font-weight: 600; cursor: pointer; }
            button:hover { background-color: #2c974b; }
            .markdown-body { background: #fff; border: 1px solid #e1e4e8; border-radius: 6px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .markdown-body h1, .markdown-body h2 { border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; margin-top: 24px; margin-bottom: 16px; }
            .markdown-body code { background-color: rgba(27,31,35,.05); border-radius: 3px; padding: .2em .4em; font-family: monospace; font-size: 85%; }
            .markdown-body pre { background-color: #f6f8fa; border-radius: 6px; padding: 16px; overflow: auto; }
            .markdown-body pre code { background-color: transparent; padding: 0; }
        </style>
    </head>
    <body>
        <header>
            <h2><a href="/">Markdown Note-taking Hub</a></h2>
            <nav><a href="/">Dashboard Home</a><a href="/create">Write New Note</a></nav>
        </header>
        <main>${contentHtml}</main>
    </body>
    </html>
    `;
}

/**
 * Intercepts connection requests and routes paths down to template rendering generators or post stream pipes.
 */
async function handleRequest(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    const sendHtml = (statusCode, payloadView) => {
        res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(payloadView);
    };

    const noteViewMatch = pathname.match(/^\/notes\/(\d+)$/);

    // --- Route 1: Home Dashboard Grid Feed ---
    if (pathname === '/' && method === 'GET') {
        const notes = readNotes();
        
        let dashboardHtml = '<h2>Saved Notes Repository Ledger</h2>';
        
        if (notes.length === 0) {
            dashboardHtml += `<p>Your repository is empty. Click <a href="/create">Write New Note</a> to draft your first markdown entry!</p>`;
        } else {
            // Sort notes to show the newest entries at the very top
            const sortedNotes = [...notes].sort((a, b) => b.id - a.id);
            sortedNotes.forEach(note => {
                // Generate a brief excerpt text for the body preview line
                const excerpt = note.content.length > 150 ? note.content.substring(0, 150) + '...' : note.content;
                dashboardHtml += `
                    <div class="note-card">
                        <h3><a href="/notes/${note.id}">${note.title}</a></h3>
                        <div class="note-meta">Created on: ${note.createdAt}</div>
                        <p style="color: #6a737d; font-size: 0.95em; white-space: pre-wrap;">${excerpt}</p>
                    </div>
                `;
            });
        }
        
        return sendHtml(200, renderBaseView('Notes Matrix', dashboardHtml));
    }

    // --- Route 2: Single HTML Note Viewer (Markdown Render View) ---
    else if (noteViewMatch && method === 'GET') {
        const noteId = parseInt(noteViewMatch[1], 10);
        const notes = readNotes();
        
        // Find specific item by id
        const note = notes.find(n => n.id === noteId);
        
        // Return 404 text templates wrap frames if missing
        if (!note) {
            return sendHtml(404, renderBaseView('Note Not Found', '<h2>Error: The requested note entry does not exist.</h2><p><a href="/">&larr; Back to Dashboard</a></p>'));
        }

        // Pass note.content text to compileMarkdownToHtml utility and output structure within a '.markdown-body' container
        const compiledMarkdown = compileMarkdownToHtml(note.content);
        
        const noteViewHtml = `
            <div style="margin-bottom: 20px;">
                <a href="/">&larr; Back to Dashboard Home</a>
            </div>
            <article class="markdown-body">
                <small style="color: #586069;">Published: ${note.createdAt}</small>
                <h1 style="margin-top: 5px; border-bottom: none; padding-bottom: 0;">${note.title}</h1>
                <hr style="border: 0; border-top: 1px solid #e1e4e8; margin: 20px 0;" />
                <div>${compiledMarkdown}</div>
            </article>
        `;
        return sendHtml(200, renderBaseView(note.title, noteViewHtml));
    }

    // --- Route 3: Write Markdown Content Entry Form Layout ---
    else if (pathname === '/create' && method === 'GET') {
        const createFormHtml = `
            <h2>Draft New Markdown Track</h2>
            <form method="POST" action="/create">
                <div class="form-group">
                    <label>Title Field Heading:</label>
                    <input type="text" name="title" placeholder="Enter notes reference category context" required />
                </div>
                <div class="form-group">
                    <label>Markdown Code Payload Editor:</label>
                    <textarea name="content" placeholder="# Heading 1\\nUse **bold** text or \`code blocks\` safely..." required></textarea>
                </div>
                <button type="submit">Save Markdown Entry</button>
            </form>
        `;
        return sendHtml(200, renderBaseView('Drafting Studio Workspace', createFormHtml));
    }

    // --- Route 4: Action Endpoint - Intercept Post Form Stream Payload ---
    else if (pathname === '/create' && method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const formData = parse(body);
            const title = formData.title ? formData.title.trim() : '';
            const content = formData.content ? formData.content.trim() : '';

            if (title && content) {
                const notes = readNotes();
                
                // Setup unique incremental identity counters mapping fields
                const newNote = {
                    id: Date.now(),
                    title: title,
                    content: content,
                    createdAt: new Date().toLocaleString()
                };

                notes.push(newNote);
                writeNotes(notes);
            }

            // Issue a 302 redirect back to home dashboard list view
            res.writeHead(302, { 'Location': '/' });
            return res.end();
        });
        return;
    }

    // Mismatch routing path fallback layer configuration
    return sendHtml(404, renderBaseView('404 Node Error', '<h2>Error: Selected notes resource pathway target cannot be located.</h2><p><a href="/">Return to Home Dashboard Feed</a></p>'));
}

/**
 * Initializes application web system native server listeners.
 */
function main() {
    initializeStorage();

    const server = createServer(async (req, res) => {
        try {
            await handleRequest(req, res);
        } catch (err) {
            console.error('System pipeline parsing error caught:', err.message);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('System request parsing framework boundary error event caught.');
        }
    });

    server.listen(PORT, () => {
        console.log(`Markdown Note-taking App Server running and listening on port: ${PORT}`);
    });
}

main();