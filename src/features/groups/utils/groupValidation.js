/**
 * @file groupValidation.js
 * @description Konstanta & helper validasi yang sinkron dengan backend Group module.
 *
 * NOTE: Nilai-nilai di sini HARUS sama dengan yang divalidasi di backend
 * (`groupController.js` & `groupDocumentController.js`). Bila diubah,
 * sinkronkan kedua sisi.
 */

export const GROUP_NAME_MAX = 100;
export const DOC_TITLE_MAX = 200;
export const FILE_SIZE_MAX_BYTES = 20 * 1024 * 1024; // 20 MB
export const ACCEPTED_FILE_MIME = 'application/pdf';

export const ALLOWED_INVITATION_ROLES = ['member', 'admin_group', 'viewer'];

/**
 * Validasi nama grup. Return error message string atau null bila valid.
 */
export const validateGroupName = (name) => {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) return 'Nama grup tidak boleh kosong.';
  if (trimmed.length > GROUP_NAME_MAX) {
    return `Nama grup maksimal ${GROUP_NAME_MAX} karakter.`;
  }
  return null;
};

/**
 * Validasi judul dokumen. Return error message string atau null bila valid.
 */
export const validateDocTitle = (title) => {
  const trimmed = typeof title === 'string' ? title.trim() : '';
  if (!trimmed) return 'Judul dokumen wajib diisi.';
  if (trimmed.length > DOC_TITLE_MAX) {
    return `Judul dokumen maksimal ${DOC_TITLE_MAX} karakter.`;
  }
  return null;
};

/**
 * Validasi file PDF. Return error message atau null.
 */
export const validatePdfFile = (file) => {
  if (!file) return 'File dokumen wajib diunggah.';
  if (file.type !== ACCEPTED_FILE_MIME) {
    return 'Sistem hanya menerima berkas berformat PDF.';
  }
  if (file.size > FILE_SIZE_MAX_BYTES) {
    const sizeMB = Math.floor(FILE_SIZE_MAX_BYTES / 1024 / 1024);
    return `Ukuran berkas tidak boleh melebihi ${sizeMB}MB.`;
  }
  return null;
};
