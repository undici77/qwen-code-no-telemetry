/**
 * Long-polling loop: getUpdates -> callback.
 * Platform-agnostic: the onMessage callback handles delivery.
 */
import { getUpdates } from './api.js';
import { MessageType, MessageItemType } from './types.js';
import { getStateDir } from './accounts.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
/** In-memory context token cache: userId -> contextToken */
const contextTokens = new Map();
export function getContextToken(userId) {
  return contextTokens.get(userId);
}
function cursorPath() {
  return join(getStateDir(), 'cursor.txt');
}
function loadCursor() {
  const p = cursorPath();
  if (existsSync(p)) return readFileSync(p, 'utf-8').trim();
  return '';
}
function saveCursor(cursor) {
  writeFileSync(cursorPath(), cursor, 'utf-8');
}
export async function startPollLoop(params) {
  const { baseUrl, token, onMessage, abortSignal } = params;
  let cursor = loadCursor();
  let consecutiveErrors = 0;
  let pollTimeoutMs = 40000;
  process.stderr.write('[weixin] Starting message poll loop...\n');
  while (!abortSignal.aborted) {
    try {
      const resp = await getUpdates(
        baseUrl,
        token,
        cursor,
        pollTimeoutMs,
        abortSignal,
      );
      if (resp.errcode === -14) {
        process.stderr.write(
          '[weixin] Session expired (errcode -14). Pausing 30s...\n',
        );
        await new Promise((r) => setTimeout(r, 30000));
        continue;
      }
      if (resp.ret !== 0 && resp.ret !== undefined) {
        throw new Error(
          `getUpdates error: ret=${resp.ret} errcode=${resp.errcode} ${resp.errmsg}`,
        );
      }
      consecutiveErrors = 0;
      // Respect server-suggested poll timeout
      if (resp.longpolling_timeout_ms && resp.longpolling_timeout_ms > 0) {
        pollTimeoutMs = resp.longpolling_timeout_ms + 5000; // add buffer for network
      }
      if (resp.msgs && resp.msgs.length > 0) {
        for (const msg of resp.msgs) {
          await processMessage(msg, onMessage);
        }
      }
      // Persist cursor after messages are processed to avoid losing messages on crash
      if (resp.get_updates_buf) {
        cursor = resp.get_updates_buf;
        saveCursor(cursor);
      }
    } catch (err) {
      if (abortSignal.aborted) break;
      consecutiveErrors++;
      process.stderr.write(
        `[weixin] Poll error (${consecutiveErrors}): ${err instanceof Error ? err.message : err}\n`,
      );
      if (consecutiveErrors >= 3) {
        process.stderr.write(
          '[weixin] Too many consecutive errors, backing off 30s...\n',
        );
        await new Promise((r) => setTimeout(r, 30000));
        consecutiveErrors = 0;
      } else {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
  process.stderr.write('[weixin] Poll loop stopped.\n');
}
async function processMessage(msg, onMessage) {
  if (msg.message_type !== MessageType.USER) return;
  const fromUserId = msg.from_user_id;
  if (!fromUserId) return;
  // Cache context token (required for replies)
  if (msg.context_token) {
    contextTokens.set(fromUserId, msg.context_token);
  }
  // Extract text, image, file CDN references, and referenced message
  let textContent = '';
  let image;
  let file;
  let refText;
  if (msg.item_list) {
    for (const item of msg.item_list) {
      if (item.type === MessageItemType.TEXT && item.text_item?.text) {
        textContent += (textContent ? '\n' : '') + item.text_item.text;
      }
      // Extract referenced message text
      if (item.ref_msg) {
        const refItem = item.ref_msg.message_item;
        if (refItem?.text_item?.text) {
          refText = refItem.text_item.text;
        } else if (item.ref_msg.title) {
          refText = item.ref_msg.title;
        }
      }
      if (item.type === MessageItemType.IMAGE && item.image_item) {
        const media = item.image_item.media;
        if (media?.encrypt_query_param && media.aes_key) {
          image = {
            encryptQueryParam: media.encrypt_query_param,
            aesKey: media.aes_key,
          };
        }
      } else if (item.type === MessageItemType.FILE && item.file_item) {
        const media = item.file_item.media;
        if (media?.encrypt_query_param && media.aes_key) {
          file = {
            encryptQueryParam: media.encrypt_query_param,
            aesKey: media.aes_key,
            fileName: item.file_item.file_name || `file_${Date.now()}`,
          };
        }
      }
    }
  }
  // Need either text, image, or file to proceed
  if (!textContent && !image && !file) return;
  await onMessage({
    fromUserId,
    messageId: String(msg.message_id || ''),
    text: textContent || (file ? `(file: ${file.fileName})` : '(image)'),
    image,
    file,
    refText,
  });
}
//# sourceMappingURL=monitor.js.map
