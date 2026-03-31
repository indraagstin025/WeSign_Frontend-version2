import { test, expect } from '@playwright/test';
import path from 'path';
import { execSync } from 'child_process';

test.describe('CRUD Dashboard Brankas Dokumen', () => {
  
  test('Alur Lengkap: Upload, Read, Update Judul, dan Delete', async ({ page }) => {
    // Set timeout lebih lama karena alur CRUD lengkap memakan waktu
    test.setTimeout(60000);

    // 0. GENERATE UNIQUE FILE (Pass Integrity Check)
    execSync('node tests/assets/generate-pdf.js');

    // 1. LOGIN
    await page.goto('/login');
    await page.fill('input[type="email"]', 'indra12@gmail.com');
    await page.fill('input[type="password"]', 'Agustin123');
    await page.click('button[type="submit"]');

    // Pastikan berhasil masuk ke Dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // 2. NAVIGASI KE BRANKAS DOKUMEN
    await page.click('nav >> text=Brankas Dokumen');
    await expect(page).toHaveURL(/.*documents/);

    // 3. CREATE (Upload Dokumen)
    const testTitle = `Dokumen Uji ${Date.now()}`;
    await page.click('button:has-text("Unggah Baru")');
    
    // Upload File secara langsung ke input tersembunyi (lebih stabil)
    await page.setInputFiles('input[type="file"]', path.resolve('tests/assets/test-sample.pdf'));

    // Isi Judul & Submit
    await page.fill('input[placeholder="Contoh: Surat Perjanjian Kerjasama"]', testTitle);
    await page.click('button:has-text("Mulai Unggah")');

    // Verifikasi Berhasil (Tunggu Row muncul)
    const successRow = page.locator('tr').filter({ hasText: testTitle });
    await expect(successRow).toBeVisible({ timeout: 25000 });

    // 4. UPDATE (Ubah Judul)
    const updatedTitle = `${testTitle} - UPDATE`;
    
    // Klik Menu Dropdown (Tiga Titik) pada row dokumen tersebut
    await successRow.locator('button').last().click();
    await page.waitForTimeout(1000); // Tunggu animasi dropdown
    
    // Klik "Ubah Judul" menggunakan Role (lebih stabil)
    await page.getByRole('button', { name: /ubah judul/i }).click();
    
    // Masukkan judul baru
    await page.fill('input[placeholder="Masukkan judul baru..."]', updatedTitle);
    await page.click('button:has-text("Simpan Perubahan")');

    // Verifikasi Berhasil terupdate
    const updatedRow = page.locator('tr').filter({ hasText: updatedTitle });
    await expect(updatedRow).toBeVisible({ timeout: 15000 });

    // 5. DELETE (Hapus Dokumen)
    // Klik Menu Dropdown lagi
    await updatedRow.locator('button').last().click();
    await page.waitForTimeout(1000);
    
    // Klik "Hapus" menggunakan Role
    await page.getByRole('button', { name: /hapus/i }).click();

    // Konfirmasi di Modal
    const confirmButton = page.locator('button:has-text("Ya, Hapus")');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Verifikasi Dokumen Hilang dari Tabel
    await expect(page.locator('tr').filter({ hasText: updatedTitle })).not.toBeVisible({ timeout: 15000 });
  });

});
