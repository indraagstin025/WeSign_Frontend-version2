import { useState, useCallback } from 'react';

/**
 * @file useInteractionMode.js
 * @description Hook utility untuk state interaction mode di signing pages.
 *
 * [L-1] Sebelumnya 3 signing pages duplikasi state ini:
 * - DocumentSigningPage.jsx (personal signing)
 * - GroupSigningPage.jsx
 * - SignPackagePage.jsx
 *
 * Pattern yang sama di tiap page:
 *   const [interactionMode, setInteractionMode] = useState('cursor');
 *   const handleToggleMode = (mode) => setInteractionMode(mode);
 *
 * Centralize di hook ini agar:
 * - Single source of truth untuk valid modes ('cursor' | 'hand')
 * - Behavior konsisten antar page
 * - Default value sama
 *
 * @typedef {'cursor' | 'hand'} InteractionMode
 *
 * @param {InteractionMode} [initial='cursor']
 * @returns {{
 *   mode: InteractionMode,
 *   setMode: (mode: InteractionMode) => void,
 *   isCursor: boolean,
 *   isHand: boolean
 * }}
 */
export function useInteractionMode(initial = 'cursor') {
  const [mode, setModeState] = useState(initial);

  // useCallback untuk stable identity — supaya kalau di-pass ke toolbar
  // sebagai prop, tidak trigger re-render setiap parent render.
  const setMode = useCallback((next) => {
    if (next !== 'cursor' && next !== 'hand') {
      // Defensive: ignore invalid mode (avoid silent state corruption)
      return;
    }
    setModeState(next);
  }, []);

  return {
    mode,
    setMode,
    isCursor: mode === 'cursor',
    isHand: mode === 'hand',
  };
}
