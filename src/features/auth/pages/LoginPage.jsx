import React from 'react';
import AuthLayout from '../../../components/Layout/AuthLayout';
import LoginForm from '../components/LoginForm';

const LoginPage = () => {
  return (
    <AuthLayout 
      maxWidth="max-w-xl"
      title="Selamat Datang Kembali."
      subtitle="Silakan masuk menggunakan akun WeSign Anda untuk melanjutkan pengelolaan dokumen."
      quote={{
        title: "Percepat Semua Keputusan Anda",
        body: "Jangan biarkan birokrasi kertas menghambat laju bisnis. Selangkah lagi untuk mengakses dasbor eksekutif Anda."
      }}
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;
