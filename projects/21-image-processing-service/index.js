// index.js
import 'dotenv/config';
import { createServer } from 'http';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { registerUser, loginUser, verifySession } from './authService.js';
import { uploadToS3, downloadFromS3 } from './s3Service.js';
import { applyImageTransformations } from './transformService.js';
import { Image } from './models.js';

const PORT = process.env.PORT;
mongoose.connect(process.env.MONGO_URI);

function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); }
            catch { reject(new Error('Invalid JSON stream formatting structural rules.')); }
        });
    });
}

function parseMultipartBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const contentType = req.headers['content-type'];
            const boundaryMatch = contentType.match(/boundary=(.+)$/);
            if (!boundaryMatch) return reject(new Error('Missing form parameters.'));

            const boundary = `--${boundaryMatch[1]}`;
            const parts = [];
            let idx = buffer.indexOf(boundary);
            while (idx !== -1) {
                const nextIdx = buffer.indexOf(boundary, idx + boundary.length);
                if (nextIdx === -1) break;
                parts.push(buffer.subarray(idx + boundary.length, nextIdx));
                idx = nextIdx;
            }

            for (const part of parts) {
                const headEnd = part.indexOf('\r\n\r\n');
                if (headEnd === -1) continue;
                const head = part.subarray(0, headEnd).toString('utf-8');
                const content = part.subarray(headEnd + 4, part.length - 2);
                if (head.includes('filename=')) {
                    return resolve({ buffer: content, mimeType: 'image/jpeg', name: 'upload.jpg' });
                }
            }
            reject(new Error('No valid file segment resolved.'));
        });
    });
}

