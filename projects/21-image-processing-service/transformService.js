// transformService.js
import sharp from 'sharp';

/**
 * Applies dynamic transformation chains to an image buffer configuration.
 */
export async function applyImageTransformations(inputBuffer, options = {}) {
    let pipeline = sharp(inputBuffer);

    // 1. Resize Execution Block
    if (options.resize) {
        const w = parseInt(options.resize.width, 10) || null;
        const h = parseInt(options.resize.height, 10) || null;
        pipeline = pipeline.resize(w, h, { fit: 'cover' });
    }

    // 2. Crop Execution Block
    if (options.crop) {
        const w = parseInt(options.crop.width, 10);
        const h = parseInt(options.crop.height, 10);
        const x = parseInt(options.crop.x, 10) || 0;
        const y = parseInt(options.crop.y, 10) || 0;
        pipeline = pipeline.extract({ width: w, height: h, left: x, top: y });
    }

    // 3. Rotate Execution Block
    if (options.rotate) {
        pipeline = pipeline.rotate(parseInt(options.rotate, 10));
    }

    // 4. Filters Execution Block
    if (options.filters) {
        if (options.filters.grayscale) pipeline = pipeline.grayscale();
        if (options.filters.sepia) {
            pipeline = pipeline.recomb([
                [0.3588, 0.7044, 0.1358],
                [0.2990, 0.5870, 0.1140],
                [0.2392, 0.4696, 0.0912]
            ]);
        }
    }

    // 5. Output Format Conversion
    let targetMime = 'image/jpeg';
    if (options.format) {
        const fmt = options.format.toLowerCase();
        if (fmt === 'png') { pipeline = pipeline.png(); targetMime = 'image/png'; }
        else if (fmt === 'webp') { pipeline = pipeline.webp(); targetMime = 'image/webp'; }
        else { pipeline = pipeline.jpeg({ quality: 90 }); }
    } else {
        pipeline = pipeline.jpeg({ quality: 90 });
    }

    const outputBuffer = await pipeline.toBuffer();
    return { outputBuffer, targetMime };
}