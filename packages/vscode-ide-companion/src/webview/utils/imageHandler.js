/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { logger } from '../../utils/logger.js';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { Storage } from '@qwen-code/qwen-code-core';
import { MAX_IMAGE_SIZE, MAX_TOTAL_IMAGE_SIZE, getImageExtensionForMimeType, escapePath, normalizeImageAttachment, } from '../../utils/imageSupport.js';
// ---------- Clipboard image storage ----------
const CLIPBOARD_DIR_NAME = 'clipboard';
const DEFAULT_MAX_IMAGES = 100;
function getClipboardImageDir() {
    return path.join(Storage.getGlobalTempDir(), CLIPBOARD_DIR_NAME);
}
async function saveImageBufferToClipboardDir(buffer, fileName) {
    const dir = getClipboardImageDir();
    await fsp.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, fileName);
    await fsp.writeFile(filePath, buffer);
    return filePath;
}
async function pruneClipboardImages(maxImages = DEFAULT_MAX_IMAGES) {
    try {
        const dir = getClipboardImageDir();
        const files = await fsp.readdir(dir);
        const imageFiles = [];
        for (const file of files) {
            if (file.startsWith('clipboard-')) {
                const filePath = path.join(dir, file);
                const stats = await fsp.stat(filePath);
                imageFiles.push({ filePath, mtimeMs: stats.mtimeMs });
            }
        }
        if (imageFiles.length > maxImages) {
            imageFiles.sort((a, b) => b.mtimeMs - a.mtimeMs);
            for (const { filePath } of imageFiles.slice(maxImages)) {
                await fsp.unlink(filePath);
            }
        }
    }
    catch {
        // Ignore errors in cleanup — directory may not exist yet
    }
}
// ---------- Image saving & processing ----------
export function appendImageReferences(text, imageReferences) {
    if (imageReferences.length === 0) {
        return text;
    }
    const imageText = imageReferences.join(' ');
    if (!text.trim()) {
        return imageText;
    }
    return `${text}\n\n${imageText}`;
}
export async function saveImageToFile(base64Data, mimeType) {
    try {
        let pureBase64 = base64Data;
        const dataUrlMatch = base64Data.match(/^data:[^;]+;base64,(.+)$/);
        if (dataUrlMatch) {
            pureBase64 = dataUrlMatch[1];
        }
        const buffer = Buffer.from(pureBase64, 'base64');
        const timestamp = Date.now();
        const ext = getImageExtensionForMimeType(mimeType);
        const fileName = `clipboard-${timestamp}-${randomUUID()}${ext}`;
        const filePath = await saveImageBufferToClipboardDir(buffer, fileName);
        await pruneClipboardImages();
        return filePath;
    }
    catch (error) {
        logger.error('[ImageHandler] Failed to save image:', error);
        return null;
    }
}
export async function processImageAttachments(text, attachments) {
    let formattedText = text;
    let displayText = text;
    let savedImageCount = 0;
    let remainingBytes = MAX_TOTAL_IMAGE_SIZE;
    const promptImages = [];
    if (attachments && attachments.length > 0) {
        const imageReferences = [];
        for (const attachment of attachments) {
            const normalizedAttachment = normalizeImageAttachment(attachment, {
                maxBytes: Math.min(MAX_IMAGE_SIZE, remainingBytes),
            });
            if (!normalizedAttachment) {
                logger.warn('[ImageHandler] Rejected invalid image attachment:', attachment.name);
                continue;
            }
            const imagePath = await saveImageToFile(normalizedAttachment.data, normalizedAttachment.type);
            if (imagePath) {
                imageReferences.push(`@${escapePath(imagePath)}`);
                promptImages.push({
                    path: imagePath,
                    name: normalizedAttachment.name,
                    mimeType: normalizedAttachment.type,
                });
                remainingBytes -= normalizedAttachment.size;
                savedImageCount += 1;
            }
            else {
                logger.warn('[ImageHandler] Failed to save image:', attachment.name);
            }
        }
        if (imageReferences.length > 0) {
            formattedText = appendImageReferences(formattedText, imageReferences);
            displayText = appendImageReferences(displayText, imageReferences);
        }
    }
    return { formattedText, displayText, savedImageCount, promptImages };
}
// ---------- ACP prompt builder ----------
export function buildPromptBlocks(text, images = []) {
    const blocks = [];
    if (text || images.length === 0) {
        blocks.push({ type: 'text', text });
    }
    for (const image of images) {
        blocks.push({
            type: 'resource_link',
            name: image.name,
            mimeType: image.mimeType,
            uri: pathToFileURL(toFileUrlPath(image.path)).href,
        });
    }
    return blocks;
}
function toFileUrlPath(imagePath) {
    if (process.platform !== 'win32' && /^[a-zA-Z]:[\\/]/.test(imagePath)) {
        return `/${imagePath.replace(/\\/g, '/')}`;
    }
    return imagePath;
}
// ---------- Image path resolution ----------
export function resolveImagePathsForWebview({ paths, workspaceRoots, globalTempDir, existsSync, toWebviewUri, }) {
    const allowedRoots = [...workspaceRoots, globalTempDir].filter(Boolean);
    const root = workspaceRoots[0];
    return paths.map((imagePath) => {
        if (!imagePath || typeof imagePath !== 'string') {
            return { path: imagePath, src: null };
        }
        const resolvedPath = path.isAbsolute(imagePath)
            ? path.normalize(imagePath)
            : root
                ? path.normalize(path.resolve(root, imagePath))
                : null;
        if (!resolvedPath) {
            return { path: imagePath, src: null };
        }
        const isAllowed = allowedRoots.some((allowedRoot) => {
            const normalizedRoot = path.normalize(allowedRoot);
            return (resolvedPath === normalizedRoot ||
                resolvedPath.startsWith(normalizedRoot + path.sep));
        });
        if (!isAllowed || !existsSync(resolvedPath)) {
            return { path: imagePath, src: null };
        }
        return { path: imagePath, src: toWebviewUri(resolvedPath) };
    });
}
export function createImagePathResolver({ workspaceRoots, toWebviewUri, }) {
    return function resolveImagePaths(paths) {
        return resolveImagePathsForWebview({
            paths,
            workspaceRoots,
            globalTempDir: Storage.getGlobalTempDir(),
            existsSync: fs.existsSync,
            toWebviewUri,
        });
    };
}
//# sourceMappingURL=imageHandler.js.map