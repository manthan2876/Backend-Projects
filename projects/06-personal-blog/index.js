import { createServer } from 'http';
import { parse } from 'querystring';
import { initializeStorage, readPosts, writePosts } from './blogService.js';

const PORT = 3000;

/**
 * Standard base HTML framing framework layout that maps out global design themes.
 * @param {string} title - Page metadata header designation element.
 * @param {string} contentHtml - Injected body markup contents representing active workspace views.
 * @returns {string} Fully integrated web page markup response string block.
 */
function renderLayout(title, contentHtml) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>${title} - My Personal Blog Suite</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; background: #fff; }
            header { border-bottom: 2px solid #eaeaea; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            header a { text-decoration: none; color: #0066cc; font-weight: bold; margin-left: 15px; }
            .post-preview { margin-bottom: 40px; border-bottom: 1px solid #f0f0f0; padding-bottom: 20px; }
            .post-title { margin-bottom: 5px; }
            .post-title a { text-decoration: none; color: #111; }
            .post-title a:hover { color: #0066cc; }
            .post-meta { color: #777; font-size: 0.9em; margin-bottom: 15px; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input[type="text"], textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
            button { background: #0066cc; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; }
            .btn-danger { background: #cc0000; }
            .admin-table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 40px; }
            .admin-table th, .admin-table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            .admin-table th { background: #f9f9f9; }
        </style>
    </head>
    <body>
        <header>
            <h1><a href="/">Personal Tech Blog Workspace</a></h1>
            <nav><a href="/">Home Feed</a><a href="/admin">Admin Control Dashboard</a></nav>
        </header>
        <main>${contentHtml}</main>
    </body>
    </html>
    `;
}

/**
 * Handles incoming connection requests, evaluating path criteria against dynamic routing rules.
 */
async function handleServerConnection(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    const sendHtmlResponse = (statusCode, htmlContent) => {
        res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlContent);
    };

    // Instantiate regex evaluation loops targeting dynamic item locations paths
    const postViewMatch = pathname.match(/^\/posts\/(\d+)$/);
    const postDeleteMatch = pathname.match(/^\/admin\/delete\/(\d+)$/);

    // --- Route 1: Home View Article Feed ---
    if (pathname === '/' && method === 'GET') {
        const posts = readPosts() || [];
        
        let feedHtml = '<h2>Recent Published Engineering Log Entries</h2>';
        if (posts.length === 0) {
            feedHtml += '<p>No blog posts published yet. Head over to the Admin Dashboard to write one!</p>';
        } else {
            // Sort posts by date or ID descending so newest appear first
            const sortedPosts = [...posts].sort((a, b) => b.id - a.id);
            sortedPosts.forEach(post => {
                feedHtml += `
                    <article class="post-preview">
                        <h3 class="post-title"><a href="/posts/${post.id}">${post.title}</a></h3>
                        <div class="post-meta">Published on: ${post.createdAt || new Date(post.id).toLocaleDateString()}</div>
                        <p>${post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content}</p>
                        <a href="/posts/${post.id}">Read Full Log &rarr;</a>
                    </article>
                `;
            });
        }
        
        return sendHtmlResponse(200, renderLayout('Home Logs Feed', feedHtml));
    }

    // --- Route 2: Single Post Article Deep-Dive View ---
    else if (postViewMatch && method === 'GET') {
        const postId = parseInt(postViewMatch[1], 10);
        const posts = readPosts() || [];
        
        // Locate targeted post record matching explicit structural verification id markers.
        const post = posts.find(p => p.id === postId);
        
        if (!post) {
            return sendHtmlResponse(404, renderLayout('Post Not Found', '<h2>Error: The requested blog post entry could not be found.</h2><a href="/">&larr; Back to Home Feed</a>'));
        }

        const postDetailHtml = `
            <article>
                <h2>${post.title}</h2>
                <div class="post-meta">Published on: ${post.createdAt || new Date(post.id).toLocaleDateString()}</div>
                <div style="white-space: pre-wrap;">${post.content}</div>
            </article>
            <p style="margin-top: 40px;"><a href="/">&larr; Back to Home Feed</a></p>
        `;
        return sendHtmlResponse(200, renderLayout(post.title, postDetailHtml));
    }

    // --- Route 3: Admin Configuration Center Dashboard ---
    else if (pathname === '/admin' && method === 'GET') {
        const posts = readPosts() || [];
        
        let tableRows = '';
        if (posts.length === 0) {
            tableRows = '<tr><td colspan="3">No blog items available. create one below!</td></tr>';
        } else {
            posts.forEach(post => {
                tableRows += `
                    <tr>
                        <td><strong>${post.id}</strong></td>
                        <td><a href="/posts/${post.id}" target="_blank">${post.title}</a></td>
                        <td>
                            <form action="/admin/delete/${post.id}" method="POST" onsubmit="return confirm('Are you sure you want to delete this log entry?');" style="margin:0;">
                                <button type="submit" class="btn-danger">Delete</button>
                            </form>
                        </td>
                    </tr>
                `;
            });
        }

        const adminViewHtml = `
            <h2>Backoffice System Admin Panel Dashboard</h2>
            <p>Manage existing items or draft new markdown entries from text areas.</p>
            
            <h3>Existing Posts</h3>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th style="width: 10%">ID</th>
                        <th style="width: 75%">Title</th>
                        <th style="width: 15%">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>

            <h3>Draft New Log Entry</h3>
            <form action="/admin/create" method="POST">
                <div class="form-group">
                    <label Kak for="title">Post Title:</label>
                    <input type="text" id="title" name="title" required placeholder="e.g., Optimizing Node.js Native Streams">
                </div>
                <div class="form-group">
                    <label for="content">Markdown / Article Body Content:</label>
                    <textarea id="content" name="content" rows="10" required placeholder="Write your log context records here..."></textarea>
                </div>
                <button type="submit">Publish Log Entry</button>
            </form>
        `;
        return sendHtmlResponse(200, renderLayout('Admin Platform Console', adminViewHtml));
    }

    // --- Route 4: Action Endpoint - Create Post Entry Event ---
    else if (pathname === '/admin/create' && method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const formData = parse(body);
            const title = formData.title ? formData.title.trim() : '';
            const content = formData.content ? formData.content.trim() : '';

            if (title && content) {
                const posts = readPosts() || [];
                
                // Assemble object tracking definitions schemas mapping properties
                const newPost = {
                    id: Date.now(), // Unique numeric identifier
                    title: title,
                    content: content,
                    createdAt: new Date().toLocaleString()
                };
                
                posts.push(newPost);
                writePosts(posts);
            }

            // Rewrite and redirect back to dashboard via 302 headers status.
            res.writeHead(302, { 'Location': '/admin' });
            return res.end();
        });
        return;
    }

    // --- Route 5: Action Endpoint - Exterminate Post Tracking Lifecycle Event ---
    else if (postDeleteMatch && method === 'POST') {
        const postId = parseInt(postDeleteMatch[1], 10);
        const posts = readPosts() || [];
        
        // Filter out matching numerical target keys out of persistent array datasets structure representations
        const filteredPosts = posts.filter(post => post.id !== postId);
        
        // Re-write configurations tracking data blocks safely down onto persistence files
        writePosts(filteredPosts);

        res.writeHead(302, { 'Location': '/admin' });
        return res.end();
    }

    // Catch-all fallback boundary interceptor rule path
    return sendHtmlResponse(404, renderLayout('404 Path Mismatch', '<h2>Error: Selected resource node target cannot be found.</h2><p><a href="/">Return to safety feed</a></p>'));
}

/**
 * Boots the application native HTTP connection channels framework.
 */
function main() {
    initializeStorage();

    const server = createServer(async (req, res) => {
        try {
            await handleServerConnection(req, res);
        } catch (err) {
            console.error('System pipeline parsing error caught:', err.message);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('System request compilation engine exception caught safely.');
        }
    });

    server.listen(PORT, () => {
        console.log(`Server-Rendered Personal Blog platform running and listening on port: ${PORT}`);
    });
}

main();