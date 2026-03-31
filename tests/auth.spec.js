import { test, expect } from '@playwright/test';

test.describe('Keamanan & Autentikasi WeSign', () => {
  
  test('Seharusnya menendang user yang tidak login ke halaman /login', async ({ page }) => {
    // Mencoba akses langsung ke Dashboard tanpa token
    await page.goto('/dashboard');
    
    // Pastikan URL berubah ke /login
    await expect(page).toHaveURL(/.*login/);
    
    // Pastikan form login muncul
    const loginTitle = page.locator('h1:has-text("Selamat Datang Kembali!")');
    await expect(loginTitle).toBeVisible();
  });

  test('Seharusnya menunjukkan pesan error jika login dengan kredensial salah', async ({ page }) => {
    await page.goto('/login');
    
    // Isi form dengan data asal
    await page.fill('input[type="email"]', 'salah@email.com');
    await page.fill('input[type="password"]', 'password_asalan_123');
    
    // Klik tombol Masuk
    await page.click('button[type="submit"]');
    
    // Pastikan loading muncul sebentar lalu error muncul
    const errorAlert = page.locator('.bg-red-50'); // Selector untuk error alert yang kita buat
    await expect(errorAlert).toBeVisible();
  });

  test('Seharusnya responsif di layar Mobile (Menu Sidebar)', async ({ page, isMobile }) => {
    await page.goto('/');
    
    if (isMobile) {
      // Pastikan Navbar Mobile muncul (Hamburger Menu) - Gunakan ARIA label yang lebih spesifik
      const menuButton = page.locator('button[aria-label="Buka Menu"]'); 
      await expect(menuButton).toBeVisible();
    } else {
      // Di Desktop, link navigasi harus langsung terlihat
      const navLinks = page.locator('nav >> text=Fitur');
      await expect(navLinks).toBeVisible();
    }
  });

});
