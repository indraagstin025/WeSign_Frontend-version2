import React from 'react';
import AuthLayout from '../../../components/Layout/AuthLayout';
import ForgotPasswordForm from '../components/ForgotPasswordForm';

const ForgotPasswordPage = () => {
  return (
    <AuthLayout
      maxWidth="max-w-xl"
      title="Lupa Password?"
      subtitle="Masukkan email yang terdaftar dan kami akan mengirimkan link untuk mereset password Anda."
      quote={{
        title: "Keamanan Adalah Prioritas",
        body: "Link reset password berlaku selama 15 menit. Pastikan Anda segera menggunakannya setelah menerima email."
      }}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
