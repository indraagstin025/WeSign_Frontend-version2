/**
 * @file sessionKeys.js
 * @description Centralized session storage keys.
 *
 * Konvensi: prefix `wesign_` agar tidak bentrok dengan key dari library lain.
 * Pakai constant untuk hindari typo + memudahkan refactor lintas-feature.
 */

/**
 * Token undangan grup yang disimpan saat user klik link join tapi belum login.
 * Dibaca oleh:
 * - LoginPage / useLogin → setelah login, redirect ke /groups/join?token=
 * - useRegister → setelah register, redirect ke /groups/join?token=
 *
 * Di-clear oleh useJoinGroupPage setelah accept invitation berhasil/gagal.
 */
export const PENDING_GROUP_JOIN_KEY = 'wesign_pending_join_token';
