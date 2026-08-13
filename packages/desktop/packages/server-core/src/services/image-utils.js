import { IMAGE_LIMITS } from '@craft-agent/shared/utils';
let imageProcessor;
function toError(error) {
    return error instanceof Error ? error : new Error(String(error));
}
function isImageProcessorUnavailableError(error) {
    const message = toError(error).message.toLowerCase();
    return ((message.includes('cannot find package') || message.includes('cannot find module'))
        && message.includes('sharp'));
}
/**
 * Inspect an uploaded image buffer and distinguish between invalid input and
 * unavailable image-processing support.
 */
export async function inspectImageBuffer(buffer, processor) {
    try {
        const metadata = await processor.getMetadata(buffer);
        if (metadata?.width && metadata?.height) {
            return { status: 'ok', width: metadata.width, height: metadata.height };
        }
    }
    catch (error) {
        if (isImageProcessorUnavailableError(error)) {
            return { status: 'processor_unavailable', error: toError(error) };
        }
    }
    try {
        const normalized = await processor.process(buffer, { format: 'png' });
        const metadata = await processor.getMetadata(normalized);
        if (metadata?.width && metadata?.height) {
            return { status: 'ok', width: metadata.width, height: metadata.height };
        }
        return { status: 'invalid_image' };
    }
    catch (error) {
        if (isImageProcessorUnavailableError(error)) {
            return { status: 'processor_unavailable', error: toError(error) };
        }
        return { status: 'invalid_image', error: toError(error) };
    }
}
export function setImageProcessor(proc) {
    imageProcessor = proc;
}
/**
 * Get image dimensions from a buffer.
 * Returns { width, height } or null if the buffer is not a valid image.
 */
export async function getImageSize(buffer) {
    try {
        return await imageProcessor.getMetadata(buffer);
    }
    catch {
        return null;
    }
}
/**
 * Resize an image buffer to fit within maxSize×maxSize, output as PNG.
 * Returns the resized PNG buffer, or undefined if the input is invalid.
 */
export async function resizeIconBuffer(buffer, targetSize) {
    try {
        return await imageProcessor.process(buffer, {
            resize: { width: targetSize, height: targetSize },
            fit: 'inside',
            format: 'png',
        });
    }
    catch {
        return undefined;
    }
}
/**
 * Resize and/or compress an image buffer to fit within agent attachment limits.
 *
 * Strategy:
 * 1. If dimensions exceed OPTIMAL_EDGE (1568px), resize down
 * 2. Output as PNG (or JPEG if isPhoto)
 * 3. If still over maxSizeBytes, try JPEG at 90 quality
 * 4. If still over, try JPEG at 75 quality
 * 5. If still over, return null (can't fix)
 *
 * @returns Resized image data, or null if image can't be made small enough
 */
export async function resizeImageForAPI(buffer, options) {
    const maxSize = options?.maxSizeBytes ?? IMAGE_LIMITS.MAX_SIZE;
    const isPhoto = options?.isPhoto ?? false;
    const metadata = await imageProcessor.getMetadata(buffer).catch(() => null);
    if (!metadata)
        return null;
    const maxEdge = Math.max(metadata.width, metadata.height);
    // Step 1: Compute target dimensions if resize needed
    let outWidth = metadata.width;
    let outHeight = metadata.height;
    if (maxEdge > IMAGE_LIMITS.OPTIMAL_EDGE) {
        const scale = IMAGE_LIMITS.OPTIMAL_EDGE / maxEdge;
        outWidth = Math.round(metadata.width * scale);
        outHeight = Math.round(metadata.height * scale);
    }
    const needsResize = outWidth !== metadata.width || outHeight !== metadata.height;
    // Step 2: Encode — try preferred format first
    let output;
    let format;
    if (isPhoto) {
        output = await imageProcessor.process(buffer, {
            ...(needsResize && { resize: { width: outWidth, height: outHeight } }),
            format: 'jpeg',
            quality: IMAGE_LIMITS.JPEG_QUALITY_HIGH,
        });
        format = 'jpeg';
    }
    else {
        output = await imageProcessor.process(buffer, {
            ...(needsResize && { resize: { width: outWidth, height: outHeight } }),
            format: 'png',
        });
        format = 'png';
    }
    // Step 3-4: Fallback to JPEG compression if still too large
    if (output.length > maxSize) {
        output = await imageProcessor.process(buffer, {
            resize: { width: outWidth, height: outHeight },
            format: 'jpeg',
            quality: IMAGE_LIMITS.JPEG_QUALITY_HIGH,
        });
        format = 'jpeg';
    }
    if (output.length > maxSize) {
        output = await imageProcessor.process(buffer, {
            resize: { width: outWidth, height: outHeight },
            format: 'jpeg',
            quality: IMAGE_LIMITS.JPEG_QUALITY_FALLBACK,
        });
    }
    // Step 5: Give up
    if (output.length > maxSize)
        return null;
    return { buffer: output, width: outWidth, height: outHeight, format };
}
//# sourceMappingURL=image-utils.js.map