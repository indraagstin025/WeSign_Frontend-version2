import React from 'react';
import AuthLayout from '../../../components/Layout/AuthLayout';
import RegisterForm from '../components/RegisterForm';

const RegisterPage = () => {
  return (
    <AuthLayout 
      title="Genggam Legalitas Digital."
      subtitle="Daftarkan profil personal atau PT Anda secara gratis untuk mulai bereksperimen dengan tanda tangan elektronik WeSign."
      maxWidth="max-w-4xl"
      quote={{
        title: "Kemanan Setara Perbankan.",
        body: "Bergabung bersama 10,000+ entitas yang telah menghemat biaya cetak dan memutar roda bisnisnya lebih kencang dari sebelumnya."
      }}
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage;