async function handleRequest(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    const sendJson = (statusCode, payload) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
    };

    // 1. Account Operations Routes
    if (pathname === '/register' && method === 'POST') {
        const body = await parseRequestBody(req);
        const data = await registerUser(body.username, body.password);
        return sendJson(201, data);
    }
    if (pathname === '/login' && method === 'POST') {
        const body = await parseRequestBody(req);
        const data = await loginUser(body.username, body.password);
        return sendJson(200, data);
    }

    // --- Session Verification Boundary ---
    const session = verifySession(req.headers['authorization']);
    if (!session) return sendJson(401, { error: 'Access Denied: Authentication token invalid.' });

    // 2. Upload Image Operation
    if (pathname === '/images' && method === 'POST') {
        const fileData = await parseMultipartBody(req);
        const uniqueId = crypto.randomUUID();
        const s3Key = `raw/${session.id}/${uniqueId}.jpg`;

        const url = await uploadToS3(s3Key, fileData.buffer, fileData.mimeType);
        const record = await Image.create({
            userId: session.id,
            originalName: fileData.name,
            mimeType: fileData.mimeType,
            sizeBytes: fileData.buffer.length,
            originalUrl: url,
            s3Key
        });
        return sendJson(201, record);
    }

    // 3. Paginated Listing Query
    if (pathname === '/images' && method === 'GET') {
        const page = parseInt(parsedUrl.searchParams.get('page'), 10) || 1;
        const limit = parseInt(parsedUrl.searchParams.get('limit'), 10) || 10;
        const skip = (page - 1) * limit;

        const records = await Image.find({ userId: session.id }).skip(skip).limit(limit).sort({ createdAt: -1 });
        const total = await Image.countDocuments({ userId: session.id });

        return sendJson(200, { page, limit, totalPages: Math.ceil(total / limit), total, images: records });
    }

    // 4. Custom Transformation Operations Pipeline
    const transformMatch = pathname.match(/^\/images\/([a-f0-9]{24})\/transform$/);
    if (transformMatch && method === 'POST') {
        const imageId = transformMatch[1];
        const body = await parseRequestBody(req);
        const targetImage = await Image.findOne({ _id: imageId, userId: session.id });

        if (!targetImage) return sendJson(404, { error: 'Target tracking image item missing.' });

        // Check cache using a unique fingerprint hash of the transformation choices
        const hashKey = crypto.createHash('md5').update(JSON.stringify(body.transformations)).digest('hex');
        const cached = targetImage.cachedTransforms.find(t => t.hashKey === hashKey);
        if (cached) return sendJson(200, { message: 'Resolved via cached transformations configuration.', url: cached.transformedUrl });

        // Fallback: Download raw bytes from S3 and process dynamically
        const rawBytes = await downloadFromS3(targetImage.s3Key);
        const { outputBuffer, targetMime } = await applyImageTransformations(rawBytes, body.transformations);

        const transKey = `cache/${session.id}/${hashKey}.${targetMime.split('/')[1]}`;
        const transUrl = await uploadToS3(transKey, outputBuffer, targetMime);

        targetImage.cachedTransforms.push({ hashKey, transformedUrl: transUrl, s3Key: transKey });
        await targetImage.save();

        return sendJson(200, { message: 'Transformation applied successfully.', url: transUrl });
    }

    // Renders the processed image visually inside Postman or a web browser
    const viewTransformMatch = pathname.match(/^\/images\/([a-f0-9]{24})\/transform\/view$/);
    if (viewTransformMatch && method === 'GET') {
        try {
            const imageId = viewTransformMatch[1];
            const targetImage = await Image.findOne({ _id: imageId, userId: session.id });

            if (!targetImage) return sendJson(404, { error: 'Target image record missing.' });

            // Extract dynamic operations from query parameters (e.g., ?width=300&height=300&grayscale=true)
            const transformations = {
                resize: {
                    width: parsedUrl.searchParams.get('width'),
                    height: parsedUrl.searchParams.get('height')
                },
                rotate: parsedUrl.searchParams.get('rotate'),
                format: parsedUrl.searchParams.get('format'),
                filters: {
                    grayscale: parsedUrl.searchParams.get('grayscale') === 'true',
                    sepia: parsedUrl.searchParams.get('sepia') === 'true'
                }
            };

            // Stream raw original file bytes directly from S3 storage
            const rawBytes = await downloadFromS3(targetImage.s3Key);

            // Process the buffer dynamically via Sharp matrix
            const { outputBuffer, targetMime } = await applyImageTransformations(rawBytes, transformations);

            // Flush the binary image stream directly back down the network pipe
            res.writeHead(200, {
                'Content-Type': targetMime,
                'Content-Length': outputBuffer.length,
                'Cache-Control': 'public, max-age=86400' // Optimize browser rendering speed
            });
            return res.end(outputBuffer);

        } catch (err) {
            return sendJson(400, { error: `Visual transformation pipeline failure: ${err.message}` });
        }
    }

    // Standard Cloudinary behavior: Processes image, caches it, and returns the public link
    const urlTransformMatch = pathname.match(/^\/images\/([a-f0-9]{24})\/transform\/url$/);
    if (urlTransformMatch && method === 'POST') {
        try {
            const imageId = urlTransformMatch[1];
            const body = await parseRequestBody(req);
            const targetImage = await Image.findOne({ _id: imageId, userId: session.id });

            if (!targetImage) return sendJson(404, { error: 'Target tracking image item missing.' });

            // Generate an MD5 hash key to fingerprint the transformation choices
            const hashKey = crypto.createHash('md5').update(JSON.stringify(body.transformations)).digest('hex');

            // Check cache to see if this operation has already been run
            const cached = targetImage.cachedTransforms.find(t => t.hashKey === hashKey);
            if (cached) {
                return sendJson(200, { message: 'Resolved via cached transformations configuration.', url: cached.transformedUrl });
            }

            // Processing Fallback: Run pipeline and cache it to S3
            const rawBytes = await downloadFromS3(targetImage.s3Key);
            const { outputBuffer, targetMime } = await applyImageTransformations(rawBytes, body.transformations);

            const transKey = `cache/${session.id}/${hashKey}.${targetMime.split('/')[1]}`;
            const transUrl = await uploadToS3(transKey, outputBuffer, targetMime);

            targetImage.cachedTransforms.push({ hashKey, transformedUrl: transUrl, s3Key: transKey });
            await targetImage.save();

            return sendJson(201, { message: 'Transformation applied and cached successfully.', url: transUrl });
        } catch (err) {
            return sendJson(400, { error: err.message });
        }
    }

    // 5. Binary Image Retrieval Endpoint
    const retrieveMatch = pathname.match(/^\/images\/([a-f0-9]{24})$/);
    if (retrieveMatch && method === 'GET') {
        const targetImage = await Image.findOne({ _id: retrieveMatch[1], userId: session.id });
        if (!targetImage) return sendJson(404, { error: 'Target image not found.' });

        const rawBytes = await downloadFromS3(targetImage.s3Key);
        res.writeHead(200, { 'Content-Type': targetImage.mimeType, 'Content-Length': rawBytes.length });
        return res.end(rawBytes);
    }

    return sendJson(404, { error: 'Target endpoint pattern could not be resolved.' });
}

const server = createServer(async (req, res) => {
    try {
        await handleRequest(req, res);
    }
    catch (err) {
        console.error('💥 Top-Level Systemic Exception Intercepted:', err.message);

        // Enforce a strict fallback JSON response stream since sendJson is out of scope here
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Internal systemic media compilation breakdown event caught.',
            details: err.message
        }));
    }
});

server.listen(PORT, () => console.log(`🚀 Scalable Cloudinary-Clone Engine executing on port: ${PORT}`));