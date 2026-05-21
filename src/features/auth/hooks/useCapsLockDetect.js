import { useState, useCallback } from 'react';

/**
 * @file useCapsLockDetect.js
 * @description Hook utility untuk deteksi state Caps Lock saat user
 *              mengetik di password input.
 *
 * [L-7] Browser tidak punya API global untuk detect Caps Lock state
 * (privacy reason — tidak boleh polling tanpa interaksi user). Tapi
 * KeyboardEvent punya `getModifierState('CapsLock')` yang valid saat
 * key event apapun fired. Strategi: subscribe ke onKeyUp / onKeyDown
 * di password input, update state setiap kali ada keystroke.
 *
 * Limitasi:
 * - Tidak bisa detect Caps Lock state sebelum user mulai mengetik
 * - State stale kalau user toggle Caps Lock di luar input field
 *   (mis. di tab lain) — akan ter-update di keystroke berikutnya
 *
 * Usage:
 *   const { capsLockOn, handleKeyEvent } = useCapsLockDetect();
 *   <input onKeyUp={handleKeyEvent} onKeyDown={handleKeyEvent} ... />
 *   {capsLockOn && <span>⚠ Caps Lock aktif</span>}
 *
 * @returns {{capsLockOn: boolean, handleKeyEvent: Function}}
 */
export function useCapsLockDetect() {
  const [capsLockOn, setCapsLockOn] = useState(false);

  const handleKeyEvent = useCallback((event) => {
    // getModifierState ada di KeyboardEvent native dan React synthetic event
    if (typeof event.getModifierState === 'function') {
      setCapsLockOn(event.getModifierState('CapsLock'));
    }
  }, []);

  return { capsLockOn, handleKeyEvent };
}
