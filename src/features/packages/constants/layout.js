/**
 * @module packages/constants/layout
 *
 * [M-7] Magic numbers di feature packages — sebelumnya tersebar di
 * useSignPackage, useMobilePackageBottomSheet, dan usePackagePreview.
 * Centralize supaya value yang sama (mis. signature default size)
 * tidak perlu diubah di banyak tempat saat tuning UI.
 */

/**
 * Drag threshold untuk Mobile Bottom Sheet — kalau user drag turun
 * lebih dari ini, sheet di-close. Kurang dari ini, snap kembali ke 0.
 */
export const SHEET_DRAG_CLOSE_THRESHOLD_PX = 120;

/**
 * Default ukuran signature saat pertama kali di-drop ke canvas.
 * Value dalam ratio (0..1) terhadap container width/height.
 * - 25% lebar: cukup proporsional di mobile + desktop
 * - 10% tinggi: placeholder, akan auto-update dari aspect ratio image
 */
export const SIGNATURE_DEFAULT_WIDTH_RATIO = 0.25;
export const SIGNATURE_DEFAULT_HEIGHT_RATIO = 0.1;

/**
 * Max PDF render width (px). Lebih dari ini -> teks PDF jadi blur
 * karena scaling. Dipakai di usePackagePreview.measureContainer().
 */
export const PDF_MAX_RENDER_WIDTH_PX = 800;

/**
 * Min PDF render width (px). Container yang lebih sempit dari ini
 * (mis. mobile narrow viewport) tetap di-render minimal sebesar ini.
 */
export const PDF_MIN_RENDER_WIDTH_PX = 100;

/**
 * Delay redirect setelah toast info muncul, supaya user sempat baca
 * pesan sebelum diarahkan ke halaman lain. Dipakai di useSignPackage
 * saat fetch package yang sudah completed.
 */
export const REDIRECT_AFTER_TOAST_MS = 2000;

/**
 * Debounce delay untuk search input di PackagesPage.
 * 400ms = balance antara responsiveness dan jumlah fetch ke backend.
 */
export const SEARCH_DEBOUNCE_MS = 400;
