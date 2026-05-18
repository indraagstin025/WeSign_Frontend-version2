/**
 * @file logger.js
 * @description Centralized logger factory dengan scope prefix konsisten.
 *
 * Pattern: setiap file/hook/service buat logger sendiri dengan scope name,
 * lalu pakai untuk log dengan prefix otomatis.
 *
 * Behavior:
 * - `info` & `debug` — hanya muncul di development mode (Vite import.meta.env.DEV)
 *   supaya production console tidak polluted
 * - `warn` & `error` — selalu muncul (dev + prod) untuk monitoring
 *
 * Usage:
 *   import { createLogger } from '../../utils/logger';
 *   const log = createLogger('MyService');
 *
 *   log.info('starting...');                       // [MyService] starting...
 *   log.warn('cache miss');                        // [MyService] cache miss
 *   log.error('fetch failed:', err.message);       // [MyService] fetch failed: ...
 *
 * Refs: docs/code-review/03-medium.md (M-8)
 */

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

/**
 * Buat logger dengan scope prefix.
 * @param {string} scope - Nama scope (mis. nama hook, service, atau file)
 * @returns {{info: Function, debug: Function, warn: Function, error: Function}}
 */
export function createLogger(scope) {
  const prefix = `[${scope}]`;
  return {
    /** Log informasional — dev only */
    info: (...args) => {
      if (isDev) console.info(prefix, ...args);
    },
    /** Log debug — dev only */
    debug: (...args) => {
      if (isDev) console.debug(prefix, ...args);
    },
    /** Log warning — dev + prod */
    warn: (...args) => console.warn(prefix, ...args),
    /** Log error — dev + prod */
    error: (...args) => console.error(prefix, ...args),
  };
}
