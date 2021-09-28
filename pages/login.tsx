import React from 'react';
import { useRouter } from 'next/router';
import Login from '@tuteria/shared-lib/src/tutor-application/Login';
import { adapter } from '../server_utils/client';

export default function LoginPage({ email }) {
  const router = useRouter();
  const showOTP = email ? true : false;
  
  return (
    <Login
      email={email}
      showOTP={showOTP}
      onEmailSubmit={adapter.onEmailSubmit}
      onOTPSubmit={adapter.onVerifyOTP}
      onResendOTP={adapter.onEmailSubmit}
      onNavigate={() => router.push('/lalaland')}
    />
  );
}

export async function getServerSideProps({ query }) {
  const email = query.email || "";
  return { props: { email } };
}
