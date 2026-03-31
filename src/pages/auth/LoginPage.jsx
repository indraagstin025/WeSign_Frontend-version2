import React from 'react';
import AuthLayout from '../../components/Layout/AuthLayout';
import LoginForm from '../../features/auth/components/LoginForm';

const LoginPage = () => {
  return (
    <AuthLayout 
      title="Selamat Datang Kembali!"
      subtitle="Silakan masukkan kredensial akun WeSign terverifikasi Anda."
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
