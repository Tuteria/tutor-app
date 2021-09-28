import React from 'react';
import Login from '@tuteria/shared-lib/src/tutor-application/Login';
import { adapter } from '../server_utils/client';
import { usePrefetchHook } from '../server_utils/util';

export default function LoginPage({ email, next }) {
  const { navigate } = usePrefetchHook({ routes: [next] }); 
  const showOTP = email ? true : false;
  
  return (
    <Login
      email={email}
      showOTP={showOTP}
      onEmailSubmit={adapter.onEmailSubmit}
      onOTPSubmit={adapter.onVerifyOTP}
      onResendOTP={adapter.onEmailSubmit}
      onNavigate={() => navigate(next)}
    />
  );
}

export async function getServerSideProps({ query }) {
  const email = query.email || "";
  const next = query.next || '/';

  return { props: { email, next } };
}
