import React from 'react';
import AuthLayout from '../../../components/Layout/AuthLayout';
import ResetPasswordForm from '../components/ResetPasswordForm';

const ResetPasswordPage = () => {
  return (
    <AuthLayout
      maxWidth="max-w-xl"
      title="Buat Password Baru"
      subtitle="Masukkan password baru untuk akun Anda. Pastikan password kuat dan mudah diingat."
      quote={{
        title: "Tips Password Aman",
        body: "Gunakan kombinasi huruf besar, huruf kecil, angka, dan minimal 8 karakter untuk keamanan optimal."
      }}
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
};

export default ResetPasswordPage;
